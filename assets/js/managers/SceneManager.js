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
        this.renderer.toneMappingExposure = 1.1;
        document.body.appendChild(this.renderer.domElement);
    }

    setupLighting() {
        // Warm ambient — simulates bounced room light
        const ambientLight = new THREE.AmbientLight(0xfff0d0, 0.6);
        this.scene.add(ambientLight);

        // Key light — warm overhead lamp
        const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.8);
        keyLight.position.set(20, 60, 40);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 1;
        keyLight.shadow.camera.far = 200;
        keyLight.shadow.bias = -0.0005;
        this.scene.add(keyLight);

        // Cool fill from opposite side — subtle contrast
        const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.4);
        fillLight.position.set(-40, 30, -30);
        this.scene.add(fillLight);

        // Warm sconce-style point lights flanking the bookshelf
        const sconce1 = new THREE.PointLight(0xffa060, 2.5, 80);
        sconce1.position.set(30, 28, 18);
        this.scene.add(sconce1);

        const sconce2 = new THREE.PointLight(0xffa060, 2.5, 80);
        sconce2.position.set(-30, 28, 18);
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
