import * as THREE from 'three';
import { BOOK_DEFAULTS, ANIM_PARAMS } from '../config/constants.js';

export class Book extends THREE.Group {
    constructor(bookId, {
        width = BOOK_DEFAULTS.WIDTH,
        height = BOOK_DEFAULTS.HEIGHT,
        thickness = BOOK_DEFAULTS.THICKNESS,
        color,
        content,
        modalInfo = null,
    }) {
        super();
        this.bookId = bookId;
        this.dimensions = { width, height, thickness };
        this.color = color;
        this.content = content;
        this.modalInfo = modalInfo;
        this.isHovered = false;
        this.isOpen = false;
        this.initialX = 0;
        this.initialY = 0;
        this.initialZ = 0;
        this.initialRotationY = 0;

        this.createGeometry();
    }

    // ─── Texture Creators ───────────────────────────────────────────────────────

    // Vertical title text on the spine
    createSpineTexture() {
        const { thickness, height } = this.dimensions;
        const T = BOOK_DEFAULTS.TEXTURE;
        const canvas = document.createElement('canvas');
        canvas.width  = Math.max(32, Math.round(thickness * T.SPINE_PIXELS_PER_UNIT));
        canvas.height = Math.max(64, Math.round(height    * T.SPINE_PIXELS_PER_UNIT));
        const ctx = canvas.getContext('2d');

        const [r, g, b] = this.color;
        const d = T.SPINE_DARKEN;
        ctx.fillStyle = `rgb(${Math.round(r*d)}, ${Math.round(g*d)}, ${Math.round(b*d)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (this.content) {
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            ctx.fillStyle = luminance > T.SPINE_LUMINANCE_THRESHOLD ? '#111111' : '#f0ece4';
            let fontSize = Math.max(8, Math.floor(canvas.width * T.SPINE_FONT_SIZE_RATIO));
            ctx.font = `bold ${fontSize}px Georgia, serif`;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxTextWidth = canvas.height * T.SPINE_MAX_TEXT_WIDTH_RATIO;
            while (ctx.measureText(this.content).width > maxTextWidth && fontSize > 6) {
                fontSize -= 1;
                ctx.font = `bold ${fontSize}px Georgia, serif`;
            }
            ctx.fillText(this.content, 0, 0);
            ctx.restore();
        }

        return new THREE.CanvasTexture(canvas);
    }

    // Subtle fabric/cloth grain texture for cover exteriors
    createCoverTexture() {
        const T = BOOK_DEFAULTS.TEXTURE;
        const size = T.COVER_CANVAS_SIZE;
        const canvas = document.createElement('canvas');
        canvas.width  = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const [r, g, b] = this.color;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const n = (Math.random() - 0.5) * T.COVER_NOISE_AMPLITUDE;
            data[i]   = Math.min(255, Math.max(0, data[i]   + n));
            data[i+1] = Math.min(255, Math.max(0, data[i+1] + n));
            data[i+2] = Math.min(255, Math.max(0, data[i+2] + n));
        }
        ctx.putImageData(imageData, 0, 0);

        return new THREE.CanvasTexture(canvas);
    }

    // Title page shown on the inside face of the front cover when open
    createTitlePageTexture() {
        const { width, height } = this.dimensions;
        const T = BOOK_DEFAULTS.TEXTURE;
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(width  * T.TITLE_PIXELS_PER_UNIT);
        canvas.height = Math.round(height * T.TITLE_PIXELS_PER_UNIT);
        const ctx = canvas.getContext('2d');

        const [r, g, b] = this.color;
        const f = T.TITLE_BORDER_COLOR_FACTOR;

        ctx.fillStyle = T.TITLE_BG_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Decorative double border in book color
        const outerMargin = T.TITLE_OUTER_MARGIN;
        ctx.strokeStyle = `rgb(${Math.round(r*f)}, ${Math.round(g*f)}, ${Math.round(b*f)})`;
        ctx.lineWidth = T.TITLE_OUTER_LINE_WIDTH;
        ctx.strokeRect(outerMargin, outerMargin, canvas.width - outerMargin*2, canvas.height - outerMargin*2);
        ctx.lineWidth = 1;
        const innerMargin = outerMargin + T.TITLE_INNER_MARGIN_OFFSET;
        ctx.strokeRect(innerMargin, innerMargin, canvas.width - innerMargin*2, canvas.height - innerMargin*2);

        // Title text
        if (this.content) {
            ctx.fillStyle = T.TITLE_TEXT_COLOR;
            const maxTextWidth = canvas.width - (innerMargin + T.TITLE_TEXT_PADDING) * 2;

            let fontSize = Math.max(16, Math.floor(canvas.width * T.TITLE_FONT_SIZE_RATIO));
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Shrink-to-fit: wrap text, then shrink font if any line still overflows
            // (e.g. a single long word that can't be broken).
            let lines = [];
            const minFontSize = 10;
            while (true) {
                ctx.font = `bold ${fontSize}px Georgia, serif`;
                lines = wrapText(ctx, this.content, maxTextWidth);
                const widest = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
                if (widest <= maxTextWidth || fontSize <= minFontSize) break;
                fontSize -= 1;
            }

            const lineHeight = fontSize * T.TITLE_LINE_HEIGHT_RATIO;
            const textBlockHeight = lines.length * lineHeight;
            const startY = canvas.height / 2 - textBlockHeight / 2 + lineHeight / 2;
            lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, startY + i * lineHeight));
        }

        return new THREE.CanvasTexture(canvas);
    }

    // Content rendered on the pages front face (+Z) — the right-hand page when open.
    // Baked at construction so the text is visible from the first frame of the
    // open animation rather than appearing afterward.
    createContentPageTexture() {
        const { width, height } = this.dimensions;
        const T   = BOOK_DEFAULTS.TEXTURE;
        const PPU = T.CONTENT_PIXELS_PER_UNIT;
        const pageInset = BOOK_DEFAULTS.PAGE.INSET;

        const canvas = document.createElement('canvas');
        canvas.width  = Math.round((width  - pageInset * 2) * PPU);
        canvas.height = Math.round((height - pageInset * 2) * PPU);
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        // ── Background ──
        ctx.fillStyle = T.TITLE_BG_COLOR;
        ctx.fillRect(0, 0, W, H);

        if (!this.content && !this.modalInfo) return new THREE.CanvasTexture(canvas);

        const [r, g, b] = this.color;
        const accent = `rgb(${Math.round(r * 0.6)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.6)})`;

        const mX  = Math.round(W * T.CONTENT_MARGIN_X_RATIO);
        const textW = W - mX * 2;
        let y = Math.round(H * T.CONTENT_MARGIN_TOP_RATIO);

        // ── Font size helpers ──
        const titleFont    = Math.max(20, Math.round(W * T.CONTENT_TITLE_RATIO));
        const subtitleFont = Math.max(16, Math.round(W * T.CONTENT_SUBTITLE_RATIO));
        const orgFont      = Math.max(14, Math.round(W * T.CONTENT_ORG_RATIO));
        const bodyFont     = Math.max(12, Math.round(W * T.CONTENT_BODY_RATIO));
        const listFont     = Math.max(11, Math.round(W * T.CONTENT_LIST_RATIO));

        // ── Title ──
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle    = '#1a1a1a';
        ctx.font = `bold ${titleFont}px Georgia, serif`;
        for (const line of wrapText(ctx, this.content ?? '', textW)) {
            ctx.fillText(line, W / 2, y);
            y += Math.round(titleFont * 1.25);
        }
        y += Math.round(titleFont * 0.2);

        // ── Subtitle / org ──
        if (this.modalInfo) {
            const subtitle = this.modalInfo.degree    ?? this.modalInfo.position ?? '';
            const org      = this.modalInfo.university ?? this.modalInfo.company  ?? '';

            if (subtitle) {
                ctx.font      = `italic ${subtitleFont}px Georgia, serif`;
                ctx.fillStyle = '#444';
                for (const line of wrapText(ctx, subtitle, textW)) {
                    ctx.fillText(line, W / 2, y);
                    y += Math.round(subtitleFont * 1.25);
                }
            }
            if (org) {
                ctx.font      = `${orgFont}px Georgia, serif`;
                ctx.fillStyle = '#666';
                for (const line of wrapText(ctx, org, textW)) {
                    ctx.fillText(line, W / 2, y);
                    y += Math.round(orgFont * 1.25);
                }
            }
        }

        // ── Divider ──
        y += 8;
        ctx.strokeStyle = accent;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(mX, y); ctx.lineTo(W - mX, y);
        ctx.stroke();
        y += 10;

        if (!this.modalInfo) return new THREE.CanvasTexture(canvas);

        ctx.textAlign = 'left';

        // ── Meta stats (GPA / dates) ──
        const meta = [];
        if (this.modalInfo.gpa)           meta.push(['GPA',       this.modalInfo.gpa]);
        if (this.modalInfo.graduationDate) meta.push(['Graduated', this.modalInfo.graduationDate]);
        if (this.modalInfo.startDate) {
            const end = this.modalInfo.endDate ?? 'Present';
            meta.push(['Dates', `${this.modalInfo.startDate} – ${end}`]);
        }
        for (const [label, value] of meta) {
            ctx.font      = `bold ${bodyFont}px Georgia, serif`;
            ctx.fillStyle = accent;
            ctx.fillText(`${label}: `, mX, y);
            const labelW = ctx.measureText(`${label}: `).width;
            ctx.font      = `${bodyFont}px Georgia, serif`;
            ctx.fillStyle = '#222';
            ctx.fillText(value, mX + labelW, y);
            y += Math.round(bodyFont * 1.5);
        }
        if (meta.length) y += 6;

        // ── Section list (projects / accomplishments) ──
        const listItems   = this.modalInfo.projects ?? this.modalInfo.accomplishments ?? [];
        const sectionLabel = this.modalInfo.projects
            ? 'Research Projects'
            : this.modalInfo.accomplishments
                ? 'Accomplishments'
                : null;

        if (sectionLabel && listItems.length) {
            ctx.font      = `bold ${bodyFont}px Georgia, serif`;
            ctx.fillStyle = '#1a1a1a';
            ctx.fillText(sectionLabel, mX, y);
            y += Math.round(bodyFont * 1.3);

            ctx.strokeStyle = accent;
            ctx.lineWidth   = 0.5;
            ctx.beginPath();
            ctx.moveTo(mX, y); ctx.lineTo(W - mX, y);
            ctx.stroke();
            y += 6;

            const bulletX = mX + 10;
            const itemX   = mX + 22;
            const itemW   = W - itemX - mX;
            const lineH   = Math.round(listFont * 1.55);

            for (const item of listItems) {
                const lines = wrapText(ctx, item, itemW);
                ctx.font = `${listFont}px Georgia, serif`;

                // Stop if there's no room for even the first line
                if (y + lineH > H - 10) break;

                ctx.fillStyle = accent;
                ctx.fillText('•', bulletX, y);
                ctx.fillStyle = '#222';
                for (const line of lines) {
                    if (y + lineH > H - 10) break;
                    ctx.fillText(line, itemX, y);
                    y += lineH;
                }
            }
        }

        return new THREE.CanvasTexture(canvas);
    }

    // ─── Geometry ───────────────────────────────────────────────────────────────

    createGeometry() {
        const actualWidth     = this.dimensions.width;
        const actualHeight    = this.dimensions.height;
        const actualThickness = this.dimensions.thickness;
        const coverThickness  = BOOK_DEFAULTS.COVER.THICKNESS;
        const pageInset       = BOOK_DEFAULTS.PAGE.INSET;

        const coverTexture = this.createCoverTexture();

        const M = BOOK_DEFAULTS.MATERIAL;
        this.materials = {
            cover: new THREE.MeshStandardMaterial({
                map:       coverTexture,
                // No `color` here — the texture already has the book color painted in.
                // Setting `color` would multiply against the texture, squaring the values
                // and making the cover significantly darker than the spine.
                roughness: M.COVER_ROUGHNESS,
                metalness: M.COVER_METALNESS,
            }),
            spine: new THREE.MeshStandardMaterial({
                map:       this.createSpineTexture(),
                roughness: M.COVER_ROUGHNESS,
                metalness: M.COVER_METALNESS,
            }),
            titlePage: new THREE.MeshStandardMaterial({
                map:       this.createTitlePageTexture(),
                roughness: M.COVER_ROUGHNESS,
                metalness: M.COVER_METALNESS,
            }),
            contentPage: new THREE.MeshStandardMaterial({
                map:       this.createContentPageTexture(),
                roughness: M.PAGE_ROUGHNESS,
                metalness: M.PAGE_METALNESS,
            }),
            pages: new THREE.MeshStandardMaterial({
                color:     M.PAGE_COLOR,
                roughness: M.PAGE_ROUGHNESS,
                metalness: M.PAGE_METALNESS,
            }),
            pageEdge: new THREE.MeshStandardMaterial({
                color:     M.PAGE_EDGE_COLOR,
                roughness: M.PAGE_EDGE_ROUGHNESS,
                metalness: M.PAGE_EDGE_METALNESS,
            }),
        };

        const coverGeometry = new THREE.BoxGeometry(actualWidth, actualHeight, coverThickness);
        const spineGeometry = new THREE.BoxGeometry(coverThickness, actualHeight, actualThickness);
        const pagesGeometry = new THREE.BoxGeometry(
            actualWidth  - pageInset * 2,
            actualHeight - pageInset * 2,
            actualThickness - coverThickness * 2
        );

        // Ry(PI/2) maps local -X → world +Z (toward camera), so the -X face (index 1)
        // of the spine is the viewer-facing face.
        const spineFaceMaterials = [
            this.materials.cover,  // +X
            this.materials.spine,  // -X: viewer-facing after rotation
            this.materials.cover,  // +Y
            this.materials.cover,  // -Y
            this.materials.cover,  // +Z
            this.materials.cover,  // -Z
        ];

        // Front cover uses per-face materials so the inside (-Z face, index 5) shows
        // the title page when the cover swings open toward the viewer.
        const frontCoverFaceMaterials = [
            this.materials.cover,      // +X
            this.materials.cover,      // -X (spine edge)
            this.materials.cover,      // +Y
            this.materials.cover,      // -Y
            this.materials.cover,      // +Z outer face
            this.materials.titlePage,  // -Z inner face — visible when open
        ];

        this.parts = {
            frontCover: new THREE.Mesh(coverGeometry, frontCoverFaceMaterials),
            backCover:  new THREE.Mesh(coverGeometry, this.materials.cover),
            spine:      new THREE.Mesh(spineGeometry, spineFaceMaterials),
            pages:      new THREE.Mesh(pagesGeometry, [
                this.materials.pageEdge,   // +X page-edge strip
                this.materials.pages,      // -X
                this.materials.pages,      // +Y
                this.materials.pages,      // -Y
                this.materials.contentPage,// +Z front face — visible as right page when open
                this.materials.pages,      // -Z
            ])
        };

        this.parts.backCover.position.set(0, 0, -actualThickness/2 + coverThickness/2);
        this.parts.spine.position.set(-actualWidth/2 + coverThickness/2, 0, 0);
        this.parts.pages.position.set(0, 0, 0);

        // Front cover pivots around the spine edge so it opens without clipping pages
        this.frontCoverPivot = new THREE.Group();
        this.frontCoverPivot.position.set(
            -actualWidth/2,
            0,
            actualThickness/2 - coverThickness/2
        );
        this.parts.frontCover.position.set(actualWidth/2, 0, 0);
        this.frontCoverPivot.add(this.parts.frontCover);

        const container = new THREE.Group();
        [this.parts.backCover, this.parts.spine, this.parts.pages, this.frontCoverPivot]
            .forEach(part => {
                part.castShadow    = true;
                part.receiveShadow = true;
                if (part.children) part.children.forEach(c => {
                    c.castShadow    = true;
                    c.receiveShadow = true;
                });
                container.add(part);
            });

        this.add(container);
        this.userData.isBook = true;
        this.userData.bookId = this.bookId;
    }

    // Returns the live params object (debug panel mutations win over defaults).
    _params() {
        return window.animParams || ANIM_PARAMS;
    }

    // ─── Hover ──────────────────────────────────────────────────────────────────

    setHovered(isHovered) {
        if (this.isHovered === isHovered) return;
        this.isHovered = isHovered;

        if (!this.isOpen) {
            const { duration, zOffset, ease } = this._params().hover;
            window.gsap.to(this.position, {
                z:        isHovered ? this.initialZ + zOffset : this.initialZ,
                duration,
                ease,
            });
        }

        const emissiveHex = isHovered
            ? BOOK_DEFAULTS.MATERIAL.HOVER_EMISSIVE
            : BOOK_DEFAULTS.MATERIAL.DEFAULT_EMISSIVE;

        Object.values(this.materials).forEach(mat => {
            if (mat?.emissive) mat.emissive.setHex(emissiveHex);
        });
    }

    // ─── Open / Close ───────────────────────────────────────────────────────────

    open() {
        if (this._activeTl) this._activeTl.kill();
        this.isOpen = true;
        this._activeTl = this._buildOpenTimeline();
        return this._activeTl;
    }

    close() {
        if (this._activeTl) this._activeTl.kill();
        this.isOpen = false;
        this._activeTl = this._buildCloseTimeline();
        return this._activeTl;
    }

    toggleOpen() {
        return this.isOpen ? this.close() : this.open();
    }

    _buildOpenTimeline() {
        const p = this._params();
        const { duration, zOut, showcaseY, coverAngle, bookRotation, ease,
                pageFanAngle, slideOutMult, centerMult, rotateMult, coverOpenMult, pageFanMult,
                centerStart, rotateOverlap, coverDelay, pageFanOffset } = p.open;
        const tl = window.gsap.timeline();

        // 1. Slide out from shelf
        tl.to(this.position, {
            z:        this.initialZ + zOut,
            duration: duration * slideOutMult,
            ease:     'power2.out'
        });

        // 2. Center on screen (X and Y) as a closed book while still moving forward
        tl.to(this.position, {
            x:        0,
            y:        showcaseY,
            duration: duration * centerMult,
            ease:     'power2.inOut'
        }, `<${centerStart}`);

        // 3. Rotate so front cover faces viewer
        tl.to(this.rotation, {
            y:        bookRotation,
            duration: duration * rotateMult,
            ease
        }, `>-${rotateOverlap}`);

        // 4. Open the front cover, and simultaneously drift right so the open spread
        // stays visually centered. When fully open the cover's free edge lands at
        // x = -w/2 + w·cos(coverAngle) relative to the book, so the spread midpoint
        // is w/2·cos(coverAngle) to the left of position — negate to re-center.
        const centeredX = -this.dimensions.width / 2 * Math.cos(coverAngle);
        tl.to(this.frontCoverPivot.rotation, {
            y:        coverAngle,
            duration: duration * coverOpenMult,
            ease
        }, `>-${coverDelay}`);
        tl.to(this.position, {
            x:        centeredX,
            duration: duration * coverOpenMult,
            ease
        }, `<`);

        // 5. Pages fan out gently as cover opens
        tl.to(this.parts.pages.rotation, {
            y:        pageFanAngle,
            duration: duration * pageFanMult,
            ease:     'power2.out'
        }, `<${pageFanOffset}`);

        return tl;
    }

    _buildCloseTimeline() {
        const p = this._params();
        const { duration, pageSettleMult, coverCloseMult, rotateMult, slideXYMult, slideZMult,
                rotateOverlap, slideZOverlap } = p.close;
        const { coverAngle, ease } = p.open;
        const targetZ = this.isHovered
            ? this.initialZ + p.hover.zOffset
            : this.initialZ;
        const tl = window.gsap.timeline();

        // 1. Pages settle and cover begins closing
        tl.to(this.parts.pages.rotation, {
            y:        0,
            duration: duration * pageSettleMult,
            ease:     'power2.in'
        });

        tl.to(this.frontCoverPivot.rotation, {
            y:        0,
            duration: duration * coverCloseMult,
            ease
        }, '<');

        // 2. Rotate book back to shelf orientation
        tl.to(this.rotation, {
            y:        this.initialRotationY,
            duration: duration * rotateMult,
            ease
        }, `>-${rotateOverlap}`);

        // 3. Slide back to original shelf position
        tl.to(this.position, {
            x:        this.initialX,
            y:        this.initialY,
            duration: duration * slideXYMult,
            ease:     'power2.inOut'
        }, '<');

        tl.to(this.position, {
            z:        targetZ,
            duration: duration * slideZMult,
            ease:     'power2.in'
        }, `>-${slideZOverlap}`);

        return tl;
    }

    // ─── Responsive ─────────────────────────────────────────────────────────────

    updateScale(screenWidth) {
        const baseScale = Math.min(1, screenWidth / BOOK_DEFAULTS.SCALE_BASE_WIDTH);
        this.scale.set(baseScale, baseScale, baseScale);
    }
}

// ─── Module helpers ──────────────────────────────────────────────────────────

// Breaks `text` into lines no wider than `maxWidth` canvas units.
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}
