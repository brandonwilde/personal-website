import * as THREE from 'three';
import { BOOKSHELF_DIMENSIONS } from '../config/constants.js';

export class Shelf {
    constructor(id, y, texture) {
        this.id = id;
        this.y = y;
        this.books = new Map(); // Map of bookId -> book
        this.createGeometry(texture);
    }

    createGeometry(texture) {
        // Create material with wood texture
        this.material = new THREE.MeshStandardMaterial({
            map: texture,
            color: new THREE.Color(0xc8a87a),
            roughness: 0.85,
            metalness: 0.0
        });

        // Create shelf geometry
        this.geometry = new THREE.BoxGeometry(
            BOOKSHELF_DIMENSIONS.WIDTH,
            BOOKSHELF_DIMENSIONS.SHELF_THICKNESS,
            BOOKSHELF_DIMENSIONS.DEPTH
        );

        // Create mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(0, this.y, 0);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }

    addBookSection(books, section) {
        // console.log(`Adding ${books.length} books to section ${section}`);

        // Define section center position
        const sectionX = {
            1: -0.75,    // Leftmost quarter
            2: -0.25,    // Center-left quarter
            3: 0.25,     // Center-right quarter
            4: 0.75      // Rightmost quarter
        }[section] * (BOOKSHELF_DIMENSIONS.WIDTH/2);

        // console.log('Section center:', sectionX);

        // Calculate total width (which is actually the sum of book thicknesses since they're rotated)
        const spacing = 0.3; // Very small gap between books
        const totalWidth = books.reduce((sum, book) => sum + book.dimensions.thickness, 0) 
            + (spacing * (books.length - 1));

        // console.log('Books in section:', books.map(b => ({
        //     id: b.bookId,
        //     thickness: b.dimensions.thickness
        // })));
        // console.log('Total width with spacing:', totalWidth);

        // Start from the leftmost position of this section
        let x = sectionX - (totalWidth / 2);
        // console.log('Starting x position:', x);

        // Position each book
        books.forEach((book, index) => {
            // Store book in map
            this.books.set(book.bookId, book);

            // Set rotation
            book.rotation.y = Math.PI / 2;
            book.initialRotationY = Math.PI / 2;

            // Position book - use book thickness since it's rotated
            const bookX = x + (book.dimensions.thickness / 2);
            book.position.x = bookX;
            book.position.y = this.y + BOOKSHELF_DIMENSIONS.SHELF_THICKNESS/2 + book.dimensions.height/2;
            book.position.z = 0;
            book.initialX = book.position.x;
            book.initialY = book.position.y;
            book.initialZ = book.position.z;

            // console.log(`Book ${book.bookId}: thickness=${book.dimensions.thickness}, x=${bookX}`);

            // Move x position for next book
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
