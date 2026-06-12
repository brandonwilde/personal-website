import * as THREE from 'three';

// World position a fixed distance directly in front of the camera, centered in
// its view. Placing an opened item here keeps its on-screen size and framing
// constant no matter how far the camera has been dollied/zoomed from the shelf.
const _dir = new THREE.Vector3();
export function showcasePosition(camera, distance) {
    camera.getWorldDirection(_dir);                 // unit forward vector
    return camera.position.clone().addScaledVector(_dir, distance);
}
