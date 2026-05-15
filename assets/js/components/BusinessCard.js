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
        ctx.lineWidth = 1;
        ctx.strokeRect(12, 12, W - 24, H - 24);

        if (!this.modalInfo) return new THREE.CanvasTexture(canvas);
        const { name, jobTitle1, jobTitle2, linkedinText, githubText } = this.modalInfo;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        ctx.font = 'bold 28px Georgia, serif';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(name ?? '', W / 2, 26);

        ctx.font = 'italic 15px Georgia, serif';
        ctx.fillStyle = '#555';
        ctx.fillText([jobTitle1, jobTitle2].filter(Boolean).join(' · '), W / 2, 62);

        ctx.strokeStyle = accent;
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(W * 0.1, 86); ctx.lineTo(W * 0.9, 86);
        ctx.stroke();

        ctx.textAlign = 'left';
        [
            linkedinText ? ['LinkedIn:', linkedinText] : null,
            githubText   ? ['GitHub:',   githubText]   : null,
        ].filter(Boolean).forEach(([label, val], i) => {
            const y = 98 + i * 26;
            ctx.font = 'bold 14px Georgia, serif';
            ctx.fillStyle = accent;
            ctx.fillText(label, 26, y);
            ctx.font = '14px Georgia, serif';
            ctx.fillStyle = '#2a2a2a';
            ctx.fillText(val, 110, y);
        });

        return new THREE.CanvasTexture(canvas);
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

    open() {
        if (this._activeTl) this._activeTl.kill();
        this.isOpen = true;

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

        return tl;
    }

    _buildCloseTimeline() {
        const { duration } = this._p().close;
        const tl = window.gsap.timeline();

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
