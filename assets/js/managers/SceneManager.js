import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CAMERA_SETTINGS, SCENE_BACKGROUND, ROOM, CARPET, LIGHTING_SETTINGS, BOOKSHELF_DIMENSIONS, RENDERER_SETTINGS, CONTROLS_SETTINGS } from '../config/constants.js';
import { roomEnvironment } from '../utils/roomEnvironment.js';
import { carpetTexture } from '../utils/carpetTexture.js';

export class SceneManager {
    constructor() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.setupBackdrop();
        this.setupControls();
        this.setupEventListeners();
        this.interactionManager = null; // Will be set by BookshelfScene
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(SCENE_BACKGROUND);

        // Scene-wide reflection source
        this.scene.environment = roomEnvironment();
    }

    // Wall behind the bookcase and a floor it stands on, framing it as a room.
    setupBackdrop() {
        const size = ROOM.PLANE_SIZE;

        const wall = new THREE.Mesh(
            new THREE.PlaneGeometry(size, size),
            new THREE.MeshStandardMaterial({
                color:     new THREE.Color(ROOM.WALL_COLOR),
                roughness: ROOM.WALL_ROUGHNESS,
                metalness: 0,
            })
        );
        // Just behind the bookcase's back face (faces +Z toward the camera).
        wall.position.set(0, 0, -BOOKSHELF_DIMENSIONS.DEPTH / 2 - ROOM.WALL_GAP);
        wall.receiveShadow = true;
        this.scene.add(wall);

        // Floor sits at the bookcase's base; the planks straddle ±HEIGHT/2, so the
        // outer bottom is half a shelf-thickness below -HEIGHT/2.
        const floorY = -(BOOKSHELF_DIMENSIONS.HEIGHT / 2 + BOOKSHELF_DIMENSIONS.SHELF_THICKNESS / 2);
        const carpet = carpetTexture();
        const normalScale = new THREE.Vector2(CARPET.NORMAL_SCALE, CARPET.NORMAL_SCALE);
        const half = CARPET.DISPLACEMENT_SCALE / 2;

        // Flat far floor: fills the whole view cheaply. Sits just under the
        // displaced patch's lowest tuft so the two never z-fight at the seam.
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(size, size),
            new THREE.MeshStandardMaterial({
                map:         carpet.map,
                normalMap:   carpet.normalMap,
                normalScale: normalScale,
                roughness:   ROOM.FLOOR_ROUGHNESS,
                metalness:   0,
            })
        );
        floor.rotation.x = -Math.PI / 2;       // lay flat, normal pointing up
        floor.position.set(0, floorY - half - 0.05, 0);
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Near patch: real subdivided geometry displaced into pile topography,
        // oscillating around floorY so the room sits at the same height as before.
        // Patch map/normal are cloned to the same tile density as the far floor
        // so feature scale stays continuous across the seam.
        const density = CARPET.REPEAT / size;
        const patchRepeat = density * CARPET.PATCH_SIZE;
        const pMap    = carpet.map.clone();
        const pNormal = carpet.normalMap.clone();
        for (const tex of [pMap, pNormal, carpet.displacementMap]) {
            tex.repeat.set(patchRepeat, patchRepeat);
            tex.needsUpdate = true;
        }
        const patch = new THREE.Mesh(
            new THREE.PlaneGeometry(
                CARPET.PATCH_SIZE, CARPET.PATCH_SIZE,
                CARPET.PATCH_SEGMENTS, CARPET.PATCH_SEGMENTS
            ),
            new THREE.MeshStandardMaterial({
                map:              pMap,
                normalMap:        pNormal,
                normalScale:      normalScale,
                displacementMap:  carpet.displacementMap,
                displacementScale: CARPET.DISPLACEMENT_SCALE,
                displacementBias: -half,   // centre the relief on floorY
                roughness:        ROOM.FLOOR_ROUGHNESS,
                metalness:        0,
            })
        );
        patch.rotation.x = -Math.PI / 2;
        patch.position.set(0, floorY, 0);
        patch.receiveShadow = true;
        this.scene.add(patch);
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

        // Camera must be in the scene so objects parented to it are rendered.
        // (OrbitControls will set lookAt each frame via its target.)
        this.scene.add(this.camera);
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

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER_SETTINGS.MAX_PIXEL_RATIO));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = LIGHTING_SETTINGS.TONE_MAPPING_EXPOSURE;
        document.body.appendChild(this.renderer.domElement);
    }

    setupLighting() {
        const L = LIGHTING_SETTINGS;

        const ambientLight = new THREE.AmbientLight(L.AMBIENT_COLOR, L.AMBIENT_INTENSITY);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(L.KEY_COLOR, L.KEY_INTENSITY);
        keyLight.position.set(L.KEY_POSITION.x, L.KEY_POSITION.y, L.KEY_POSITION.z);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width  = L.SHADOW_MAP_SIZE;
        keyLight.shadow.mapSize.height = L.SHADOW_MAP_SIZE;
        keyLight.shadow.camera.near   = L.SHADOW_NEAR;
        keyLight.shadow.camera.far    = L.SHADOW_FAR;
        keyLight.shadow.camera.left   = L.SHADOW_LEFT;
        keyLight.shadow.camera.right  = L.SHADOW_RIGHT;
        keyLight.shadow.camera.top    = L.SHADOW_TOP;
        keyLight.shadow.camera.bottom = L.SHADOW_BOTTOM;
        keyLight.shadow.bias          = L.SHADOW_BIAS;
        keyLight.shadow.radius        = L.SHADOW_RADIUS;
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(L.FILL_COLOR, L.FILL_INTENSITY);
        fillLight.position.set(L.FILL_POSITION.x, L.FILL_POSITION.y, L.FILL_POSITION.z);
        this.scene.add(fillLight);

        const sconce1 = new THREE.PointLight(L.SCONCE_COLOR, L.SCONCE_INTENSITY, L.SCONCE_DISTANCE);
        sconce1.position.set(L.SCONCE_X, L.SCONCE_Y, L.SCONCE_Z);
        this.scene.add(sconce1);

        const sconce2 = new THREE.PointLight(L.SCONCE_COLOR, L.SCONCE_INTENSITY, L.SCONCE_DISTANCE);
        sconce2.position.set(-L.SCONCE_X, L.SCONCE_Y, L.SCONCE_Z);
        this.scene.add(sconce2);
    }

    setupControls() {
        const C = CONTROLS_SETTINGS;
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
        // floor and back-wall planes (see setupBackdrop for their positions).
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

        const el = this.renderer.domElement;
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

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

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

    animate() {
        requestAnimationFrame(() => this.animate());
        // Only run OrbitControls update when controls are active.
        // When locked, we drive the camera directly (GSAP tweens or snapToDefault),
        // and controls.update() would fight those changes by reapplying its stored spherical.
        if (this.controls.enabled) {
            this.controls.update();
            this._clampToBounds();
            // Keep an open item's link hotspots aligned as the camera moves.
            this.interactionManager?.openItem?.object?.syncOverlay?.();
        }
        this.renderer.render(this.scene, this.camera);
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

    add(object) {
        this.scene.add(object);
    }

    remove(object) {
        this.scene.remove(object);
    }
}
