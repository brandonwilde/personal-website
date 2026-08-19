import * as THREE from 'three';
import { BOOKSHELF_DIMENSIONS, ROOM, SHELF_BRACKET as B } from '../../config/constants.js';

// The wooden brackets each wall-mounted shelf rests on. The gusset outline is
// drawn once in the bracket's own plane (u forward from the wall, v down from
// the shelf's underside) and extruded sideways into a plate, then turned to
// stand against the wall — the same trick baseboards.js uses.

let _geometry = null;

// Brackets for one shelf, spread evenly across its span. Takes the plank's own
// material so the supports match the shelves they carry.
export function shelfBrackets(shelfY, shelfWidth, material) {
    const geometry = bracketGeometry();

    const undersideY = shelfY - BOOKSHELF_DIMENSIONS.SHELF_THICKNESS / 2;
    const wallZ      = -BOOKSHELF_DIMENSIONS.DEPTH / 2 - ROOM.WALL_GAP;
    const reach      = shelfWidth / 2 - B.END_INSET;

    const brackets = [];
    for (let i = 0; i < B.COUNT; i++) {
        // Single bracket sits centered; otherwise span end inset to end inset.
        const t = B.COUNT === 1 ? 0.5 : i / (B.COUNT - 1);
        const x = -reach + t * 2 * reach;

        const bracket = new THREE.Mesh(geometry, material);
        // Extrusion runs toward -x once rotated, so nudge over to center the plate.
        bracket.position.set(x + B.PLATE / 2, undersideY, wallZ);
        bracket.rotation.y = -Math.PI / 2;
        bracket.castShadow = true;
        bracket.receiveShadow = true;
        brackets.push(bracket);
    }
    return brackets;
}

// Corbel outline, clockwise from the wall/shelf corner: forward along the
// shelf's underside, around the rounded front tip, back along a concave sweep,
// then around the rounded foot and up the wall face. Every corner is eased into
// the next, so the tangents stay continuous and the whole edge reads as one
// curve. The sweep's control point sits at the inner corner — that is what
// pulls it hollow rather than bulging.
function bracketGeometry() {
    if (_geometry) return _geometry;

    const R         = B.NOSE_R;
    const sweepEndY = -(B.DROP - B.FOOT_R);

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);                                        // wall / shelf corner
    shape.lineTo(B.ARM - R, 0);                                // forward under the shelf
    shape.quadraticCurveTo(B.ARM, 0, B.ARM, -R);               // round over the nose
    shape.lineTo(B.ARM, -(B.TIP - R));                         // front tip face
    shape.quadraticCurveTo(B.ARM, -B.TIP, B.ARM - R, -B.TIP);  // round under the nose
    shape.quadraticCurveTo(B.STOCK, -B.TIP, B.STOCK, sweepEndY);        // concave sweep
    shape.quadraticCurveTo(B.STOCK, -B.DROP, B.STOCK - B.FOOT_R, -B.DROP);  // round the foot
    shape.lineTo(0, -B.DROP);                                  // underside of the foot
    shape.lineTo(0, 0);                                        // back up the wall face

    _geometry = new THREE.ExtrudeGeometry(shape, {
        depth: B.PLATE,
        bevelEnabled: false,
        curveSegments: B.SEGMENTS,
    });

    // ExtrudeGeometry lays out UVs in shape units (inches), while a plank's
    // BoxGeometry stretches one tile across its whole face. Rescale so the
    // bracket's grain runs at the same inches-per-tile as the shelves it holds,
    // instead of ~60x finer.
    const uv = _geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) / BOOKSHELF_DIMENSIONS.WIDTH, uv.getY(i) / BOOKSHELF_DIMENSIONS.WIDTH);
    }
    uv.needsUpdate = true;

    return _geometry;
}
