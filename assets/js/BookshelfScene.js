import * as THREE from 'three';
import { Book } from './components/Book.js';
import { BlogNotebook } from './components/BlogNotebook.js';
import { BusinessCard } from './components/BusinessCard.js';
import { Shelf } from './components/Shelf.js';
import { SceneManager } from './managers/SceneManager.js';
import { InteractionManager } from './managers/InteractionManager.js';
import { BOOKSHELF_DIMENSIONS, WOOD_MATERIAL, colors, sectionCenterX } from './config/constants.js';
import { goodreadsSnapshot } from './data/goodreadsSnapshot.js';
import { fetchRecentReads } from './data/goodreads.js';

export class BookshelfScene {
    constructor() {
        // Initialize managers
        this.sceneManager = new SceneManager();
        this.interactionManager = new InteractionManager(
            this.sceneManager.camera,
            this.sceneManager.renderer,
            {
                onOpen: () => {
                    // Snap camera to the default shelf view so the book always
                    // animates into a known, visible position, then lock controls.
                    this.sceneManager.snapToDefault();
                    this.sceneManager.lockCamera();
                },
                onCloseStart: () => {
                    // Fly camera back to default and unlock when it arrives.
                    this.sceneManager.flyToDefault(() => this.sceneManager.unlockCamera());
                },
            }
        );
        this.sceneManager.interactionManager = this.interactionManager;
        
        // Initialize collections
        this.shelves = new Map();
        this.books = new Map();
        this.setupTextures();
        this.createBookshelf();
    }

    setupTextures() {
        this.textureLoader = new THREE.TextureLoader();
        const woodTex = this.textureLoader.load('assets/textures/wood2.png');
        const woodTexH = this.textureLoader.load('assets/textures/wood2-h-cropped.png');

        woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
        woodTexH.wrapS = woodTexH.wrapT = THREE.RepeatWrapping;

        // Build materials once; share across all frame/shelf meshes
        this.frameMaterial = this.createWoodMaterial(woodTex);
        this.shelfMaterial = this.createWoodMaterial(woodTexH);
    }

    createBookshelf() {
        // Create back panel
        const backPanelGeometry = new THREE.BoxGeometry(
            BOOKSHELF_DIMENSIONS.WIDTH, 
            BOOKSHELF_DIMENSIONS.HEIGHT, 
            BOOKSHELF_DIMENSIONS.FRAME_THICKNESS
        );
        const backPanel = new THREE.Mesh(backPanelGeometry, this.frameMaterial);
        backPanel.position.set(0, 0, -BOOKSHELF_DIMENSIONS.DEPTH/2);
        backPanel.castShadow = true;
        backPanel.receiveShadow = true;
        this.sceneManager.add(backPanel);

        // Create side panels
        const sidePanelGeometry = new THREE.BoxGeometry(
            BOOKSHELF_DIMENSIONS.FRAME_THICKNESS,
            BOOKSHELF_DIMENSIONS.HEIGHT,
            BOOKSHELF_DIMENSIONS.DEPTH
        );

        const leftPanel = new THREE.Mesh(sidePanelGeometry, this.frameMaterial);
        leftPanel.position.set(-BOOKSHELF_DIMENSIONS.WIDTH/2, 0, 0);
        leftPanel.castShadow = true;
        leftPanel.receiveShadow = true;
        this.sceneManager.add(leftPanel);

        const rightPanel = new THREE.Mesh(sidePanelGeometry, this.frameMaterial);
        rightPanel.position.set(BOOKSHELF_DIMENSIONS.WIDTH/2, 0, 0);
        rightPanel.castShadow = true;
        rightPanel.receiveShadow = true;
        this.sceneManager.add(rightPanel);

        // Create shelves
        const numShelves = Math.floor(BOOKSHELF_DIMENSIONS.HEIGHT / BOOKSHELF_DIMENSIONS.SHELF_SPACING);
        for (let i = 0; i <= numShelves; i++) {
            const y = i * BOOKSHELF_DIMENSIONS.SHELF_SPACING - BOOKSHELF_DIMENSIONS.HEIGHT / 2;
            const shelf = new Shelf(String.fromCharCode(65 + i), y, this.shelfMaterial);
            this.sceneManager.add(shelf.mesh);
            this.shelves.set(shelf.id, shelf);
        }
    }

