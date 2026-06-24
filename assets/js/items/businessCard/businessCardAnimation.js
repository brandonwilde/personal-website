import * as THREE from 'three';
import { BUSINESS_CARD_DEFAULTS } from '../../config/constants.js';
import { showcasePosition } from '../../utils/showcase.js';
import { localCardCenter } from './businessCardGeometry.js';

// GSAP timelines for the flying card: out of the tray to a showcase pose facing the
// camera (flipping to its contact side), and back down into the holder.

export function buildOpenTimeline(card) {
    const { duration, ease } = card._p().open;
    // Fly the card to a fixed distance in front of the camera, centered in
    // view, so its on-screen size stays constant however far the camera has
    // zoomed from the shelf.
    const cam = card._openCtx?.camera;
    const target = cam
        ? showcasePosition(cam, BUSINESS_CARD_DEFAULTS.SHOWCASE_DISTANCE)
        : new THREE.Vector3(0, 16, 185);
    // Orbit/zoom locus while the card is on display.
    card._showcaseCenter = target.clone();
    const tl = window.gsap.timeline();

    // 1. Card pops up slightly from the stack
    tl.to(card.flyingCard.position, {
        y:        card._flyWorldRestPos.y + 0.6,
        duration: duration * 0.25,
        ease:     'power2.out',
    });

    // 2. Card flies forward to center screen
    tl.to(card.flyingCard.position, {
        x: target.x, y: target.y, z: target.z,
        duration: duration * 0.85,
        ease:     'power2.inOut',
    }, '>-0.05');

    // 3. Card rotates flat to face camera
    tl.to(card.flyingCard.rotation, {
        x: 0, y: 0, z: 0,
        duration: duration * 0.7,
        ease,
    }, '<0.1');

    // 4. Card flips 180° to reveal contact details on the back face
    tl.to(card.flyingCard.rotation, {
        y: Math.PI,
        duration: duration * 0.7,
        ease: 'power2.inOut',
    });

    // 5. Once at rest, drop the invisible HTML link overlay on top and hand
    // the card's center to the camera as its orbit/zoom locus.
    tl.call(() => {
        card._showLinkOverlay(card._openCtx);
        card._openCtx.onShowcased?.(card._showcaseCenter);
    });

    return tl;
}

export function buildCloseTimeline(card) {
    const { duration } = card._p().close;
    const tl = window.gsap.timeline();

    // Remove HTML overlay immediately so links don't intercept clicks
    // during the close animation.
    card._linkOverlay?.hide();

    // 1. Card flips back to front face
    tl.to(card.flyingCard.rotation, {
        y: 0,
        duration: duration * 0.5,
        ease: 'power2.inOut',
    });

    // 2. Card flies back to just above the holder, tilting to lean angle en route
    tl.to(card.flyingCard.position, {
        x: card._flyWorldRestPos.x,
        y: card._flyWorldRestPos.y + 0.6,
        z: card._flyWorldRestPos.z,
        duration: duration * 0.85,
        ease: 'power2.inOut',
    });

    tl.to(card.flyingCard.rotation, {
        x: card._flyWorldRestRot.x,
        y: card._flyWorldRestRot.y,
        z: card._flyWorldRestRot.z,
        duration: duration * 0.7,
        ease: 'power2.inOut',
    }, '<');

    // 3. Card slides down into the holder
    tl.to(card.flyingCard.position, {
        y: card._flyWorldRestPos.y,
        duration: duration * 0.25,
        ease: 'power2.in',
    });

    // Reparent card back into the group
    tl.call(() => {
        if (card._cardInScene) {
            card.add(card.flyingCard);
            const localCenter = localCardCenter(card);
            localCenter.z += BUSINESS_CARD_DEFAULTS.STACK_Z_OFFSET;
            card.flyingCard.position.copy(localCenter);
            card.flyingCard.rotation.set(card.leanAngle, 0, 0);
            card._cardInScene = false;
        }
    });

    return tl;
}
