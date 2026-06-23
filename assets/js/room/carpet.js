import * as THREE from 'three';
import { CARPET } from '../config/constants.js';

// Procedural carpet maps built on a canvas (no external assets), in the same
// spirit as room/environment.js. Produces a tileable colour, normal, and
// displacement map so the floor reads as a soft, fibrous cut-pile carpet
// instead of a flat painted plane.
//
// The look is carried by tuft-scale relief (not per-pixel grain, which just
// mip-maps back to flat at viewing distance): a few octaves of value noise
// dominated by a tuft frequency give clumps the lights can rake across. The
// normal map tilts hard off those clumps and the colour darkens in the valleys
// as fake ambient occlusion, while the separate, coarser displacement map
// pushes the near floor patch into genuine 3D topography (see room/floor.js).
// Tunables live in CARPET in config/constants.js.

let _maps = null;

export function carpetTexture() {
    if (_maps) return _maps;

    const C = CARPET;
    const size = C.TEXTURE_SIZE;

    const height = buildHeightField(size, C);

    const colorTex  = buildColorMap(size, height, C);
    const normalTex = buildNormalMap(size, height, C);
    const dispTex   = buildDisplacementMap(size, C);

    for (const tex of [colorTex, normalTex, dispTex]) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(C.REPEAT, C.REPEAT);
        tex.anisotropy = C.ANISOTROPY;
    }
    colorTex.colorSpace = THREE.SRGBColorSpace;

    _maps = { map: colorTex, normalMap: normalTex, displacementMap: dispTex };
    return _maps;
}

// A 0..1 height per pixel built as fractal value noise dominated by a tuft
// frequency (the fluffy clumps), with finer octaves for fibre detail. All
// octaves wrap, so the field tiles seamlessly.
function buildHeightField(size, C) {
    const h = new Float32Array(size * size);

    let cells = C.TUFT_CELLS;
    let amp = 1;
    for (let o = 0; o < C.OCTAVES; o++) {
        addSmoothOctave(h, size, cells, amp);
        cells = Math.min(size, cells * 2);
        amp *= C.PERSISTENCE;
    }

    // A whisper of per-pixel grain for fibre texture up close.
    for (let i = 0; i < h.length; i++) h[i] += Math.random() * C.GRAIN;

    normalize01(h);
    return h;
}

// Scale an array in place to the 0..1 range.
function normalize01(arr) {
    let min = Infinity, max = -Infinity;
    for (const v of arr) { if (v < min) min = v; if (v > max) max = v; }
    const span = max - min || 1;
    for (let i = 0; i < arr.length; i++) arr[i] = (arr[i] - min) / span;
}

// Bilinearly-interpolated, wrapping value noise on a `cells`×`cells` grid,
// added in place so octaves accumulate.
function addSmoothOctave(h, size, cells, amp) {
    const grid = new Float32Array(cells * cells);
    for (let i = 0; i < grid.length; i++) grid[i] = Math.random();

    const scale = cells / size;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const gx = x * scale, gy = y * scale;
            const x0 = Math.floor(gx), y0 = Math.floor(gy);
            const fx = gx - x0, fy = gy - y0;
            const x1 = (x0 + 1) % cells, y1 = (y0 + 1) % cells;
            const cx0 = x0 % cells, cy0 = y0 % cells;
            const v00 = grid[cy0 * cells + cx0], v10 = grid[cy0 * cells + x1];
            const v01 = grid[y1 * cells + cx0], v11 = grid[y1 * cells + x1];
            const top = v00 + (v10 - v00) * fx;
            const bot = v01 + (v11 - v01) * fx;
            h[y * size + x] += (top + (bot - top) * fy) * amp;
        }
    }
}

function buildColorMap(size, height, C) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    const data = img.data;

    // Base yarn colour as raw sRGB bytes — the canvas is an sRGB texture, so
    // do NOT route through THREE.Color (that yields linear values and double-
    // darkens once the GPU converts sRGB->linear again).
    const br = (C.COLOR >> 16) & 255;
    const bg = (C.COLOR >> 8) & 255;
    const bb = C.COLOR & 255;

    for (let i = 0; i < size * size; i++) {
        // Tuft tops catch light, valleys fall into shadow (fake AO). Biased so
        // the average stays near the base colour rather than darkening overall.
        const shade = 1 + (height[i] - 0.55) * 2 * C.COLOR_VARIATION;
        const o = i * 4;
        data[o]     = clamp255(br * shade);
        data[o + 1] = clamp255(bg * shade);
        data[o + 2] = clamp255(bb * shade);
        data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(canvas);
}

// Derive a tangent-space normal map from the height field via finite
// differences; steeper height gradients tilt the normal further.
function buildNormalMap(size, height, C) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    const data = img.data;

    const strength = C.NORMAL_STRENGTH;
    const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = (at(x - 1, y) - at(x + 1, y)) * strength;
            const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
            // Normalise (dx, dy, 1) into an RGB normal.
            const len = Math.sqrt(dx * dx + dy * dy + 1);
            const o = (y * size + x) * 4;
            data[o]     = clamp255((dx / len * 0.5 + 0.5) * 255);
            data[o + 1] = clamp255((dy / len * 0.5 + 0.5) * 255);
            data[o + 2] = clamp255((1  / len * 0.5 + 0.5) * 255);
            data[o + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(canvas);
}

// Low-frequency grayscale height for the displacementMap: the broad, plush
// lumps of the pile that get pushed into real geometry on the near patch.
// Kept coarse on purpose — fine fibre relief stays in the normal map, while
// this gives the surface genuine rolling topography that catches the lights.
function buildDisplacementMap(size, C) {
    const h = new Float32Array(size * size);

    let cells = C.DISP_CELLS;
    let amp = 1;
    for (let o = 0; o < C.DISP_OCTAVES; o++) {
        addSmoothOctave(h, size, cells, amp);
        cells = Math.min(size, cells * 2);
        amp *= 0.5;
    }
    normalize01(h);

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let i = 0; i < h.length; i++) {
        const v = clamp255(h[i] * 255);
        const o = i * 4;
        data[o] = data[o + 1] = data[o + 2] = v;
        data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(canvas);
}

function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
