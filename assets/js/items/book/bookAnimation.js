import * as THREE from 'three';
import { showcasePosition } from '../../utils/showcase.js';

// GSAP timelines that fly a book from the shelf to its showcase pose and back.
// Both read the live animation params via book._params() and tween the book's
// position/rotation, front-cover pivot, and page fan.

export function buildOpenTimeline(book) {
    const p = book._params();
    const { duration, zOut, showcaseY, coverAngle, bookRotation, ease,
            pageFanAngle, pullOffDist, moveMult, rotateMult, coverOpenMult, pageFanMult,
            rotateOverlap, coverDelay, pageFanOffset } = p.open;
    const tl = window.gsap.timeline();

    // Showcase target: a fixed distance in front of the camera (zOut), centered
    // in view, so the open book fills the frame the same however far the camera
    // has zoomed from the shelf. showcaseY is an optional vertical nudge.
    const cam = book._openCtx?.camera;
    const s = cam
        ? showcasePosition(cam, zOut)
        : new THREE.Vector3(0, showcaseY, book.initialZ + zOut);
    const showcase = { x: cam ? s.x : 0, y: s.y + (cam ? showcaseY : 0), z: s.z };
    // Visual center of the open spread (the book drifts by centeredX below so its
    // midpoint lands here) — used as the orbit target while the book is on display.
    book._showcaseCenter = new THREE.Vector3(showcase.x, showcase.y, showcase.z);

    // 1. Glide from the shelf to the showcase along a quadratic Bézier curve. The
    // control point sits straight off the shelf (+z) so the book leaves moving
    // forward, then smoothly curves toward the showcase — one continuous arc with
    // no velocity kink. start/control are captured at run time to respect any hover.
    const start = new THREE.Vector3();
    const ctrl  = new THREE.Vector3();
    const end   = new THREE.Vector3(showcase.x, showcase.y, showcase.z);
    const pt    = new THREE.Vector3();
    const proxy = { t: 0 };
    tl.to(proxy, {
        t:        1,
        duration: duration * moveMult,
        ease:     'power2.inOut',
        onStart: () => {
            start.copy(book.position);
            ctrl.copy(start).z += pullOffDist;
        },
        onUpdate: () => {
            const t = proxy.t, u = 1 - t;
            pt.copy(start).multiplyScalar(u * u)
              .addScaledVector(ctrl, 2 * u * t)
              .addScaledVector(end,  t * t);
            book.position.copy(pt);
        }
    });

    // 2. Rotate so front cover faces viewer
    tl.to(book.rotation, {
        y:        bookRotation,
        duration: duration * rotateMult,
        ease
    }, `>-${rotateOverlap}`);

    // 3. Open the front cover, and simultaneously drift right so the open spread
    // stays visually centered. When fully open the cover's free edge lands at
    // x = -w/2 + w·cos(coverAngle) relative to the book, so the spread midpoint
    // is w/2·cos(coverAngle) to the left of position — negate to re-center.
    const centeredX = -book.dimensions.width / 2 * Math.cos(coverAngle);
    tl.to(book.frontCoverPivot.rotation, {
        y:        coverAngle,
        duration: duration * coverOpenMult,
        ease
    }, `>-${coverDelay}`);
    tl.to(book.position, {
        x:        showcase.x + centeredX,
        duration: duration * coverOpenMult,
        ease
    }, `<`);

    // 4. Pages fan out gently as cover opens
    tl.to(book.parts.pages.rotation, {
        y:        pageFanAngle,
        duration: duration * pageFanMult,
        ease:     'power2.out'
    }, `<${pageFanOffset}`);

    return tl;
}

export function buildCloseTimeline(book) {
    const p = book._params();
    const { duration, pageSettleMult, coverCloseMult, rotateMult, moveMult,
            rotateOverlap } = p.close;
    const { ease, pullOffDist } = p.open;
    const targetZ = book.isHovered
        ? book.initialZ + p.hover.zOffset
        : book.initialZ;
    const tl = window.gsap.timeline();

    // 1. Pages settle and cover begins closing
    tl.to(book.parts.pages.rotation, {
        y:        0,
        duration: duration * pageSettleMult,
        ease:     'power2.in'
    });

    tl.to(book.frontCoverPivot.rotation, {
        y:        0,
        duration: duration * coverCloseMult,
        ease
    }, '<');

    // 2. Rotate book back to shelf orientation
    tl.to(book.rotation, {
        y:        book.initialRotationY,
        duration: duration * rotateMult,
        ease
    }, `>-${rotateOverlap}`);

    // 3. Glide back to the shelf along the same quadratic Bézier as opening, in
    // reverse: the control point sits straight off the shelf (+z) so the book
    // arrives sliding straight into its slot. start is captured at run time.
    const start = new THREE.Vector3();
    const end   = new THREE.Vector3(book.initialX, book.initialY, targetZ);
    const ctrl  = end.clone();
    ctrl.z += pullOffDist;
    const pt    = new THREE.Vector3();
    const proxy = { t: 0 };
    tl.to(proxy, {
        t:        1,
        duration: duration * moveMult,
        ease:     'power2.inOut',
        onStart: () => { start.copy(book.position); },
        onUpdate: () => {
            const t = proxy.t, u = 1 - t;
            pt.copy(start).multiplyScalar(u * u)
              .addScaledVector(ctrl, 2 * u * t)
              .addScaledVector(end,  t * t);
            book.position.copy(pt);
        }
    }, `>-${rotateOverlap}`);

    return tl;
}
