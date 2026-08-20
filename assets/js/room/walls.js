import * as THREE from 'three';
import { ROOM, BOOKSHELF_DIMENSIONS } from '../config/constants.js';

export function addWalls(scene, { wallZ }) {
    const size = ROOM.PLANE_SIZE;

    const wallMat = new THREE.MeshStandardMaterial({
        color:     new THREE.Color(ROOM.WALL_COLOR),
        roughness: ROOM.WALL_ROUGHNESS,
        metalness: 0,
    });

    // Back wall — large enough to fill any view regardless of camera angle.
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(size, size), wallMat);
    backWall.position.set(0, 0, wallZ);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Side walls at ±SIDE_WALL_X, running from the back wall to the camera-side edge.
    const sideDepth = size / 2 - wallZ;
    for (const sign of [-1, 1]) {
        const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(sideDepth, size), wallMat);
        sideWall.rotation.y = -sign * Math.PI / 2;
        sideWall.position.set(sign * ROOM.SIDE_WALL_X, 0, wallZ + sideDepth / 2);
        sideWall.receiveShadow = true;
        scene.add(sideWall);
    }

    // The wall is lit but casts nothing, so shadows carry through it onto the carpet
    // beyond. This plane occludes in its place, writing neither colour nor depth so
    // it stays invisible. DoubleSide is required: a FrontSide material casts from
    // its back face, which the light never sees, and the shadow silently never appears.
    const blocker = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({
            side:       THREE.DoubleSide,
            shadowSide: THREE.DoubleSide,
            colorWrite: false,
            depthWrite: false,
        })
    );
    blocker.position.set(0, 0, wallZ - ROOM.SHADOW_BLOCKER_GAP);
    blocker.castShadow = true;
    scene.add(blocker);

    return { sideDepth };
}
