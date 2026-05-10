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
  AMBIENT_INTENSITY: 0.7,
  MAIN_LIGHT_INTENSITY: 1.0,
  FILL_LIGHT_INTENSITY: 0.5,
  POINT_LIGHT_INTENSITY: 0.5,
  MAIN_LIGHT_COLOR: 0xffffff,
  FILL_LIGHT_COLOR: 0xffffff,
  POINT_LIGHT_COLOR: 0xffcc88,
  SHADOW_MAP_SIZE: 2048
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
  
  // Animation settings
  HOVER: {
    HEIGHT: 1,       // 1 inch up
    DURATION: 0.3,   // seconds
    EASE: "power2.out"
  },
  OPEN: {
    ANGLE: Math.PI / 6,  // 30 degrees
    DURATION: 0.8,       // seconds (base — steps are multiples of this)
    EASE: "power2.inOut"
  },
  // Material settings
  MATERIAL: {
    HOVER_EMISSIVE: 0x333333,
    DEFAULT_EMISSIVE: 0x000000,
    ROUGHNESS: 0.8,
    METALNESS: 0.1,
    PAGE_COLOR: 0xffffff
  }
};

// Live-editable animation parameters — mutated by the debug panel at runtime.
// Book._buildOpenTimeline() reads these fresh each call so changes take effect immediately.
export const ANIM_PARAMS = {
    open: {
        duration:   0.8,          // base seconds; individual steps are fractions/multiples
        zOut:       10,           // units the book pulls forward from the shelf
        showcaseY:  0,            // world-Y the book centers on when open
        coverAngle: -Math.PI * 0.9, // radians the cover swings open (~162°)
    },
    close: {
        duration:   0.7,          // base seconds for close
        openDelay:  0.4,          // seconds after close starts before new book begins opening
    },
    hover: {
        duration:   0.3,
        zOffset:    1,
    }
};

// Arrays of varied book dimensions for decorative books
export const BOOK_VARIATIONS = {
  HEIGHTS: [185, 191, 194, 200, 203, 205, 211, 219, 230, 250],
  WIDTHS: [25, 31, 35, 38, 42, 48, 58, 66],
};
