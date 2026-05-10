import * as THREE from 'three';
import { BOOK_DEFAULTS } from '../config/constants.js';

export class Book extends THREE.Group {
    constructor(bookId, {
        width = BOOK_DEFAULTS.WIDTH,
        height = BOOK_DEFAULTS.HEIGHT,
        thickness = BOOK_DEFAULTS.THICKNESS,
        color,
        content
    }) {
        super();
        this.bookId = bookId;
        this.dimensions = { width, height, thickness };
        this.color = color;
        this.content = content;
        this.isHovered = false;
        this.isOpen = false;
        this.initialY = 0;
        this.initialZ = 0;
        this.initialRotationY = 0;

        this.createGeometry();
        this.setupAnimations();
    }

    // Canvas texture for the spine with vertical text
    createSpineTexture() {
        const { thickness, height } = this.dimensions;
        const PIXELS_PER_UNIT = 50;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(32, Math.round(thickness * PIXELS_PER_UNIT));
        canvas.height = Math.max(64, Math.round(height * PIXELS_PER_UNIT));
        const ctx = canvas.getContext('2d');

        const [r, g, b] = this.color;

        // Slightly darker shade for spine background
        const darken = 0.8;
        ctx.fillStyle = `rgb(${Math.round(r*darken)}, ${Math.round(g*darken)}, ${Math.round(b*darken)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        if (this.content) {
            ctx.fillStyle = luminance > 0.45 ? '#111111' : '#f0ece4';
            let fontSize = Math.max(8, Math.floor(canvas.width * 0.72));
            ctx.font = `bold ${fontSize}px Georgia, serif`;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxTextWidth = canvas.height * 0.85;
            while (ctx.measureText(this.content).width > maxTextWidth && fontSize > 6) {
                fontSize -= 1;
                ctx.font = `bold ${fontSize}px Georgia, serif`;
            }
            ctx.fillText(this.content, 0, 0);
            ctx.restore();
        }

        return new THREE.CanvasTexture(canvas);
    }

    // Subtle fabric/cloth grain texture for covers
    createCoverTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const [r, g, b] = this.color;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, 128, 128);

        // Random grain noise
        const imageData = ctx.getImageData(0, 0, 128, 128);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const n = (Math.random() - 0.5) * 24;
            data[i]   = Math.min(255, Math.max(0, data[i]   + n));
            data[i+1] = Math.min(255, Math.max(0, data[i+1] + n));
            data[i+2] = Math.min(255, Math.max(0, data[i+2] + n));
        }
        ctx.putImageData(imageData, 0, 0);

        return new THREE.CanvasTexture(canvas);
    }

    createGeometry() {
        const actualWidth     = this.dimensions.width;
        const actualHeight    = this.dimensions.height;
        const actualThickness = this.dimensions.thickness;
        const coverThickness  = BOOK_DEFAULTS.COVER.THICKNESS;
        const pageInset       = BOOK_DEFAULTS.PAGE.INSET;

        const coverTexture = this.createCoverTexture();

        this.materials = {
            cover: new THREE.MeshStandardMaterial({
                map: coverTexture,
                color: new THREE.Color(`rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`),
                roughness: 0.85,
                metalness: 0.0
            }),
            spine: new THREE.MeshStandardMaterial({
                map: this.createSpineTexture(),
                roughness: 0.85,
                metalness: 0.0
            }),
            pages: new THREE.MeshStandardMaterial({
                color: 0xf5f0e8,
                roughness: 0.95,
                metalness: 0.0
            }),
            // Gold/cream page-edge strip on the right side (pages visible from top/right)
            pageEdge: new THREE.MeshStandardMaterial({
                color: 0xe8dfc0,
                roughness: 0.9,
                metalness: 0.05
            })
        };

        // Geometries
        const coverGeometry = new THREE.BoxGeometry(actualWidth, actualHeight, coverThickness);
        const spineGeometry = new THREE.BoxGeometry(coverThickness, actualHeight, actualThickness);
        const pagesGeometry = new THREE.BoxGeometry(
            actualWidth - pageInset * 2,
            actualHeight - pageInset * 2,
            actualThickness - coverThickness * 2
        );

        // Ry(PI/2) maps local -X → world +Z (toward camera) so the -X face (index 1)
        // of the spine is the viewer-facing face.
        const spineMaterials = [
            this.materials.cover,   // +X
            this.materials.spine,   // -X: viewer-facing after rotation
            this.materials.cover,   // +Y
            this.materials.cover,   // -Y
            this.materials.cover,   // +Z
            this.materials.cover,   // -Z
        ];

        this.parts = {
            frontCover: new THREE.Mesh(coverGeometry, this.materials.cover),
            backCover:  new THREE.Mesh(coverGeometry, this.materials.cover),
            spine:      new THREE.Mesh(spineGeometry, spineMaterials),
            pages:      new THREE.Mesh(pagesGeometry, [
                this.materials.pageEdge,  // +X: right/page-edge side
                this.materials.pages,     // -X
                this.materials.pages,     // +Y top
                this.materials.pages,     // -Y bottom
                this.materials.pages,     // +Z front
                this.materials.pages,     // -Z back
            ])
        };

        // Back cover and spine positions (these don't animate)
        this.parts.backCover.position.set(0, 0, -actualThickness/2 + coverThickness/2);
        this.parts.spine.position.set(-actualWidth/2 + coverThickness/2, 0, 0);
        this.parts.pages.position.set(0, 0, 0);

        // Front cover sits in a pivot group so it rotates around the spine edge
        // Pivot is placed at the spine edge of the front cover in local book space
        this.frontCoverPivot = new THREE.Group();
        this.frontCoverPivot.position.set(
            -actualWidth/2,                      // spine edge (X)
            0,
            actualThickness/2 - coverThickness/2 // same Z as the cover center
        );
        // Offset cover inside the pivot so its spine edge is at the pivot origin
        this.parts.frontCover.position.set(actualWidth/2, 0, 0);
        this.frontCoverPivot.add(this.parts.frontCover);

        const container = new THREE.Group();
        [this.parts.backCover, this.parts.spine, this.parts.pages, this.frontCoverPivot]
            .forEach(part => {
                part.castShadow  = true;
                part.receiveShadow = true;
                if (part.children) part.children.forEach(c => { c.castShadow = true; c.receiveShadow = true; });
                container.add(part);
            });

        this.add(container);
        this.userData.isBook  = true;
        this.userData.bookId  = this.bookId;
    }

    setupAnimations() {
        this.animations = {
            hover: {
                y:        BOOK_DEFAULTS.HOVER.HEIGHT,
                duration: BOOK_DEFAULTS.HOVER.DURATION,
                ease:     BOOK_DEFAULTS.HOVER.EASE
            },
            open: {
                angle:    -Math.PI * 0.5,    // 90° outward — negative opens away from pages, not through them
                duration: BOOK_DEFAULTS.OPEN.DURATION,
                ease:     BOOK_DEFAULTS.OPEN.EASE
            }
        };
    }

    setHovered(isHovered) {
        if (this.isHovered === isHovered) return;
        this.isHovered = isHovered;

        window.gsap.to(this.position, {
            z:        isHovered ? this.initialZ + this.animations.hover.y : this.initialZ,
            duration: this.animations.hover.duration,
            ease:     this.animations.hover.ease
        });

        const emissiveHex = isHovered
            ? BOOK_DEFAULTS.MATERIAL.HOVER_EMISSIVE
            : BOOK_DEFAULTS.MATERIAL.DEFAULT_EMISSIVE;

        Object.values(this.materials).forEach(mat => {
            if (mat && mat.emissive) mat.emissive.setHex(emissiveHex);
        });
    }

    toggleOpen() {
        this.isOpen = !this.isOpen;

        const targetZ = this.isOpen
            ? this.initialZ + this.animations.hover.y + 0.5
            : (this.isHovered ? this.initialZ + this.animations.hover.y : this.initialZ);

        // Pop book out from shelf
        window.gsap.to(this.position, {
            z:        targetZ,
            duration: this.animations.open.duration * 0.4,
            ease:     'power2.out'
        });

        // Rotate whole book to present cover toward viewer (spine at PI/2 → cover at PI/6)
        window.gsap.to(this.rotation, {
            y:        this.isOpen ? this.initialRotationY - Math.PI / 3 : this.initialRotationY,
            duration: this.animations.open.duration,
            ease:     this.animations.open.ease,
            delay:    this.isOpen ? this.animations.open.duration * 0.3 : 0
        });

        // Open front cover outward — negative angle opens away from pages, not through book
        window.gsap.to(this.frontCoverPivot.rotation, {
            y:        this.isOpen ? this.animations.open.angle : 0,
            duration: this.animations.open.duration,
            ease:     this.animations.open.ease,
            delay:    this.isOpen ? this.animations.open.duration * 0.3 : 0
        });

        // Pages fan out slightly as the book opens
        window.gsap.to(this.parts.pages.rotation, {
            y:        this.isOpen ? 0.08 : 0,
            duration: this.animations.open.duration * 0.7,
            ease:     'power2.out',
            delay:    this.isOpen ? this.animations.open.duration * 0.5 : 0
        });
    }

    updateScale(screenWidth) {
        const baseScale = Math.min(1, screenWidth / 1200);
        this.scale.set(baseScale, baseScale, baseScale);
    }
}
