import * as THREE from 'three';

export class InteractionManager {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredBook = null;
        this.books = new Map();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.renderer.domElement.addEventListener('click', (event) => this.onClick(event));
    }

    registerBook(id, book, modal) {
        console.log(`Registering book ${id} with modal:`, modal);
        this.books.set(id, { object: book, modal: modal });
    }

    unregisterBook(id) {
        this.books.delete(id);
    }

    onMouseMove(event) {
        // Get canvas-relative coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Find all intersected objects
        const intersects = this.raycaster.intersectObjects(
            Array.from(this.books.values()).map(book => book.object),
            true
        );

        // Handle hover states
        const intersectedBook = intersects.length > 0 ? 
            this.findBookFromMesh(intersects[0].object) : null;

        if (this.hoveredBook !== intersectedBook) {
            if (this.hoveredBook) {
                this.hoveredBook.object.setHovered(false);
            }
            if (intersectedBook) {
                intersectedBook.object.setHovered(true);
            }
            this.hoveredBook = intersectedBook;
            this.renderer.domElement.style.cursor = intersectedBook ? 'pointer' : 'default';
        }
    }

    onClick(event) {
        console.log('Click event received');
        
        // Get canvas-relative coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Find all intersected objects
        const intersects = this.raycaster.intersectObjects(
            Array.from(this.books.values()).map(book => book.object),
            true
        );

        // Handle click
        const intersectedBook = intersects.length > 0 ? 
            this.findBookFromMesh(intersects[0].object) : null;

        if (intersectedBook) {
            if (intersectedBook.modal) {
                // First show the modal
                intersectedBook.modal.classList.add('modal-active');
                
                // Then animate the book
                intersectedBook.object.toggleOpen();
            }
        }
    }

    findBookFromMesh(mesh) {
        // Find the Book instance that contains this mesh
        for (const [bookId, bookData] of this.books.entries()) {
            const book = bookData.object;
            if (mesh === book || mesh.parent === book || mesh.parent?.parent === book) {
                return bookData;
            }
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
