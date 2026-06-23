import * as THREE from 'three';
import { ROOM, CARPET } from '../config/constants.js';
import { carpetTexture } from './carpet.js';

export function addFloor(scene, { floorY }) {
    const size   = ROOM.PLANE_SIZE;
    const carpet = carpetTexture();
    const normalScale = new THREE.Vector2(CARPET.NORMAL_SCALE, CARPET.NORMAL_SCALE);
    const half   = CARPET.DISPLACEMENT_SCALE / 2;

    // Flat far floor: fills the whole view cheaply.
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshStandardMaterial({
            map:         carpet.map,
            normalMap:   carpet.normalMap,
            normalScale: normalScale,
            roughness:   ROOM.FLOOR_ROUGHNESS,
            metalness:   0,
        })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, floorY - half - 0.05, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Near patch: subdivided geometry displaced into real pile topography.
    const density     = CARPET.REPEAT / size;
    const patchRepeat = density * CARPET.PATCH_SIZE;
    const pMap    = carpet.map.clone();
    const pNormal = carpet.normalMap.clone();
    for (const tex of [pMap, pNormal, carpet.displacementMap]) {
        tex.repeat.set(patchRepeat, patchRepeat);
        tex.needsUpdate = true;
    }
    const patch = new THREE.Mesh(
        new THREE.PlaneGeometry(CARPET.PATCH_SIZE, CARPET.PATCH_SIZE, CARPET.PATCH_SEGMENTS, CARPET.PATCH_SEGMENTS),
        new THREE.MeshStandardMaterial({
            map:               pMap,
            normalMap:         pNormal,
            normalScale:       normalScale,
            displacementMap:   carpet.displacementMap,
            displacementScale: CARPET.DISPLACEMENT_SCALE,
            displacementBias:  -half,
            roughness:         ROOM.FLOOR_ROUGHNESS,
            metalness:         0,
        })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(0, floorY, 0);
    patch.receiveShadow = true;
    scene.add(patch);
}
