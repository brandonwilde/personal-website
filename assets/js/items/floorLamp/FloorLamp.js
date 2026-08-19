import * as THREE from 'three';
import { FLOOR_LAMP, FLOOR_Y } from '../../config/constants.js';
import { shadeTextures } from './floorLampTextures.js';

const L = FLOOR_LAMP;

// A tall brass floor lamp: lathed weighted foot, slender banded pole, a bowed
// harp carrying a tapered linen shade, and a warm bulb that actually lights the
// room. Built with its origin on the floor so every Y in FLOOR_LAMP reads as
// "inches above the carpet". Purely decorative — not registered for interaction.
export class FloorLamp extends THREE.Group {
    constructor() {
        super();
        this.name = 'floorLamp';

        this.metal = new THREE.MeshStandardMaterial({
            color:            new THREE.Color(L.METAL_COLOR),
            roughness:        L.METAL_ROUGHNESS,
            metalness:        L.METAL_METALNESS,
            envMapIntensity:  L.METAL_ENV_INTENSITY,
        });

        this._buildBase();
        this._buildPole();
        this._buildSocket();
        this._buildHarp();
        this._buildShade();
        this._buildLight();

        this.position.set(L.POSITION.x, FLOOR_Y, L.POSITION.z);
        this.rotation.y = L.ROTATION_Y;
    }

    _add(mesh, { cast = true, receive = true } = {}) {
        mesh.castShadow = cast;
        mesh.receiveShadow = receive;
        this.add(mesh);
        return mesh;
    }

    // Weighted foot — a spun dome flowing from the floor up into the pole. The
    // only part low enough to sit inside the key light's shadow frustum, so it
    // carries the lamp's contact shadow on the carpet.
    _buildBase() {
        const r = L.BASE_RADIUS;
        const h = L.BASE_HEIGHT;
        const p = L.POLE_RADIUS;

        const profile = [
            [0,        0],
            [r,        0],
            [r,        0.16 * h],
            [0.93 * r, 0.34 * h],
            [0.60 * r, 0.56 * h],
            [0.28 * r, 0.76 * h],
            [2.4 * p,  0.92 * h],
            [p,        h],
        ];
        this._add(new THREE.Mesh(new THREE.LatheGeometry(smooth(profile), L.BASE_SEGMENTS), this.metal));
    }

    // Pole from the top of the foot to the socket, banded by decorative collars.
    _buildPole() {
        const from = L.BASE_HEIGHT;
        const len  = L.POLE_TOP_Y - from;

        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(L.POLE_RADIUS, L.POLE_RADIUS, len, 24),
            this.metal
        );
        pole.position.y = from + len / 2;
        this._add(pole);

