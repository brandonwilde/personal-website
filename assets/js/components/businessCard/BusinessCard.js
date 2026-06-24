import * as THREE from 'three';
import { ANIM_PARAMS, BOOK_DEFAULTS, BUSINESS_CARD_DEFAULTS } from '../../config/constants.js';
import { InteractiveItem } from '../InteractiveItem.js';
import { buildGeometry } from './businessCardGeometry.js';
import { buildOpenTimeline, buildCloseTimeline } from './businessCardAnimation.js';

// A business card holder that sits on the shelf.
// Cards lean back in a dark metal tray. On click, the top card detaches
// and flies forward to present itself; the tray stays on the shelf.
// Geometry, face textures, and the open/close timelines live in the sibling
// businessCard/ modules.
export class BusinessCard extends InteractiveItem {
    constructor(id, { modalInfo, color }) {
        super();
        this.bookId    = id;
        this.modalInfo = modalInfo;
        this.color     = color || [147, 147, 147];

        this.cardW     = BUSINESS_CARD_DEFAULTS.WIDTH;
        this.cardH     = BUSINESS_CARD_DEFAULTS.HEIGHT;
        this.cardT     = BUSINESS_CARD_DEFAULTS.THICKNESS;
        this.leanAngle = BUSINESS_CARD_DEFAULTS.LEAN_ANGLE;

        // Whether flyingCard has been reparented to the scene
        this._cardInScene = false;

        this._allMats = [];
        buildGeometry(this);

        this.userData.isBook = true;
        this.userData.bookId = id;
    }

    // ─── HTML link overlay ──────────────────────────────────────────────────

    // Convert a (cx, cy) point in contact-canvas pixel coords to screen pixels.
    // The contact texture lives on the -Z back face, whose UV.x is inverted relative
    // to local X. After the Y-flip (rotation.y = π) the two inversions cancel, so
    // text is not mirrored on screen.
    _projectHotspot(cx, cy, camera, viewport) {
        this.flyingCard.updateWorldMatrix(true, false);
        const u = cx / this._contactCanvasW;
        const v = 1 - cy / this._contactCanvasH;
        const local = new THREE.Vector3(
            (0.5 - u) * this.cardW,   // inverted X: back face UV convention
            (v - 0.5) * this.cardH,
            -this.cardT / 2,           // back face
        );
        const world = local.applyMatrix4(this.flyingCard.matrixWorld);
        return this._worldToScreen(world, camera, viewport);
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

        this._activeTl = buildOpenTimeline(this);
        return this._activeTl;
    }

    close() {
        if (this._activeTl) this._activeTl.kill();
        this.isOpen = false;
        this._activeTl = buildCloseTimeline(this);
        return this._activeTl;
    }

    _p() { return window.animParams || ANIM_PARAMS; }
}
