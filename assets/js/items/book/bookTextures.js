import * as THREE from 'three';
import { BOOK_DEFAULTS } from '../../config/constants.js';
import { wrapText } from './bookText.js';
import { spineLayout } from './bookGeometry.js';

// Canvas-painted textures/materials for a book's exterior: spine, cloth cover, logo
// front, and the inside title page. Each takes the book instance for its color, trim
// dimensions, and title text.

// Splits the title on the first colon into { main, subtitle }. Books without a colon
// return the whole title as `main` and an empty subtitle.
export function titleParts(content) {
    const raw = content ?? '';
    const idx = raw.indexOf(':');
    if (idx === -1) return { main: raw.trim(), subtitle: '' };
    return { main: raw.slice(0, idx).trim(), subtitle: raw.slice(idx + 1).trim() };
}

// Add cloth-grain noise to a painted region so cover and spine share the
// same fabric look. Applies before any text is drawn so lettering stays crisp.
export function applyFabricGrain(ctx, x, y, w, h) {
    const amp = BOOK_DEFAULTS.TEXTURE.COVER_NOISE_AMPLITUDE;
    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const n = (Math.random() - 0.5) * amp;
        data[i]   = Math.min(255, Math.max(0, data[i]   + n));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + n));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + n));
    }
    ctx.putImageData(imageData, x, y);
}

// Wrap a canvas as an albedo texture. Pixels are painted with sRGB values,
// so tag the texture sRGB or three.js samples them as linear and the result
// renders too bright/washed out.
export function albedoTexture(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = BOOK_DEFAULTS.TEXTURE.ANISOTROPY;
    return tex;
}

