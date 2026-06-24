import * as THREE from 'three';
import { BOOKSHELF_DIMENSIONS } from '../../config/constants.js';
import { shelfInnerSpan, flexCenters } from './shelfLayout.js';

export class Shelf {
    constructor(id, y, material, width = BOOKSHELF_DIMENSIONS.WIDTH) {
        this.id = id;
        this.y = y;
        this.width = width;
        this.books = new Map();
        // Layout groups (book sections, special items) distributed by layout().
        this.groups = [];
        this.createGeometry(material);
    }

    createGeometry(material) {
        this.material = material;

        this.geometry = new THREE.BoxGeometry(
            this.width,
            BOOKSHELF_DIMENSIONS.SHELF_THICKNESS,
            BOOKSHELF_DIMENSIONS.DEPTH
        );

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(0, this.y, 0);
        this.mesh.castShadow    = true;
        this.mesh.receiveShadow = true;
    }

    // Combined spine-out width of a run of books, including inter-book spacing.
    static sectionWidth(books) {
        const spacing = BOOKSHELF_DIMENSIONS.BOOK_SPACING;
        return books.reduce((sum, book) => sum + book.dimensions.thickness, 0)
            + spacing * (books.length - 1);
    }

    // Lay a run of books spine-out, centered on centerX.
    positionBooks(books, centerX) {
        const spacing = BOOKSHELF_DIMENSIONS.BOOK_SPACING;
        let x = centerX - Shelf.sectionWidth(books) / 2;

        books.forEach(book => {
            this.books.set(book.bookId, book);

            book.rotation.y       = Math.PI / 2;
            book.initialRotationY = Math.PI / 2;

            const bookX = x + book.dimensions.thickness / 2;
            book.position.set(
                bookX,
                this.y + BOOKSHELF_DIMENSIONS.SHELF_THICKNESS / 2 + book.dimensions.height / 2,
                0
            );
            book.initialX = book.position.x;
            book.initialY = book.position.y;
            book.initialZ = book.position.z;

            x += book.dimensions.thickness + spacing;
        });
    }

    // Register (or replace, by id) a group to be placed by layout().
    //   order       — left→right ordering hint (the old section number)
    //   width       — footprint along X
    //   place(cx)   — positions the group's contents at center X (cx is null for anchored)
    //   anchored    — true to opt out of flow (e.g. wall-leaning items)
    //   reserveSide — 'left' | 'right': which end an anchored group reserves
    registerGroup(group) {
        if (group.id) {
            const i = this.groups.findIndex(g => g.id === group.id);
            if (i !== -1) { this.groups[i] = group; return; }
        }
        this.groups.push(group);
    }

    // Distribute flowing groups across the shelf's inner span, after reserving
    // space for any anchored groups, then position each group's contents.
    layout() {
        let { left, right } = shelfInnerSpan();

        for (const g of this.groups.filter(g => g.anchored)) {
            g.place(null);
            if (g.reserveSide === 'right') right -= g.width;
            else left += g.width;
        }

        const flow = this.groups.filter(g => !g.anchored).sort((a, b) => a.order - b.order);
        const centers = flexCenters(flow.map(g => g.width), left, right);
        flow.forEach((g, i) => g.place(centers[i]));
    }

    removeBook(bookId) {
        this.books.delete(bookId);
    }

    getBooks() {
        return Array.from(this.books.values());
    }
}
