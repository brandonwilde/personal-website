import * as THREE from 'three';
import { BOOK_DEFAULTS, ANIM_PARAMS } from '../config/constants.js';
import { formatReadDate } from '../data/goodreads.js';

export class Book extends THREE.Group {
    constructor(bookId, {
        width,
        height,
        thickness,
        color,
        content,
        modalInfo = null,
    }) {
        super();
        this.bookId = bookId;
        this.color = color;
        this.content = content;
        this.modalInfo = modalInfo;
        // Spine text: review books show only the main title (pre-colon) so the spine stays
        // legible; every other book keeps its full content on the spine.
        this.spineText = modalInfo?.kind === 'review' ? this._titleParts().main : content;
        this.isHovered = false;
        this.isOpen = false;
        this.initialX = 0;
        this.initialY = 0;
        this.initialZ = 0;
        this.initialRotationY = 0;
        this._typeScale = 1;

        // Books with structured content derive their trim size from how much content
        // they hold (fixed readable type → dimensions follow the text, like real
        // publishing). Any dimension pinned in config overrides the computed value.
        // Title-only books (no modalInfo) keep their hand-set config dimensions.
        const computed = this.modalInfo ? this._computeContentSizing() : null;
        this.dimensions = {
            width:     width     ?? computed?.width     ?? BOOK_DEFAULTS.WIDTH,
            height:    height    ?? computed?.height    ?? BOOK_DEFAULTS.HEIGHT,
            thickness: thickness ?? computed?.thickness ?? BOOK_DEFAULTS.THICKNESS,
        };
        if (computed) this._typeScale = computed.typeScale;

        this.createGeometry();
    }

    // ─── Texture Creators ───────────────────────────────────────────────────────

    // Splits the title on the first colon into { main, subtitle }. Books without a colon
    // return the whole title as `main` and an empty subtitle.
    _titleParts() {
        const raw = this.content ?? '';
        const idx = raw.indexOf(':');
        if (idx === -1) return { main: raw.trim(), subtitle: '' };
        return { main: raw.slice(0, idx).trim(), subtitle: raw.slice(idx + 1).trim() };
    }

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

