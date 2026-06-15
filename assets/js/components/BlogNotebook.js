import * as THREE from 'three';
import { BOOK_DEFAULTS, BLOG_NOTEBOOK_DEFAULTS } from '../config/constants.js';
import { forwardCameraEvents } from '../utils/LinkOverlay.js';

// A spiral-bound notebook representing the blog link.
// Sits on the shelf leaning at an angle rather than spine-out like books.
// Hovering shows the native browser URL preview via an invisible <a> overlay.
export class BlogNotebook extends THREE.Group {
    constructor(id, { color, link }) {
        super();
        this.bookId = id;
        this.color  = color ?? [77, 98, 89];
        this.link   = link  ?? null;

        this.dimensions = {
            width:     BLOG_NOTEBOOK_DEFAULTS.WIDTH,
            height:    BLOG_NOTEBOOK_DEFAULTS.HEIGHT,
            thickness: BLOG_NOTEBOOK_DEFAULTS.THICKNESS,
        };

        this.isHovered = false;
        this.isOpen    = false;
        this.initialX  = 0;
        this.initialY  = 0;
        this.initialZ  = 0;
        this.initialRotationY = 0;

        this._allMats   = [];
        this._camera    = null;
        this._renderer  = null;
        this._overlayEl = null;
        this._rafId     = null;

        this._buildGeometry();
        this.userData.isBook = true;
        this.userData.bookId = id;
    }

    // Must be called before hover overlays will work.
    setContext(camera, renderer) {
        this._camera   = camera;
        this._renderer = renderer;
    }

