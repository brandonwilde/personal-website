import * as THREE from 'three';
import { LinkOverlay } from '../utils/LinkOverlay.js';

// Base for the shelf's clickable 3D items (books, the business card, the blog
// notebook). Holds the shared interaction state and the HTML link-overlay plumbing;
// subclasses build their own geometry, hover, and open/close behavior.
export class InteractiveItem extends THREE.Group {
    constructor() {
        super();
        this.isHovered = false;
        this.isOpen    = false;
        this.initialX  = 0;
        this.initialY  = 0;
        this.initialZ  = 0;
        this.initialRotationY = 0;
        this._linkHotspots = null;
        this._linkOverlay  = null;
    }

    // Lazily build and show the HTML link overlay for the hotspots this item recorded
    // while painting its page. The projector defers to _projectHotspot(), which each
    // subclass implements for its own page geometry.
    _showLinkOverlay(ctx) {
        if (!this._linkHotspots?.length) return;
        if (!this._linkOverlay) {
            this._linkOverlay = new LinkOverlay(
                (cx, cy, camera, viewport) => this._projectHotspot(cx, cy, camera, viewport)
            );
        }
        this._linkOverlay.show(this._linkHotspots, ctx);
    }

    // Re-project the link hotspots; called each frame while the item is on display so
    // they track the page as the camera moves.
    syncOverlay() {
        this._linkOverlay?.update();
    }

    // Maps a hotspot point (canvas px) to screen px. Overridden by subclasses that
    // surface link overlays.
    _projectHotspot() {
        return { x: 0, y: 0 };
    }

    // Project a world-space point to screen pixels within the renderer's viewport.
    _worldToScreen(world, camera, viewport) {
        const ndc = world.project(camera);
        return {
            x: viewport.left + (ndc.x + 1) * 0.5 * viewport.width,
            y: viewport.top  + (1 - ndc.y) * 0.5 * viewport.height,
        };
    }
}
