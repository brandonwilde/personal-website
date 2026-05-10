import { ANIM_PARAMS } from '../config/constants.js';

/**
 * Floating animation-controls panel.
 * Toggle with backtick (`) key or the ⚙ button.
 * All changes are written to window.animParams, which Book reads at timeline-build time.
 */
export function initDebugPanel() {
    // Seed the global mutable copy from the exported defaults
    window.animParams = JSON.parse(JSON.stringify(ANIM_PARAMS));
    // coverAngle can't survive JSON round-trip as PI, so restore it
    window.animParams.open.coverAngle = ANIM_PARAMS.open.coverAngle;

    const panel = buildPanel();
    document.body.appendChild(panel);

    // Toggle with backtick
    document.addEventListener('keydown', (e) => {
        if (e.key === '`') togglePanel(panel);
    });
}

function togglePanel(panel) {
    const body = panel.querySelector('#anim-panel-body');
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
}

function buildPanel() {
    const wrap = document.createElement('div');
    wrap.id = 'anim-debug-panel';
    wrap.style.cssText = [
        'position:fixed', 'top:12px', 'right:12px',
        'background:rgba(15,15,20,0.88)', 'color:#e8e4dc',
        'padding:10px 14px 12px', 'border-radius:8px',
        'font:12px/1.5 monospace', 'z-index:99999',
        'min-width:240px', 'box-shadow:0 4px 18px rgba(0,0,0,0.5)',
        'backdrop-filter:blur(4px)',
    ].join(';');

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
    const title = document.createElement('span');
    title.textContent = '⚙ Animation Controls';
    title.style.cssText = 'font-weight:bold;letter-spacing:0.04em;';
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '▾';
    toggleBtn.title = 'Toggle (`)';
    toggleBtn.style.cssText = 'background:none;border:none;color:#aaa;cursor:pointer;font-size:14px;padding:0 2px;';
    toggleBtn.onclick = () => togglePanel(wrap);
    header.appendChild(title);
    header.appendChild(toggleBtn);
    wrap.appendChild(header);

    // Body (hidden by default; user presses ` to open)
    const body = document.createElement('div');
    body.id = 'anim-panel-body';
    body.style.display = 'none';
    wrap.appendChild(body);

    const sliders = [
        { label: 'Open duration (s)',  path: ['open',  'duration'],   min: 0.1, max: 4,   step: 0.05, fmt: v => v.toFixed(2) + 's' },
        { label: 'Close duration (s)', path: ['close', 'duration'],   min: 0.1, max: 4,   step: 0.05, fmt: v => v.toFixed(2) + 's' },
        { label: 'Pull-out (zOut)',    path: ['open',  'zOut'],       min: 1,   max: 80,  step: 0.5,  fmt: v => v.toFixed(1) },
        { label: 'Center Y',          path: ['open',  'showcaseY'],   min: -30, max: 30,  step: 0.5,  fmt: v => v.toFixed(1) },
        { label: 'Cover angle (°)',    path: ['open',  'coverAngle'],  min: 45,  max: 175, step: 1,
          // stored as negative radians; slider works in positive degrees
          get: p => Math.round(Math.abs(p.open.coverAngle) * 180 / Math.PI),
          set: (p, v) => { p.open.coverAngle = -(v * Math.PI / 180); },
          fmt: v => v + '°' },
        { label: 'Hover duration (s)', path: ['hover', 'duration'],   min: 0.05, max: 1,  step: 0.05, fmt: v => v.toFixed(2) + 's' },
        { label: 'Hover Z offset',     path: ['hover', 'zOffset'],    min: 0,   max: 6,   step: 0.1,  fmt: v => v.toFixed(1) },
    ];

    sliders.forEach(cfg => {
        const p = window.animParams;
        const currentVal = cfg.get ? cfg.get(p) : getPath(p, cfg.path);

        const row = document.createElement('div');
        row.style.cssText = 'margin-bottom:7px;';

        const labelRow = document.createElement('div');
        labelRow.style.cssText = 'display:flex;justify-content:space-between;';
        const lbl = document.createElement('span');
        lbl.textContent = cfg.label;
        lbl.style.color = '#bbb';
        const val = document.createElement('span');
        val.style.cssText = 'color:#f0c060;min-width:48px;text-align:right;';
        val.textContent = cfg.fmt(currentVal);

        labelRow.appendChild(lbl);
        labelRow.appendChild(val);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min  = cfg.min;
        slider.max  = cfg.max;
        slider.step = cfg.step;
        slider.value = currentVal;
        slider.style.cssText = 'width:100%;margin-top:2px;accent-color:#f0c060;';

        slider.addEventListener('input', () => {
            const n = parseFloat(slider.value);
            val.textContent = cfg.fmt(n);
            if (cfg.set) {
                cfg.set(window.animParams, n);
            } else {
                setPath(window.animParams, cfg.path, n);
            }
        });

        row.appendChild(labelRow);
        row.appendChild(slider);
        body.appendChild(row);
    });

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset to defaults';
    resetBtn.style.cssText = [
        'margin-top:8px', 'width:100%', 'padding:4px 0',
        'background:#2a2a35', 'border:1px solid #444',
        'border-radius:4px', 'color:#ccc', 'cursor:pointer', 'font:11px monospace',
    ].join(';');
    resetBtn.onclick = () => {
        window.animParams = JSON.parse(JSON.stringify(ANIM_PARAMS));
        window.animParams.open.coverAngle = ANIM_PARAMS.open.coverAngle;
        // Rebuild panel to reflect reset values
        body.remove();
        wrap.remove();
        const newPanel = buildPanel();
        document.body.appendChild(newPanel);
        // Re-open the body so user sees the reset values
        newPanel.querySelector('#anim-panel-body').style.display = 'block';
    };
    body.appendChild(resetBtn);

    return wrap;
}

function getPath(obj, path) {
    return path.reduce((o, k) => o[k], obj);
}

function setPath(obj, path, val) {
    const last = path[path.length - 1];
    const parent = path.slice(0, -1).reduce((o, k) => o[k], obj);
    parent[last] = val;
}
