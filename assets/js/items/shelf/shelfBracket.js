import * as THREE from 'three';
import { BOOKSHELF_DIMENSIONS, ROOM, SHELF_BRACKET as B } from '../../config/constants.js';

// The wrought-iron brackets each wall-mounted shelf rests on. The gusset
// outline is drawn once in the bracket's own plane (u forward from the wall,
// v down from the shelf's underside) and extruded sideways into a plate, then
// turned to stand against the wall — the same trick baseboards.js uses.

let _geometry = null;
let _material = null;

// Brackets for one shelf, spread evenly across its span.
export function shelfBrackets(shelfY, shelfWidth) {
    const geometry = bracketGeometry();
    const material = bracketMaterial();

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

// Gusset outline: along the shelf's underside, down the front tip, back along
// the diagonal, then down the wall arm.
function bracketGeometry() {
    if (_geometry) return _geometry;

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);              // wall / shelf corner
    shape.lineTo(B.ARM, 0);          // forward under the shelf
    shape.lineTo(B.ARM, -B.STOCK);   // front tip
    shape.lineTo(B.STOCK, -B.DROP);  // diagonal back down to the wall arm
    shape.lineTo(0, -B.DROP);        // bottom of the wall arm
    shape.lineTo(0, 0);

    _geometry = new THREE.ExtrudeGeometry(shape, { depth: B.PLATE, bevelEnabled: false });
    return _geometry;
}

function bracketMaterial() {
    if (_material) return _material;
    _material = new THREE.MeshStandardMaterial({
        color:           new THREE.Color(B.COLOR),
        roughness:       B.ROUGHNESS,
        metalness:       B.METALNESS,
        envMapIntensity: B.ENV_INTENSITY,
    });
    return _material;
}
