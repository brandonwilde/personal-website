// Floats invisible <a>s over hotspot rects, positioned by projecting each to the screen.
// projectPoint(cx, cy, camera, viewport) => { x, y } maps a hotspot coord to a screen point.
export class LinkOverlay {
    constructor(projectPoint) {
        this._projectPoint = projectPoint;
        this._el = null;
        this._onResize = () => this.update();
    }

    _ensureEl() {
        if (this._el) return;
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;' +
            'pointer-events:none;z-index:10;display:none;';
        document.body.appendChild(el);
        this._el = el;
    }

    // hotspots: [{ url, x0, y0, x1, y1 }].
    show(hotspots, { camera, renderer, onLinkClick } = {}) {
        if (!camera || !renderer || !hotspots?.length) return;
        this._ensureEl();
        this._hotspots = hotspots;
        this._camera   = camera;
        this._renderer = renderer;
        this._el.innerHTML = '';
        for (const h of hotspots) {
            const a = document.createElement('a');
            a.href   = h.url;
            a.target = '_blank';
            a.rel    = 'noopener noreferrer';
            a.style.cssText = 'position:absolute;display:block;pointer-events:auto;cursor:pointer;';
            if (onLinkClick) a.addEventListener('click', onLinkClick);
            this._el.appendChild(a);
        }
        this._el.style.display = 'block';
        window.addEventListener('resize', this._onResize);
        this.update();
    }

    update() {
        if (!this._el || this._el.style.display === 'none') return;
        const viewport = this._renderer.domElement.getBoundingClientRect();
        const links = this._el.children;
        this._hotspots.forEach((h, i) => {
            const tl = this._projectPoint(h.x0, h.y0, this._camera, viewport);
            const br = this._projectPoint(h.x1, h.y1, this._camera, viewport);
            const a = links[i];
            if (!a) return;
            a.style.left   = `${tl.x}px`;
            a.style.top    = `${tl.y}px`;
            a.style.width  = `${br.x - tl.x}px`;
            a.style.height = `${br.y - tl.y}px`;
        });
    }

    hide() {
        if (!this._el) return;
        this._el.style.display = 'none';
        this._el.innerHTML = '';
        window.removeEventListener('resize', this._onResize);
    }
}
