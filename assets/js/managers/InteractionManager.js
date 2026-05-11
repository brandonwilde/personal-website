import * as THREE from 'three';

export class InteractionManager {
    constructor(camera, renderer, { onOpen, onCloseStart } = {}) {
        this.camera   = camera;
        this.renderer = renderer;
        this.raycaster      = new THREE.Raycaster();
        this.mouse          = new THREE.Vector2();
        this.hoveredBook    = null;
        this.openBook       = null; // at most one book open at a time
        this.books          = new Map();
        this._onOpen        = onOpen       ?? null; // fires before open animation
        this._onCloseStart  = onCloseStart ?? null; // fires before close animation
        this._pendingOpen   = null;                 // delayedCall scheduled by closeOpenBook

        this.setupEventListeners();
    }

    // bookMeta shape: { title, modalInfo, color }
    registerBook(id, book, bookMeta) {
        this.books.set(id, { object: book, ...bookMeta });
    }

    unregisterBook(id) {
        this.books.delete(id);
    }

    // Closes the open book and calls onComplete after openDelay seconds.
    // openDelay < close duration = animations overlap; 0 = fully concurrent.
    // If nothing is open, onComplete fires immediately.
    closeOpenBook(onComplete) {
        // Cancel any queued open from a prior close so rapid clicks can't
        // stack multiple openBookEntry calls (which would re-fire onOpen).
        if (this._pendingOpen) {
            this._pendingOpen.kill();
            this._pendingOpen = null;
        }
        if (!this.openBook) {
            if (onComplete) onComplete();
            return;
        }
        const bookData = this.openBook;
        this.openBook  = null;
        if (this._onCloseStart) this._onCloseStart();
        bookData.object.close();
        if (onComplete) {
            const delay = (window.animParams ?? { close: { openDelay: 0.4 } }).close.openDelay;
            this._pendingOpen = window.gsap.delayedCall(delay, () => {
                this._pendingOpen = null;
                onComplete();
            });
        }
    }

    openBookEntry(bookData) {
        this.openBook = bookData;
        if (this._onOpen) this._onOpen();
        bookData.object.open();
    }

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
        this.mouse.y = -((event.clientY - rect.top)  / rect.height) *  2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(
            Array.from(this.books.values()).map(b => b.object),
            true
        );

        const intersectedBook = intersects.length > 0
            ? this.findBookFromMesh(intersects[0].object)
            : null;

        if (this.hoveredBook !== intersectedBook) {
            if (this.hoveredBook)  this.hoveredBook.object.setHovered(false);
            if (intersectedBook)   intersectedBook.object.setHovered(true);
            this.hoveredBook = intersectedBook;
            this.renderer.domElement.style.cursor = intersectedBook ? 'pointer' : 'default';
        }
    }

    onClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
        this.mouse.y = -((event.clientY - rect.top)  / rect.height) *  2 + 1;

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
            this.closeOpenBook(() => this.openBookEntry(clickedBook));
        }
    }

    setupEventListeners() {
        this.renderer.domElement.addEventListener('mousemove', e => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('click',     e => this.onClick(e));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.closeOpenBook();
        });
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
