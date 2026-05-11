import * as THREE from 'three';
import { Book } from './components/Book.js';
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

    animate() {
        this.sceneManager.animate();
    }
}
