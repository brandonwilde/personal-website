import * as THREE from 'three';
import { BOOKSHELF_DIMENSIONS } from '../config/constants.js';

export class Shelf {
    constructor(id, y, material) {
        this.id = id;
        this.y = y;
        this.books = new Map();
        this.createGeometry(material);
    }

    createGeometry(material) {
        this.material = material;

        this.geometry = new THREE.BoxGeometry(
            BOOKSHELF_DIMENSIONS.WIDTH,
            BOOKSHELF_DIMENSIONS.SHELF_THICKNESS,
            BOOKSHELF_DIMENSIONS.DEPTH
        );

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(0, this.y, 0);
        this.mesh.castShadow    = true;
        this.mesh.receiveShadow = true;
    }

    addBookSection(books, section) {
        const sectionX = {
            1: -0.75,
            2: -0.25,
            3:  0.25,
            4:  0.75,
        }[section] * (BOOKSHELF_DIMENSIONS.WIDTH / 2);

        const spacing    = 0.3;
        const totalWidth = books.reduce((sum, book) => sum + book.dimensions.thickness, 0)
            + spacing * (books.length - 1);

        let x = sectionX - totalWidth / 2;

        books.forEach(book => {
            this.books.set(book.bookId, book);

            book.rotation.y      = Math.PI / 2;
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

    removeBook(bookId) {
        this.books.delete(bookId);
    }

    getBooks() {
        return Array.from(this.books.values());
    }
}
