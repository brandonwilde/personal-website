import * as THREE from 'three';
import { BOOKSHELF_DIMENSIONS, WOOD_MATERIAL, SHELF_SUPPORT, SHELF_YS } from '../../config/constants.js';
import { Shelf } from './Shelf.js';
import { shelfSupports } from './shelfSupport.js';

// A run of independently wall-mounted shelves — no side posts, top, or back
// panel; each plank rides its own wooden supports. Exposes the shelves Map plus
// an `objects` list for the scene to install.
export class ShelfRun {
    constructor() {
        this.shelves = new Map();
        this.objects = [];

        this._setupMaterials();
        this._buildShelves();
    }

    _setupMaterials() {
        const loader = new THREE.TextureLoader();
        const woodTexH = loader.load('assets/textures/wood2-h-cropped.png');
        woodTexH.wrapS = woodTexH.wrapT = THREE.RepeatWrapping;

        // Supports take the same grain in a darker tone, so they read as separate pieces.
        this.shelfMaterial   = this._woodMaterial(woodTexH);
        this.supportMaterial = this._woodMaterial(woodTexH, {
            color:     SHELF_SUPPORT.COLOR,
            roughness: SHELF_SUPPORT.ROUGHNESS,
        });
    }

    _woodMaterial(texture, overrides = {}) {
        return new THREE.MeshStandardMaterial({
            map:       texture,
            color:     new THREE.Color(overrides.color ?? WOOD_MATERIAL.COLOR),
            roughness: overrides.roughness ?? WOOD_MATERIAL.ROUGHNESS,
            metalness: WOOD_MATERIAL.METALNESS,
        });
    }

    _buildShelves() {
        const { WIDTH } = BOOKSHELF_DIMENSIONS;

        // Full width — with no side posts there is nothing to butt into. The
        // topmost SHELF_YS position stays bare: it was the frame's cap, not a shelf.
        SHELF_YS.forEach((y, i) => {
            const shelf = new Shelf(String.fromCharCode(65 + i), y, this.shelfMaterial, WIDTH);
            this.objects.push(shelf.mesh, ...shelfSupports(y, WIDTH, this.supportMaterial));
            this.shelves.set(shelf.id, shelf);
        });
    }
}