// Vertical title text on the spine
export function createSpineTexture(book) {
    const { thickness, height } = book.dimensions;
    const T = BOOK_DEFAULTS.TEXTURE;
    const canvas = document.createElement('canvas');
    canvas.width  = Math.max(32, Math.round(thickness * T.SPINE_PIXELS_PER_UNIT));
    canvas.height = Math.max(64, Math.round(height    * T.SPINE_PIXELS_PER_UNIT));
    const ctx = canvas.getContext('2d');

    const [r, g, b] = book.color;
    const d = T.SPINE_DARKEN * T.COLOR_GAIN;
    const lift = (c) => Math.min(255, Math.round(c * d));
    ctx.fillStyle = `rgb(${lift(r)}, ${lift(g)}, ${lift(b)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    applyFabricGrain(ctx, 0, 0, canvas.width, canvas.height);

    if (book.spineText) {
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        ctx.fillStyle = luminance > T.SPINE_LUMINANCE_THRESHOLD ? '#111111' : '#f0ece4';

        const { lines, font } = spineLayout(ctx, book.spineText, thickness, height);

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

    return albedoTexture(canvas);
}

// Subtle fabric/cloth grain texture for cover exteriors
export function createCoverTexture(book) {
    const size = BOOK_DEFAULTS.TEXTURE.COVER_CANVAS_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    paintCloth(canvas.getContext('2d'), book.color, size);
    return albedoTexture(canvas);
}

// Fills a square canvas with the book's cloth color plus subtle grain noise.
// COLOR_GAIN brightens the cloth and the grain matches every other fabric face.
export function paintCloth(ctx, color, size) {
    const T = BOOK_DEFAULTS.TEXTURE;
    const g0 = T.COLOR_GAIN;
    const [r, g, b] = color.map(c => Math.min(255, Math.round(c * g0)));
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, size, size);
    applyFabricGrain(ctx, 0, 0, size, size);
}

// Front outer cover material with a logo/crest centered over the cloth. coverAspect
// (width/height) keeps the logo undistorted on the non-square face; it loads async.
export function createLogoFrontMaterial(book, logoSrc, coverAspect, logoScale = 1) {
    const M = BOOK_DEFAULTS.MATERIAL;
    const C = BOOK_DEFAULTS.COVER;
    const size = C.LOGO_CANVAS_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    paintCloth(ctx, book.color, size);

    // sRGB-tagged like createCoverTexture so the cloth brightness matches.
    const texture = albedoTexture(canvas);
    const material = new THREE.MeshStandardMaterial({
        map:       texture,
        roughness: M.COVER_ROUGHNESS,
        metalness: M.COVER_METALNESS,
    });

    const img = new Image();
    img.onload = () => {
        if (!img.naturalWidth || !img.naturalHeight) return;
        const maxPx = size * C.LOGO_MAX_FRACTION * logoScale;
        // Canvas-px aspect that yields the logo's true world aspect once the
        // non-square cover stretches it: world aspect = (cw/ch) * coverAspect.
        const cwToCh = (img.naturalWidth / img.naturalHeight) / coverAspect;
        let cw, ch;
        if (cwToCh >= 1) { cw = maxPx; ch = maxPx / cwToCh; }
        else             { ch = maxPx; cw = maxPx * cwToCh; }
        const dx = (size - cw) / 2, dy = (size - ch) / 2;

        // Build the logo on its own layer so the heavy weave grain affects only the
        // logo — the surrounding cloth stays identical to the other cover faces.
        const layer = document.createElement('canvas');
        layer.width  = size;
        layer.height = size;
        const lctx = layer.getContext('2d');
        lctx.globalAlpha = C.LOGO_ALPHA;     // let cloth color/weave bleed up through the logo
        lctx.drawImage(img, dx, dy, cw, ch);
        lctx.globalAlpha = 1;
        overlayGrain(lctx, size);            // weave the grain into the logo
        lctx.globalCompositeOperation = 'source-atop';     // darken only the logo pixels
        lctx.fillStyle = `rgba(0, 0, 0, ${C.LOGO_DARKEN})`;
        lctx.fillRect(0, 0, size, size);
        lctx.globalCompositeOperation = 'destination-in';  // clip grain back to the logo shape
        lctx.drawImage(img, dx, dy, cw, ch);

        ctx.drawImage(layer, 0, 0);          // composite the woven logo onto untouched cloth
        texture.needsUpdate = true;
    };
    img.src = logoSrc;

    return material;
}

// Overlay-blends neutral-gray noise so the logo beneath picks up the fabric weave.
// Gray is neutral, so only the noise varies light/dark — no color shift.
export function overlayGrain(ctx, size) {
    const C = BOOK_DEFAULTS.COVER;
    const amp = C.LOGO_GRAIN_AMPLITUDE;
    const grain = document.createElement('canvas');
    grain.width  = size;
    grain.height = size;
    const gctx = grain.getContext('2d');
    const imageData = gctx.createImageData(size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const v = 128 + (Math.random() - 0.5) * amp;
        data[i] = data[i+1] = data[i+2] = v;
        data[i+3] = 255;
    }
    gctx.putImageData(imageData, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = C.LOGO_GRAIN_ALPHA;
    ctx.drawImage(grain, 0, 0);
    ctx.restore();
}

// Title page shown on the inside face of the front cover when open
export function createTitlePageTexture(book) {
    const { width, height } = book.dimensions;
    const T = BOOK_DEFAULTS.TEXTURE;
    const canvas = document.createElement('canvas');
    canvas.width  = Math.round(width  * T.TITLE_PIXELS_PER_UNIT);
    canvas.height = Math.round(height * T.TITLE_PIXELS_PER_UNIT);
    const ctx = canvas.getContext('2d');

    const [r, g, b] = book.color;
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
    if (book.content) {
        ctx.fillStyle = T.TITLE_TEXT_COLOR;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const maxTextWidth = canvas.width  - (innerMargin + T.TITLE_TEXT_PADDING) * 2;
        const usableHeight = canvas.height - (innerMargin + T.TITLE_TEXT_PADDING) * 2;
        const lineHRatio   = T.TITLE_LINE_HEIGHT_RATIO;
        const minFontSize  = 10;
        let fontSize = Math.max(16, Math.floor(canvas.width * T.TITLE_FONT_SIZE_RATIO));

        if (book.modalInfo?.kind === 'review') {
            // Review left page: main title (large) + subtitle (medium) + author (small),
            // shrunk together until the whole block fits the border, then centered — so a
            // long title never pushes the byline into the margin.
            const { main, subtitle } = titleParts(book.content);
            const author = book.modalInfo.author;

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
                lines = wrapText(ctx, book.content, maxTextWidth);
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

    return albedoTexture(canvas);
}

// Loads a real book cover into `material` asynchronously, swapping it in once decoded
// (the procedural placeholder shows until then). gr-assets serves the image with
// `Access-Control-Allow-Origin: *`, so it uploads to WebGL cleanly. Falls back to the
// thumbnail URL if the full-resolution variant fails; on total failure the placeholder
// stays. Never blocks the first render.
export function loadCoverImage(material, url, fallbackUrl) {
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
