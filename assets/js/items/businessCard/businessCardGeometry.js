import * as THREE from 'three';
import { BUSINESS_CARD_DEFAULTS } from '../../config/constants.js';
import { buildRestingTexture, buildContactTexture } from './businessCardTextures.js';

// Builds the card holder: the dark metal tray, the static card stack, and the
// flying card (the top card that detaches and presents itself on open).

// Local-space center of a card resting in the tray.
export function localCardCenter(card) {
    const baseTop = 0.12;
    return new THREE.Vector3(
        0,
        baseTop + (card.cardH / 2) * Math.cos(Math.abs(card.leanAngle)),
        -0.4
    );
}

export function buildGeometry(card) {
    // ── Dark metal holder ────────────────────────────────────────────────────
    const holderMat = new THREE.MeshStandardMaterial({
        color:     new THREE.Color(0.12, 0.12, 0.12),
        roughness: 0.35,
        metalness: 0.75,
    });
    card._allMats.push(holderMat);

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(card.cardW + 0.5, 0.12, 2.1),
        holderMat
    );
    base.position.set(0, 0.06, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    card.add(base);

    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(card.cardW + 0.5, 1.4, 0.1),
        holderMat
    );
    backWall.position.set(0, 0.12 + 0.55, -0.95);
    backWall.rotation.x = card.leanAngle;
    backWall.castShadow = true;
    card.add(backWall);

    const frontLip = new THREE.Mesh(
        new THREE.BoxGeometry(card.cardW + 0.5, 0.28, 0.1),
        holderMat
    );
    frontLip.position.set(0, 0.12 + 0.14, 0.95);
    frontLip.castShadow = true;
    card.add(frontLip);

    for (const side of [-1, 1]) {
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.9, 2.1),
            holderMat
        );
        wall.position.set(side * (card.cardW / 2 + 0.3), 0.12 + 0.45, 0);
        wall.castShadow = true;
        card.add(wall);
    }

    // ── Card stack (stays in tray, never moves) ──────────────────────────────
    const stackMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.92, 0.88, 0.82), roughness: 0.9,
    });
    card._allMats.push(stackMat);

    const stack = new THREE.Mesh(
        new THREE.BoxGeometry(card.cardW, card.cardH, 0.3),
        stackMat
    );
    stack.position.copy(localCardCenter(card));
    stack.rotation.x = card.leanAngle;
    stack.castShadow = true;
    card.add(stack);

    // ── Flying card (top card — leaves the tray on click) ────────────────────
    card._restingTex = buildRestingTexture(card);
    card._contactTex = buildContactTexture(card);

    card._faceMat = new THREE.MeshStandardMaterial({
        map: card._restingTex, roughness: 0.85, metalness: 0.0,
    });
    card._backMat = new THREE.MeshStandardMaterial({
        map: card._contactTex, roughness: 0.85, metalness: 0.0,
    });
    const edgeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.89, 0.85, 0.79), roughness: 0.95,
    });
    card._allMats.push(card._faceMat, card._backMat, edgeMat);

    card.flyingCard = new THREE.Mesh(
        new THREE.BoxGeometry(card.cardW, card.cardH, card.cardT),
        [edgeMat, edgeMat, edgeMat, edgeMat, card._faceMat, card._backMat]
        //  +X edge  -X edge  +Y edge  -Y edge  +Z front      -Z back (contact)
    );
    // Sit on top of the stack, slightly in front
    const localCenter = localCardCenter(card);
    localCenter.z += BUSINESS_CARD_DEFAULTS.STACK_Z_OFFSET;
    card.flyingCard.position.copy(localCenter);
    card.flyingCard.rotation.x = card.leanAngle;
    card.flyingCard.castShadow = true;
    card.add(card.flyingCard);
}
