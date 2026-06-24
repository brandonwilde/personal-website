import * as THREE from 'three';

// Canvas-painted textures for the flying card's two faces: the "Contact Info" front
// shown at rest, and the full contact details revealed on the back when it flips open.

// Front face shown while the card rests in the tray.
export function buildRestingTexture(card) {
    const W = 350, H = 200;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const [r, g, b] = card.color;
    const accent = `rgb(${Math.round(r*0.4)},${Math.round(g*0.4)},${Math.round(b*0.4)})`;

    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(7, 7, W - 14, H - 14);

    ctx.fillStyle = '#2a2a2a';
    ctx.font = 'bold 50px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Contact Info', W / 2, H / 2);

    return new THREE.CanvasTexture(canvas);
}

// Back face: name, job titles, logo, and the email/LinkedIn/GitHub rows. Records the
// row link hotspots on the card and lazy-loads the logo/email images, redrawing when
// they arrive.
export function buildContactTexture(card) {
    const W = 700, H = 400;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const [r, g, b] = card.color;
    const accent = `rgb(${Math.round(r*0.4)},${Math.round(g*0.4)},${Math.round(b*0.4)})`;

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;

    const redraw = () => {
        ctx.fillStyle = '#f8f4ec';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 6;
        ctx.strokeRect(14, 14, W - 28, H - 28);
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 24, W - 48, H - 48);

        if (!card.modalInfo) { tex.needsUpdate = true; return; }
        const {
            name, jobTitle1, jobTitle2,
            linkedinText, githubText,
        } = card.modalInfo;

        // ── Header: name + job titles on left, logo on right ─────────────
        const padX = 56;
        const headerTop = 56;
        const logoSize = 160;
        const logoX = W - padX - logoSize + 30; // shift slightly toward center
        const logoY = headerTop - 10;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        ctx.font = 'bold 44px Georgia, serif';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(name ?? '', padX, headerTop);

        ctx.font = 'italic 22px Georgia, serif';
        ctx.fillStyle = '#555';
        if (jobTitle1) ctx.fillText(jobTitle1, padX, headerTop + 56);
        if (jobTitle2) ctx.fillText(jobTitle2, padX, headerTop + 86);

        if (card._logoImg && card._logoImg.complete && card._logoImg.naturalWidth) {
            const img = card._logoImg;
            const scale = Math.min(logoSize / img.naturalWidth, logoSize / img.naturalHeight);
            const w = img.naturalWidth * scale;
            const h = img.naturalHeight * scale;
            ctx.drawImage(img, logoX + (logoSize - w) / 2, logoY + (logoSize - h) / 2, w, h);
        }

        // ── Divider ─────────────────────────────────────────────────────
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padX, 210);
        ctx.lineTo(W - padX, 210);
        ctx.stroke();

        // ── Footer rows: Email (image), LinkedIn, GitHub ────────────────
        const labelX = padX;
        const valueX = padX + 140;
        const rowY = [238, 286, 334];
        const valueFontPx = 20;
        const emailH = 24;
        const rowH = 36;

        ctx.font = `bold ${valueFontPx}px Georgia, serif`;
        ctx.fillStyle = accent;
        ctx.fillText('Email:',    labelX, rowY[0]);
        ctx.fillText('LinkedIn:', labelX, rowY[1]);
        ctx.fillText('GitHub:',   labelX, rowY[2]);

        // Record link hotspots in canvas coords. Whole row is clickable
        // (label + value) — this is just the invisible link rectangle the
        // browser uses to show URL previews on hover.
        card._linkHotspots = [];
        const addHotspot = (url, y) => {
            if (!url) return;
            card._linkHotspots.push({
                url,
                x0: labelX,
                x1: W - padX,
                y0: y - 4,
                y1: y - 4 + rowH,
            });
        };

        if (card._emailImg && card._emailImg.complete && card._emailImg.naturalWidth) {
            const img = card._emailImg;
            const scale = emailH / img.naturalHeight;
            ctx.drawImage(img, valueX, rowY[0], img.naturalWidth * scale, emailH);
        }

        ctx.font = `${valueFontPx}px Georgia, serif`;
        ctx.fillStyle = '#2a2a2a';
        if (linkedinText) ctx.fillText(linkedinText, valueX, rowY[1]);
        if (githubText)   ctx.fillText(githubText,   valueX, rowY[2]);

        addHotspot(card.modalInfo.linkedinUrl, rowY[1]);
        addHotspot(card.modalInfo.githubUrl,   rowY[2]);

        tex.needsUpdate = true;
    };

    // Stash canvas dims for UV → pixel conversion
    card._contactCanvasW = W;
    card._contactCanvasH = H;

    redraw();

    // Lazy-load images (logo + email) and redraw when ready
    const loadImg = (src) => {
        if (!src) return null;
        const img = new Image();
        img.onload = redraw;
        img.src = src;
        return img;
    };
    if (card.modalInfo) {
        card._logoImg  = loadImg(card.modalInfo.personalLogoSrc);
        card._emailImg = loadImg(card.modalInfo.emailSrc);
    }

    return tex;
}