    createWoodMaterial(texture) {
        return new THREE.MeshStandardMaterial({
            map:       texture,
            color:     new THREE.Color(WOOD_MATERIAL.COLOR),
            roughness: WOOD_MATERIAL.ROUGHNESS,
            metalness: WOOD_MATERIAL.METALNESS,
        });
    }

    createBook(id, bookProps) {
        const book = new Book(id, bookProps);
        this.sceneManager.add(book);

        this.interactionManager.registerBook(id, book, {
            title:     bookProps.content   ?? id,
            modalInfo: bookProps.modalInfo ?? null,
            color:     bookProps.color,
            link:      bookProps.link      ?? null,
        });

        this.books.set(id, { object: book });
        return book;
    }

    addBooksFromConfig(bookConfigs, shelfConfigs) {
        // Special items (goodreads, contact, blog) record only their location here,
        // keyed by ref, and are built by their own render methods via placementFor().
        this._placements = {};

        for (const [shelfId, shelfConfig] of Object.entries(shelfConfigs)) {
            const shelf = this.shelves.get(shelfId);
            if (!shelf) continue;

            for (const [section, entry] of Object.entries(shelfConfig.sections ?? {})) {
                if (!Array.isArray(entry)) {
                    this._placements[entry.ref] = { shelfId, section: parseInt(section) };
                    continue;
                }

                const sectionBooks = [];
                for (const bookId of entry) {
                    let bookConfig = null;
                    for (const category of Object.values(bookConfigs)) {
                        if (bookId in category) {
                            bookConfig = category[bookId];
                            break;
                        }
                    }

                    if (bookConfig) {
                        sectionBooks.push(this.createBook(bookId, bookConfig));
                    }
                }

                if (sectionBooks.length > 0) {
                    shelf.addBookSection(sectionBooks, parseInt(section));
                }
            }
        }
    }

    placementFor(ref) {
        return this._placements?.[ref] ?? null;
    }

    // Places the contact BusinessCard at the position defined in its placement config.
    // Positioned manually (not through the shelf system) because BusinessCard faces
    // front (rotation.y=0), unlike books which use rotation.y=PI/2.
    addContactCard(contactConfig) {
        const card = new BusinessCard('contact', contactConfig);

        const { shelfId, section } = this.placementFor('contact');
        const { shelfAngle } = contactConfig.placement;
        const shelf = this.shelves.get(shelfId);
        const shelfSurfaceY = shelf.y + BOOKSHELF_DIMENSIONS.SHELF_THICKNESS / 2;
        const sectionX = sectionCenterX(section);

        card.position.set(sectionX, shelfSurfaceY, 0);
        card.rotation.y = shelfAngle;
        card.initialX = sectionX;
        card.initialY = shelfSurfaceY;
        card.initialZ = 0;
        card.initialRotationY = shelfAngle;

        this.sceneManager.add(card);
        this.interactionManager.registerBook('contact', card, {
            title:     'Contact Info',
            modalInfo: contactConfig.modalInfo ?? null,
            color:     contactConfig.color,
        });
        this.books.set('contact', { object: card });
    }

    // Places the blog as a spiral notebook leaning into a shelf's back-left corner,
    // resting against the shelf, left side wall, and back panel.
    addBlogNotebook(config) {
        const notebook = new BlogNotebook('blog', config);
        notebook.setContext(this.sceneManager.camera, this.sceneManager.renderer);

        const { shelfId } = this.placementFor('blog');
        const { leanBack, swivel, leanLeft, offsetFromLeft, offsetFromBack } = config.placement;

        const shelf = this.shelves.get(shelfId);
        const shelfSurfaceY = shelf.y + BOOKSHELF_DIMENSIONS.SHELF_THICKNESS / 2;

        // Inner faces of the bookcase the notebook leans against
        const leftInnerX = -BOOKSHELF_DIMENSIONS.WIDTH / 2 + BOOKSHELF_DIMENSIONS.FRAME_THICKNESS / 2;
        const backInnerZ = -BOOKSHELF_DIMENSIONS.DEPTH / 2 + BOOKSHELF_DIMENSIONS.FRAME_THICKNESS / 2;

        const posX = leftInnerX + offsetFromLeft;
        const posZ = backInnerZ + offsetFromBack;

        notebook.rotation.set(leanBack, swivel, leanLeft);

        // Auto-compute Y so the lowest corner of the rotated body rests flush on
        // the shelf — keeps the bottom edge planted however the angles are tuned.
        const { width, height, thickness } = notebook.dimensions;
        const q = new THREE.Quaternion().setFromEuler(notebook.rotation);
        let minCornerY = Infinity;
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
            const corner = new THREE.Vector3(sx * width / 2, sy * height / 2, sz * thickness / 2)
                .applyQuaternion(q);
            if (corner.y < minCornerY) minCornerY = corner.y;
        }
        const posY = shelfSurfaceY - minCornerY;

