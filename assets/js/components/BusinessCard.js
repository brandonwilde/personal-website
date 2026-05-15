import * as THREE from 'three';
import { ANIM_PARAMS, BOOK_DEFAULTS } from '../config/constants.js';

// A business card holder that sits on the shelf.
// Cards lean back in a dark metal tray. On click, the top card detaches
// and flies forward to present itself; the tray stays on the shelf.
export class BusinessCard extends THREE.Group {
    constructor(id, { modalInfo, color }) {
        super();
        this.bookId    = id;
        this.modalInfo = modalInfo;
        this.color     = color || [147, 147, 147];
        this.isOpen    = false;
        this.isHovered = false;
        this.initialX  = 0;
        this.initialY  = 0;
        this.initialZ  = 0;
        this.initialRotationY = 0;

        // Real business card: 3.5" × 2" × 0.02" (scene units = inches)
        this.cardW = 3.5;
        this.cardH = 2.0;
        this.cardT = 0.02;

        // Cards lean back ~22° from vertical (face tilts upward toward viewer)
        this.leanAngle = -0.38;

        // Whether flyingCard has been reparented to the scene
        this._cardInScene = false;

        this._allMats = [];
        this._buildGeometry();

        this.userData.isBook = true;
        this.userData.bookId = id;
    }

