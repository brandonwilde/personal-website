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
        // Supports take the same grain in a darker tone, so they read as separate pieces.
        this.shelfMaterial   = this._woodMaterial();
        this.supportMaterial = this._woodMaterial({
            color:     SHELF_SUPPORT.COLOR,
            roughness: SHELF_SUPPORT.ROUGHNESS,
        });

        // The map is attached only once decoded: an unloaded Texture samples as
        // black and multiplies the base color away, flashing black shelves.
        new THREE.TextureLoader().load('assets/textures/wood2-h-cropped.png', (woodTexH) => {
            woodTexH.wrapS = woodTexH.wrapT = THREE.RepeatWrapping;
            for (const material of [this.shelfMaterial, this.supportMaterial]) {
                material.map = woodTexH;
                material.needsUpdate = true;
            }
        });
    }

    _woodMaterial(overrides = {}) {
        return new THREE.MeshStandardMaterial({
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
