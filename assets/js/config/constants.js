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
  SHADOW_NEAR:       1,
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
  FOV:  10,
  NEAR: 1.2,
  FAR:  12000,
};

// Renderer settings
export const RENDERER_SETTINGS = {
  MAX_PIXEL_RATIO: 2,
};

// OrbitControls settings
export const CONTROLS_SETTINGS = {
  DAMPING_FACTOR:        0.05,
  MAX_POLAR_ANGLE_DENOM: 1.5,   // maxPolarAngle = PI / this
  MIN_DISTANCE:          12,
  MAX_DISTANCE:          360,
  ZOOM_SPEED:            3,
  ROTATE_SPEED:          0.8,
  PAN_SPEED:             0.8,
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
    HOVER_EMISSIVE:      0x333333,
    DEFAULT_EMISSIVE:    0x000000,
    COVER_ROUGHNESS:     0.85,
    COVER_METALNESS:     0.0,
    PAGE_COLOR:          0xf5f0e8,
    PAGE_ROUGHNESS:      0.95,
    PAGE_METALNESS:      0.0,
    PAGE_EDGE_COLOR:     0xe8dfc0,
    PAGE_EDGE_ROUGHNESS: 0.9,
    PAGE_EDGE_METALNESS: 0.05,
  },

  // Texture generation settings
  TEXTURE: {
    // Spine texture
    SPINE_PIXELS_PER_UNIT:      50,    // canvas pixels per scene unit
    SPINE_DARKEN:               0.8,   // spine color darkened slightly vs cover
    SPINE_LUMINANCE_THRESHOLD:  0.45,  // below = light text, above = dark text
    SPINE_FONT_SIZE_RATIO:      0.72,  // font size as fraction of canvas width
    SPINE_MAX_TEXT_WIDTH_RATIO: 0.85,  // max text width as fraction of canvas height

    // Cover texture
    COVER_CANVAS_SIZE:    128,  // square canvas dimension for cover fabric
    COVER_NOISE_AMPLITUDE: 24,  // ±noise added per channel for fabric grain

    // Title page texture (inner cover face — left page when open)
    TITLE_PIXELS_PER_UNIT:      42,
    TITLE_BG_COLOR:             '#f8f4ec',
    TITLE_TEXT_COLOR:           '#1a1a1a',
    TITLE_BORDER_COLOR_FACTOR:  0.6,   // multiplier to darken book color for borders
    TITLE_OUTER_MARGIN:         14,    // px from canvas edge to outer border
    TITLE_OUTER_LINE_WIDTH:     4,     // px width of outer border stroke
    TITLE_INNER_MARGIN_OFFSET:  7,     // px gap between outer and inner border
    TITLE_FONT_SIZE_RATIO:      0.14,  // initial font size as fraction of canvas width
    TITLE_LINE_HEIGHT_RATIO:    1.5,   // line height as multiple of font size
    TITLE_TEXT_PADDING:         24,    // px padding inside inner border for text

    // Content page texture (pages +Z face — right page when open)
    // Font sizes are ratios of canvas width with px minimums for small books.
    CONTENT_PIXELS_PER_UNIT:  80,    // high-res so text is sharp at close zoom
    CONTENT_TITLE_RATIO:      0.055, // bold title; min 20px
    CONTENT_SUBTITLE_RATIO:   0.040, // italic subtitle; min 16px
    CONTENT_ORG_RATIO:        0.033, // org / company line; min 14px
    CONTENT_BODY_RATIO:       0.030, // meta stats + section headers; min 12px
    CONTENT_LIST_RATIO:       0.027, // bullet-list items; min 11px
    CONTENT_MARGIN_X_RATIO:   0.07,  // horizontal page margin (fraction of width)
    CONTENT_MARGIN_TOP_RATIO: 0.04,  // top margin (fraction of height)
  },

  // Reference screen width for responsive scale calculation
  SCALE_BASE_WIDTH: 1200,
};

// BusinessCard default properties
export const BUSINESS_CARD_DEFAULTS = {
  // Real business card dimensions in inches (scene units = inches)
  WIDTH:     3.5,
  HEIGHT:    2.0,
  THICKNESS: 0.02,

  // How far the top (flying) card sits in front of the stack in the tray
  STACK_Z_OFFSET: 0.16,

  // Lean angle in radians (~22° back from vertical, face tilts toward viewer)
  LEAN_ANGLE: -0.38,
};

// All animation parameters — the single source of truth for book animations.
// Mutated at runtime by the debug panel; Book reads via _params() each timeline build.
export const ANIM_PARAMS = {
    open: {
        duration:     0.8,            // base seconds; individual steps are multiples of this
        zOut:         150,            // units pulled forward from the shelf
        showcaseY:    13,             // world-Y the book centers on when open (= camera lookAt Y)
        coverAngle:   -Math.PI * 0.9, // radians the cover swings open (~162°)
        bookRotation: 0,              // rotation.y when open; 0 = front cover faces viewer
        ease:         "power2.inOut",
        pageFanAngle: 0.08,           // radians pages fan out as cover opens

        // Step duration multipliers (× base duration)
        slideOutMult:  0.5,
        centerMult:    0.7,
        rotateMult:    1.0,
        coverOpenMult: 1.2,
        pageFanMult:   0.8,

        // Timeline overlap/delay offsets (seconds)
        centerStart:   0.1,   // seconds after slideOut starts that centering begins
        rotateOverlap: 0.2,   // seconds before centering ends that rotation starts
        coverDelay:    0.1,   // seconds after rotation ends before cover opens
        pageFanOffset: 0.2,   // seconds after cover starts that pages fan out
    },
    close: {
        duration:  0.7,   // base seconds for close
        openDelay: 0.4,   // seconds after close starts before new book begins opening

        // Step duration multipliers (× base duration)
        pageSettleMult: 0.5,
        coverCloseMult: 1.2,
        rotateMult:     1.0,
        slideXYMult:    0.7,
        slideZMult:     0.5,

        // Timeline overlap offsets (seconds)
        rotateOverlap: 0.3,   // seconds before cover closes that rotation starts
        slideZOverlap: 0.1,   // seconds before slide-XY ends that Z slide starts
    },
    hover: {
        duration: 0.3,
        zOffset:  1,
        ease:     "power2.out",
    },
};

