import * as THREE from 'three';
import { BOOKSHELF_DIMENSIONS, SHELF_LABEL, sectionCenterX } from '../config/constants.js';
import { roomEnvironment } from '../utils/roomEnvironment.js';

// Thin brass nameplate fixed to the front face of a shelf plank

function roundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
}

export class ShelfLabel {
    constructor(text, shelf, section) {
        this.text = text;

        const { texture, widthIn } = this._buildTexture(text);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.repeat.set(1 / widthIn, 1 / SHELF_LABEL.HEIGHT);
        texture.offset.set(0.5, 0.5);

        this.geometry = new THREE.ExtrudeGeometry(
            roundedRectShape(widthIn, SHELF_LABEL.HEIGHT, SHELF_LABEL.CORNER_RADIUS),
            { depth: SHELF_LABEL.DEPTH, bevelEnabled: false, curveSegments: 20 }
        );
        this.geometry.center();

        const env = roomEnvironment();
        const faceMaterial = new THREE.MeshStandardMaterial({
            map:            texture,
            color:          new THREE.Color(SHELF_LABEL.BASE_COLOR),
            metalness:      SHELF_LABEL.METALNESS,
            roughness:      SHELF_LABEL.ROUGHNESS,
            envMap:         env,
            envMapIntensity: SHELF_LABEL.ENV_INTENSITY,
        });
        const sideMaterial = new THREE.MeshStandardMaterial({
            color:          new THREE.Color(SHELF_LABEL.SIDE_COLOR),
            metalness:      SHELF_LABEL.METALNESS,
            roughness:      SHELF_LABEL.ROUGHNESS,
            envMap:         env,
            envMapIntensity: SHELF_LABEL.ENV_INTENSITY,
        });

        this.mesh = new THREE.Mesh(this.geometry, [faceMaterial, sideMaterial]);
        this.mesh.castShadow    = true;
        this.mesh.receiveShadow = true;

        const frontZ = BOOKSHELF_DIMENSIONS.DEPTH / 2 + SHELF_LABEL.DEPTH / 2 - SHELF_LABEL.FRONT_PROUD;
        this.mesh.position.set(sectionCenterX(section), shelf.y, frontZ);
    }

    _buildTexture(text) {
        const ppu = SHELF_LABEL.PIXELS_PER_UNIT;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Size the plate to the text, then shrink the font if it would overflow the cap width.
        let fontPx = SHELF_LABEL.FONT_IN * ppu;
        ctx.font = `bold ${fontPx}px Georgia, serif`;
        const textW = ctx.measureText(text).width / ppu;

        const widthIn = THREE.MathUtils.clamp(
            textW + 2 * SHELF_LABEL.PAD_X,
            SHELF_LABEL.MIN_WIDTH,
            SHELF_LABEL.MAX_WIDTH
        );
        const usableIn = widthIn - 2 * SHELF_LABEL.PAD_X;
        if (textW > usableIn) {
            fontPx *= usableIn / textW;
        }

        canvas.width  = Math.round(widthIn * ppu);
        canvas.height = Math.round(SHELF_LABEL.HEIGHT * ppu);
        const W = canvas.width;
        const H = canvas.height;

        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, SHELF_LABEL.GRADIENT_TOP);
        grad.addColorStop(1, SHELF_LABEL.GRADIENT_BOTTOM);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Soft light glare across the top half.
        const glare = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 1.1);
        glare.addColorStop(0, SHELF_LABEL.GLARE);
        glare.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, W, H);

        // Engraved label text.
        ctx.font = `bold ${fontPx}px Georgia, serif`;
        ctx.fillStyle = SHELF_LABEL.TEXT_COLOR;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, W / 2, H / 2 + H * 0.04);

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 8;
        return { texture, widthIn };
    }
}
