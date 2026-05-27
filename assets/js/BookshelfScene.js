import * as THREE from 'three';
import { Book } from './components/Book.js';
import { BlogNotebook } from './components/BlogNotebook.js';
import { BusinessCard } from './components/BusinessCard.js';
import { Shelf } from './components/Shelf.js';
import { SceneManager } from './managers/SceneManager.js';
import { InteractionManager } from './managers/InteractionManager.js';
import { BOOKSHELF_DIMENSIONS, WOOD_MATERIAL } from './config/constants.js';

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
        // Process each shelf
        for (const [shelfId, shelfConfig] of Object.entries(shelfConfigs)) {
            const shelf = this.shelves.get(shelfId);
            if (!shelf) continue;

            // Process each section in the shelf
            for (const [section, bookIds] of Object.entries(shelfConfig.sections)) {
                // Create all books for this section
                const sectionBooks = [];
                
                for (const bookId of bookIds) {
                    // Find book config
                    let bookConfig = null;
                    for (const category of Object.values(bookConfigs)) {
                        if (bookId in category) {
                            bookConfig = category[bookId];
                            break;
                        }
                    }
                    
                    if (bookConfig) {
                        const book = this.createBook(bookId, bookConfig);
                        sectionBooks.push(book);
                    }
                }

                // Add all books in this section at once
                if (sectionBooks.length > 0) {
                    shelf.addBookSection(sectionBooks, parseInt(section));
                }
            }
        }
    }

    // Places the contact BusinessCard at the position defined in its placement config.
    // Positioned manually (not through the shelf system) because BusinessCard faces
    // front (rotation.y=0), unlike books which use rotation.y=PI/2.
    addContactCard(contactConfig) {
        const card = new BusinessCard('contact', contactConfig);

        const { shelfId, section, shelfAngle } = contactConfig.placement;
        const shelf = this.shelves.get(shelfId);
        const shelfSurfaceY = shelf.y + BOOKSHELF_DIMENSIONS.SHELF_THICKNESS / 2;
        // Section center fractions (matches the map in Shelf.addBookSection)
        const sectionFraction = { 1: -0.75, 2: -0.25, 3: 0.25, 4: 0.75 }[section];
        const sectionX = sectionFraction * (BOOKSHELF_DIMENSIONS.WIDTH / 2);

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

    // Places the blog as a leaning spiral notebook tucked into the back-left
    // corner of a shelf — bottom edge on the shelf, top-left corner against the
    // left side wall, top-right corner against the back panel. Tunable values
    // live in the blog entry of contentConfig.js.
    addBlogNotebook(config) {
        const notebook = new BlogNotebook('blog', config);
        notebook.setContext(this.sceneManager.camera, this.sceneManager.renderer);

        const { shelfId, leanBack, swivel, leanLeft, offsetFromLeft, offsetFromBack } = config.placement;

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

    animate() {
        this.sceneManager.animate();
    }
}
