import * as THREE from 'three';
import { FLOOR_HATCH, FLOOR_Y, WALL_Z } from '../../config/constants.js';
import { InteractiveItem } from '../InteractiveItem.js';
import { chalkboardTexture } from './floorHatchTextures.js';

const H = FLOOR_HATCH;
const DEG = Math.PI / 180;

// A steel hatch standing on the carpet behind the back wall. Its origin sits on
// the carpet, so every Y below reads as inches above the pile. The hinge is on the
// far edge, so the raised lid leans away from the viewer instead of over the slate.
export class FloorHatch extends InteractiveItem {
    constructor() {
        super();
        this.name = 'floorHatch';

        this.lidMat = new THREE.MeshStandardMaterial({
            color:     new THREE.Color(H.LID_COLOR),
            metalness: H.METALNESS,
            roughness: H.ROUGHNESS,
        });
        this.rimMat = new THREE.MeshStandardMaterial({
            color:     new THREE.Color(H.RIM_COLOR),
            metalness: H.METALNESS,
            roughness: H.ROUGHNESS,
        });

        this._buildWell();
        this._buildRim();
        this._buildLid();

        this.position.set(H.POSITION_X, FLOOR_Y, WALL_Z - H.GAP_FROM_WALL - H.SIZE / 2);
    }

    _add(parent, mesh, { cast = true, receive = true } = {}) {
        mesh.castShadow = cast;
        mesh.receiveShadow = receive;
        parent.add(mesh);
        return mesh;
    }

    // The well's floor, and the chalked slate lying on it.
    _buildWell() {
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(H.SIZE, H.SIZE),
            new THREE.MeshStandardMaterial({
                color:     new THREE.Color(H.WELL_COLOR),
                metalness: 0.5,
                roughness: 0.8,
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = H.FLOOR_LIFT;
        this._add(this, floor, { cast: false });

        const slate = new THREE.Mesh(
            new THREE.PlaneGeometry(H.SIZE * 0.98, H.SIZE * 0.98),
            new THREE.MeshStandardMaterial({
                map:       chalkboardTexture(),
                roughness: 0.95,
                metalness: 0,
            })
        );
        slate.rotation.x = -Math.PI / 2;
        slate.position.y = H.FLOOR_LIFT + 0.04;
        this._add(this, slate, { cast: false });
    }

    _buildRim() {
        const s = H.SIZE, w = H.RIM_WIDTH, h = H.CURB_HEIGHT;
        const outer = s + w * 2;
        const y = h / 2;

        for (const [sx, sz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            const geo = sx ? new THREE.BoxGeometry(w, h, s) : new THREE.BoxGeometry(outer, h, w);
            const bar = new THREE.Mesh(geo, this.rimMat);
            bar.position.set(sx * (s + w) / 2, y, sz * (s + w) / 2);
            this._add(this, bar);
        }
    }

    _buildLid() {
        const s = H.SIZE, t = H.LID_THICKNESS;

        this.hinge = new THREE.Group();
        this.hinge.position.set(0, H.CURB_HEIGHT - t / 2, -s / 2);
        this.add(this.hinge);

        const lid = new THREE.Mesh(new THREE.BoxGeometry(s, t, s), this.lidMat);
        lid.position.z = s / 2;
        this._add(this.hinge, lid);

        const P = H.HANDLE;
        const handle = new THREE.Mesh(new THREE.BoxGeometry(P.LENGTH, P.HEIGHT, P.WIDTH), this.rimMat);
        handle.position.set(0, t / 2 + P.HEIGHT / 2, s - P.INSET);
        this._add(this.hinge, handle);
    }

    setHovered(isHovered) {
        if (this.isHovered === isHovered) return;
        this.isHovered = isHovered;
        if (this.isOpen) return;

        window.gsap.to(this.hinge.rotation, {
            x:        isHovered ? -H.HOVER_ANGLE * DEG : 0,
            duration: H.HOVER_TIME,
            ease:     'power2.out',
        });
    }

    // Never calls back onShowcased: opening in place leaves whoever found this the
    // vantage point they found it from.
    open() {
        this.isOpen = true;
        window.gsap.to(this.hinge.rotation, {
            x:        -H.OPEN_ANGLE * DEG,
            duration: H.OPEN_TIME,
            ease:     'back.out(1.4)',
        });
    }

    close() {
        this.isOpen = false;
        this.isHovered = false;
        window.gsap.to(this.hinge.rotation, {
            x:        0,
            duration: H.CLOSE_TIME,
            ease:     'power2.inOut',
        });
    }
}
