import * as THREE from 'three';
import { FLOOR_HATCH } from '../../config/constants.js';

// Chalk-on-slate panel for the hatch: a caped stick figure over a scrawled
// message. Kept deliberately coarse — crisp type reads as printed, and chalk is
// anything but. Coordinates are authored against 1024px and multiplied by `k`.

const T = FLOOR_HATCH.TEXTURE;

let _tex = null;

export function chalkboardTexture() {
    if (_tex) return _tex;

    const size = T.SIZE;
    const k = size / 1024;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    paintSlate(ctx, size);

    const chalk = `rgb(${T.CHALK.join(',')})`;
    drawCape(ctx, chalk, k);
    drawFigure(ctx, chalk, k);
    drawMessage(ctx, chalk, size, k, FLOOR_HATCH.MESSAGE);
    dustFleck(ctx, size, k);
    soften(canvas, ctx, size);

    _tex = new THREE.CanvasTexture(canvas);
    _tex.colorSpace = THREE.SRGBColorSpace;
    _tex.anisotropy = 8;
    return _tex;
}

function paintSlate(ctx, size) {
    ctx.fillStyle = `rgb(${T.SLATE.join(',')})`;
    ctx.fillRect(0, 0, size, size);

    // Wiped-chalk blooms first, then per-pixel grain over the top of them.
    for (let i = 0; i < T.SMUDGES; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = size * (0.05 + Math.random() * 0.14);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.045)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    const img = ctx.getImageData(0, 0, size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 2 * T.SLATE_GRAIN;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
}

// A chalk stroke is two passes of the same jittered path: a solid core and a
// wider, fainter halo, which is what reads as dusty rather than inked.
function chalkStroke(ctx, color, pts, k, { close = false, width = T.STROKE } = {}) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const jitter = T.JITTER * k;

    for (const [w, alpha] of [[width * k * 1.9, 0.16], [width * k, 0.92]]) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = w;
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
            const jx = x * k + (Math.random() - 0.5) * jitter;
            const jy = y * k + (Math.random() - 0.5) * jitter;
            if (i === 0) ctx.moveTo(jx, jy); else ctx.lineTo(jx, jy);
        });
        if (close) ctx.closePath();
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function chalkCircle(ctx, color, cx, cy, r, k) {
    const pts = [];
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 24) {
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    chalkStroke(ctx, color, pts, k);
}

function drawCape(ctx, chalk, k) {
    chalkStroke(ctx, chalk, [
        [452, 318], [372, 432], [400, 560], [335, 694],
        [424, 662], [470, 722], [560, 664], [642, 700],
        [600, 560], [632, 432], [572, 318],
    ], k, { close: true, width: T.STROKE * 0.85 });
}

function drawFigure(ctx, chalk, k) {
    chalkCircle(ctx, chalk, 512, 232, 70, k);
    chalkStroke(ctx, chalk, [[512, 302], [512, 522]], k);                    // torso
    chalkStroke(ctx, chalk, [[390, 296], [512, 362], [634, 296]], k);        // arms, thrown wide
    chalkStroke(ctx, chalk, [[430, 694], [512, 522], [594, 694]], k);        // legs
    chalkStroke(ctx, chalk, [[458, 320], [566, 320]], k, { width: T.STROKE * 0.7 });  // cape collar
}

// Letters are placed one at a time, each knocked off square and off the baseline:
// no font can be relied on to exist on the viewer's device, so the handwriting has
// to come from the placement rather than the typeface.
function drawMessage(ctx, chalk, size, k, message) {
    const chars = [...message];
    let fontSize = T.FONT_SIZE * k;
    const gap = T.LETTER_GAP * fontSize;

    const widthAt = (px) => {
        ctx.font = `${px}px ${T.FONT}`;
        return chars.reduce((w, c) => w + ctx.measureText(c).width + gap, -gap);
    };

    const maxWidth = size * 0.88;
    const measured = widthAt(fontSize);
    if (measured > maxWidth) fontSize *= maxWidth / measured;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = chalk;

    ctx.save();
    ctx.translate(size / 2, 858 * k);
    ctx.rotate(-0.02);
    let x = -widthAt(fontSize) / 2;

    for (const ch of chars) {
        const px = fontSize * (1 + (Math.random() - 0.5) * 2 * T.LETTER_SIZE);
        ctx.font = `${px}px ${T.FONT}`;
        const w = ctx.measureText(ch).width;

        ctx.save();
        ctx.translate(x + w / 2, (Math.random() - 0.5) * 2 * T.LETTER_SHIFT * fontSize);
        ctx.rotate((Math.random() - 0.5) * 2 * T.LETTER_ROT);
        // Offset repeats give the doubled, dragged edge of a chalk stick.
        for (const [dx, dy, alpha] of [[0, 0, 0.88], [2.5 * k, 1.5 * k, 0.24], [-2 * k, -1.5 * k, 0.2]]) {
            ctx.globalAlpha = alpha;
            ctx.fillText(ch, dx, dy);
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        x += w + gap;
    }
    ctx.restore();
}

// Loose chalk dust so the panel doesn't read as vector art.
function dustFleck(ctx, size, k) {
    ctx.fillStyle = `rgb(${T.CHALK.join(',')})`;
    for (let i = 0; i < size * 1.5; i++) {
        ctx.globalAlpha = Math.random() * 0.18;
        const r = Math.random() * 1.8 * k;
        ctx.fillRect(Math.random() * size, Math.random() * size, r, r);
    }
    ctx.globalAlpha = 1;
}

// Chalk has no hard edges. Blurring here beats leaning on the texture's own
// minification, which varies with how close the camera happens to be.
function soften(canvas, ctx, size) {
    if (!T.BLUR) return;
    const copy = document.createElement('canvas');
    copy.width = copy.height = size;
    copy.getContext('2d').drawImage(canvas, 0, 0);

    ctx.clearRect(0, 0, size, size);
    ctx.filter = `blur(${T.BLUR}px)`;
    ctx.drawImage(copy, 0, 0);
    ctx.filter = 'none';
}
