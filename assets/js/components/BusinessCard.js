import * as THREE from 'three';
import { ANIM_PARAMS, BOOK_DEFAULTS, BUSINESS_CARD_DEFAULTS } from '../config/constants.js';
import { LinkOverlay } from '../utils/LinkOverlay.js';
import { showcasePosition } from '../utils/showcase.js';

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

        this.cardW     = BUSINESS_CARD_DEFAULTS.WIDTH;
        this.cardH     = BUSINESS_CARD_DEFAULTS.HEIGHT;
        this.cardT     = BUSINESS_CARD_DEFAULTS.THICKNESS;
        this.leanAngle = BUSINESS_CARD_DEFAULTS.LEAN_ANGLE;

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
        this._backMat = new THREE.MeshStandardMaterial({
            map: this._contactTex, roughness: 0.85, metalness: 0.0,
        });
        const edgeMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.89, 0.85, 0.79), roughness: 0.95,
        });
        this._allMats.push(this._faceMat, this._backMat, edgeMat);

        this.flyingCard = new THREE.Mesh(
            new THREE.BoxGeometry(this.cardW, this.cardH, this.cardT),
            [edgeMat, edgeMat, edgeMat, edgeMat, this._faceMat, this._backMat]
            //  +X edge  -X edge  +Y edge  -Y edge  +Z front      -Z back (contact)
        );
        // Sit on top of the stack, slightly in front
        const localCenter = this._localCardCenter();
        localCenter.z += BUSINESS_CARD_DEFAULTS.STACK_Z_OFFSET;
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

            // Record link hotspots in canvas coords. Whole row is clickable
            // (label + value) — this is just the invisible link rectangle the
            // browser uses to show URL previews on hover.
            this._linkHotspots = [];
            const addHotspot = (url, y) => {
                if (!url) return;
                this._linkHotspots.push({
                    url,
                    x0: labelX,
                    x1: W - padX,
                    y0: y - 4,
                    y1: y - 4 + rowH,
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

            addHotspot(this.modalInfo.linkedinUrl, rowY[1]);
            addHotspot(this.modalInfo.githubUrl,   rowY[2]);

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

    _showLinkOverlay(ctx) {
        if (!this._linkHotspots?.length) return;
        if (!this._linkOverlay) {
            this._linkOverlay = new LinkOverlay((cx, cy, camera, viewport) => {
                this.flyingCard.updateWorldMatrix(true, false);
                return this._canvasPxToScreen(cx, cy, camera, viewport);
            });
        }
        this._linkOverlay.show(this._linkHotspots, ctx);
    }

    // Re-project the link hotspots each frame so they track the card as the camera moves.
    syncOverlay() {
        this._linkOverlay?.update();
    }

    // Convert a (cx, cy) point in contact-canvas pixel coords to screen pixels.
    // The contact texture lives on the -Z back face, whose UV.x is inverted relative
    // to local X. After the Y-flip (rotation.y = π) the two inversions cancel, so
    // text is not mirrored on screen.
    _canvasPxToScreen(cx, cy, camera, viewport) {
        const u = cx / this._contactCanvasW;
        const v = 1 - cy / this._contactCanvasH;
        const local = new THREE.Vector3(
            (0.5 - u) * this.cardW,   // inverted X: back face UV convention
            (v - 0.5) * this.cardH,
            -this.cardT / 2,           // back face
        );
        const world = local.applyMatrix4(this.flyingCard.matrixWorld);
        const ndc = world.project(camera);
        return {
            x: viewport.left + (ndc.x + 1) * 0.5 * viewport.width,
            y: viewport.top  + (1 - ndc.y) * 0.5 * viewport.height,
        };
    }

    // Meshes that should count as "the open object" for click/raycast purposes.
    // The flying card is reparented out of this group during open(), so the
    // InteractionManager needs an explicit handle on it.
    getOpenInteractables() {
        return this.flyingCard ? [this.flyingCard] : [];
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
        // Fly the card to a fixed distance in front of the camera, centered in
        // view, so its on-screen size stays constant however far the camera has
        // zoomed from the shelf.
        const cam = this._openCtx?.camera;
        const target = cam
            ? showcasePosition(cam, BUSINESS_CARD_DEFAULTS.SHOWCASE_DISTANCE)
            : new THREE.Vector3(0, 16, 185);
        // Orbit/zoom locus while the card is on display.
        this._showcaseCenter = target.clone();
        const tl = window.gsap.timeline();

        // 1. Card pops up slightly from the stack
        tl.to(this.flyingCard.position, {
            y:        this._flyWorldRestPos.y + 0.6,
            duration: duration * 0.25,
            ease:     'power2.out',
        });

        // 2. Card flies forward to center screen
        tl.to(this.flyingCard.position, {
            x: target.x, y: target.y, z: target.z,
            duration: duration * 0.85,
            ease:     'power2.inOut',
        }, '>-0.05');

        // 3. Card rotates flat to face camera
        tl.to(this.flyingCard.rotation, {
            x: 0, y: 0, z: 0,
            duration: duration * 0.7,
            ease,
        }, '<0.1');

        // 4. Card flips 180° to reveal contact details on the back face
        tl.to(this.flyingCard.rotation, {
            y: Math.PI,
            duration: duration * 0.7,
            ease: 'power2.inOut',
        });

        // 5. Once at rest, drop the invisible HTML link overlay on top and hand
        // the card's center to the camera as its orbit/zoom locus.
        tl.call(() => {
            this._showLinkOverlay(this._openCtx);
            this._openCtx.onShowcased?.(this._showcaseCenter);
        });

        return tl;
    }

    _buildCloseTimeline() {
        const { duration } = this._p().close;
        const tl = window.gsap.timeline();

        // Remove HTML overlay immediately so links don't intercept clicks
        // during the close animation.
        this._linkOverlay?.hide();

        // 1. Card flips back to front face
        tl.to(this.flyingCard.rotation, {
            y: 0,
            duration: duration * 0.5,
            ease: 'power2.inOut',
        });

        // 2. Card flies back to just above the holder, tilting to lean angle en route
        tl.to(this.flyingCard.position, {
            x: this._flyWorldRestPos.x,
            y: this._flyWorldRestPos.y + 0.6,
            z: this._flyWorldRestPos.z,
            duration: duration * 0.85,
            ease: 'power2.inOut',
        });

        tl.to(this.flyingCard.rotation, {
            x: this._flyWorldRestRot.x,
            y: this._flyWorldRestRot.y,
            z: this._flyWorldRestRot.z,
            duration: duration * 0.7,
            ease: 'power2.inOut',
        }, '<');

        // 3. Card slides down into the holder
        tl.to(this.flyingCard.position, {
            y: this._flyWorldRestPos.y,
            duration: duration * 0.25,
            ease: 'power2.in',
        });

        // Reparent card back into the group
        tl.call(() => {
            if (this._cardInScene) {
                this.add(this.flyingCard);
                const localCenter = this._localCardCenter();
                localCenter.z += BUSINESS_CARD_DEFAULTS.STACK_Z_OFFSET;
                this.flyingCard.position.copy(localCenter);
                this.flyingCard.rotation.set(this.leanAngle, 0, 0);
                this._cardInScene = false;
            }
        });

        return tl;
    }
}
