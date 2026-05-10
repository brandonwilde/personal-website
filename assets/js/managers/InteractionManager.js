import * as THREE from 'three';

export class InteractionManager {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredBook = null;
        this.openBook = null; // at most one book open at a time
        this.books = new Map();

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.renderer.domElement.addEventListener('click', (event) => this.onClick(event));
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.closeOpenBook();
        });
    }

    registerBook(id, book, modal) {
        this.books.set(id, { object: book, modal });
    }

    unregisterBook(id) {
        this.books.delete(id);
    }

    // Closes the open book and calls onComplete after openDelay seconds.
    // openDelay < close duration = animations overlap; 0 = fully concurrent.
    // If nothing is open, onComplete fires immediately.
    closeOpenBook(onComplete) {
        if (!this.openBook) {
            if (onComplete) onComplete();
            return;
        }
        const bookData = this.openBook;
        this.openBook = null;
        if (bookData.modal) bookData.modal.classList.remove('modal-active');
        bookData.object.close();
        if (onComplete) {
            const delay = (window.animParams ?? { close: { openDelay: 0.4 } }).close.openDelay;
            window.gsap.delayedCall(delay, onComplete);
        }
    }

    openBookEntry(bookData) {
        this.openBook = bookData;
        bookData.object.open();
        if (bookData.modal) bookData.modal.classList.add('modal-active');
    }

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(
            Array.from(this.books.values()).map(b => b.object),
            true
        );

        const intersectedBook = intersects.length > 0
            ? this.findBookFromMesh(intersects[0].object)
            : null;

        if (this.hoveredBook !== intersectedBook) {
            if (this.hoveredBook) this.hoveredBook.object.setHovered(false);
            if (intersectedBook) intersectedBook.object.setHovered(true);
            this.hoveredBook = intersectedBook;
            this.renderer.domElement.style.cursor = intersectedBook ? 'pointer' : 'default';
        }
    }

    onClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(
            Array.from(this.books.values()).map(b => b.object),
            true
        );

        const clickedBook = intersects.length > 0
            ? this.findBookFromMesh(intersects[0].object)
            : null;

        if (!clickedBook) {
            this.closeOpenBook();
            return;
        }

        if (clickedBook === this.openBook) {
            this.closeOpenBook();
        } else {
            // Wait for close animation to finish before opening the new book
            this.closeOpenBook(() => this.openBookEntry(clickedBook));
        }
    }

    findBookFromMesh(mesh) {
        for (const bookData of this.books.values()) {
            if (this.isChildOfBook(mesh, bookData.object)) return bookData;
        }
        return null;
    }

    isChildOfBook(mesh, book) {
        let current = mesh;
        while (current) {
            if (current === book) return true;
            current = current.parent;
        }
        return false;
    }
}
