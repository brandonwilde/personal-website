import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CAMERA_SETTINGS, SCENE_BACKGROUND, LIGHTING_SETTINGS, BOOKSHELF_DIMENSIONS, RENDERER_SETTINGS, CONTROLS_SETTINGS } from '../config/constants.js';
import { roomEnvironment } from '../utils/roomEnvironment.js';

export class SceneManager {
    constructor() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
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

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_SETTINGS.FOV,
            window.innerWidth / window.innerHeight,
            CAMERA_SETTINGS.NEAR,
            CAMERA_SETTINGS.FAR
        );

        const vFov     = this.camera.fov * Math.PI / 180;
        const centerY  = BOOKSHELF_DIMENSIONS.HEIGHT / 2;
        const distance = BOOKSHELF_DIMENSIONS.HEIGHT / (2 * Math.tan(vFov / 2));
        this.camera.position.set(0, centerY, distance);

        // Camera must be in the scene so objects parented to it are rendered.
        // (OrbitControls will set lookAt each frame via its target.)
        this.scene.add(this.camera);
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
        this.controls.maxDistance   = C.MAX_DISTANCE;
        this.controls.zoomSpeed     = C.ZOOM_SPEED;
        this.controls.rotateSpeed   = C.ROTATE_SPEED;
        this.controls.enablePan     = true;
        this.controls.panSpeed      = C.PAN_SPEED;
        this.controls.screenSpacePanning = true;
        // target stays at (0,0,0) — the bookshelf center — which is the OrbitControls default.
        // saveState() records this as the "home" position for reset().
        this.controls.update();
        this.controls.saveState();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        // Only run OrbitControls update when controls are active.
        // When locked, we drive the camera directly (GSAP tweens or snapToDefault),
        // and controls.update() would fight those changes by reapplying its stored spherical.
        if (this.controls.enabled) this.controls.update();
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
