import * as THREE from 'three';
import { BOOK_DEFAULTS, ANIM_PARAMS } from '../../config/constants.js';
import { InteractiveItem } from '../InteractiveItem.js';
import {
    titleParts,
    createCoverTexture,
    createSpineTexture,
    createTitlePageTexture,
    createLogoFrontMaterial,
    loadCoverImage,
} from './bookTextures.js';
import { createContentPageTexture, computeContentSizing } from './bookContentPage.js';
import { curveSpineGeometry } from './bookGeometry.js';
import { buildOpenTimeline, buildCloseTimeline } from './bookAnimation.js';

// A single 3D book: builds its mesh + textures, handles hover, and orchestrates the
// open/close showcase animation. Texture painting, content-page layout, spine math,
// and the GSAP timelines live in the sibling book/ modules.
export class Book extends InteractiveItem {
    constructor(bookId, {
        width,
        height,
        thickness,
        color,
        content,
        modalInfo = null,
    }) {
        super();
        this.bookId = bookId;
        this.color = color;
        this.content = content;
        this.modalInfo = modalInfo;
        // Spine text: review books show only the main title (pre-colon) so the spine stays
        // legible; every other book keeps its full content on the spine.
        this.spineText = modalInfo?.kind === 'review' ? titleParts(content).main : content;
        this._typeScale = 1;

        // Books with structured content derive their trim size from how much content
        // they hold (fixed readable type → dimensions follow the text, like real
        // publishing). Any dimension pinned in config overrides the computed value.
        // Title-only books (no modalInfo) keep their hand-set config dimensions.
        const computed = this.modalInfo ? computeContentSizing(this) : null;
        this.dimensions = {
            width:     width     ?? computed?.width     ?? BOOK_DEFAULTS.WIDTH,
            height:    height    ?? computed?.height    ?? BOOK_DEFAULTS.HEIGHT,
            thickness: thickness ?? computed?.thickness ?? BOOK_DEFAULTS.THICKNESS,
        };
        if (computed) this._typeScale = computed.typeScale;

        this.createGeometry();
    }

    // ─── Geometry ───────────────────────────────────────────────────────────────

