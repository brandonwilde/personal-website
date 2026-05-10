import * as THREE from 'three';
import { BOOK_DEFAULTS, ANIM_PARAMS } from '../config/constants.js';

export class Book extends THREE.Group {
    constructor(bookId, {
        width = BOOK_DEFAULTS.WIDTH,
        height = BOOK_DEFAULTS.HEIGHT,
        thickness = BOOK_DEFAULTS.THICKNESS,
        color,
        content
    }) {
        super();
        this.bookId = bookId;
        this.dimensions = { width, height, thickness };
        this.color = color;
        this.content = content;
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
        const PIXELS_PER_UNIT = 50;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(32, Math.round(thickness * PIXELS_PER_UNIT));
        canvas.height = Math.max(64, Math.round(height * PIXELS_PER_UNIT));
        const ctx = canvas.getContext('2d');

        const [r, g, b] = this.color;
        const darken = 0.8;
        ctx.fillStyle = `rgb(${Math.round(r*darken)}, ${Math.round(g*darken)}, ${Math.round(b*darken)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (this.content) {
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            ctx.fillStyle = luminance > 0.45 ? '#111111' : '#f0ece4';
            let fontSize = Math.max(8, Math.floor(canvas.width * 0.72));
            ctx.font = `bold ${fontSize}px Georgia, serif`;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxTextWidth = canvas.height * 0.85;
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
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const [r, g, b] = this.color;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, 128, 128);

        const imageData = ctx.getImageData(0, 0, 128, 128);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const n = (Math.random() - 0.5) * 24;
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
        const PIXELS_PER_UNIT = 42;
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(width  * PIXELS_PER_UNIT);
        canvas.height = Math.round(height * PIXELS_PER_UNIT);
        const ctx = canvas.getContext('2d');

        const [r, g, b] = this.color;

        // Cream paper background
        ctx.fillStyle = '#f8f4ec';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Decorative double border in book color
        const margin = 14;
        ctx.strokeStyle = `rgb(${Math.round(r*0.6)}, ${Math.round(g*0.6)}, ${Math.round(b*0.6)})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(margin, margin, canvas.width - margin*2, canvas.height - margin*2);
        ctx.lineWidth = 1;
        const innerMargin = margin + 7;
        ctx.strokeRect(innerMargin, innerMargin, canvas.width - innerMargin*2, canvas.height - innerMargin*2);

        // Title text
        if (this.content) {
            ctx.fillStyle = '#1a1a1a';
            const maxTextWidth = canvas.width - (innerMargin + 10) * 2;

            let fontSize = Math.max(16, Math.floor(canvas.width * 0.14));
            ctx.font = `bold ${fontSize}px Georgia, serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Word-wrap
            const words = this.content.split(' ');
            const lines = [];
            let line = '';
            for (const word of words) {
                const test = line ? `${line} ${word}` : word;
                if (ctx.measureText(test).width > maxTextWidth && line) {
                    lines.push(line);
                    line = word;
                } else {
                    line = test;
                }
            }
            if (line) lines.push(line);

            const lineHeight = fontSize * 1.5;
            const textBlockHeight = lines.length * lineHeight;
            const startY = canvas.height / 2 - textBlockHeight / 2 + lineHeight / 2;
            lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, startY + i * lineHeight));
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
                color:     new THREE.Color(`rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`),
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
                this.materials.pageEdge, // +X page-edge strip
                this.materials.pages,    // -X
                this.materials.pages,    // +Y
                this.materials.pages,    // -Y
                this.materials.pages,    // +Z
                this.materials.pages,    // -Z
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

    // Returns the playing GSAP timeline so callers can chain .then()
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
        const { duration, zOut, showcaseY, coverAngle, bookRotation, ease } = p.open;
        const tl = window.gsap.timeline();

        // 1. Slide out from shelf
        tl.to(this.position, {
            z:        this.initialZ + zOut,
            duration: duration * 0.5,
            ease:     'power2.out'
        });

        // 2. Center on screen (X and Y) while still moving forward
        tl.to(this.position, {
            x:        0,
            y:        showcaseY,
            duration: duration * 0.7,
            ease:     'power2.inOut'
        }, '<0.1');

        // 3. Rotate so front cover faces viewer
        tl.to(this.rotation, {
            y:        bookRotation,
            duration: duration,
            ease
        }, '>-0.2');

        // 4. Open the front cover
        tl.to(this.frontCoverPivot.rotation, {
            y:        coverAngle,
            duration: duration * 1.2,
            ease
        }, '>-0.1');

        // 5. Pages fan out gently as cover opens
        tl.to(this.parts.pages.rotation, {
            y:        0.08,
            duration: duration * 0.8,
            ease:     'power2.out'
        }, '<0.2');

        return tl;
    }

    _buildCloseTimeline() {
        const p = this._params();
        const { duration } = p.close;
        const { coverAngle, ease } = p.open;
        const targetZ    = this.isHovered
            ? this.initialZ + p.hover.zOffset
            : this.initialZ;
        const tl = window.gsap.timeline();

        // 1. Pages settle and cover begins closing
        tl.to(this.parts.pages.rotation, {
            y:        0,
            duration: duration * 0.5,
            ease:     'power2.in'
        });

        tl.to(this.frontCoverPivot.rotation, {
            y:        0,
            duration: duration * 1.2,
            ease
        }, '<');

        // 2. Rotate book back to shelf orientation
        tl.to(this.rotation, {
            y:        this.initialRotationY,
            duration: duration,
            ease
        }, '>-0.3');

        // 3. Slide back to original shelf position
        tl.to(this.position, {
            x:        this.initialX,
            y:        this.initialY,
            duration: duration * 0.7,
            ease:     'power2.inOut'
        }, '<');

        tl.to(this.position, {
            z:        targetZ,
            duration: duration * 0.5,
            ease:     'power2.in'
        }, '>-0.1');

        return tl;
    }

    // ─── Responsive ─────────────────────────────────────────────────────────────

    updateScale(screenWidth) {
        const baseScale = Math.min(1, screenWidth / 1200);
        this.scale.set(baseScale, baseScale, baseScale);
    }
}
