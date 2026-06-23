import * as THREE from 'three';
import { ROOM } from '../config/constants.js';

export function addBaseboards(scene, { wallZ, floorY, sideDepth }) {
    const size = ROOM.PLANE_SIZE;
    const h    = ROOM.BASEBOARD_HEIGHT;
    const d    = ROOM.BASEBOARD_DEPTH;
    const sink = ROOM.BASEBOARD_SINK;

    // Moulded white trim profile: riser → bullnose → cove.
    const profile = new THREE.Shape();
    profile.moveTo(0, -sink);
    profile.lineTo(d, -sink);
    profile.lineTo(d, h * 0.5);
    profile.quadraticCurveTo(d, h * 0.74, d * 0.55, h * 0.8);  // bullnose
    profile.quadraticCurveTo(d * 0.12, h * 0.86, d * 0.12, h); // cove
    profile.lineTo(0, h);
    profile.lineTo(0, -sink);

    const mat = new THREE.MeshStandardMaterial({
        color:     new THREE.Color(ROOM.BASEBOARD_COLOR),
        roughness: ROOM.BASEBOARD_ROUGHNESS,
        metalness: 0,
    });

    // Back wall: extruded profile runs along X, faces +Z.
    const backGeo = new THREE.ExtrudeGeometry(profile, { depth: size, bevelEnabled: false, curveSegments: 24 });
    const backBB  = new THREE.Mesh(backGeo, mat);
    backBB.rotation.y = -Math.PI / 2;
    backBB.position.set(size / 2, floorY, wallZ);
    backBB.castShadow = true;
    backBB.receiveShadow = true;
    scene.add(backBB);

    // Side walls: flat planes that cull naturally when the camera passes through.
    const sideMat = new THREE.MeshStandardMaterial({
        color:     new THREE.Color(ROOM.BASEBOARD_COLOR),
        roughness: ROOM.BASEBOARD_ROUGHNESS,
        metalness: 0,
    });
    for (const sign of [-1, 1]) {
        const bb = new THREE.Mesh(new THREE.PlaneGeometry(sideDepth, h + sink), sideMat);
        bb.rotation.y = -sign * Math.PI / 2;
        bb.position.set(
            sign * (ROOM.SIDE_WALL_X - d),
            floorY + (h - sink) / 2,
            wallZ + sideDepth / 2
        );
        bb.castShadow = true;
        bb.receiveShadow = true;
        scene.add(bb);
    }
}
