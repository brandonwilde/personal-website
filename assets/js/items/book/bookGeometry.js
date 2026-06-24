import * as THREE from 'three';
import { BOOK_DEFAULTS } from '../../config/constants.js';
import { balanceLines } from './bookText.js';

// Spine geometry/sizing math: curving the spine shell, fitting the title onto it, and
// the deterministic per-book jitter used to vary dimensions.

// Bend the spine box into a shallow circular arc so it reads as a rounded
// hardcover. Every vertex is shifted toward the viewer by the arc depth at its
// thickness position, so the whole shell curves uniformly (inner face matches
// outer) rather than just bulging the front into a wedge. The thickness edges
// stay put (depth → 0) so the curve meets the cover edges flush, and shifting
// along X alone leaves the UVs — and thus the title mapping — untouched.
export function curveSpineGeometry(geometry, thickness, bulge) {
    if (bulge <= 0) return;
    const R = (bulge * bulge + (thickness / 2) ** 2) / (2 * bulge);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i);
        const depth = Math.sqrt(Math.max(0, R * R - z * z)) - (R - bulge);
        pos.setX(i, pos.getX(i) - depth);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
}

// Chooses how to lay out the spine title: tries 1…SPINE_MAX_LINES balanced columns
// and picks the option that yields the largest readable font for the given trim. The
// font is limited both by title length (along the spine height) and by how many
// columns fit across the spine thickness. Returns { lines, font }.
export function spineLayout(ctx, spineText, thicknessIn, heightIn) {
    const T   = BOOK_DEFAULTS.TEXTURE;
    const PPU = T.SPINE_PIXELS_PER_UNIT;
    const maxLen  = heightIn   * PPU * T.SPINE_MAX_TEXT_WIDTH_RATIO;
    const widthPx = thicknessIn * PPU * T.SPINE_TEXT_WIDTH_FRAC;

    ctx.font = 'bold 100px Georgia, serif';
    const perPx = (s) => ctx.measureText(s).width / 100;   // text width per 1px of font

    let best = null;
    for (let n = 1; n <= T.SPINE_MAX_LINES; n++) {
        const lines = balanceLines(spineText, n);
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
export function spineThickness(ctx, spineText, heightIn, thickness) {
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
        const lines = balanceLines(spineText, n);
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
export function jitter(bookId, salt = '') {
    const str = bookId + salt;
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return ((Math.abs(h) % 1000) / 1000) * 2 - 1;
}