        const collarGeo = new THREE.CylinderGeometry(L.COLLAR_RADIUS, L.COLLAR_RADIUS, L.COLLAR_HEIGHT, 24);
        for (const y of L.COLLAR_YS) {
            const collar = new THREE.Mesh(collarGeo, this.metal);
            collar.position.y = y;
            this._add(collar);
        }
    }

    // Socket housing the bulb, plus the pull chain hanging off it.
    _buildSocket() {
        const socket = new THREE.Mesh(
            new THREE.CylinderGeometry(L.SOCKET_RADIUS, L.SOCKET_RADIUS * 0.8, L.SOCKET_HEIGHT, 24),
            this.metal
        );
        socket.position.y = L.POLE_TOP_Y + L.SOCKET_HEIGHT / 2;
        this._add(socket);

        const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(L.BULB_RADIUS, 24, 16),
            new THREE.MeshStandardMaterial({
                color:             new THREE.Color(L.BULB_COLOR),
                emissive:          new THREE.Color(L.BULB_COLOR),
                emissiveIntensity: L.BULB_EMISSIVE_INTENSITY,
                roughness:         0.4,
            })
        );
        bulb.position.y = L.BULB_Y;
        this._add(bulb, { cast: false, receive: false });

        const chainTop = L.POLE_TOP_Y + L.SOCKET_HEIGHT * 0.6;
        const chain = new THREE.Mesh(
            new THREE.CylinderGeometry(L.CHAIN_RADIUS, L.CHAIN_RADIUS, L.CHAIN_LENGTH, 8),
            this.metal
        );
        chain.position.set(L.CHAIN_OFFSET, chainTop - L.CHAIN_LENGTH / 2, 0);
        this._add(chain, { cast: false });

        const bead = new THREE.Mesh(new THREE.SphereGeometry(L.CHAIN_BEAD_RADIUS, 12, 8), this.metal);
        bead.position.set(L.CHAIN_OFFSET, chainTop - L.CHAIN_LENGTH, 0);
        this._add(bead, { cast: false });
    }

    // Two wires bowing out around the bulb to carry the shade, tied off at a
    // finial on top.
    _buildHarp() {
        const saddle = new THREE.Mesh(
            new THREE.TorusGeometry(L.POLE_RADIUS * 2.2, L.HARP_WIRE_RADIUS * 1.6, 10, 28),
            this.metal
        );
        saddle.rotation.x = Math.PI / 2;
        saddle.position.y = L.HARP_BASE_Y;
        this._add(saddle, { cast: false });

        const span = L.HARP_TOP_Y - L.HARP_BASE_Y;
        for (const s of [-1, 1]) {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(s * L.POLE_RADIUS * 2.0, L.HARP_BASE_Y, 0),
                new THREE.Vector3(s * L.HARP_WIDTH * 0.85, L.HARP_BASE_Y + span * 0.22, 0),
                new THREE.Vector3(s * L.HARP_WIDTH,        L.HARP_BASE_Y + span * 0.55, 0),
                new THREE.Vector3(s * L.HARP_WIDTH * 0.55, L.HARP_BASE_Y + span * 0.88, 0),
                new THREE.Vector3(0,                       L.HARP_TOP_Y, 0),
            ]);
            this._add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, L.HARP_WIRE_RADIUS, 8, false), this.metal), { cast: false });
        }

        const finial = new THREE.Mesh(
            new THREE.LatheGeometry(smooth([
                [0,                    0],
                [L.FINIAL_RADIUS * 0.4, 0.15 * L.FINIAL_RADIUS],
                [L.FINIAL_RADIUS,       0.9 * L.FINIAL_RADIUS],
                [L.FINIAL_RADIUS * 0.7, 1.7 * L.FINIAL_RADIUS],
                [L.FINIAL_RADIUS * 0.25, 2.2 * L.FINIAL_RADIUS],
                [0,                      2.4 * L.FINIAL_RADIUS],
            ]), 24),
            this.metal
        );
        finial.position.y = L.FINIAL_Y;
        this._add(finial, { cast: false });
    }

    // Tapered drum shade in lit linen, rolled rims top and bottom.
    _buildShade() {
        const { linen, glow } = shadeTextures();

        const shade = new THREE.Mesh(
            new THREE.CylinderGeometry(
                L.SHADE_TOP_RADIUS, L.SHADE_BOTTOM_RADIUS, L.SHADE_HEIGHT,
                L.SHADE_SEGMENTS, 1, true
            ),
            new THREE.MeshStandardMaterial({
                map:               linen,
                bumpMap:           linen,
                bumpScale:         L.SHADE_BUMP_SCALE,
                emissive:          new THREE.Color(L.SHADE_EMISSIVE),
                emissiveMap:       glow,
                emissiveIntensity: L.SHADE_EMISSIVE_INTENSITY,
                roughness:         L.SHADE_ROUGHNESS,
                metalness:         0,
                side:              THREE.DoubleSide,
                transparent:       true,
                opacity:           L.SHADE_OPACITY,
            })
        );
        shade.position.y = L.SHADE_BOTTOM_Y + L.SHADE_HEIGHT / 2;
        // No shadow casting: the linen is meant to let the bulb's light through.
        this._add(shade, { cast: false, receive: true });

        const rims = [
            [L.SHADE_BOTTOM_RADIUS, L.SHADE_BOTTOM_Y],
            [L.SHADE_TOP_RADIUS,    L.SHADE_BOTTOM_Y + L.SHADE_HEIGHT],
        ];
        for (const [radius, y] of rims) {
            const rim = new THREE.Mesh(
                new THREE.TorusGeometry(radius, L.TRIM_TUBE_RADIUS, 10, L.SHADE_SEGMENTS),
                this.metal
            );
            rim.rotation.x = Math.PI / 2;
            rim.position.y = y;
            this._add(rim, { cast: false });
        }
    }

    _buildLight() {
        const light = new THREE.PointLight(L.LIGHT_COLOR, L.LIGHT_INTENSITY, L.LIGHT_DISTANCE, L.LIGHT_DECAY);
        light.position.y = L.BULB_Y;
        this.add(light);
        this.light = light;
    }
}

// Runs a spline through a sparse [radius, y] profile so lathed parts read as
// turned metal rather than faceted stacks of cones.
function smooth(points, divisions = 8) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)));
    return curve.getPoints(points.length * divisions)
        .map(p => new THREE.Vector2(Math.max(0, p.x), p.y));
}