    _buildGeometry() {
        // ── Dark metal holder ────────────────────────────────────────────────────
        const holderMat = new THREE.MeshStandardMaterial({
            color:     new THREE.Color(0.12, 0.12, 0.12),
            roughness: 0.35,
            metalness: 0.75,
        });
        this._allMats.push(holderMat);

        const base = new THREE.Mesh(
            new THREE.BoxGeometry(this.cardW + 0.5, 0.12, 2.1),
            holderMat
        );
        base.position.set(0, 0.06, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        this.add(base);

        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(this.cardW + 0.5, 1.4, 0.1),
            holderMat
        );
        backWall.position.set(0, 0.12 + 0.55, -0.95);
        backWall.rotation.x = this.leanAngle;
        backWall.castShadow = true;
        this.add(backWall);

        const frontLip = new THREE.Mesh(
            new THREE.BoxGeometry(this.cardW + 0.5, 0.28, 0.1),
            holderMat
        );
        frontLip.position.set(0, 0.12 + 0.14, 0.95);
        frontLip.castShadow = true;
        this.add(frontLip);

        for (const side of [-1, 1]) {
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.9, 2.1),
                holderMat
            );
            wall.position.set(side * (this.cardW / 2 + 0.3), 0.12 + 0.45, 0);
            wall.castShadow = true;
            this.add(wall);
        }

        // ── Card stack (stays in tray, never moves) ──────────────────────────────
        const stackMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.92, 0.88, 0.82), roughness: 0.9,
        });
        this._allMats.push(stackMat);

        const stack = new THREE.Mesh(
            new THREE.BoxGeometry(this.cardW, this.cardH, 0.3),
            stackMat
        );
        stack.position.copy(this._localCardCenter());
        stack.rotation.x = this.leanAngle;
        stack.castShadow = true;
        this.add(stack);

        // ── Flying card (top card — leaves the tray on click) ────────────────────
        this._restingTex = this._buildRestingTexture();
        this._contactTex = this._buildContactTexture();

        this._faceMat = new THREE.MeshStandardMaterial({
            map: this._restingTex, roughness: 0.85, metalness: 0.0,
        });
        const backMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.91, 0.87, 0.81), roughness: 0.9,
        });
        const edgeMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.89, 0.85, 0.79), roughness: 0.95,
        });
        this._allMats.push(this._faceMat, backMat, edgeMat);

        this.flyingCard = new THREE.Mesh(
            new THREE.BoxGeometry(this.cardW, this.cardH, this.cardT),
            [edgeMat, edgeMat, edgeMat, edgeMat, this._faceMat, backMat]
            //  +X edge  -X edge  +Y edge  -Y edge  +Z face       -Z back
        );
        // Sit on top of the stack, slightly in front
        const localCenter = this._localCardCenter();
        localCenter.z += 0.16;
        this.flyingCard.position.copy(localCenter);
        this.flyingCard.rotation.x = this.leanAngle;
        this.flyingCard.castShadow = true;
        this.add(this.flyingCard);
    }

    // Local-space center of a card resting in the tray
    _localCardCenter() {
        const baseTop = 0.12;
        return new THREE.Vector3(
            0,
            baseTop + (this.cardH / 2) * Math.cos(Math.abs(this.leanAngle)),
            -0.4
        );
    }

    _buildRestingTexture() {
        const W = 350, H = 200;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        const [r, g, b] = this.color;
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

    _buildContactTexture() {
        const W = 700, H = 400;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        const [r, g, b] = this.color;
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

            if (!this.modalInfo) { tex.needsUpdate = true; return; }
            const {
                name, jobTitle1, jobTitle2,
                linkedinText, githubText,
            } = this.modalInfo;

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

            if (this._logoImg && this._logoImg.complete && this._logoImg.naturalWidth) {
                const img = this._logoImg;
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

            // Record link hotspots in canvas coords. The hotspot covers only
            // the URL text area (not the label) so the invisible <a> overlay
            // and selection rectangle line up with what the user sees.
            this._linkHotspots = [];
            const addHotspot = (url, text, y) => {
                if (!url || !text) return;
                const textW = ctx.measureText(text).width;
                this._linkHotspots.push({
                    url, text,
                    x0: valueX,
                    x1: Math.min(valueX + textW, W - padX),
                    y0: y - 4,
                    y1: y - 4 + rowH,
                    fontPx: valueFontPx,
                });
            };

            if (this._emailImg && this._emailImg.complete && this._emailImg.naturalWidth) {
                const img = this._emailImg;
                const scale = emailH / img.naturalHeight;
                ctx.drawImage(img, valueX, rowY[0], img.naturalWidth * scale, emailH);
            }

            ctx.font = `${valueFontPx}px Georgia, serif`;
            ctx.fillStyle = '#2a2a2a';
            if (linkedinText) ctx.fillText(linkedinText, valueX, rowY[1]);
            if (githubText)   ctx.fillText(githubText,   valueX, rowY[2]);

            // measureText needs the value font to be active when called
            addHotspot(this.modalInfo.linkedinUrl, linkedinText, rowY[1]);
            addHotspot(this.modalInfo.githubUrl,   githubText,   rowY[2]);

            tex.needsUpdate = true;
        };

        // Stash canvas dims for UV → pixel conversion
        this._contactCanvasW = W;
        this._contactCanvasH = H;

        redraw();

        // Lazy-load images (logo + email) and redraw when ready
        const loadImg = (src) => {
            if (!src) return null;
            const img = new Image();
            img.onload = redraw;
            img.src = src;
            return img;
        };
        if (this.modalInfo) {
            this._logoImg  = loadImg(this.modalInfo.personalLogoSrc);
            this._emailImg = loadImg(this.modalInfo.emailSrc);
        }

        return tex;
    }

    // ─── HTML link overlay ──────────────────────────────────────────────────
    // While the card is open and at rest, we render invisible <a> tags on top
    // of the canvas-painted URLs. This gives real link UX (status-bar URL
    // preview on hover, right-click "copy link", keyboard focus, text
    // selection) without any visible DOM that could break the 3D illusion.

    _ensureOverlay() {
        if (this._overlayEl) return;
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;' +
            'pointer-events:none;z-index:10;display:none;';
        document.body.appendChild(el);
        this._overlayEl = el;
        this._overlayResize = () => this.updateLinkOverlay();
    }

    showLinkOverlay({ camera, renderer, onLinkClick } = {}) {
        if (!camera || !renderer || !this._linkHotspots?.length) return;
        this._ensureOverlay();
        this._overlayCamera   = camera;
        this._overlayRenderer = renderer;
        this._overlayEl.innerHTML = '';
        for (const h of this._linkHotspots) {
            const a = document.createElement('a');
            a.href = h.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = h.text;
            a.style.cssText =
                'position:absolute;display:block;' +
                'color:transparent;background:transparent;' +
                'text-decoration:none;white-space:nowrap;' +
                'font-family:Georgia,serif;font-weight:normal;' +
                'pointer-events:auto;user-select:text;-webkit-user-select:text;';
            a.dataset.fontPx = h.fontPx;
            if (onLinkClick) {
                a.addEventListener('click', () => onLinkClick());
            }
            this._overlayEl.appendChild(a);
        }
        this._overlayEl.style.display = 'block';
        window.addEventListener('resize', this._overlayResize);
        this.updateLinkOverlay();
    }

    updateLinkOverlay() {
        if (!this._overlayEl || this._overlayEl.style.display === 'none') return;
        const camera = this._overlayCamera;
        const renderer = this._overlayRenderer;
        if (!camera || !renderer) return;
        const viewport = renderer.domElement.getBoundingClientRect();
        const links = this._overlayEl.children;
        this._linkHotspots.forEach((h, i) => {
            const tl = this._canvasPxToScreen(h.x0, h.y0, camera, viewport);
            const br = this._canvasPxToScreen(h.x1, h.y1, camera, viewport);
            const a = links[i];
            if (!a) return;
            const w = br.x - tl.x;
            const ht = br.y - tl.y;
            // Canvas font is `fontPx` over a row of height `rowH` (=36) canvas px.
            // Scale that ratio into the row's screen height so DOM text matches.
            const fontPx = parseFloat(a.dataset.fontPx) || 20;
            const screenFontPx = ht * (fontPx / 36);
            a.style.left = `${tl.x}px`;
            a.style.top = `${tl.y}px`;
            a.style.width = `${w}px`;
            a.style.height = `${ht}px`;
            a.style.fontSize = `${screenFontPx}px`;
            a.style.lineHeight = `${ht}px`;
        });
    }

    hideLinkOverlay() {
        if (!this._overlayEl) return;
        this._overlayEl.style.display = 'none';
        this._overlayEl.innerHTML = '';
        window.removeEventListener('resize', this._overlayResize);
    }

    // Convert a (cx, cy) point in contact-canvas pixel coords to screen pixels
    // by mapping → UV → flyingCard local space → world → camera projection.
    _canvasPxToScreen(cx, cy, camera, viewport) {
        const u = cx / this._contactCanvasW;
        const v = 1 - cy / this._contactCanvasH;
        const local = new THREE.Vector3(
            (u - 0.5) * this.cardW,
            (v - 0.5) * this.cardH,
            this.cardT / 2,
        );
        this.flyingCard.updateWorldMatrix(true, false);
        const world = local.applyMatrix4(this.flyingCard.matrixWorld);
        const ndc = world.project(camera);
        return {
            x: viewport.left + (ndc.x + 1) * 0.5 * viewport.width,
            y: viewport.top  + (1 - ndc.y) * 0.5 * viewport.height,
        };
    }

    setHovered(isHovered) {
        if (this.isHovered === isHovered) return;
        this.isHovered = isHovered;
        if (!this.isOpen) {
            window.gsap.to(this.position, {
                z: isHovered ? this.initialZ + 0.4 : this.initialZ,
                duration: 0.3, ease: 'power2.out',
            });
        }
        const hex = isHovered
            ? BOOK_DEFAULTS.MATERIAL.HOVER_EMISSIVE
            : BOOK_DEFAULTS.MATERIAL.DEFAULT_EMISSIVE;
        this._allMats.forEach(m => m.emissive?.setHex(hex));
    }

    open(ctx = {}) {
        if (this._activeTl) this._activeTl.kill();
        this.isOpen = true;
        this._openCtx = ctx;

        if (!this._cardInScene) {
            // Capture world transform, then detach card from group → scene
            this._flyWorldRestPos = new THREE.Vector3();
            this._flyWorldRestRot = new THREE.Euler();
            const q = new THREE.Quaternion();
            this.flyingCard.getWorldPosition(this._flyWorldRestPos);
            this.flyingCard.getWorldQuaternion(q);
            this._flyWorldRestRot.setFromQuaternion(q);

            const scene = this.parent;
            scene.add(this.flyingCard);                      // reparents; local → world
            this.flyingCard.position.copy(this._flyWorldRestPos);
            this.flyingCard.rotation.copy(this._flyWorldRestRot);
            this._cardInScene = true;
        }

        this._activeTl = this._buildOpenTimeline();
        return this._activeTl;
    }

    close() {
        if (this._activeTl) this._activeTl.kill();
        this.isOpen = false;
        this._activeTl = this._buildCloseTimeline();
        return this._activeTl;
    }

    _p() { return window.animParams || ANIM_PARAMS; }

    _buildOpenTimeline() {
        const { duration, ease } = this._p().open;
        // Camera sits at z≈206 (HEIGHT / 2·tan5°). Place card 21 units in front.
        // Screen-center Y at z=185: 18 * 185 / 206 ≈ 16.
        const targetZ = 185;
        const targetY = 16;
        const tl = window.gsap.timeline();

        // 1. Card pops up slightly from the stack
        tl.to(this.flyingCard.position, {
            y:        this._flyWorldRestPos.y + 0.6,
            duration: duration * 0.25,
            ease:     'power2.out',
        });

        // 2. Card flies forward to center screen
        tl.to(this.flyingCard.position, {
            x: 0, y: targetY, z: targetZ,
            duration: duration * 0.85,
            ease:     'power2.inOut',
        }, '>-0.05');

        // 3. Card rotates flat to face camera
        tl.to(this.flyingCard.rotation, {
            x: 0, y: 0, z: 0,
            duration: duration * 0.7,
            ease,
        }, '<0.1');

        // 4. Texture morphs to full contact info
        tl.call(() => {
            this._faceMat.map = this._contactTex;
            this._faceMat.needsUpdate = true;
        });

        // 5. Once at rest, drop the invisible HTML link overlay on top.
        tl.call(() => this.showLinkOverlay(this._openCtx));

        return tl;
    }

    _buildCloseTimeline() {
        const { duration } = this._p().close;
        const tl = window.gsap.timeline();

        // Remove HTML overlay immediately so links don't intercept clicks
        // during the close animation.
        this.hideLinkOverlay();

        // Revert texture as card begins returning
        tl.call(() => {
            this._faceMat.map = this._restingTex;
            this._faceMat.needsUpdate = true;
        });

        // Card tilts back to lean angle
        tl.to(this.flyingCard.rotation, {
            x: this._flyWorldRestRot.x,
            y: this._flyWorldRestRot.y,
            z: this._flyWorldRestRot.z,
            duration: duration * 0.5,
            ease:     'power2.in',
        });

        // Card flies back to its resting world position
        tl.to(this.flyingCard.position, {
            x: this._flyWorldRestPos.x,
            y: this._flyWorldRestPos.y,
            z: this._flyWorldRestPos.z,
            duration: duration * 0.85,
            ease:     'power2.inOut',
        }, '<0.1');

        // Reparent card back into the group
        tl.call(() => {
            if (this._cardInScene) {
                this.add(this.flyingCard);
                const localCenter = this._localCardCenter();
                localCenter.z += 0.16;
                this.flyingCard.position.copy(localCenter);
                this.flyingCard.rotation.set(this.leanAngle, 0, 0);
                this._cardInScene = false;
            }
        });

        return tl;
    }
}
