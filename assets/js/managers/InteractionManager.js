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

    // Targets to raycast against: all registered books, plus the open book's
    // flying card (which may have been reparented out of its group).
    _raycastTargets() {
        const targets = Array.from(this.books.values()).map(b => b.object);
        const flying = this.openBook?.object?.flyingCard;
        if (flying && !targets.includes(flying)) targets.push(flying);
        return targets;
    }

    // If the topmost hit is on the open BusinessCard's front face and lands
    // on a link hotspot, returns the URL; otherwise null.
    _linkHitFromIntersects(intersects) {
        const obj = this.openBook?.object;
        if (!obj || !obj.getLinkAtUV) return null;
        const hit = intersects.find(i => i.object === obj.flyingCard);
        if (!hit || hit.face?.materialIndex !== 4) return null;
        return obj.getLinkAtUV(hit.uv);
    }

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
        this.mouse.y = -((event.clientY - rect.top)  / rect.height) *  2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this._raycastTargets(), true);

        const intersectedBook = intersects.length > 0
            ? this.findBookFromMesh(intersects[0].object)
            : null;

        if (this.hoveredBook !== intersectedBook) {
            if (this.hoveredBook)  this.hoveredBook.object.setHovered(false);
            if (intersectedBook)   intersectedBook.object.setHovered(true);
            this.hoveredBook = intersectedBook;
        }

        // Cursor: pointer if hovering a book OR a clickable link on the open card
        const overLink = !!this._linkHitFromIntersects(intersects);
        this.renderer.domElement.style.cursor =
            (intersectedBook || overLink) ? 'pointer' : 'default';
    }

    onClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
        this.mouse.y = -((event.clientY - rect.top)  / rect.height) *  2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this._raycastTargets(), true);

        // Link on the open business card takes priority — open URL and close card.
        const linkUrl = this._linkHitFromIntersects(intersects);
        if (linkUrl) {
            window.open(linkUrl, '_blank', 'noopener,noreferrer');
            this.closeOpenBook();
            return;
        }

        const clickedBook = intersects.length > 0
            ? this.findBookFromMesh(intersects[0].object)
            : null;

        if (!clickedBook) {
            this.closeOpenBook();
            return;
        }

        if (clickedBook.link) {
            // Open immediately (must be synchronous with the click to avoid popup blockers).
            // Close animation plays concurrently on the main tab.
            window.open(clickedBook.link, '_blank', 'noopener,noreferrer');
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
