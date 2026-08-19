import * as THREE from 'three';
import { BOOKSHELF_DIMENSIONS, WOOD_MATERIAL, SHELF_SUPPORT, SHELF_YS } from '../../config/constants.js';
import { Shelf } from './Shelf.js';
import { shelfSupports } from './shelfSupport.js';

// A run of independently wall-mounted shelves — no side posts, top, or back panel;
// each plank is carried on its own wooden supports. Builds everything in world
// space at the origin and exposes the shelves Map plus an `objects` list for the
// scene to install. The shelves hold the books; the business card and blog notebook are
// placed by BookshelfScene.
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

        // Built once and shared across every plank and support. The supports take
        // the same grain in a darker tone so they read as separate pieces.
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

        // Each plank spans the full width — with no side posts, there is nothing
        // to butt into. Y-centers are unchanged, so book/label placement carries over.
        // The topmost position is left bare: it was the frame's cap, not a shelf.
        SHELF_YS.forEach((y, i) => {
            const shelf = new Shelf(String.fromCharCode(65 + i), y, this.shelfMaterial, WIDTH);
            this.objects.push(shelf.mesh, ...shelfSupports(y, WIDTH, this.supportMaterial));
            this.shelves.set(shelf.id, shelf);
        });
    }
}
