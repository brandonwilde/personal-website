import * as THREE from 'three';
import { CAMERA_SETTINGS } from '../config/constants.js';

// World position a fixed distance directly in front of the camera, centered in
// its view, so an opened item keeps a constant on-screen size at any zoom.
// On screens narrower than SHOWCASE_BASE_ASPECT it's pushed proportionally
// farther back so it still fits by width (width scales with distance * aspect).
const _dir = new THREE.Vector3();
export function showcasePosition(camera, distance) {
    const factor = Math.max(1, CAMERA_SETTINGS.SHOWCASE_BASE_ASPECT / camera.aspect);
    const d = distance * factor;
    camera.getWorldDirection(_dir);                 // unit forward vector
    return camera.position.clone().addScaledVector(_dir, d);
}

// Yaw that turns a +z-facing object squarely toward the camera. The showcase
// poses used to assume the camera sat head-on at yaw 0; with a default viewing
// angle (CAMERA_SETTINGS.DEFAULT_YAW) they have to follow it around instead.
export function facingYaw(camera, point) {
    return Math.atan2(camera.position.x - point.x, camera.position.z - point.z);
}
