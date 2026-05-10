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

    closeOpenBook() {
        if (!this.openBook) return;
        const bookData = this.openBook;
        this.openBook = null;
        bookData.object.toggleOpen();
        if (bookData.modal) bookData.modal.classList.remove('modal-active');
    }

    openBookEntry(bookData) {
        this.openBook = bookData;
        bookData.object.toggleOpen();
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
            // Click on empty space closes the open book
            this.closeOpenBook();
            return;
        }

        if (clickedBook === this.openBook) {
            // Toggle the already-open book closed
            this.closeOpenBook();
        } else {
            // Close whatever is open, then open the clicked book
            this.closeOpenBook();
            this.openBookEntry(clickedBook);
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
