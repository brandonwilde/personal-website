import * as THREE from 'three';
import { INTERACTION } from '../config/constants.js';

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
        // Pass interaction context so components like BusinessCard can mount
        // an HTML link overlay positioned to the camera/renderer.
        bookData.object.open({
            camera:      this.camera,
            renderer:    this.renderer,
            onLinkClick: () => this.closeOpenBook(),
        });
    }

    // Raycast targets: every registered book, plus any meshes the open book
    // wants treated as part of itself (e.g. BusinessCard's flying card, which
    // gets reparented out of its group during the open animation).
    _raycastTargets() {
        const targets = Array.from(this.books.values()).map(b => b.object);
        const extras = this.openBook?.object?.getOpenInteractables?.() ?? [];
        for (const m of extras) if (!targets.includes(m)) targets.push(m);
        return targets;
    }

    // True if the topmost intersect belongs to the currently open book — either
    // as a descendant of its group, or via getOpenInteractables().
    _intersectIsOnOpenBook(intersects) {
        if (!this.openBook || !intersects.length) return false;
        const obj = intersects[0].object;
        const open = this.openBook.object;
        const extras = open.getOpenInteractables?.() ?? [];
        if (extras.includes(obj)) return true;
        return this.isChildOfBook(obj, open);
    }

    _updateMouse(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
        this.mouse.y = -((event.clientY - rect.top)  / rect.height) *  2 + 1;
    }

    onMouseMove(event) {
        this._updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this._raycastTargets(), true);

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
        // Ignore clicks that were really camera drags (orbit/pan)
        const down = this._downPos;
        this._downPos = null;
        if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > INTERACTION.DRAG_THRESHOLD_PX) {
            return;
        }

        this._updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this._raycastTargets(), true);

        // Click on the open book itself — leave it open so users can interact
        // with the displayed content (text selection, links via the overlay).
        if (this._intersectIsOnOpenBook(intersects)) return;

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

        // Different book — close current and open the new one.
        this.closeOpenBook(() => this.openBookEntry(clickedBook));
    }

    setupEventListeners() {
        this.renderer.domElement.addEventListener('mousemove', e => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mousedown', e => { this._downPos = { x: e.clientX, y: e.clientY }; });
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
