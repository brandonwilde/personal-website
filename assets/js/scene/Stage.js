import * as THREE from 'three';
import { SCENE_BACKGROUND, LIGHTING_SETTINGS, RENDERER_SETTINGS, FLOOR_Y, WALL_Z } from '../config/constants.js';
import { roomEnvironment } from '../room/environment.js';
import { addWalls } from '../room/walls.js';
import { addBaseboards } from '../room/baseboards.js';
import { addFloor } from '../room/floor.js';
import { CameraController } from './CameraController.js';

const SHADOW_TYPES = {
    BASIC:    THREE.BasicShadowMap,
    PCF:      THREE.PCFShadowMap,
    PCF_SOFT: THREE.PCFSoftShadowMap,
    VSM:      THREE.VSMShadowMap,
};

// Builds and draws the world (scene, renderer, lights, room backdrop) and
// runs the render loop. The camera and its choreography live in CameraController.
export class Stage {
    constructor() {
        this.setupScene();
        this.setupRenderer();
        this.setupLighting();
        this.setupBackdrop();

        this.cameraController = new CameraController(this.renderer.domElement);
        // Camera must be in the scene so objects parented to it are rendered.
        // (OrbitControls sets lookAt each frame via its target.)
        this.scene.add(this.cameraController.camera);

        this.setupEventListeners();
        this.interactionManager = null; // Will be set by BookshelfScene
    }

    // The camera lives on the controller; expose it for raycasting/overlay consumers.
    get camera() {
        return this.cameraController.camera;
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(SCENE_BACKGROUND);

        // Scene-wide reflection source
        this.scene.environment = roomEnvironment();
    }

    // Wall the shelves hang on and the floor below them, framing it as a room.
    setupBackdrop() {
        const { sideDepth } = addWalls(this.scene, { wallZ: WALL_Z });
        addBaseboards(this.scene, { wallZ: WALL_Z, floorY: FLOOR_Y, sideDepth });
        addFloor(this.scene, { floorY: FLOOR_Y });
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER_SETTINGS.MAX_PIXEL_RATIO));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = SHADOW_TYPES[LIGHTING_SETTINGS.SHADOW_TYPE] ?? THREE.PCFShadowMap;
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
        keyLight.shadow.normalBias    = L.SHADOW_NORMAL_BIAS;
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

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.cameraController.onResize();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        // When controls are active, keep an open item's link hotspots aligned as the
        // camera moves. (While locked, the camera is driven directly by GSAP tweens.)
        if (this.cameraController.update()) {
            this.interactionManager?.openItem?.object?.syncOverlay?.();
        }
        this.renderer.render(this.scene, this.cameraController.camera);
    }

    add(object) {
        this.scene.add(object);
    }

    remove(object) {
        this.scene.remove(object);
    }
}
