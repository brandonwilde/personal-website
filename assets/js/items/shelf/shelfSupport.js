import * as THREE from 'three';
import { BOOKSHELF_DIMENSIONS, ROOM, SHELF_SUPPORT as S } from '../../config/constants.js';

// The wooden supports each wall-mounted shelf rests on. The gusset outline is
// drawn once in the support's own plane (u forward from the wall, v down from
// the shelf's underside) and extruded sideways into a plate, then turned to
// stand against the wall — the same trick baseboards.js uses.

let _geometry = null;

// The supports for one shelf, spread evenly across its span. Takes the plank's own
// material so the supports match the shelves they carry.
export function shelfSupports(shelfY, shelfWidth, material) {
    const geometry = supportGeometry();

    const undersideY = shelfY - BOOKSHELF_DIMENSIONS.SHELF_THICKNESS / 2;
    const wallZ      = -BOOKSHELF_DIMENSIONS.DEPTH / 2 - ROOM.WALL_GAP;
    const reach      = shelfWidth / 2 - S.END_INSET;

    const supports = [];
    for (let i = 0; i < S.COUNT; i++) {
        // Single support sits centered; otherwise span end inset to end inset.
        const t = S.COUNT === 1 ? 0.5 : i / (S.COUNT - 1);
        const x = -reach + t * 2 * reach;

        const support = new THREE.Mesh(geometry, material);
        // Extrusion runs toward -x once rotated, so nudge over to center the plate.
        support.position.set(x + S.PLATE / 2, undersideY, wallZ);
        support.rotation.y = -Math.PI / 2;
        support.castShadow = true;
        support.receiveShadow = true;
        supports.push(support);
    }
    return supports;
}

// Support outline, clockwise from the wall/shelf corner: forward along the
// shelf's underside, around the rounded front tip, back along a concave sweep,
// then around the rounded foot and up the wall face. Every corner is eased into
// the next, so the tangents stay continuous and the whole edge reads as one
// curve. The sweep's control point sits at the inner corner — that is what
// pulls it hollow rather than bulging.
function supportGeometry() {
    if (_geometry) return _geometry;

    const R         = S.NOSE_R;
    const sweepEndY = -(S.DROP - S.FOOT_R);

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);                                        // wall / shelf corner
    shape.lineTo(S.ARM - R, 0);                                // forward under the shelf
    shape.quadraticCurveTo(S.ARM, 0, S.ARM, -R);               // round over the nose
    shape.lineTo(S.ARM, -(S.TIP - R));                         // front tip face
    shape.quadraticCurveTo(S.ARM, -S.TIP, S.ARM - R, -S.TIP);  // round under the nose
    shape.quadraticCurveTo(S.STOCK, -S.TIP, S.STOCK, sweepEndY);        // concave sweep
    shape.quadraticCurveTo(S.STOCK, -S.DROP, S.STOCK - S.FOOT_R, -S.DROP);  // round the foot
    shape.lineTo(0, -S.DROP);                                  // underside of the foot
    shape.lineTo(0, 0);                                        // back up the wall face

    _geometry = new THREE.ExtrudeGeometry(shape, {
        depth: S.PLATE,
        bevelEnabled: false,
        curveSegments: S.SEGMENTS,
    });

    // ExtrudeGeometry lays out UVs in shape units (inches), while a plank's
    // BoxGeometry stretches one tile across its whole face. Rescale so the
    // support's grain runs at the same inches-per-tile as the shelves it holds,
    // instead of ~60x finer.
    const uv = _geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) / BOOKSHELF_DIMENSIONS.WIDTH, uv.getY(i) / BOOKSHELF_DIMENSIONS.WIDTH);
    }
    uv.needsUpdate = true;

    return _geometry;
}