    _buildGeometry() {
        const { width, height, thickness } = this.dimensions;
        const [r, g, b] = this.color;

        const frontMat = new THREE.MeshStandardMaterial({
            map: this._buildFrontTexture(), roughness: 0.82, metalness: 0.0,
        });
        const backMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(r / 255 * 0.72, g / 255 * 0.72, b / 255 * 0.72),
            roughness: 0.9,
        });
        // Pages (top/bottom edges) — cream colored, like a stack of paper
        const pageMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.93, 0.91, 0.86), roughness: 0.95,
        });
        const coverEdgeMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(r / 255, g / 255, b / 255), roughness: 0.88,
        });
        this._allMats.push(frontMat, backMat, pageMat, coverEdgeMat);

        // ── Notebook body ──────────────────────────────────────────────────────
        // Face order for BoxGeometry: +X, -X, +Y, -Y, +Z (front), -Z (back)
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, thickness),
            [coverEdgeMat, coverEdgeMat, pageMat, pageMat, frontMat, backMat],
        );
        body.castShadow = body.receiveShadow = true;
        this.add(body);

        // ── Spiral coils along the top edge ───────────────────────────────────
        // Each torus has axis along local X (rotation.y = PI/2 from default axis-Z),
        // so the ring lies in the YZ plane and physically wraps over the top edge
        // from front face to back face. With the notebook angled slightly in Y,
        // the rings appear as ovals — the classic spiral-binding look.
        const coilMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.2, 0.2, 0.2), roughness: 0.25, metalness: 0.85,
        });
        this._allMats.push(coilMat);

        const numCoils = BLOG_NOTEBOOK_DEFAULTS.NUM_COILS;
        const coilR    = BLOG_NOTEBOOK_DEFAULTS.COIL_RADIUS;
        const coilGeo  = new THREE.TorusGeometry(coilR, BLOG_NOTEBOOK_DEFAULTS.COIL_TUBE_RADIUS, 10, 24);

        for (let i = 0; i < numCoils; i++) {
            const coil = new THREE.Mesh(coilGeo, coilMat);
            coil.position.set(
                -width / 2 + (i + 0.5) * (width / numCoils),
                height / 2,
                0,
            );
            coil.rotation.y = Math.PI / 2;
            coil.castShadow = true;
            this.add(coil);
        }
    }

    _buildFrontTexture() {
        // Canvas proportional to notebook face (7.5 × 9.75 → 375 × 488 px)
        const W = 375, H = 488;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        const [r, g, b] = this.color;

        // Base fill
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, W, H);

        // Subtle horizontal ruled lines
        const shade = (v, f) => Math.min(255, Math.round(v * f));
        ctx.strokeStyle = `rgba(${shade(r,0.83)},${shade(g,0.83)},${shade(b,0.83)},0.55)`;
        ctx.lineWidth = 1;
        for (let y = 96; y < H - 16; y += 22) {
            ctx.beginPath(); ctx.moveTo(46, y); ctx.lineTo(W - 18, y); ctx.stroke();
        }

        // Red margin line
        ctx.strokeStyle = 'rgba(210,75,65,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(46, 80); ctx.lineTo(46, H - 18); ctx.stroke();

        // Darker top band (like a composition notebook header)
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(0, 0, W, 64);

        // "PERSONAL BLOG" in top band
        ctx.font = 'bold 15px Georgia, serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PERSONAL BLOG', W / 2, 34);

        // Light label area in center of cover
        const lx = 36, ly = 104, lw = W - 72, lh = 196;
        ctx.fillStyle = 'rgba(255,255,255,0.13)';
        ctx.fillRect(lx, ly, lw, lh);
        ctx.strokeStyle = 'rgba(255,255,255,0.32)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(lx, ly, lw, lh);

        // Choose text color based on cover luminance
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const textDark  = '#1a1a1a';
        const textLight = '#f0ece4';

        ctx.fillStyle = lum > 0.5 ? textDark : textLight;
        ctx.font = 'bold 84px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Blog', W / 2, ly + lh * 0.42);

        ctx.font = '24px Georgia, serif';
        ctx.fillStyle = lum > 0.5 ? '#2a2a2a' : '#ccc';
        ctx.fillText('the.btw.so', W / 2, ly + lh * 0.76);

        return new THREE.CanvasTexture(canvas);
    }

    // ── URL link overlay ──────────────────────────────────────────────────────
    // An invisible <a> element tracks the notebook's screen-space bounding box
    // so the browser shows its native URL preview in the status bar on hover.
    // pointer-events:auto lets clicks navigate directly; mouseleave restores
    // Three.js hover tracking when the cursor exits the notebook area.

    _ensureOverlay() {
        if (this._overlayEl) return;
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;' +
            'pointer-events:none;z-index:10;display:none;';
        document.body.appendChild(el);
        this._overlayEl = el;
        this._overlayResize = () => this._updateOverlay();
    }

    _showOverlay() {
        if (!this._camera || !this._renderer || !this.link) return;
        this._ensureOverlay();

        this._overlayEl.innerHTML = '';
        const a = document.createElement('a');
        a.href   = this.link;
        a.target = '_blank';
        a.rel    = 'noopener noreferrer';
        a.style.cssText = 'position:absolute;display:block;pointer-events:auto;cursor:pointer;';

        // When the cursor leaves the overlay, manually un-hover so InteractionManager
        // stays consistent (the canvas missed those mouse events while overlay was active).
        a.addEventListener('mouseleave', () => {
            this.setHovered(false);
            if (this._renderer) this._renderer.domElement.style.cursor = 'default';
        });

        forwardCameraEvents(a, this._renderer.domElement);

        this._overlayEl.appendChild(a);
        this._overlayEl.style.display = 'block';
        window.addEventListener('resize', this._overlayResize);
        this._startOverlayLoop();
    }

    // rAF loop — keeps overlay aligned while the user orbits during hover.
    _startOverlayLoop() {
        const tick = () => {
            if (!this.isHovered) return;
            this._updateOverlay();
            this._rafId = requestAnimationFrame(tick);
        };
        this._rafId = requestAnimationFrame(tick);
    }

    _updateOverlay() {
        if (!this._overlayEl || this._overlayEl.style.display === 'none') return;
        if (!this._camera || !this._renderer) return;

        const viewport = this._renderer.domElement.getBoundingClientRect();
        const { width, height, thickness } = this.dimensions;

        this.updateWorldMatrix(true, false);

        // Project all 8 corners of the bounding box to screen space.
        const hW = width / 2, hH = height / 2, hT = thickness / 2;
        const screenPts = [
            [-hW, -hH, -hT], [ hW, -hH, -hT],
            [-hW,  hH, -hT], [ hW,  hH, -hT],
            [-hW, -hH,  hT], [ hW, -hH,  hT],
            [-hW,  hH,  hT], [ hW,  hH,  hT],
        ].map(([x, y, z]) => {
            const w = new THREE.Vector3(x, y, z).applyMatrix4(this.matrixWorld);
            const n = w.project(this._camera);
            return {
                x: viewport.left + (n.x + 1) * 0.5 * viewport.width,
                y: viewport.top  + (1 - n.y) * 0.5 * viewport.height,
            };
        });

        const xs = screenPts.map(p => p.x);
        const ys = screenPts.map(p => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);

        const a = this._overlayEl.children[0];
        if (!a) return;
        a.style.left   = `${minX}px`;
        a.style.top    = `${minY}px`;
        a.style.width  = `${maxX - minX}px`;
        a.style.height = `${maxY - minY}px`;
    }

    _hideOverlay() {
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
        if (!this._overlayEl) return;
        this._overlayEl.style.display = 'none';
        this._overlayEl.innerHTML = '';
        window.removeEventListener('resize', this._overlayResize);
    }

    // ── Interaction ───────────────────────────────────────────────────────────

    setHovered(isHovered) {
        if (this.isHovered === isHovered) return;
        this.isHovered = isHovered;

        window.gsap.to(this.position, {
            z:        isHovered ? this.initialZ + BLOG_NOTEBOOK_DEFAULTS.HOVER_Z_OFFSET : this.initialZ,
            duration: BLOG_NOTEBOOK_DEFAULTS.HOVER_DURATION,
            ease:     'power2.out',
        });

        const hex = isHovered
            ? BOOK_DEFAULTS.MATERIAL.HOVER_EMISSIVE
            : BOOK_DEFAULTS.MATERIAL.DEFAULT_EMISSIVE;
        this._allMats.forEach(m => m.emissive?.setHex(hex));

        if (isHovered) this._showOverlay();
        else           this._hideOverlay();
    }

    // Clicking navigates via the link (handled by the overlay <a>, or as a
    // fallback by InteractionManager's clickedBook.link check).
    open()  {}
    close() {}
    getOpenInteractables() { return []; }
}
