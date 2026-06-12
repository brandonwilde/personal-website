import * as THREE from 'three';
import { ROOM_ENVIRONMENT } from '../config/constants.js';

// A shared equirectangular reflection map standing in for the "room" that
// reflective surfaces in the scene mirror: a warm bright ceiling fading to a
// dark floor, with a soft overhead band that reads as a polished highlight.
//
// This isn't tied to any one material — point any MeshStandardMaterial's
// `envMap` at it (and tune with `envMapIntensity`) to give a surface natural
// reflections without per-item setup. The texture is built once and shared.
// Tunable colors/sizes live in ROOM_ENVIRONMENT in config/constants.js.

let _roomEnv = null;

export function roomEnvironment() {
    if (_roomEnv) return _roomEnv;

    const R = ROOM_ENVIRONMENT;
    const canvas = document.createElement('canvas');
    canvas.width  = R.WIDTH;
    canvas.height = R.HEIGHT;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    for (const [stop, color] of R.GRADIENT) grad.addColorStop(stop, color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const band = ctx.createRadialGradient(
        canvas.width / 2, R.BAND_CENTER_Y, 0,
        canvas.width / 2, R.BAND_CENTER_Y, canvas.width / 2
    );
    band.addColorStop(0, R.BAND_INNER);
    band.addColorStop(1, R.BAND_OUTER);
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping    = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    _roomEnv = tex;
    return tex;
}
