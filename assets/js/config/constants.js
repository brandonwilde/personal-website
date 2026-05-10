// Colors in RGB format
export const colors = {
  red: [98, 55, 55],
  // lightRed: [162, 80, 74],
  // brightRed: [89, 14, 23],
  tan: [140, 123, 109],
  brown: [72, 56, 50],
  yellow: [162, 128, 27],
  yellowGreen: [106, 99, 69],
  green: [77, 98, 89],
  // aqua: [68, 97, 111],
  blue: [74, 104, 162],
  purple: [80, 68, 111],
  white: [147, 147, 147],
  gray: [115, 115, 115],
  black: [64, 64, 64],
};

// Scene background color in hex
export const SCENE_BACKGROUND = 0xf7f3e9;

// Lighting settings
export const LIGHTING_SETTINGS = {
  // Warm ambient — simulates bounced room light
  AMBIENT_COLOR:     0xfff0d0,
  AMBIENT_INTENSITY: 0.6,

  // Key light — centered overhead to avoid diagonal shelf shadows
  KEY_COLOR:         0xfff5e0,
  KEY_INTENSITY:     1.6,
  KEY_POSITION:      { x: 0, y: 80, z: 30 },

  // Shadow frustum — kept tight around the shelf to maximise shadow resolution
  SHADOW_MAP_SIZE:   2048,
  SHADOW_FAR:        300,
  SHADOW_LEFT:       -40,
  SHADOW_RIGHT:       40,
  SHADOW_TOP:         30,
  SHADOW_BOTTOM:     -30,
  SHADOW_BIAS:       -0.001,
  SHADOW_RADIUS:      3,

  // Cool fill from opposite side
  FILL_COLOR:        0xd0e8ff,
  FILL_INTENSITY:    0.4,
  FILL_POSITION:     { x: -40, y: 30, z: -30 },

  // Warm sconce-style point lights flanking the shelf
  SCONCE_COLOR:      0xffa060,
  SCONCE_INTENSITY:  2.5,
  SCONCE_DISTANCE:   80,
  SCONCE_X:          30,   // mirrored to ±X
  SCONCE_Y:          28,
  SCONCE_Z:          18,

  TONE_MAPPING_EXPOSURE: 1.1,
};

// Bookshelf dimensions in inches
export const BOOKSHELF_DIMENSIONS = {
  WIDTH: 60,           // 5 feet
  HEIGHT: 36,          // 3 feet
  DEPTH: 7.2,         // 7.2 inches
  BASE_DISTANCE: 240,  // 20 feet - camera distance
  FRAME_THICKNESS: 1.2,// 1.2 inches
  SHELF_THICKNESS: 1,  // 1 inch
  SHELF_SPACING: 12,   // 1 foot between shelves
  SECTION_WIDTH: 12,   // 1 foot per section
};

// Wood material for bookshelf frame and shelves
export const WOOD_MATERIAL = {
  COLOR:     0xc8a87a,
  ROUGHNESS: 0.85,
  METALNESS: 0.0,
};

// Camera settings
export const CAMERA_SETTINGS = {
  FOV: 10,
  NEAR: 1.2,
  FAR: 12000,
};

// Book default properties
export const BOOK_DEFAULTS = {
  // Standard book dimensions in inches
  WIDTH: 6,        // 6 inches
  HEIGHT: 9.6,     // 9.6 inches
  THICKNESS: 1.2,  // 1.2 inches

  // Cover properties
  COVER: {
    THICKNESS: 0.24,  // Cover thickness in inches
  },
  
  // Page properties
  PAGE: {
    INSET: 0.18,    // How far pages are inset from cover edge
  },
  
  // Material settings
  MATERIAL: {
    HOVER_EMISSIVE:   0x333333,
    DEFAULT_EMISSIVE: 0x000000,
    COVER_ROUGHNESS:  0.85,
    COVER_METALNESS:  0.0,
    PAGE_COLOR:       0xf5f0e8,
    PAGE_ROUGHNESS:   0.95,
    PAGE_METALNESS:   0.0,
    PAGE_EDGE_COLOR:  0xe8dfc0,
    PAGE_EDGE_ROUGHNESS: 0.9,
    PAGE_EDGE_METALNESS: 0.05,
  }
};

// All animation parameters — the single source of truth for book animations.
// Mutated at runtime by the debug panel; Book reads via _params() each timeline build.
export const ANIM_PARAMS = {
    open: {
        duration:     0.8,            // base seconds; individual steps are multiples of this
        zOut:         10,             // units pulled forward from the shelf
        showcaseY:    0,              // world-Y the book centers on when open
        coverAngle:   -Math.PI * 0.9, // radians the cover swings open (~162°)
        bookRotation: 0,              // rotation.y when open; 0 = front cover faces viewer
        ease:         "power2.inOut",
    },
    close: {
        duration:  0.7,   // base seconds for close
        openDelay: 0.4,   // seconds after close starts before new book begins opening
    },
    hover: {
        duration: 0.3,
        zOffset:  1,
        ease:     "power2.out",
    },
};

// Arrays of varied book dimensions for decorative books
export const BOOK_VARIATIONS = {
  HEIGHTS: [185, 191, 194, 200, 203, 205, 211, 219, 230, 250],
  WIDTHS: [25, 31, 35, 38, 42, 48, 58, 66],
};