    createGeometry() {
        const actualWidth     = this.dimensions.width;
        const actualHeight    = this.dimensions.height;
        const actualThickness = this.dimensions.thickness;
        const coverThickness  = BOOK_DEFAULTS.COVER.THICKNESS;
        const pageInset       = BOOK_DEFAULTS.PAGE.INSET;

        // +Z face of the pages mesh, for projecting content-page hotspots to screen.
        this._pageFace = {
            w: actualWidth  - pageInset * 2,
            h: actualHeight - pageInset * 2,
            z: (actualThickness - coverThickness * 2) / 2,
        };

        const coverTexture = createCoverTexture(this);

        const M = BOOK_DEFAULTS.MATERIAL;
        this.materials = {
            cover: new THREE.MeshStandardMaterial({
                map:       coverTexture,
                // No `color` here — the texture already has the book color painted in.
                // Setting `color` would multiply against the texture, squaring the values
                // and making the cover significantly darker than the spine.
                roughness: M.COVER_ROUGHNESS,
                metalness: M.COVER_METALNESS,
            }),
            spine: new THREE.MeshStandardMaterial({
                map:       createSpineTexture(this),
                roughness: M.COVER_ROUGHNESS,
                metalness: M.COVER_METALNESS,
            }),
            titlePage: new THREE.MeshStandardMaterial({
                map:       createTitlePageTexture(this),
                roughness: M.COVER_ROUGHNESS,
                metalness: M.COVER_METALNESS,
            }),
            contentPage: new THREE.MeshStandardMaterial({
                map:       createContentPageTexture(this),
                roughness: M.PAGE_ROUGHNESS,
                metalness: M.PAGE_METALNESS,
            }),
            pages: new THREE.MeshStandardMaterial({
                color:     M.PAGE_COLOR,
                roughness: M.PAGE_ROUGHNESS,
                metalness: M.PAGE_METALNESS,
            }),
            pageEdge: new THREE.MeshStandardMaterial({
                color:     M.PAGE_EDGE_COLOR,
                roughness: M.PAGE_EDGE_ROUGHNESS,
                metalness: M.PAGE_EDGE_METALNESS,
            }),
        };

        const coverGeometry = new THREE.BoxGeometry(actualWidth, actualHeight, coverThickness);
        // Subdivide across the thickness (depth) axis so the shell can be bent
        // into a smooth rounded spine; height/width need no extra segments.
        const spineGeometry = new THREE.BoxGeometry(
            coverThickness, actualHeight, actualThickness,
            1, 1, BOOK_DEFAULTS.TEXTURE.SPINE_CURVE_SEGMENTS
        );
        curveSpineGeometry(
            spineGeometry, actualThickness, BOOK_DEFAULTS.TEXTURE.SPINE_CURVE_DEPTH
        );
        const pagesGeometry = new THREE.BoxGeometry(
            actualWidth  - pageInset * 2,
            actualHeight - pageInset * 2,
            actualThickness - coverThickness * 2
        );

        // Ry(PI/2) maps local -X → world +Z (toward camera), so the -X face (index 1)
        // of the spine is the viewer-facing face.
        const spineFaceMaterials = [
            this.materials.cover,  // +X
            this.materials.spine,  // -X: viewer-facing after rotation
            this.materials.cover,  // +Y
            this.materials.cover,  // -Y
            this.materials.cover,  // +Z
            this.materials.cover,  // -Z
        ];

        // Review books show the real Goodreads cover on the front outer face. The
        // procedural cover texture stands in (hash color) until the image loads, so the
        // book is never blank; the spine/back stay procedural to keep the hash color
        // instant and avoid reading pixels off a cross-origin image.
        let frontOuterMat = this.materials.cover;
        if (this.modalInfo?.kind === 'review' && this.modalInfo.coverImgSrcFull) {
            frontOuterMat = new THREE.MeshStandardMaterial({
                map:       coverTexture,
                roughness: M.COVER_ROUGHNESS,
                metalness: M.COVER_METALNESS,
            });
            this.materials.frontArt = frontOuterMat;
            loadCoverImage(frontOuterMat, this.modalInfo.coverImgSrcFull, this.modalInfo.coverImgSrc);
        } else if (this.modalInfo?.logoSrc) {
            // Books with a logo (e.g. a university crest) wear it on the front cover.
            frontOuterMat = createLogoFrontMaterial(
                this, this.modalInfo.logoSrc, actualWidth / actualHeight, this.modalInfo.logoScale);
            this.materials.frontArt = frontOuterMat;
        }

        // Front cover uses per-face materials so the inside (-Z face, index 5) shows
        // the title page when the cover swings open toward the viewer.
        const frontCoverFaceMaterials = [
            this.materials.cover,      // +X
            this.materials.cover,      // -X (spine edge)
            this.materials.cover,      // +Y
            this.materials.cover,      // -Y
            frontOuterMat,             // +Z outer face — real cover art for review books
            this.materials.titlePage,  // -Z inner face — visible when open
        ];

        this.parts = {
            frontCover: new THREE.Mesh(coverGeometry, frontCoverFaceMaterials),
            backCover:  new THREE.Mesh(coverGeometry, this.materials.cover),
            spine:      new THREE.Mesh(spineGeometry, spineFaceMaterials),
            pages:      new THREE.Mesh(pagesGeometry, [
                this.materials.pageEdge,   // +X page-edge strip
                this.materials.pages,      // -X
                this.materials.pages,      // +Y
                this.materials.pages,      // -Y
                this.materials.contentPage,// +Z front face — visible as right page when open
                this.materials.pages,      // -Z
            ])
        };

        this.parts.backCover.position.set(0, 0, -actualThickness/2 + coverThickness/2);
        this.parts.spine.position.set(-actualWidth/2 + coverThickness/2, 0, 0);
        this.parts.pages.position.set(0, 0, 0);

        // Front cover pivots around the spine edge so it opens without clipping pages
        this.frontCoverPivot = new THREE.Group();
        this.frontCoverPivot.position.set(
            -actualWidth/2,
            0,
            actualThickness/2 - coverThickness/2
        );
        this.parts.frontCover.position.set(actualWidth/2, 0, 0);
        this.frontCoverPivot.add(this.parts.frontCover);

        const container = new THREE.Group();
        [this.parts.backCover, this.parts.spine, this.parts.pages, this.frontCoverPivot]
            .forEach(part => {
                part.castShadow    = true;
                part.receiveShadow = true;
                if (part.children) part.children.forEach(c => {
                    c.castShadow    = true;
                    c.receiveShadow = true;
                });
                container.add(part);
            });

        this.add(container);
        this.userData.isBook = true;
        this.userData.bookId = this.bookId;
    }

