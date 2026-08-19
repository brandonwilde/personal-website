import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CAMERA_SETTINGS, BOOKSHELF_DIMENSIONS, CONTROLS_SETTINGS, ROOM } from '../config/constants.js';

// Owns the camera and OrbitControls, and choreographs them: auto-framing the bookcase,
// clamping to the room bounds, touch-gesture arbitration, and the lock / snap / focus /
// fly camera moves that play as items open and close. Stage adds the camera to the
// scene and drives update()/onResize() from its render loop; BookshelfScene calls the
// choreography methods from its interaction callbacks.
export class CameraController {
    constructor(domElement) {
        this._domElement = domElement;
        this.setupCamera();
        this.setupControls();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_SETTINGS.FOV,
            window.innerWidth / window.innerHeight,
            CAMERA_SETTINGS.NEAR,
            CAMERA_SETTINGS.FAR
        );

        const centerY = BOOKSHELF_DIMENSIONS.HEIGHT / 2;
        this.camera.position.set(0, centerY, this._fitDistance());
        // Stage adds the camera to the scene (so camera-parented objects render).
    }

    // Camera distance that "contains" the whole bookcase (plus FRAME_MARGIN
    // headroom) for the current aspect ratio — fits by whichever of width or
    // height is more constraining, so labels never clip at any window size.
    _fitDistance() {
        const vFov   = this.camera.fov * Math.PI / 180;
        const margin = CAMERA_SETTINGS.FRAME_MARGIN;
        const halfH  = (BOOKSHELF_DIMENSIONS.HEIGHT / 2) * margin;
        const halfW  = (BOOKSHELF_DIMENSIONS.WIDTH  / 2) * margin;
        const distForHeight = halfH / Math.tan(vFov / 2);
        const distForWidth  = halfW / (Math.tan(vFov / 2) * this.camera.aspect);
        return Math.max(distForHeight, distForWidth);
    }

    setupControls() {
        const C = CONTROLS_SETTINGS;
        this.controls = new OrbitControls(this.camera, this._domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = C.DAMPING_FACTOR;
        this.controls.maxPolarAngle = Math.PI / C.MAX_POLAR_ANGLE_DENOM;
        this.controls.minDistance   = C.MIN_DISTANCE;
        // At least the auto-fit distance, so portrait can pull back to frame the shelf.
        this.controls.maxDistance   = Math.max(C.MAX_DISTANCE, this._fitDistance() * C.MAX_DISTANCE_FIT_MARGIN);
        this.controls.zoomSpeed     = C.ZOOM_SPEED;
        this.controls.rotateSpeed   = C.ROTATE_SPEED;
        this.controls.enablePan     = true;
        this.controls.panSpeed      = C.PAN_SPEED;
        this.controls.screenSpacePanning = true;

        if (this._isTouchDevice()) this._setupTouchControls();

        // Lowest/closest the camera and target may sit, keeping them clear of the
        // floor and back-wall planes (see Stage.setupBackdrop for their positions).
        const clr = C.BOUNDS_CLEARANCE;
        this._minY = -(BOOKSHELF_DIMENSIONS.HEIGHT / 2 + BOOKSHELF_DIMENSIONS.SHELF_THICKNESS / 2) + clr;
        this._minZ = -BOOKSHELF_DIMENSIONS.DEPTH / 2 - ROOM.WALL_GAP + clr;

        // target stays at (0,0,0) — the bookshelf center — which is the OrbitControls default.
        // saveState() records this as the "home" position for reset().
        this.controls.update();
        this.controls.saveState();
    }

    // Hard barrier so neither orbiting nor panning can take the camera below the
    // floor or behind the back wall. Clamps both the camera and its look-at target
    // to the half-spaces y >= _minY and z >= _minZ (in front of the wall).
    _clampToBounds() {
        for (const v of [this.camera.position, this.controls.target]) {
            if (v.y < this._minY) v.y = this._minY;
            if (v.z < this._minZ) v.z = this._minZ;
        }
    }

    _isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Touch: one finger pans, two fingers do EITHER pinch-zoom OR orbit per
    // gesture (never both). DOLLY_ROTATE checks enableZoom/enableRotate each
    // move, so the arbiter below picks the mode by toggling them.
    _setupTouchControls() {
        const C = CONTROLS_SETTINGS;
        this.controls.touches.ONE = THREE.TOUCH.PAN;
        this.controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
        this.controls.zoomSpeed   = C.TOUCH_ZOOM_SPEED;

        const el = this._domElement;
        let startDist = 0, startMidX = 0, startMidY = 0, classified = false;

        const reset = () => {
            classified = false;
            this.controls.enableZoom   = true;
            this.controls.enableRotate = true;
        };

        el.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 2) { reset(); return; }
            const [a, b] = e.touches;
            startDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            startMidX = (a.clientX + b.clientX) / 2;
            startMidY = (a.clientY + b.clientY) / 2;
            classified = false;
            // Hold both off until the gesture's intent is clear.
            this.controls.enableZoom   = false;
            this.controls.enableRotate = false;
        }, { passive: true });

        el.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 2 || classified) return;
            const [a, b] = e.touches;
            const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            const midX = (a.clientX + b.clientX) / 2;
            const midY = (a.clientY + b.clientY) / 2;
            const dDist = Math.abs(dist - startDist);
            const dMid  = Math.hypot(midX - startMidX, midY - startMidY);
            if (Math.max(dDist, dMid) < C.TOUCH_GESTURE_THRESHOLD_PX) return;
            classified = true;
            if (dDist >= dMid) this.controls.enableZoom = true;     // pinch -> zoom only
            else               this.controls.enableRotate = true;   // drag  -> orbit only
        }, { passive: true });

        el.addEventListener('touchend',    reset);
        el.addEventListener('touchcancel', reset);
    }

    // Per-frame: advance the controls and re-clamp when the user has control. Returns
    // whether controls are active, so the caller knows to keep open-item overlays synced.
    // When locked, the camera is driven directly (GSAP tweens or snapToDefault), and
    // controls.update() would fight those by reapplying its stored spherical.
    update() {
        if (!this.controls.enabled) return false;
        this.controls.update();
        this._clampToBounds();
        return true;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        // Re-fit the bookcase to the new viewport and update the saved "home"
        // distance so reset() stays correct.
        const distance = this._fitDistance();
        this.controls.position0.setZ(distance);
        const fitMax = Math.max(CONTROLS_SETTINGS.MAX_DISTANCE, distance * CONTROLS_SETTINGS.MAX_DISTANCE_FIT_MARGIN);

        // While focused on an open item, keep its framing (don't reframe to the
        // shelf or touch the focus zoom cap) — just remember the default max for
        // when focus is released.
        if (this._focused) {
            this._prevMaxDistance = fitMax;
            return;
        }

        this.controls.maxDistance = fitMax;
        // Reframe live only when the user is freely browsing (controls enabled).
        if (this.controls.enabled) {
            this.camera.position.set(0, BOOKSHELF_DIMENSIONS.HEIGHT / 2, distance);
            this.controls.target.copy(this.controls.target0);
            this.controls.update();
        }
    }

    lockCamera() {
        this._killFlyTweens();
        this.controls.enabled = false;
    }

    // Re-enable controls and sync OrbitControls' internal spherical from the
    // current camera position so there is no snap on the first user interaction.
    unlockCamera() {
        this.controls.enabled = true;
        this.controls.update();
    }

    // Instantly resets camera to the default shelf-facing position.
    snapToDefault() {
        this._killFlyTweens();
        this.controls.reset(); // restores position0/target0 saved in setupControls
    }

    // Retarget the controls onto an open item and re-enable them, so the user
    // keeps some mobility (notably zoom-to-read) while it's displayed. With the
    // target on the item, zoom dollies toward it and stops at FOCUS_MIN_DISTANCE
    // instead of rushing past; maxDistance is capped at the current framing so
    // the item stays in view.
    focusOpenItem(center) {
        this._killFlyTweens();
        this.controls.target.copy(center);
        this._prevMinDistance = this.controls.minDistance;
        this._prevMaxDistance = this.controls.maxDistance;
        this.controls.minDistance = CONTROLS_SETTINGS.FOCUS_MIN_DISTANCE;
        this.controls.maxDistance = this.camera.position.distanceTo(center);
        this.controls.enabled = true;
        this._focused = true;
        this.controls.update();
    }

    // Undo focusOpenItem's zoom limits, then fly back to the default shelf view.
    // Controls are disabled for the flight so the tween isn't fought, and
    // re-enabled (synced) on arrival.
    unfocusAndFlyToDefault() {
        this._focused = false;
        if (this._prevMinDistance != null) this.controls.minDistance = this._prevMinDistance;
        if (this._prevMaxDistance != null) this.controls.maxDistance = this._prevMaxDistance;
        this._prevMinDistance = this._prevMaxDistance = null;
        this.lockCamera();
        this.flyToDefault(() => this.unlockCamera());
    }

    // Smoothly flies camera back to the default position, then fires onComplete.
    // Cancels any in-flight fly tweens so a rapid open/close/open sequence can't
    // leave a stale onComplete that would re-enable controls at the wrong time.
    flyToDefault(onComplete) {
        this._killFlyTweens();
        const { position0, target0 } = this.controls; // saved by saveState()
        this._flyTweens = [
            window.gsap.to(this.camera.position, {
                x: position0.x, y: position0.y, z: position0.z,
                duration: 0.6,
                ease: 'power2.inOut',
            }),
            window.gsap.to(this.controls.target, {
                x: target0.x, y: target0.y, z: target0.z,
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: () => {
                    this._flyTweens = null;
                    if (onComplete) onComplete();
                },
            }),
        ];
    }

    _killFlyTweens() {
        if (!this._flyTweens) return;
        this._flyTweens.forEach(t => t.kill());
        this._flyTweens = null;
    }
}
