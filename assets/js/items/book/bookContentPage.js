import { BOOK_DEFAULTS } from '../../config/constants.js';
import { formatReadDate } from '../../data/goodreads.js';
import { wrapText } from './bookText.js';
import { albedoTexture, titleParts } from './bookTextures.js';
import { spineThickness, jitter } from './bookGeometry.js';

// The content page — the right-hand page shown when a book is opened — and the
// content-driven trim sizing derived from it. composeContentItems is the single source
// of truth for the laid-out content, used both to measure (→ book dimensions) and render.

// Builds the ordered list of drawable items for the content page at a given page
// width and type scale. Each item is { advance (px height it consumes), draw? }.
// Used both to *measure* content (sum of advances → derive book size) and to
// *render* it, so the two never drift apart. Type is sized in physical inches
// (× PPU × typeScale) so it reads at a consistent size across every book.
export function composeContentItems(book, ctx, { textWidthPx, marginXpx, typeScale }) {
    const T   = BOOK_DEFAULTS.TEXTURE;
    const PPU = T.CONTENT_PIXELS_PER_UNIT;
    const W   = textWidthPx + marginXpx * 2;
    const lh  = T.CONTENT_LINE_HEIGHT;

    const titlePx = T.CONTENT_TITLE_IN    * PPU * typeScale;
    const subPx   = T.CONTENT_SUBTITLE_IN * PPU * typeScale;
    const orgPx   = T.CONTENT_ORG_IN      * PPU * typeScale;
    const bodyPx  = T.CONTENT_BODY_IN     * PPU * typeScale;
    const listPx  = T.CONTENT_LIST_IN     * PPU * typeScale;

    const [r, g, b] = book.color;
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

    // Horizontal rule across the text column.
    const rule = (lineWidth) => items.push({ advance: 2, draw: (c, y) => {
        c.strokeStyle = accent; c.lineWidth = lineWidth;
        c.beginPath(); c.moveTo(marginXpx, y); c.lineTo(W - marginXpx, y); c.stroke();
    }});

    // Title + optional italic subtitle + org line, closed by a divider.
    // Shared header for the education / experience / project pages.
    const header = (subtitle, org, title) => {
        centered(title ?? book.content ?? '', `bold ${titlePx}px Georgia, serif`, titlePx, '#1a1a1a');
        gap(titlePx * 0.2);
        if (subtitle) centered(subtitle, `italic ${subPx}px Georgia, serif`, subPx, '#444');
        if (org)      centered(org,      `${orgPx}px Georgia, serif`,        orgPx, '#666');
        gap(bodyPx * 0.5);
        rule(1);
        gap(bodyPx * 0.6);
    };

    // "Label: value" stat rows (GPA, dates, repo, …).
    const metaRows = (rows) => {
        for (const [label, value] of rows) {
            items.push({ advance: bodyPx * 1.5, draw: (c, y) => {
                c.textAlign = 'left'; c.textBaseline = 'top';
                c.font = `bold ${bodyPx}px Georgia, serif`; c.fillStyle = accent;
                c.fillText(`${label}: `, marginXpx, y);
                const labelW = c.measureText(`${label}: `).width;
                c.font = `${bodyPx}px Georgia, serif`; c.fillStyle = '#222';
                c.fillText(value, marginXpx + labelW, y);
            }});
        }
        if (rows.length) gap(bodyPx * 0.4);
    };

    // Headed bullet list (research projects / accomplishments / highlights).
    const bulletList = (label, listItems) => {
        if (!label || !listItems.length) return;
        items.push({ advance: bodyPx * 1.3, draw: (c, y) => {
            c.textAlign = 'left'; c.textBaseline = 'top';
            c.font = `bold ${bodyPx}px Georgia, serif`; c.fillStyle = '#1a1a1a';
            c.fillText(label, marginXpx, y);
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
    };

    // A single headed group (label + rule + bullets) laid out within a column whose
    // left edge is `x0` and width is `colW`. Returns the group's items rather than
    // pushing them, so the caller can place groups in columns. x0 only affects the
    // draw position (not advances), so the same items measure identically anywhere.
    const makeGroupItems = (label, listItems, x0, colW) => {
        const out = [];
        if (!listItems.length) return out;
        const colRight = x0 + colW;
        if (label) {
            out.push({ advance: bodyPx * 1.3, draw: (c, y) => {
                c.textAlign = 'left'; c.textBaseline = 'top';
                c.font = `bold ${bodyPx}px Georgia, serif`; c.fillStyle = '#1a1a1a';
                c.fillText(label, x0, y);
            }});
            out.push({ advance: 8, draw: (c, y) => {
                c.strokeStyle = accent; c.lineWidth = 0.5;
                c.beginPath(); c.moveTo(x0, y); c.lineTo(colRight, y); c.stroke();
            }});
        }
        const bulletX = x0 + 10;
        const itemX   = x0 + 22;
        const itemW   = colRight - itemX;
        ctx.font = `${listPx}px Georgia, serif`;
        for (const item of listItems) {
            wrapText(ctx, item, itemW).forEach((line, i) => {
                out.push({ advance: listPx * 1.55, draw: (c, y) => {
                    c.textAlign = 'left'; c.textBaseline = 'top';
                    c.font = `${listPx}px Georgia, serif`;
                    if (i === 0) { c.fillStyle = accent; c.fillText('•', bulletX, y); }
                    c.fillStyle = '#222'; c.fillText(line, itemX, y);
                }});
            });
        }
        return out;
    };

    // Lays groups across two balanced columns (each new group joins the shorter
    // column), then emits one item spanning the taller column so the surrounding
    // single-column flow still measures and centers the block correctly.
    const twoColumnGroups = (groups) => {
        const gutter = bodyPx * 1.4;
        const colW   = (textWidthPx - gutter) / 2;
        const grpGap = bodyPx * 0.7;
        const cols = [
            { x: marginXpx,                 items: [], h: 0 },
            { x: marginXpx + colW + gutter, items: [], h: 0 },
        ];
        for (const group of groups) {
            const col = cols[0].h <= cols[1].h ? cols[0] : cols[1];
            const built  = makeGroupItems(group.label, group.items, col.x, colW);
            const height = built.reduce((s, it) => s + it.advance, 0) + grpGap;
            col.items.push(...built, { advance: grpGap });
            col.h += height;
        }
        const blockH = Math.max(cols[0].h, cols[1].h);
        items.push({ advance: blockH, draw: (c, yStart) => {
            for (const col of cols) {
                let y = yStart;
                for (const it of col.items) { if (it.draw) it.draw(c, y); y += it.advance; }
            }
        }});
    };

    // Draws the "Go to Repo" button and records its hotspot for the link overlay.
    const repoButton = (url) => {
        if (!url) return;
        const label = 'Go to Repo  →';
        const padX  = bodyPx * 1.1;
        const btnH  = bodyPx * 1.9;
        gap(bodyPx * 0.9);
        items.push({ advance: btnH, draw: (c, y) => {
            c.font = `bold ${bodyPx}px Georgia, serif`;
            const btnW = Math.min(c.measureText(label).width + padX * 2, W - marginXpx * 2);
            const x0 = (W - btnW) / 2, x1 = x0 + btnW, y1 = y + btnH;
            const r  = btnH / 2;
            c.beginPath();
            c.moveTo(x0 + r, y);
            c.arcTo(x1, y, x1, y1, r);
            c.arcTo(x1, y1, x0, y1, r);
            c.arcTo(x0, y1, x0, y, r);
            c.arcTo(x0, y, x1, y, r);
            c.closePath();
            c.fillStyle = accent; c.fill();
            c.fillStyle = '#f8f4ec';
            c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText(label, W / 2, y + btnH / 2 + 1);
            book._linkHotspots = [{ url, x0, y0: y, x1, y1 }];
        }});
    };

    // ── Goodreads review variant ──
    // Right page holds everything substantive: a title/subtitle/author ladder, a large
    // star rating, the genres, and the review text when one was written.
    if (book.modalInfo?.kind === 'review') {
        const { author, rating = 0, genres = [], review, dateAdded } = book.modalInfo;
        const [cr, cg, cb] = book.color;
        const { main, subtitle } = titleParts(book.content);

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

    // ── Standard pages: dispatch by content kind ──
    // Each kind owns its own field schema; the shared header / metaRows / bulletList
    // helpers keep the formatting consistent between them.
    const info = book.modalInfo;

    if (!info) {                          // title-only spine (skills, misc)
        header('', '');
        return items;
    }

    if (info.kind === 'education') {
        header(info.degree, info.university);
        const meta = [];
        if (info.gpa)            meta.push(['GPA',       info.gpa]);
        if (info.graduationDate) meta.push(['Graduated', info.graduationDate]);
        metaRows(meta);
        bulletList('Research Projects', info.projects ?? []);

    } else if (info.kind === 'experience') {
        header(info.position, info.company);
        const meta = [];
        if (info.startDate) meta.push(['Dates', `${info.startDate} – ${info.endDate ?? 'Present'}`]);
        metaRows(meta);
        bulletList('Accomplishments', info.accomplishments ?? []);

    } else if (info.kind === 'project') {
        header(info.tagline, info.tech);
        bulletList('Highlights', info.highlights ?? []);
        repoButton(info.repoUrl);

    } else if (info.kind === 'skills') {
        header('', '', info.title);   // title falls back to spine content (e.g. Languages → زبان‌ها)
        if (info.columns === 2) twoColumnGroups(info.groups ?? []);
        else for (const group of info.groups ?? []) {
            if (group.label) bulletList(group.label, group.items);
            else items.push(...makeGroupItems('', group.items, marginXpx, textWidthPx));
        }
    }

    return items;
}

// Content rendered on the pages front face (+Z) — the right-hand page when open.
// Baked at construction so the text is visible from the first frame of the
// open animation rather than appearing afterward.
export function createContentPageTexture(book) {
    const { width, height } = book.dimensions;
    const T   = BOOK_DEFAULTS.TEXTURE;
    const PPU = T.CONTENT_PIXELS_PER_UNIT;
    const pageInset = BOOK_DEFAULTS.PAGE.INSET;

    const canvas = document.createElement('canvas');
    canvas.width  = Math.round((width  - pageInset * 2) * PPU);
    canvas.height = Math.round((height - pageInset * 2) * PPU);
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    book._contentCanvasW = W;
    book._contentCanvasH = H;

    ctx.fillStyle = T.TITLE_BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    if (!book.content && !book.modalInfo) return albedoTexture(canvas);

    const marginXpx = T.CONTENT_MARGIN_X_IN  * PPU;
    const marginYpx = T.CONTENT_MARGIN_TOP_IN * PPU;
    const textWidthPx = W - marginXpx * 2;

    const items = composeContentItems(book, ctx, { textWidthPx, marginXpx, typeScale: book._typeScale });
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

    return albedoTexture(canvas);
}

// Derives realistic trim dimensions from the laid-out content: fixed readable type
// size, page height chosen so content fills ~TARGET_FILL of the page, width nudged
// to keep a realistic hardcover aspect ratio, and a small type-scale adjustment so
// sparse books fill out and dense books fit on one page. Thickness tracks content
// volume as a page-count proxy. Returns { width, height, thickness, typeScale }.
export function computeContentSizing(book) {
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
        const items = composeContentItems(book, ctx, { textWidthPx, marginXpx, typeScale });
        return items.reduce((sum, it) => sum + it.advance, 0) / PPU;
    };

    // 1. Page height so content occupies ~TARGET_FILL of the usable height, plus a
    //    deterministic per-book nudge so similar-content books still differ on the shelf.
    const contentH = contentHeightIn(S.MEASURE_WIDTH, 1);
    let height = clamp(contentH / S.TARGET_FILL + marginYIn * 2, S.HEIGHT_MIN, S.HEIGHT_MAX);
    height = clamp(height + jitter(book.bookId, 'h') * S.HEIGHT_JITTER, S.HEIGHT_MIN, S.HEIGHT_MAX);

    // 2. Width from a per-book aspect ratio within the realistic hardcover band.
    const ratio = S.RATIO_MIN + ((jitter(book.bookId, 'r') + 1) / 2) * (S.RATIO_MAX - S.RATIO_MIN);
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
    //    title needs two readable spine lines (see spineThickness).
    let thickness = clamp(S.THICKNESS_BASE + contentH * S.THICKNESS_PER_IN,
                          S.THICKNESS_MIN, S.THICKNESS_MAX);
    thickness = spineThickness(ctx, book.spineText, height, thickness);

    return { width, height, thickness, typeScale };
}