    // Returns the live params object (debug panel mutations win over defaults).
    _params() {
        return window.animParams || ANIM_PARAMS;
    }

    // ─── Hover ──────────────────────────────────────────────────────────────────

    setHovered(isHovered) {
        if (this.isHovered === isHovered) return;
        this.isHovered = isHovered;

        if (this.isOpen) return;

        if (!(this._activeTl && this._activeTl.isActive())) {
            const { duration, zOffset, ease } = this._params().hover;
            window.gsap.to(this.position, {
                z:        isHovered ? this.initialZ + zOffset : this.initialZ,
                duration,
                ease,
            });
        }

        const emissiveHex = isHovered
            ? BOOK_DEFAULTS.MATERIAL.HOVER_EMISSIVE
            : BOOK_DEFAULTS.MATERIAL.DEFAULT_EMISSIVE;

        Object.values(this.materials).forEach(mat => {
            if (mat?.emissive) mat.emissive.setHex(emissiveHex);
        });
    }

    // ─── HTML link overlay ──────────────────────────────────────────────────────

    // Canvas pixel → screen pixel via the pages mesh's +Z face (the right-hand page).
    _projectHotspot(cx, cy, camera, viewport) {
        this.parts.pages.updateWorldMatrix(true, false);
        const local = new THREE.Vector3(
            (cx / this._contentCanvasW - 0.5) * this._pageFace.w,
            (0.5 - cy / this._contentCanvasH) * this._pageFace.h,
            this._pageFace.z,
        );
        const world = local.applyMatrix4(this.parts.pages.matrixWorld);
        return this._worldToScreen(world, camera, viewport);
    }

    // ─── Open / Close ───────────────────────────────────────────────────────────

    open(ctx = {}) {
        if (this._activeTl) this._activeTl.kill();
        window.gsap.killTweensOf(this.position); // clear any in-flight hover lift
        this.isOpen = true;
        // Clear any hover glow so the open book doesn't look clickable.
        Object.values(this.materials).forEach(mat => {
            if (mat?.emissive) mat.emissive.setHex(BOOK_DEFAULTS.MATERIAL.DEFAULT_EMISSIVE);
        });
        this._openCtx = ctx;
        this._activeTl = buildOpenTimeline(this);
        // Once the book has finished opening and settled: drop the HTML link overlay
        // (e.g. project "Go to Repo" button) and hand its center to the camera so it
        // can become the orbit/zoom locus while on display.
        this._activeTl.call(() => {
            this._showLinkOverlay(this._openCtx);
            this._openCtx.onShowcased?.(this._showcaseCenter);
        });
        return this._activeTl;
    }

    close() {
        if (this._activeTl) this._activeTl.kill();
        window.gsap.killTweensOf(this.position); // clear any in-flight hover lift
        this.isOpen = false;
        // Remove the overlay immediately so its links can't intercept clicks mid-close.
        this._linkOverlay?.hide();
        this._activeTl = buildCloseTimeline(this);
        return this._activeTl;
    }

    toggleOpen() {
        return this.isOpen ? this.close() : this.open();
    }

    // ─── Responsive ─────────────────────────────────────────────────────────────

    updateScale(screenWidth) {
        const baseScale = Math.min(1, screenWidth / BOOK_DEFAULTS.SCALE_BASE_WIDTH);
        this.scale.set(baseScale, baseScale, baseScale);
    }
}
