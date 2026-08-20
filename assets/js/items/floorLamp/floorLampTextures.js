import * as THREE from 'three';
import { FLOOR_LAMP } from '../../config/constants.js';

// Lamp shade maps, built once in a single pass: `linen` is the woven cloth
// colour (also its bump map), `glow` the emissive mask, hottest at the bulb.

let _maps = null;

export function shadeTextures() {
    if (_maps) return _maps;

    const T = FLOOR_LAMP.TEXTURE;
    const w = T.SIZE_X;
    const h = T.SIZE_Y;

    const linen = new ImageData(w, h);
    const glow  = new ImageData(w, h);
    const [br, bg, bb] = T.LINEN;
    const seamX = w * 0.5;

    for (let y = 0; y < h; y++) {
        // Canvas rows run top-down; texture v runs bottom-up.
        const v = 1 - y / (h - 1);
        const d = (v - T.GLOW_CENTER) / T.GLOW_FALLOFF;
        const lit = T.GLOW_FLOOR + (1 - T.GLOW_FLOOR) * Math.exp(-d * d * 2.2);
        const g = Math.round(255 * Math.min(1, lit));

        // Weft threads: a few run thicker than the rest (linen "slubs").
        const weft = Math.sin((y / T.WEAVE_PERIOD) * Math.PI);
        const slub = Math.sin(y * 0.021) * Math.sin(y * 0.113);

        for (let x = 0; x < w; x++) {
            const warp = Math.sin((x / T.WEAVE_PERIOD) * Math.PI);
            let shade = warp * weft * T.WEAVE_DEPTH
                      + slub * Math.sin(x * 0.017) * T.SLUB_DEPTH
                      + (Math.random() - 0.5) * 2 * T.GRAIN;

            let seam = 1;
            if (Math.abs(x - seamX) < T.SEAM_WIDTH) seam = T.SEAM_DARKEN;

            const i = (y * w + x) * 4;
            linen.data[i]     = clamp((br + shade) * seam);
            linen.data[i + 1] = clamp((bg + shade) * seam);
            linen.data[i + 2] = clamp((bb + shade) * seam);
            linen.data[i + 3] = 255;

            // The weave lets slightly more light through where threads are thin.
            const gg = clamp(g + shade * 0.6);
            glow.data[i] = glow.data[i + 1] = glow.data[i + 2] = gg;
            glow.data[i + 3] = 255;
        }
    }

    _maps = {
        linen: toTexture(linen, THREE.SRGBColorSpace),
        glow:  toTexture(glow),
    };
    return _maps;
}

function clamp(v) {
    return v < 0 ? 0 : v > 255 ? 255 : v;
}

function toTexture(imageData, colorSpace) {
    const canvas = document.createElement('canvas');
    canvas.width  = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 8;
    if (colorSpace) tex.colorSpace = colorSpace;
    return tex;
}