        notebook.position.set(posX, posY, posZ);

        notebook.initialX         = notebook.position.x;
        notebook.initialY         = notebook.position.y;
        notebook.initialZ         = notebook.position.z;
        notebook.initialRotationY = notebook.rotation.y;

        this.sceneManager.add(notebook);
        this.interactionManager.registerBook('blog', notebook, {
            title: 'Blog',
            link:  config.link ?? null,
            color: config.color,
        });
        this.books.set('blog', { object: notebook });
    }

    // Populates a shelf section with one real 3D book per recent Goodreads read. Renders
    // immediately from the committed snapshot (no network wait → no pop-in), then kicks off
    // a background refresh that silently swaps in live data if it has changed.
    addBookReviews(config) {
        this._goodreadsConfig = config;
        this._goodreadsPlacement = this.placementFor('goodreads');
        this._reviewReads = goodreadsSnapshot.slice(0, config.count);
        this._reviewBooks = this._buildReviewBooks(this._reviewReads, config);
        this._refreshReviews(config);
    }

    // Deterministic book color from the title so it's stable across reloads and never waits
    // on the (cross-origin) cover image to decode.
    _hashColor(str) {
        const palette = Object.values(colors);
        let h = 0;
        for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
        return palette[Math.abs(h) % palette.length];
    }

    _buildReviewBooks(reads, config) {
        const { shelfId, section } = this._goodreadsPlacement;
        const shelf = this.shelves.get(shelfId);
        if (!shelf) return [];

        const books = reads.map(read => this.createBook(read.id, {
            color:   this._hashColor(read.title),
            content: read.title,
            modalInfo: {
                kind:            'review',
                author:          read.author,
                rating:          read.rating,
                genres:          read.genres,
                review:          read.review,
                coverImgSrc:     read.coverImgSrc,
                coverImgSrcFull: read.coverImgSrcFull,
            },
        }));

        shelf.addBookSection(books, section);
        return books;
    }

    async _refreshReviews(config) {
        let reads;
        try {
            reads = await fetchRecentReads(config);
        } catch (err) {
            console.warn('[goodreads] live refresh failed — keeping snapshot', err);
            return;
        }
        if (!reads.length) return;

        const signature = list => list.map(r => `${r.title}|${r.rating}|${r.review ? 1 : 0}`).join('~');
        if (signature(reads) === signature(this._reviewReads)) return;   // nothing changed

        this._swapReviewBooks(reads, config);
    }

    // Cross-fades the rendered review books out and the freshly fetched set in. Old books are
    // detached from interaction/registry immediately (freeing their ids in case any persist)
    // and removed from the scene once faded out.
    _swapReviewBooks(reads, config) {
        const shelf = this.shelves.get(this._goodreadsPlacement.shelfId);

        for (const book of this._reviewBooks) {
            this.interactionManager.unregisterBook(book.bookId);
            this.books.delete(book.bookId);
            shelf?.removeBook(book.bookId);
            this._fadeBook(book, 1, 0, () => this.sceneManager.remove(book));
        }

        this._reviewReads = reads;
        const fresh = this._buildReviewBooks(reads, config);
        fresh.forEach(book => this._fadeBook(book, 0, 1));
        this._reviewBooks = fresh;
    }

    _fadeBook(book, from, to, onComplete) {
        const mats = Object.values(book.materials);
        mats.forEach(m => { m.transparent = true; m.opacity = from; });
        const proxy = { o: from };
        window.gsap.to(proxy, {
            o: to,
            duration: 0.5,
            ease: 'power2.inOut',
            onUpdate: () => mats.forEach(m => { m.opacity = proxy.o; }),
            onComplete,
        });
    }

    animate() {
        this.sceneManager.animate();
    }
}
