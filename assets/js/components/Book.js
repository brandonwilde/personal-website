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

        this.createGeometry();
        this.setupAnimations();
    }

    createSpineTexture() {
        const { thickness, height } = this.dimensions;
        const PIXELS_PER_UNIT = 50;

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(32, Math.round(thickness * PIXELS_PER_UNIT));
        canvas.height = Math.max(64, Math.round(height * PIXELS_PER_UNIT));
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (this.content) {
            const [r, g, b] = this.color;
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            ctx.fillStyle = luminance > 0.45 ? '#1a1a1a' : '#f0ece4';

            let fontSize = Math.max(8, Math.floor(canvas.width * 0.78));
            ctx.font = `bold ${fontSize}px Georgia, serif`;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Shrink font until text fits within the spine height dimension
            const maxTextWidth = canvas.height * 0.88;
            while (ctx.measureText(this.content).width > maxTextWidth && fontSize > 6) {
                fontSize -= 1;
                ctx.font = `bold ${fontSize}px Georgia, serif`;
            }

            ctx.fillText(this.content, 0, 0);
            ctx.restore();
        }

        return new THREE.CanvasTexture(canvas);
    }

    createGeometry() {
        const actualWidth = this.dimensions.width;
        const actualHeight = this.dimensions.height;
        const actualThickness = this.dimensions.thickness;

        const coverThickness = BOOK_DEFAULTS.COVER.THICKNESS;
        const pageInset = BOOK_DEFAULTS.PAGE.INSET;

        this.materials = {
            cover: new THREE.MeshStandardMaterial({
                color: new THREE.Color(`rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`),
                roughness: BOOK_DEFAULTS.MATERIAL.ROUGHNESS,
                metalness: BOOK_DEFAULTS.MATERIAL.METALNESS
            }),
            spine: new THREE.MeshStandardMaterial({
                map: this.createSpineTexture(),
                roughness: BOOK_DEFAULTS.MATERIAL.ROUGHNESS,
                metalness: BOOK_DEFAULTS.MATERIAL.METALNESS
            }),
            pages: new THREE.MeshStandardMaterial({
                color: BOOK_DEFAULTS.MATERIAL.PAGE_COLOR,
                roughness: BOOK_DEFAULTS.MATERIAL.ROUGHNESS,
                metalness: BOOK_DEFAULTS.MATERIAL.METALNESS
            })
        };

        const coverGeometry = new THREE.BoxGeometry(actualWidth, actualHeight, coverThickness);
        const spineGeometry = new THREE.BoxGeometry(coverThickness, actualHeight, actualThickness);
        const pagesGeometry = new THREE.BoxGeometry(
            actualWidth - pageInset * 2,
            actualHeight - pageInset * 2,
            actualThickness - coverThickness * 2
        );

        // Ry(PI/2) maps local -X → world +Z (toward camera), so the -X face (index 1)
        // is the viewer-facing face of the spine after the book Group is rotated PI/2 around Y.
        const spineMaterials = [
            this.materials.cover,  // +X
            this.materials.spine,  // -X: faces viewer after rotation
            this.materials.cover,  // +Y top
            this.materials.cover,  // -Y bottom
            this.materials.cover,  // +Z
            this.materials.cover,  // -Z
        ];

        this.parts = {
            frontCover: new THREE.Mesh(coverGeometry, this.materials.cover),
            backCover:  new THREE.Mesh(coverGeometry, this.materials.cover),
            spine:      new THREE.Mesh(spineGeometry, spineMaterials),
            pages:      new THREE.Mesh(pagesGeometry, this.materials.pages)
        };

        this.parts.frontCover.position.set(0, 0,  actualThickness/2 - coverThickness/2);
        this.parts.backCover.position.set( 0, 0, -actualThickness/2 + coverThickness/2);
        this.parts.spine.position.set(-actualWidth/2 + coverThickness/2, 0, 0);
        this.parts.pages.position.set(0, 0, 0);

        const container = new THREE.Group();
        Object.values(this.parts).forEach(part => {
            part.castShadow = true;
            part.receiveShadow = true;
            container.add(part);
        });
        this.add(container);

        this.userData.isBook = true;
        this.userData.bookId = this.bookId;
    }

    setupAnimations() {
        this.animations = {
            hover: {
                y:        BOOK_DEFAULTS.HOVER.HEIGHT,
                duration: BOOK_DEFAULTS.HOVER.DURATION,
                ease:     BOOK_DEFAULTS.HOVER.EASE
            },
            open: {
                rotateY:  BOOK_DEFAULTS.OPEN.ANGLE,
                duration: BOOK_DEFAULTS.OPEN.DURATION,
                ease:     BOOK_DEFAULTS.OPEN.EASE
            }
        };
    }

    setHovered(isHovered) {
        if (this.isHovered === isHovered) return;
        this.isHovered = isHovered;

        window.gsap.to(this.position, {
            y:        isHovered ? this.initialY + this.animations.hover.y : this.initialY,
            duration: this.animations.hover.duration,
            ease:     this.animations.hover.ease
        });

        const emissiveHex = isHovered
            ? BOOK_DEFAULTS.MATERIAL.HOVER_EMISSIVE
            : BOOK_DEFAULTS.MATERIAL.DEFAULT_EMISSIVE;

        Object.values(this.parts).forEach(part => {
            const mats = Array.isArray(part.material) ? part.material : [part.material];
            mats.forEach(mat => {
                if (mat && mat.emissive) mat.emissive.setHex(emissiveHex);
            });
        });
    }

    toggleOpen() {
        this.isOpen = !this.isOpen;
        window.gsap.to([this.parts.frontCover.rotation, this.parts.pages.rotation], {
            y:        this.isOpen ? this.animations.open.rotateY : 0,
            duration: this.animations.open.duration,
            ease:     this.animations.open.ease
        });
    }

    updateScale(screenWidth) {
        const baseScale = Math.min(1, screenWidth / 1200);
        this.scale.set(baseScale, baseScale, baseScale);
    }
}
