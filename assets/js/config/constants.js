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
  AMBIENT_INTENSITY: 1.0,

  // Key light
  KEY_COLOR:         0xfff5e0,
  KEY_INTENSITY:     1.2,
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
  SHADOW_RADIUS:      6,

  // Cool fill from opposite side
  FILL_COLOR:        0xd0e8ff,
  FILL_INTENSITY:    0.7,
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
  BOOK_SPACING:  0.2,  // inches between adjacent books on a shelf
};

// A shelf is divided into 4 evenly spaced sections (1–4, left→right). These are the
// center positions of each section as a fraction of the shelf half-width. Single source
// of truth — used wherever something is placed by section (books, contact card, etc.).
export const SECTION_FRACTIONS = { 1: -0.75, 2: -0.25, 3: 0.25, 4: 0.75 };

// World-space X of a section's center.
export function sectionCenterX(section) {
  return SECTION_FRACTIONS[section] * (BOOKSHELF_DIMENSIONS.WIDTH / 2);
}

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
    SPINE_MAX_LINES:            3,     // longest titles may wrap across up to this many columns
    SPINE_TEXT_WIDTH_FRAC:      0.7,   // fraction of spine thickness the text columns may use (side padding)
    SPINE_LINE_GAP_RATIO:       0.18,  // gap between columns as a fraction of font size
    SPINE_LINE_GAIN:            1.08,  // add another line only if it enlarges the font this much
    SPINE_COMFORT_FONT_PX:      42,    // target spine title size; thin books thicken to reach it
    SPINE_MAX_TEXT_WIDTH_RATIO: 0.74,  // max text length as fraction of canvas height (end padding)

    // Cover texture
    COVER_CANVAS_SIZE:    128,  // square canvas dimension for cover fabric
    COVER_NOISE_AMPLITUDE: 24,  // ±noise added per channel for fabric grain

    // Title page texture (inner cover face — left page when open)
    TITLE_PIXELS_PER_UNIT:      100,   // canvas pixels per inch — high-res for close zoom
    TITLE_BG_COLOR:             '#f8f4ec',
    TITLE_TEXT_COLOR:           '#1a1a1a',
    TITLE_BORDER_COLOR_FACTOR:  0.6,   // multiplier to darken book color for borders
    TITLE_OUTER_MARGIN:         33,    // px from canvas edge to outer border (~0.33in)
    TITLE_OUTER_LINE_WIDTH:     10,    // px width of outer border stroke (~0.10in)
    TITLE_INNER_MARGIN_OFFSET:  17,    // px gap between outer and inner border (~0.17in)
    TITLE_FONT_SIZE_RATIO:      0.14,  // initial font size as fraction of canvas width
    TITLE_LINE_HEIGHT_RATIO:    1.5,   // line height as multiple of font size
    TITLE_TEXT_PADDING:         57,    // px padding inside inner border for text (~0.57in)

    // Content page texture (pages +Z face — right page when open)
    // Type is sized in physical inches (not ratios of width) so text appears at a
    // consistent, readable size across every book regardless of trim size — the way
    // real publishing works. A book's dimensions then follow from its content; see
    // CONTENT_SIZING below and Book._computeContentSizing().
    CONTENT_PIXELS_PER_UNIT:  120,   // canvas pixels per inch — high-res for close zoom
    CONTENT_TITLE_IN:         0.30,  // bold title (~22pt)
    CONTENT_SUBTITLE_IN:      0.21,  // italic subtitle / position (~15pt)
    CONTENT_ORG_IN:           0.17,  // org / company line (~12pt)
    CONTENT_BODY_IN:          0.155, // meta stats + section headers (~11pt)
    CONTENT_LIST_IN:          0.145, // bullet-list items (~10.5pt)
    CONTENT_LINE_HEIGHT:      1.45,  // line height as multiple of font size
    CONTENT_MARGIN_X_IN:      0.45,  // horizontal page margin in inches
    CONTENT_MARGIN_TOP_IN:    0.4,   // top/bottom margin in inches
  },

  // Content-driven dimension sizing (inches). When a book has modalInfo and its
  // dimensions aren't pinned in config, width/height/thickness are derived from the
  // laid-out content within these realistic bands. See Book._computeContentSizing().
  CONTENT_SIZING: {
    MEASURE_WIDTH: 6.0,   // trim width used when first measuring content height
    WIDTH_MIN:     4.8,
    WIDTH_MAX:     6.5,
    HEIGHT_MIN:    7.0,   // floor — low enough that a sparse book fills out at readable type
    HEIGHT_MAX:   10.2,   // ceiling (also bounded by the ~11" shelf gap)
    HEIGHT_JITTER: 0.45,  // ± deterministic per-book height variation for a natural shelf
    RATIO_MIN:     1.28,  // height/width — realistic hardcover proportions (6×9 ≈ 1.5)
    RATIO_MAX:     1.62,
    TARGET_FILL:   0.9,   // aim for content to occupy this fraction of usable page height
    TYPE_SCALE_MIN: 0.7,  // shrink type at most this much to fit a dense book on one page
    TYPE_SCALE_MAX: 1.5,  // grow type at most this much to fill a sparse book
    THICKNESS_BASE: 0.8,
    THICKNESS_PER_IN: 0.24, // thickness added per inch of content height (page-count proxy)
    THICKNESS_MIN:  1.1,
    THICKNESS_MAX:  3.0,
  },

  // Reference screen width for responsive scale calculation
  SCALE_BASE_WIDTH: 1200,
};

// BlogNotebook default properties (spiral-bound notebook on the shelf)
export const BLOG_NOTEBOOK_DEFAULTS = {
  // Notebook physical dimensions in inches
  WIDTH:     7.5,
  HEIGHT:    9.75,
  THICKNESS: 0.55,

  // Spiral-binding coils along the top edge
  NUM_COILS:        16,
  COIL_RADIUS:      0.34,  // ring radius — slightly bigger than thickness/2 so it clears the body
  COIL_TUBE_RADIUS: 0.07,  // wire thickness of each ring

  // Hover animation
  HOVER_Z_OFFSET: 1,    // inches forward when hovered
  HOVER_DURATION: 0.3,  // seconds
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

