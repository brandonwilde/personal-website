import * as THREE from 'three';
import { BOOKSHELF_DIMENSIONS, WOOD_MATERIAL } from '../config/constants.js';
import { Shelf } from './shelf/Shelf.js';

// The bookcase: its wooden frame (back panel + two side posts) and the run of shelves
// it holds. Builds everything in world space at the origin and exposes the shelves Map
// plus an `objects` list for the scene to install. The shelves hold the books; the
// business card and blog notebook are placed against the frame by BookshelfScene.
export class Bookcase {
    constructor() {
        this.shelves = new Map();
        this.objects = [];

        this._setupMaterials();
        this._buildFrame();
        this._buildShelves();
    }

    _setupMaterials() {
        const loader = new THREE.TextureLoader();
        const woodTex = loader.load('assets/textures/wood2.png');
        const woodTexH = loader.load('assets/textures/wood2-h-cropped.png');

        woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
        woodTexH.wrapS = woodTexH.wrapT = THREE.RepeatWrapping;

        // Build materials once; share across all frame/shelf meshes
        this.frameMaterial = this._woodMaterial(woodTex);
        this.shelfMaterial = this._woodMaterial(woodTexH);
    }

    _woodMaterial(texture) {
        return new THREE.MeshStandardMaterial({
            map:       texture,
            color:     new THREE.Color(WOOD_MATERIAL.COLOR),
            roughness: WOOD_MATERIAL.ROUGHNESS,
            metalness: WOOD_MATERIAL.METALNESS,
        });
    }

    _buildFrame() {
        const { WIDTH, HEIGHT, DEPTH, FRAME_THICKNESS, SHELF_THICKNESS } = BOOKSHELF_DIMENSIONS;
        // Side posts are the outer envelope; everything else butts flush inside them.
        const innerWidth = WIDTH - 2 * FRAME_THICKNESS;   // span between the side posts

        // Posts/back run a touch taller than HEIGHT so they cover the top and
        // bottom cap shelves (which straddle ±HEIGHT/2), giving flush edges.
        const outerHeight = HEIGHT + SHELF_THICKNESS;

        // Back panel — inset so its rear face sits flush with the posts' back edge.
        const backPanel = new THREE.Mesh(
            new THREE.BoxGeometry(innerWidth, outerHeight, FRAME_THICKNESS),
            this.frameMaterial
        );
        backPanel.position.set(0, 0, -DEPTH / 2 + FRAME_THICKNESS / 2);
        backPanel.castShadow = true;
        backPanel.receiveShadow = true;
        this.objects.push(backPanel);

        // Side posts — run the full height (covering the cap shelves) and full
        // depth, with their outer faces flush at ±WIDTH/2.
        const sidePanelGeometry = new THREE.BoxGeometry(FRAME_THICKNESS, outerHeight, DEPTH);

        const leftPanel = new THREE.Mesh(sidePanelGeometry, this.frameMaterial);
        leftPanel.position.set(-(WIDTH / 2 - FRAME_THICKNESS / 2), 0, 0);
        leftPanel.castShadow = true;
        leftPanel.receiveShadow = true;
        this.objects.push(leftPanel);

        const rightPanel = new THREE.Mesh(sidePanelGeometry, this.frameMaterial);
        rightPanel.position.set(WIDTH / 2 - FRAME_THICKNESS / 2, 0, 0);
        rightPanel.castShadow = true;
        rightPanel.receiveShadow = true;
        this.objects.push(rightPanel);
    }

    _buildShelves() {
        const { WIDTH, HEIGHT, FRAME_THICKNESS } = BOOKSHELF_DIMENSIONS;
        const sideInnerX = (WIDTH - 2 * FRAME_THICKNESS) / 2;   // inner face of each post

        // Shelves — span only the inner width so each plank butts cleanly between
        // the side posts. Y-centers match the frame so book/label placement is unchanged.
        const numShelves = Math.floor(HEIGHT / BOOKSHELF_DIMENSIONS.SHELF_SPACING);
        for (let i = 0; i <= numShelves; i++) {
            const y = i * BOOKSHELF_DIMENSIONS.SHELF_SPACING - HEIGHT / 2;
            const shelf = new Shelf(String.fromCharCode(65 + i), y, this.shelfMaterial, 2 * sideInnerX);
            this.objects.push(shelf.mesh);
            this.shelves.set(shelf.id, shelf);
        }
    }
}