        if (this.spineText) {
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            ctx.fillStyle = luminance > T.SPINE_LUMINANCE_THRESHOLD ? '#111111' : '#f0ece4';

            const { lines, font } = this._spineLayout(ctx, thickness, height);

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${font}px Georgia, serif`;

            const gap = font * (1 + T.SPINE_LINE_GAP_RATIO);
            const n = lines.length;
            lines.forEach((line, i) => ctx.fillText(line, 0, (i - (n - 1) / 2) * gap));
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
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const maxTextWidth = canvas.width  - (innerMargin + T.TITLE_TEXT_PADDING) * 2;
            const usableHeight = canvas.height - (innerMargin + T.TITLE_TEXT_PADDING) * 2;
            const lineHRatio   = T.TITLE_LINE_HEIGHT_RATIO;
            const minFontSize  = 10;
            let fontSize = Math.max(16, Math.floor(canvas.width * T.TITLE_FONT_SIZE_RATIO));

            if (this.modalInfo?.kind === 'review') {
                // Review left page: main title (large) + subtitle (medium) + author (small),
                // shrunk together until the whole block fits the border, then centered — so a
                // long title never pushes the byline into the margin.
                const { main, subtitle } = this._titleParts();
                const author = this.modalInfo.author;

                const layout = (size) => {
                    const blocks = [];
                    const add = (text, factor, style, color, gapAfter) => {
                        if (!text) return;
                        const fs = size * factor;
                        ctx.font = `${style} ${fs}px Georgia, serif`;
                        blocks.push({ lines: wrapText(ctx, text, maxTextWidth), fs, style, color, gapAfter: gapAfter * size });
                    };
                    add(main, 1.0, 'bold', '#1a1a1a', 0.35);
                    add(subtitle, 0.62, '', '#3a3a3a', 0.45);
                    add(author ? `by ${author}` : '', 0.5, 'italic', '#666', 0);
                    return blocks;
                };

                let blocks, totalH;
                while (true) {
                    blocks = layout(fontSize);
                    totalH = 0;
                    let widest = 0;
                    for (const blk of blocks) {
                        for (const l of blk.lines) {
                            ctx.font = `${blk.style} ${blk.fs}px Georgia, serif`;
                            widest = Math.max(widest, ctx.measureText(l).width);
                        }
                        totalH += blk.lines.length * blk.fs * lineHRatio + blk.gapAfter;
                    }
                    if ((totalH <= usableHeight && widest <= maxTextWidth) || fontSize <= minFontSize) break;
                    fontSize -= 1;
                }

                let y = canvas.height / 2 - totalH / 2;
                for (const blk of blocks) {
                    const lh = blk.fs * lineHRatio;
                    ctx.fillStyle = blk.color;
                    for (const l of blk.lines) {
                        ctx.font = `${blk.style} ${blk.fs}px Georgia, serif`;
                        ctx.fillText(l, canvas.width / 2, y + lh / 2);
                        y += lh;
                    }
                    y += blk.gapAfter;
                }
            } else {
                // Shrink-to-fit: wrap text, then shrink font if any line still overflows
                // (e.g. a single long word that can't be broken).
                let lines = [];
                while (true) {
                    ctx.font = `bold ${fontSize}px Georgia, serif`;
                    lines = wrapText(ctx, this.content, maxTextWidth);
                    const widest = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
                    if (widest <= maxTextWidth || fontSize <= minFontSize) break;
                    fontSize -= 1;
                }

                const lineHeight = fontSize * lineHRatio;
                const textBlockHeight = lines.length * lineHeight;
                const startY = canvas.height / 2 - textBlockHeight / 2 + lineHeight / 2;
                lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, startY + i * lineHeight));
            }
        }

        return new THREE.CanvasTexture(canvas);
    }

    // Builds the ordered list of drawable items for the content page at a given page
    // width and type scale. Each item is { advance (px height it consumes), draw? }.
    // Used both to *measure* content (sum of advances → derive book size) and to
    // *render* it, so the two never drift apart. Type is sized in physical inches
    // (× PPU × typeScale) so it reads at a consistent size across every book.
    _composeContentItems(ctx, { textWidthPx, marginXpx, typeScale }) {
        const T   = BOOK_DEFAULTS.TEXTURE;
        const PPU = T.CONTENT_PIXELS_PER_UNIT;
        const W   = textWidthPx + marginXpx * 2;
        const lh  = T.CONTENT_LINE_HEIGHT;

        const titlePx = T.CONTENT_TITLE_IN    * PPU * typeScale;
        const subPx   = T.CONTENT_SUBTITLE_IN * PPU * typeScale;
        const orgPx   = T.CONTENT_ORG_IN      * PPU * typeScale;
        const bodyPx  = T.CONTENT_BODY_IN     * PPU * typeScale;
        const listPx  = T.CONTENT_LIST_IN     * PPU * typeScale;

        const [r, g, b] = this.color;
        const accent = `rgb(${Math.round(r * 0.6)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.6)})`;

        const items = [];
        const gap   = (px) => items.push({ advance: px });

        // Center-aligned wrapped text block (title / subtitle / org)
        const centered = (text, fontStr, fontPx, color) => {
            ctx.font = fontStr;
            for (const line of wrapText(ctx, text, textWidthPx)) {
                items.push({ advance: fontPx * lh, draw: (c, y) => {
                    c.font = fontStr; c.fillStyle = color;
                    c.textAlign = 'center'; c.textBaseline = 'top';
                    c.fillText(line, W / 2, y);
                }});
            }
        };

        // ── Goodreads review variant ──
        // Right page holds everything substantive: a title/subtitle/author ladder, a large
        // star rating, the genres, and the review text when one was written.
        if (this.modalInfo?.kind === 'review') {
            const { author, rating = 0, genres = [], review, dateAdded } = this.modalInfo;
            const [cr, cg, cb] = this.color;
            const { main, subtitle } = this._titleParts();

            // Size ladder: bold main title, lighter subtitle, smaller italic byline.
            centered(main, `bold ${titlePx}px Georgia, serif`, titlePx, '#1a1a1a');
            if (subtitle) {
                gap(titlePx * 0.12);
                centered(subtitle, `${subPx}px Georgia, serif`, subPx, '#3a3a3a');
            }
            gap(titlePx * 0.12);
            if (author) centered(`by ${author}`, `italic ${orgPx}px Georgia, serif`, orgPx, '#666');
            gap(subPx * 0.55);

            // Large star rating (filled vs. outlined star polygons)
            const starR    = titlePx * 0.62;
            const starStep = starR * 2.2;
            const drawStar = (c, cx, cy, filled) => {
                c.beginPath();
                for (let i = 0; i < 10; i++) {
                    const ang = -Math.PI / 2 + i * Math.PI / 5;
                    const rad = i % 2 === 0 ? starR : starR * 0.42;
                    const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
                    i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
                }
                c.closePath();
                if (filled) { c.fillStyle = '#d9a520'; c.fill(); }
                else {
                    c.fillStyle = '#ece4cf'; c.fill();
                    c.strokeStyle = '#c9bd96'; c.lineWidth = 1; c.stroke();
                }
            };
            items.push({ advance: starR * 2 + bodyPx * 0.6, draw: (c, y) => {
                const cy = y + starR;
                const startX = W / 2 - starStep * 2;   // 5 stars centered
                for (let i = 0; i < 5; i++) drawStar(c, startX + i * starStep, cy, i < rating);
            }});

            // Date read — the feed's raw pubDate, formatted to "Mon YYYY" here so the
            // display granularity stays in the view layer. Small italic caption under the stars.
            const readLabel = formatReadDate(dateAdded);
            if (readLabel) {
                centered(`Read ${readLabel}`, `italic ${listPx}px Georgia, serif`, listPx, '#8a8170');
                gap(bodyPx * 0.2);
            }

            // Genres — a centered small-caps middot line, wrapped by whole genre so a
            // separator never orphans at a line start.
            if (genres.length) {
                const muted   = `rgb(${Math.round(cr*0.5)},${Math.round(cg*0.5)},${Math.round(cb*0.5)})`;
                const gPx     = listPx * 0.95;
                const sep     = '   ·   ';
                const spacing = '1px';
                const labels  = genres.map(g => g.toUpperCase());

                ctx.font = `${gPx}px Georgia, serif`;
                if ('letterSpacing' in ctx) ctx.letterSpacing = spacing;
                const lines = [];
                let cur = [];
                for (const lab of labels) {
                    const test = [...cur, lab].join(sep);
                    if (ctx.measureText(test).width > textWidthPx && cur.length) { lines.push(cur); cur = [lab]; }
                    else cur.push(lab);
                }
                if (cur.length) lines.push(cur);
                if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

                gap(bodyPx * 0.2);
                for (const lineGenres of lines) {
                    const lineStr = lineGenres.join(sep);
                    items.push({ advance: gPx * 1.6, draw: (c, y) => {
                        c.font = `${gPx}px Georgia, serif`; c.fillStyle = muted;
                        c.textAlign = 'center'; c.textBaseline = 'top';
                        if ('letterSpacing' in c) c.letterSpacing = spacing;
                        c.fillText(lineStr, W / 2, y);
                        if ('letterSpacing' in c) c.letterSpacing = '0px';
                    }});
                }
                gap(bodyPx * 0.2);
            }

            // Review prose (only when the user actually wrote one)
            if (review) {
                gap(bodyPx * 0.6);
                items.push({ advance: 2, draw: (c, y) => {
                    c.strokeStyle = accent; c.lineWidth = 1;
                    c.beginPath(); c.moveTo(marginXpx, y); c.lineTo(W - marginXpx, y); c.stroke();
                }});
                gap(bodyPx * 0.7);
                ctx.font = `${bodyPx}px Georgia, serif`;
                for (const line of wrapText(ctx, review, textWidthPx)) {
                    items.push({ advance: bodyPx * lh, draw: (c, y) => {
                        c.font = `${bodyPx}px Georgia, serif`; c.fillStyle = '#222';
                        c.textAlign = 'left'; c.textBaseline = 'top';
                        c.fillText(line, marginXpx, y);
                    }});
                }
            }

            return items;
        }

        // ── Title ──
        centered(this.content ?? '', `bold ${titlePx}px Georgia, serif`, titlePx, '#1a1a1a');
        gap(titlePx * 0.2);

        // ── Subtitle / org ──
        if (this.modalInfo) {
            const subtitle = this.modalInfo.degree    ?? this.modalInfo.position ?? '';
            const org      = this.modalInfo.university ?? this.modalInfo.company  ?? '';
            if (subtitle) centered(subtitle, `italic ${subPx}px Georgia, serif`, subPx, '#444');
            if (org)      centered(org,      `${orgPx}px Georgia, serif`,        orgPx, '#666');
        }

        // ── Divider ──
        gap(bodyPx * 0.5);
        items.push({ advance: 2, draw: (c, y) => {
            c.strokeStyle = accent; c.lineWidth = 1;
            c.beginPath(); c.moveTo(marginXpx, y); c.lineTo(W - marginXpx, y); c.stroke();
        }});
        gap(bodyPx * 0.6);

        if (!this.modalInfo) return items;

        // ── Meta stats (GPA / dates) ──
        const meta = [];
        if (this.modalInfo.gpa)            meta.push(['GPA',       this.modalInfo.gpa]);
        if (this.modalInfo.graduationDate) meta.push(['Graduated', this.modalInfo.graduationDate]);
        if (this.modalInfo.startDate) {
            const end = this.modalInfo.endDate ?? 'Present';
            meta.push(['Dates', `${this.modalInfo.startDate} – ${end}`]);
        }
        for (const [label, value] of meta) {
            items.push({ advance: bodyPx * 1.5, draw: (c, y) => {
                c.textAlign = 'left'; c.textBaseline = 'top';
                c.font = `bold ${bodyPx}px Georgia, serif`; c.fillStyle = accent;
                c.fillText(`${label}: `, marginXpx, y);
                const labelW = c.measureText(`${label}: `).width;
                c.font = `${bodyPx}px Georgia, serif`; c.fillStyle = '#222';
                c.fillText(value, marginXpx + labelW, y);
            }});
        }
        if (meta.length) gap(bodyPx * 0.4);

        // ── Section list (projects / accomplishments) ──
        const listItems    = this.modalInfo.projects ?? this.modalInfo.accomplishments ?? [];
        const sectionLabel = this.modalInfo.projects
            ? 'Research Projects'
            : this.modalInfo.accomplishments
                ? 'Accomplishments'
                : null;

        if (sectionLabel && listItems.length) {
            items.push({ advance: bodyPx * 1.3, draw: (c, y) => {
                c.textAlign = 'left'; c.textBaseline = 'top';
                c.font = `bold ${bodyPx}px Georgia, serif`; c.fillStyle = '#1a1a1a';
                c.fillText(sectionLabel, marginXpx, y);
            }});
            items.push({ advance: 8, draw: (c, y) => {
                c.strokeStyle = accent; c.lineWidth = 0.5;
                c.beginPath(); c.moveTo(marginXpx, y); c.lineTo(W - marginXpx, y); c.stroke();
            }});

            const bulletX = marginXpx + 10;
            const itemX   = marginXpx + 22;
            const itemW   = W - itemX - marginXpx;
            ctx.font = `${listPx}px Georgia, serif`;
            for (const item of listItems) {
                const lines = wrapText(ctx, item, itemW);
                lines.forEach((line, i) => {
                    items.push({ advance: listPx * 1.55, draw: (c, y) => {
                        c.textAlign = 'left'; c.textBaseline = 'top';
                        c.font = `${listPx}px Georgia, serif`;
                        if (i === 0) { c.fillStyle = accent; c.fillText('•', bulletX, y); }
                        c.fillStyle = '#222'; c.fillText(line, itemX, y);
                    }});
                });
            }
        }

        return items;
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

        ctx.fillStyle = T.TITLE_BG_COLOR;
        ctx.fillRect(0, 0, W, H);

        if (!this.content && !this.modalInfo) return new THREE.CanvasTexture(canvas);

        const marginXpx = T.CONTENT_MARGIN_X_IN  * PPU;
        const marginYpx = T.CONTENT_MARGIN_TOP_IN * PPU;
        const textWidthPx = W - marginXpx * 2;

        const items = this._composeContentItems(ctx, { textWidthPx, marginXpx, typeScale: this._typeScale });
        const totalH = items.reduce((sum, it) => sum + it.advance, 0);

        // Vertically center the content block in the usable area so leftover space is
        // balanced top-and-bottom rather than pooling at the bottom. If content is
        // taller than the page (shouldn't happen post-sizing), start at the top margin.
        const usableH = H - marginYpx * 2;
        let y = marginYpx + Math.max(0, (usableH - totalH) / 2);

        for (const it of items) {
            if (it.draw && y + it.advance <= H) it.draw(ctx, y);
            y += it.advance;
        }

        return new THREE.CanvasTexture(canvas);
    }

    // Derives realistic trim dimensions from the laid-out content: fixed readable type
    // size, page height chosen so content fills ~TARGET_FILL of the page, width nudged
    // to keep a realistic hardcover aspect ratio, and a small type-scale adjustment so
    // sparse books fill out and dense books fit on one page. Thickness tracks content
    // volume as a page-count proxy. Returns { width, height, thickness, typeScale }.
    _computeContentSizing() {
        const T   = BOOK_DEFAULTS.TEXTURE;
        const S   = BOOK_DEFAULTS.CONTENT_SIZING;
        const PPU = T.CONTENT_PIXELS_PER_UNIT;
        const pageInset = BOOK_DEFAULTS.PAGE.INSET;
        const marginYIn = T.CONTENT_MARGIN_TOP_IN;
        const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

        const ctx = document.createElement('canvas').getContext('2d');

        // Total content height (inches) for a given trim width and type scale.
        const contentHeightIn = (widthIn, typeScale) => {
            const canvasW   = (widthIn - pageInset * 2) * PPU;
            const marginXpx = T.CONTENT_MARGIN_X_IN * PPU;
            const textWidthPx = canvasW - marginXpx * 2;
            const items = this._composeContentItems(ctx, { textWidthPx, marginXpx, typeScale });
            return items.reduce((sum, it) => sum + it.advance, 0) / PPU;
        };

        // 1. Page height so content occupies ~TARGET_FILL of the usable height, plus a
        //    deterministic per-book nudge so similar-content books still differ on the shelf.
        const contentH = contentHeightIn(S.MEASURE_WIDTH, 1);
        let height = clamp(contentH / S.TARGET_FILL + marginYIn * 2, S.HEIGHT_MIN, S.HEIGHT_MAX);
        height = clamp(height + this._jitter('h') * S.HEIGHT_JITTER, S.HEIGHT_MIN, S.HEIGHT_MAX);

        // 2. Width from a per-book aspect ratio within the realistic hardcover band.
        const ratio = S.RATIO_MIN + ((this._jitter('r') + 1) / 2) * (S.RATIO_MAX - S.RATIO_MIN);
        const width = clamp(height / ratio, S.WIDTH_MIN, S.WIDTH_MAX);

        // 3. Fit type to fill ~TARGET_FILL of the usable height. Content height grows
        //    super-linearly with type scale (bigger type wraps to more lines), so
        //    binary-search the scale rather than assuming a linear relationship.
        const usableHIn = height - marginYIn * 2;
        const targetH = usableHIn * S.TARGET_FILL;
        let typeScale;
        if (contentHeightIn(width, S.TYPE_SCALE_MIN) >= targetH) {
            typeScale = S.TYPE_SCALE_MIN;        // even smallest type overfills — cram at min
        } else if (contentHeightIn(width, S.TYPE_SCALE_MAX) <= targetH) {
            typeScale = S.TYPE_SCALE_MAX;        // even largest type underfills — grow to max
        } else {
            let lo = S.TYPE_SCALE_MIN, hi = S.TYPE_SCALE_MAX;
            for (let i = 0; i < 14; i++) {
                const mid = (lo + hi) / 2;
                if (contentHeightIn(width, mid) <= targetH) lo = mid; else hi = mid;
            }
            typeScale = lo;
        }

        // 4. Thickness from content volume (page-count proxy), then thickened if a long
        //    title needs two readable spine lines (see _twoLineThickness).
        let thickness = clamp(S.THICKNESS_BASE + contentH * S.THICKNESS_PER_IN,
                              S.THICKNESS_MIN, S.THICKNESS_MAX);
        thickness = this._spineThickness(ctx, height, thickness);

        return { width, height, thickness, typeScale };
    }

    // Chooses how to lay out the spine title: tries 1…SPINE_MAX_LINES balanced columns
    // and picks the option that yields the largest readable font for the given trim. The
    // font is limited both by title length (along the spine height) and by how many
    // columns fit across the spine thickness. Returns { lines, font }.
    _spineLayout(ctx, thicknessIn, heightIn) {
        const T   = BOOK_DEFAULTS.TEXTURE;
        const PPU = T.SPINE_PIXELS_PER_UNIT;
        const maxLen  = heightIn   * PPU * T.SPINE_MAX_TEXT_WIDTH_RATIO;
        const widthPx = thicknessIn * PPU * T.SPINE_TEXT_WIDTH_FRAC;

        ctx.font = 'bold 100px Georgia, serif';
        const perPx = (s) => ctx.measureText(s).width / 100;   // text width per 1px of font

        let best = null;
        for (let n = 1; n <= T.SPINE_MAX_LINES; n++) {
            const lines = balanceLines(this.spineText, n);
            if (lines.length !== n) break;                     // fewer words than columns
            const longest   = Math.max(...lines.map(perPx));
            const fontLen   = maxLen / longest;                // limited by spine length
            const fontThick = widthPx / (n + (n - 1) * T.SPINE_LINE_GAP_RATIO); // by thickness
            const font = Math.max(6, Math.min(fontLen, fontThick));
            if (!best || font > best.font * T.SPINE_LINE_GAIN) best = { lines, font };
        }
        return best;
    }

    // Returns a thickness large enough to host the spine title at a comfortable size
    // (capped by what the title length allows), without shrinking below the input.
    _spineThickness(ctx, heightIn, thickness) {
        const T   = BOOK_DEFAULTS.TEXTURE;
        const S   = BOOK_DEFAULTS.CONTENT_SIZING;
        const PPU = T.SPINE_PIXELS_PER_UNIT;
        const maxLen = heightIn * PPU * T.SPINE_MAX_TEXT_WIDTH_RATIO;

        ctx.font = 'bold 100px Georgia, serif';
        const perPx = (s) => ctx.measureText(s).width / 100;

        // Pick the line count giving the largest comfortable font, then the thickness
        // needed to host that many columns at that size.
        let need = thickness;
        let bestFont = 0;
        for (let n = 1; n <= T.SPINE_MAX_LINES; n++) {
            const lines = balanceLines(this.spineText, n);
            if (lines.length !== n) break;
            const longest   = Math.max(...lines.map(perPx));
            const fontLen   = maxLen / longest;
            const target    = Math.min(fontLen, T.SPINE_COMFORT_FONT_PX);
            if (target <= bestFont * T.SPINE_LINE_GAIN) continue;
            bestFont = target;
            need = target * (n + (n - 1) * T.SPINE_LINE_GAP_RATIO) / (PPU * T.SPINE_TEXT_WIDTH_FRAC);
        }
        return Math.min(Math.max(thickness, need), S.THICKNESS_MAX);
    }

    // Stable [-1, 1] hash from the book id (+ salt) for deterministic per-book variation.
    _jitter(salt = '') {
        const str = this.bookId + salt;
        let h = 0;
        for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
        return ((Math.abs(h) % 1000) / 1000) * 2 - 1;
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

        // Review books show the real Goodreads cover on the front outer face. The
        // procedural cover texture stands in (hash color) until the image loads, so the
        // book is never blank; the spine/back stay procedural to keep the hash color
        // instant and avoid reading pixels off a cross-origin image.
        let frontOuterMat = this.materials.cover;
        if (this.modalInfo?.kind === 'review' && this.modalInfo.coverImgSrcFull) {
            frontOuterMat = new THREE.MeshStandardMaterial({
                map:       coverTexture,
                roughness: M.COVER_ROUGHNESS,
                metalness: M.COVER_METALNESS,
            });
            this.materials.frontArt = frontOuterMat;
            this._loadCoverImage(frontOuterMat, this.modalInfo.coverImgSrcFull, this.modalInfo.coverImgSrc);
        }

        // Front cover uses per-face materials so the inside (-Z face, index 5) shows
        // the title page when the cover swings open toward the viewer.
        const frontCoverFaceMaterials = [
            this.materials.cover,      // +X
            this.materials.cover,      // -X (spine edge)
            this.materials.cover,      // +Y
            this.materials.cover,      // -Y
            frontOuterMat,             // +Z outer face — real cover art for review books
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

    // Loads a real book cover into `material` asynchronously, swapping it in once decoded
    // (the procedural placeholder shows until then). gr-assets serves the image with
    // `Access-Control-Allow-Origin: *`, so it uploads to WebGL cleanly. Falls back to the
    // thumbnail URL if the full-resolution variant fails; on total failure the placeholder
    // stays. Never blocks the first render.
    _loadCoverImage(material, url, fallbackUrl) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        const apply = (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            material.map = tex;
            material.needsUpdate = true;
        };
        loader.load(url, apply, undefined, () => {
            if (fallbackUrl && fallbackUrl !== url) loader.load(fallbackUrl, apply, undefined, () => {});
        });
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

// Splits `text` into `n` character-balanced lines at word boundaries (greedy: fill to
// the running target length). Returns fewer than `n` lines when there aren't enough
// words to fill them.
function balanceLines(text, n) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= n) return n === 1 ? [words.join(' ')] : words.slice();
    if (n === 1) return [words.join(' ')];

    const total  = words.reduce((s, w) => s + w.length, 0) + (words.length - 1);
    const target = total / n;
    const lines = [];
    let line = '', remainingWords = words.length;
    for (const word of words) {
        const linesLeft = n - lines.length;
        const candidate = line ? `${line} ${word}` : word;
        // Start a new line once this one is near its share — but never strand the
        // remaining words with fewer lines than they need.
        if (line && candidate.length > target && linesLeft > 1 && remainingWords >= linesLeft) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
        remainingWords--;
    }
    if (line) lines.push(line);
    return lines;
}

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
