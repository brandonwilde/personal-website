import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CAMERA_SETTINGS, SCENE_BACKGROUND, LIGHTING_SETTINGS } from '../config/constants.js';

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
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_SETTINGS.FOV, 
            window.innerWidth / window.innerHeight, 
            CAMERA_SETTINGS.NEAR, 
            CAMERA_SETTINGS.FAR
        );
        
        // Position camera
        const vFov = this.camera.fov * Math.PI / 180;
        const centerY = 18; // Half of bookshelf height
        const distance = 36 / (2 * Math.tan(vFov / 2)); // Height / (2 * tan(fov/2))
        this.camera.position.set(0, centerY, distance);
        this.camera.lookAt(0, centerY, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
        keyLight.shadow.camera.near   = 1;
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
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.minDistance = 12;
        this.controls.maxDistance = 360;
        this.controls.zoomSpeed = 3;
        this.controls.rotateSpeed = 0.8;
        this.controls.enablePan = true;
        this.controls.panSpeed = 0.8;
        this.controls.screenSpacePanning = true;
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
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    add(object) {
        this.scene.add(object);
    }

    remove(object) {
        this.scene.remove(object);
    }
}
