import { NAV_HINTS } from '../config/constants.js';

const NS = 'http://www.w3.org/2000/svg';
let clipIdSeq = 0; // unique ids for per-icon clip paths

/**
 * Small corner guide showing how the left/right mouse buttons drive navigation.
 * Collapses to a mouse-icon button; hover (or click) it to reopen.
 */
export function initNavHints() {
    const C = NAV_HINTS;
    const wrap = document.createElement('div');
    wrap.id = 'nav-hints';
    wrap.style.cssText = [
        'position:fixed', cornerStyles(C.CORNER, C.MARGIN_PX),
        `background:${C.BG}`, `color:${C.TEXT}`,
        'padding:12px 14px', 'border-radius:10px',
        'font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        'z-index:9998', 'max-width:230px',
        'box-shadow:0 6px 22px rgba(0,0,0,0.45)', 'backdrop-filter:blur(5px)',
        'user-select:none', 'transition:opacity 0.25s ease',
    ].join(';');

    wrap.appendChild(buildHeader(C));
    wrap.appendChild(buildBody(C));

    // Starts collapsed to the mouse-icon button; hover the button to reveal the
    // guide, and moving the cursor off the guide collapses it again.
    wrap.style.display = 'none';
    const pill = buildPill(C);

    function expand()   { pill.style.display = 'none'; wrap.style.display = 'block'; }
    function collapse() { wrap.style.display = 'none'; pill.style.display = 'flex'; }

    pill.onmouseenter = expand;
    pill.onclick = expand;
    wrap.onmouseleave = collapse;

    document.body.appendChild(wrap);
    document.body.appendChild(pill);
}

function buildHeader(C) {
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom:9px;';
    const title = document.createElement('span');
    title.textContent = 'Navigation';
    title.style.cssText = 'font-weight:600;letter-spacing:0.03em;';
    header.appendChild(title);
    return header;
}

function buildBody(C) {
    // Each row: a mouse glyph and the [action, result] pairs it covers.
    const rows = [
        ['left',  [['Left-drag', 'orbit'], ['Left-click', 'open']]],
        ['right', [['Right-drag', 'pan']]],
        ['wheel', [['Scroll', 'zoom']]],
    ];
    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex-direction:column;gap:9px;';
    for (const [highlight, descs] of rows) body.appendChild(row(highlight, descs, C));
    return body;
}

// One legend line: mouse icon + its "<action> — <result>" descriptions.
function row(highlight, descs, C) {
    const r = document.createElement('div');
    r.style.cssText = 'display:flex;align-items:center;gap:10px;';
    const icon = mouseIcon(highlight, C);
    icon.style.flex = '0 0 auto';
    r.appendChild(icon);

    const text = document.createElement('div');
    text.style.cssText = 'display:flex;flex-direction:column;gap:1px;';
    for (const [action, result] of descs) text.appendChild(descLine(action, result, C));
    r.appendChild(text);
    return r;
}

function descLine(action, result, C) {
    const line = document.createElement('span');
    const a = document.createElement('span');
    a.textContent = action;
    a.style.cssText = `color:${C.ACCENT};font-weight:600;`;
    const rest = document.createElement('span');
    rest.textContent = ` — ${result}`;
    rest.style.color = C.TEXT;
    line.append(a, rest);
    return line;
}

/**
 * Mouse glyph. `highlight` ∈ 'left' | 'right' | 'wheel' | 'none'.
 * The highlighted button is a filled rectangle clipped to the mouse body so it
 * follows the rounded outline exactly (no stray corners). `scale` sizes it.
 */
function mouseIcon(highlight, C, scale = 1) {
    const w = 22, h = 34;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', w * scale);
    svg.setAttribute('height', h * scale);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    // Body geometry, shared by the outline and the clip region.
    const bx = 2, by = 1, bw = 18, bh = 32, br = 9, midY = by + bh / 2, midX = bx + bw / 2;

    const clipId = `mouse-clip-${clipIdSeq++}`;
    const defs = document.createElementNS(NS, 'defs');
    const clip = document.createElementNS(NS, 'clipPath');
    clip.setAttribute('id', clipId);
    clip.appendChild(roundedRect(bx, by, bw, bh, br));
    defs.appendChild(clip);
    svg.appendChild(defs);

    // Accent fill for a pressed button, clipped to the body silhouette.
    if (highlight === 'left' || highlight === 'right') {
        const fx = highlight === 'left' ? bx : midX;
        const fill = rect(fx, by, bw / 2, bh / 2 - 2, C.ACCENT);
        fill.setAttribute('clip-path', `url(#${clipId})`);
        svg.appendChild(fill);
    }

    // Body outline.
    const body = roundedRect(bx, by, bw, bh, br);
    body.setAttribute('fill', 'none');
    body.setAttribute('stroke', C.TEXT);
    body.setAttribute('stroke-width', '1.5');
    svg.appendChild(body);

    // Button divider + vertical neck line down the top half.
    svg.appendChild(line(midX, by, midX, midY, C.TEXT, 1));

    // Scroll wheel: a little capsule centered on the divider.
    const wheel = roundedRect(midX - 1.5, by + 4, 3, 6, 1.5);
    wheel.setAttribute('fill', highlight === 'wheel' ? C.ACCENT : C.TEXT);
    svg.appendChild(wheel);

    return svg;
}

function buildPill(C) {
    const pill = document.createElement('button');
    pill.id = 'nav-hints-pill';
    pill.title = 'How to navigate';
    pill.style.cssText = [
        'position:fixed', cornerStyles(C.CORNER, C.MARGIN_PX),
        `background:${C.BG}`,
        'width:40px', 'height:40px', 'border-radius:50%', 'border:none',
        'cursor:pointer', 'display:flex',
        'align-items:center', 'justify-content:center',
        'box-shadow:0 6px 22px rgba(0,0,0,0.45)', 'backdrop-filter:blur(5px)',
        'z-index:9998', 'padding:0',
    ].join(';');
    pill.appendChild(mouseIcon('none', C, 0.62));
    return pill;
}

// --- tiny SVG helpers ---

function roundedRect(x, y, w, h, r) {
    const el = document.createElementNS(NS, 'rect');
    el.setAttribute('x', x); el.setAttribute('y', y);
    el.setAttribute('width', w); el.setAttribute('height', h);
    el.setAttribute('rx', r); el.setAttribute('ry', r);
    return el;
}

function rect(x, y, w, h, fill) {
    const el = document.createElementNS(NS, 'rect');
    el.setAttribute('x', x); el.setAttribute('y', y);
    el.setAttribute('width', w); el.setAttribute('height', h);
    el.setAttribute('fill', fill);
    return el;
}

function line(x1, y1, x2, y2, stroke, sw) {
    const el = document.createElementNS(NS, 'line');
    el.setAttribute('x1', x1); el.setAttribute('y1', y1);
    el.setAttribute('x2', x2); el.setAttribute('y2', y2);
    el.setAttribute('stroke', stroke); el.setAttribute('stroke-width', sw);
    return el;
}

function cornerStyles(corner, m) {
    const [v, h] = corner.split('-');
    return `${v}:${m}px;${h}:${m}px`;
}
