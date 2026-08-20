import { BOOKSHELF_DIMENSIONS, SHELF_LAYOUT } from '../../config/constants.js';

// Flex-style shelf layout math: distribute groups across a shelf's inner span,
// mirroring CSS justify-content. Tunables (justify mode, edge padding) live in
// SHELF_LAYOUT in config/constants.js.

// X range available for laying out groups on a shelf. The planks are open-ended
// (no side posts), so only the edge padding keeps books back from the drop.
export function shelfInnerSpan() {
  const half = BOOKSHELF_DIMENSIONS.WIDTH / 2 - SHELF_LAYOUT.EDGE_PADDING;
  return { left: -half, right: half };
}

// Distribute items of the given widths across [left, right] and return their
// center X positions, mirroring CSS flex justify-content behavior.
export function flexCenters(widths, left, right, justify = SHELF_LAYOUT.JUSTIFY) {
  const n = widths.length;
  if (n === 0) return [];

  const free = Math.max(0, (right - left) - widths.reduce((a, b) => a + b, 0));

  let lead, gap;
  if (justify === 'space-between') {
    gap = n > 1 ? free / (n - 1) : 0;
    lead = n > 1 ? 0 : free / 2;        // lone item: center it
  } else if (justify === 'space-evenly') {
    gap = lead = free / (n + 1);
  } else {                              // space-around
    gap = free / n;
    lead = gap / 2;
  }

  const centers = [];
  let cursor = left + lead;
  for (let i = 0; i < n; i++) {
    centers.push(cursor + widths[i] / 2);
    cursor += widths[i] + gap;
  }
  return centers;
}
