import * as THREE from 'three';
import { INTERACTION } from '../config/constants.js';

export class InteractionManager {
    constructor(camera, renderer, { onOpen, onShowcased, onCloseStart } = {}) {
        this.camera   = camera;
        this.renderer = renderer;
        this.raycaster      = new THREE.Raycaster();
        this.mouse          = new THREE.Vector2();
        this.hoveredItem    = null;
        this.openItem       = null; // at most one item open at a time
        this.items          = new Map();
        this._onOpen        = onOpen       ?? null; // fires before open animation
        this._onShowcased   = onShowcased  ?? null; // fires when the open item settles on display
        this._onCloseStart  = onCloseStart ?? null; // fires before close animation
        this._pendingOpen   = null;                 // delayedCall scheduled by closeOpenItem

        this.setupEventListeners();
    }

    // meta shape: { title, modalInfo, color, standalone }. A standalone item opens
    // where it stands, so the open/close callbacks leave the camera alone.
    registerItem(id, item, meta) {
        this.items.set(id, { object: item, ...meta });
    }

    unregisterItem(id) {
        this.items.delete(id);
    }

    // Closes the open item and calls onComplete after openDelay seconds.
    // openDelay < close duration = animations overlap; 0 = fully concurrent.
    // If nothing is open, onComplete fires immediately.
    closeOpenItem(onComplete) {
        // Cancel any queued open from a prior close so rapid clicks can't
        // stack multiple openItemEntry calls (which would re-fire onOpen).
        if (this._pendingOpen) {
            this._pendingOpen.kill();
            this._pendingOpen = null;
        }
        if (!this.openItem) {
            if (onComplete) onComplete();
            return;
        }
        const itemData = this.openItem;
        this.openItem  = null;
        if (this._onCloseStart) this._onCloseStart(itemData);
        itemData.object.close();
        if (onComplete) {
            const delay = (window.animParams ?? { close: { openDelay: 0.4 } }).close.openDelay;
            this._pendingOpen = window.gsap.delayedCall(delay, () => {
                this._pendingOpen = null;
                onComplete();
            });
        }
    }

    openItemEntry(itemData) {
        this.openItem = itemData;
        if (this._onOpen) this._onOpen(itemData);
        // Pass interaction context so components like BusinessCard can mount
        // an HTML link overlay positioned to the camera/renderer.
        itemData.object.open({
            camera:      this.camera,
            renderer:    this.renderer,
            onLinkClick: () => this.closeOpenItem(),
            onShowcased: (center) => this._onShowcased?.(center),
        });
    }

    // Raycast targets: every registered item, plus any meshes the open item
    // wants treated as part of itself (e.g. BusinessCard's flying card, which
    // gets reparented out of its group during the open animation).
    _raycastTargets() {
        const targets = Array.from(this.items.values()).map(i => i.object);
        const extras = this.openItem?.object?.getOpenInteractables?.() ?? [];
        for (const m of extras) if (!targets.includes(m)) targets.push(m);
        return targets;
    }

    // Single source of truth for "what is under the cursor", shared by hover and
    // click so their rules can't drift apart. Returns { kind, item } where kind is:
    //   'closed'           — a registered item that isn't currently open (clickable)
    //   'open-body'        — the open item's own geometry (not clickable)
    //   'open-interactable'— an extra the open item exposes, e.g. a link mesh
    //   'none'             — empty space
    _classifyTopIntersect(intersects) {
        if (!intersects.length) return { kind: 'none', item: null };
        const obj = intersects[0].object;

        if (this.openItem) {
            const open = this.openItem.object;
            const extras = open.getOpenInteractables?.() ?? [];
            if (extras.includes(obj))          return { kind: 'open-interactable', item: this.openItem };
            if (this.isChildOfItem(obj, open)) return { kind: 'open-body',         item: this.openItem };
        }

        const item = this.findItemFromMesh(obj);
        return item ? { kind: 'closed', item } : { kind: 'none', item: null };
    }

    _updateMouse(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
        this.mouse.y = -((event.clientY - rect.top)  / rect.height) *  2 + 1;
    }

    onMouseMove(event) {
        // While dragging the camera (orbit/pan), suppress hover effects — clear
        // any current hover and skip raycasting until the drag ends. event.buttons
        // confirms a button is still held (so a stale _downPos can't re-trigger this).
        if (event.buttons !== 0 && this._downPos &&
            Math.hypot(event.clientX - this._downPos.x, event.clientY - this._downPos.y) > INTERACTION.DRAG_THRESHOLD_PX) {
            this._dragging = true;
        }
        if (this._dragging) {
            if (this.hoveredItem) {
                this.hoveredItem.object.setHovered(false);
                this.hoveredItem = null;
            }
            this.renderer.domElement.style.cursor = 'default';
            return;
        }

        this._updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this._raycastTargets(), true);
        const { kind, item } = this._classifyTopIntersect(intersects);

        // Only closed items get the hover lift/glow — the open item isn't clickable.
        const hoverItem = kind === 'closed' ? item : null;
        if (this.hoveredItem !== hoverItem) {
            if (this.hoveredItem) this.hoveredItem.object.setHovered(false);
            if (hoverItem)        hoverItem.object.setHovered(true);
            this.hoveredItem = hoverItem;
        }

        const clickable = kind === 'closed' || kind === 'open-interactable' ||
                          (kind === 'open-body' && item.standalone);
        this.renderer.domElement.style.cursor = clickable ? 'pointer' : 'default';
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
        const { kind, item } = this._classifyTopIntersect(intersects);

        // Click on the open item (body or its extras) — leave it open so users can
        // interact with the displayed content (text selection, links via the overlay).
        // A standalone item has no such content, so a second click means "shut it".
        if (kind === 'open-body' || kind === 'open-interactable') {
            if (kind === 'open-body' && item.standalone) this.closeOpenItem();
            return;
        }

        if (kind === 'none') {
            this.closeOpenItem();
            return;
        }

        // kind === 'closed'
        if (item.link) {
            // Open immediately (must be synchronous with the click to avoid popup blockers).
            // Close animation plays concurrently on the main tab.
            window.open(item.link, '_blank', 'noopener,noreferrer');
            this.closeOpenItem();
            return;
        }

        // Different item — close current and open the new one.
        this.closeOpenItem(() => this.openItemEntry(item));
    }

    setupEventListeners() {
        this.renderer.domElement.addEventListener('mousemove', e => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mousedown', e => { this._downPos = { x: e.clientX, y: e.clientY }; });
        this.renderer.domElement.addEventListener('click',     e => this.onClick(e));
        // Drag ends on mouseup (may land outside the canvas, so listen on window).
        window.addEventListener('mouseup', () => { this._dragging = false; });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.closeOpenItem();
        });
    }

    findItemFromMesh(mesh) {
        for (const itemData of this.items.values()) {
            if (this.isChildOfItem(mesh, itemData.object)) return itemData;
        }
        return null;
    }

    isChildOfItem(mesh, item) {
        let current = mesh;
        while (current) {
            if (current === item) return true;
            current = current.parent;
        }
        return false;
    }
}
