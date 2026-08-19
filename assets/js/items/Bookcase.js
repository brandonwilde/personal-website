import * as THREE from 'three';
import { BOOKSHELF_DIMENSIONS, WOOD_MATERIAL, SHELF_BRACKET } from '../config/constants.js';
import { Shelf } from './shelf/Shelf.js';
import { shelfBrackets } from './shelf/shelfBracket.js';

// A run of independently wall-mounted shelves — no side posts, top, or back panel;
// each plank is carried on its own iron brackets. Builds everything in world space
// at the origin and exposes the shelves Map plus an `objects` list for the scene to
// install. The shelves hold the books; the business card and blog notebook are
// placed by BookshelfScene.
export class Bookcase {
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

        // Built once and shared across every plank and corbel. The corbels take
        // the same grain in a darker tone so they read as separate pieces.
        this.shelfMaterial   = this._woodMaterial(woodTexH);
        this.bracketMaterial = this._woodMaterial(woodTexH, {
            color:     SHELF_BRACKET.COLOR,
            roughness: SHELF_BRACKET.ROUGHNESS,
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
        const { WIDTH, HEIGHT } = BOOKSHELF_DIMENSIONS;

        // Each plank spans the full width — with no side posts, there is nothing
        // to butt into. Y-centers are unchanged, so book/label placement carries over.
        // The topmost position is left bare: it was the frame's cap, not a shelf.
        const numShelves = Math.floor(HEIGHT / BOOKSHELF_DIMENSIONS.SHELF_SPACING);
        for (let i = 0; i < numShelves; i++) {
            const y = i * BOOKSHELF_DIMENSIONS.SHELF_SPACING - HEIGHT / 2;
            const shelf = new Shelf(String.fromCharCode(65 + i), y, this.shelfMaterial, WIDTH);
            this.objects.push(shelf.mesh, ...shelfBrackets(y, WIDTH, this.bracketMaterial));
            this.shelves.set(shelf.id, shelf);
        }
    }
}
