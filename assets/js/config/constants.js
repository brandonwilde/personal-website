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

export const SCENE_BACKGROUND = 0x3b4a66;

export const ROOM = {
  WALL_COLOR:      0x3b4a66,  // musty navy blue
  WALL_GAP:        0.9,       // how far the wall sits behind the bookcase's back face
  PLANE_SIZE:      800,       // wall/floor extent — large enough to fill any view
  SIDE_WALL_X:     120,       // ±X position of the left/right side walls (= PLANE_SIZE/2 for a true corner)
  WALL_ROUGHNESS:  0.95,
  FLOOR_ROUGHNESS: 1.0,

  BASEBOARD_COLOR:     0xf5f3ee,  // off-white trim
  BASEBOARD_HEIGHT:    2.5,         // how tall the baseboard stands off the floor
  BASEBOARD_DEPTH:     0.4,       // how far it juts out from the wall
  BASEBOARD_ROUGHNESS: 0.6,       // slightly sheened painted trim
  BASEBOARD_SINK:      0.4,       // how far the bottom tucks below the floor into the pile
};

// Procedural cut-pile carpet for the floor (see room/carpet.js).
export const CARPET = {
  COLOR:           0xcdb88f,  // cream-tan base yarn colour
  TEXTURE_SIZE:    512,        // canvas resolution of each generated map
  REPEAT:          40,         // tiles across the 800-inch floor (~20in per tile)
  ANISOTROPY:      8,          // sharpens the pile when viewed at grazing angles
  TUFT_CELLS:      48,         // grid of the dominant pile clumps within a tile
  OCTAVES:         4,          // fractal octaves layered over the tuft scale
  PERSISTENCE:     0.55,       // how fast finer octaves fade (0..1)
  GRAIN:           0.10,       // per-pixel fibre fuzz on top of the tufts
  COLOR_VARIATION: 0.22,       // tuft-to-valley brightness spread (fake AO)
  NORMAL_STRENGTH: 8.0,        // how steeply pile bumps tilt the surface normal
  NORMAL_SCALE:    1.4,        // material normalScale applied to the normal map

  // Near "patch" of real displaced geometry, laid over the flat far floor so
  // the foreground pile has actual 3D topography (see SceneManager backdrop).
  PATCH_SIZE:        360,      // inches square; large enough to cover the view
  PATCH_SEGMENTS:    720,      // subdivisions per side (~0.5in per vertex)
  DISPLACEMENT_SCALE: 0.45,    // inches of real pile relief — subtle until close
  DISP_CELLS:        24,       // clump grid per tile (~0.8in lumps)
  DISP_OCTAVES:      3,        // octaves layered into the displacement
};

// Shared room reflection/IBL map (see room/environment.js); keep mostly dark.
export const ROOM_ENVIRONMENT = {
  WIDTH:  512,                 // equirectangular texture size
  HEIGHT: 256,

  // Vertical gradient: dim warm ceiling → near-black floor. [stop, color]
  GRADIENT: [
    [0.0, '#4a3f2a'],          // ceiling — dim warm, not the light source itself
    [0.4, '#2a2418'],          // upper wall
    [0.6, '#17130c'],          // lower wall
    [1.0, '#080603'],          // floor
  ],

  // Soft overhead highlight band — the "light fixture" glint on polished faces.
  BAND_CENTER_Y: 40,           // px from top; the band's origin/peak
  BAND_INNER:    'rgba(255, 255, 255, 0.45)',
  BAND_OUTER:    'rgba(255, 255, 255, 0)',
};

// Lighting settings
export const LIGHTING_SETTINGS = {
  // Warm ambient — simulates bounced room light
  AMBIENT_COLOR:     0xfff0d0,
  AMBIENT_INTENSITY: 1.0,

  // Key light
  KEY_COLOR:         0xfff5e0,
  KEY_INTENSITY:     1.2,
  // Direction only — a directional light has no position. The y/z ratio sets how
  // far a shelf's shadow runs down the wall (DEPTH x ratio); at 80/30 each 7.2in
  // plank smeared a 19in band across an 11in gap, so 45° keeps it to 7.2in. The
  // x offset swings the light off-center, so shadows fall on a slant rather than
  // straight down — and away from the lamp, which lights from the right.
  KEY_POSITION:      { x: -20, y: 60, z: 60 },

  // 'BASIC' | 'PCF' | 'PCF_SOFT' | 'VSM'. Note that SHADOW_RADIUS below only has
  // any effect under PCF and VSM — PCF_SOFT ignores it and uses a fixed kernel,
  // which is why the edges stayed crisp however high the radius went.
  SHADOW_TYPE:       'PCF',

  // Shadow frustum — kept tight around the shelf to maximise shadow resolution.
  // NEAR/FAR bracket the scene along the light's axis; the old 1..300 spread the
  // depth buffer so thin that the bias needed to fight acne also detached the
  // shadows from their casters.
  SHADOW_MAP_SIZE:   1024,  // smaller texels blur further, which we want here
  SHADOW_NEAR:       20,
  SHADOW_FAR:        220,
  SHADOW_LEFT:       -50,   // wide enough to include the floor lamp's foot
  SHADOW_RIGHT:       50,
  SHADOW_TOP:         30,
  SHADOW_BOTTOM:     -30,
  SHADOW_BIAS:       -0.0004,
  SHADOW_NORMAL_BIAS: 0.3,  // offsets along the surface normal, not the light ray;
                            // keep well under the 1in plank thickness or light leaks through
  SHADOW_RADIUS:      6,   // blur width in shadow-map texels

  // Cool fill from opposite side
  FILL_COLOR:        0xd0e8ff,
  FILL_INTENSITY:    0.7,
  FILL_POSITION:     { x: -40, y: 30, z: -30 },

  // Warm sconce-style point lights flanking the shelf. Three.js uses physical
  // light units, so a point light's contribution is intensity / distance² —
  // and with the scene measured in inches these sit ~40in out. Intensity has to
  // be in the thousands to register at all; at 2.5 they were contributing
  // ~0.003 against an ambient of 1.0, i.e. nothing.
  SCONCE_COLOR:      0xffa060,
  SCONCE_INTENSITY:  1000,
  SCONCE_DISTANCE:   220,  // cutoff radius; at 80 the falloff clipped mid-shelf
  // Standing well off the shelves: the closer they sit, the bigger the gap
  // between what the near and far ends of a plank receive, which is what made
  // the outer books bleach while the middle stayed flat.
  SCONCE_X:          44,   // mirrored to ±X
  SCONCE_Y:          42,
  SCONCE_Z:          34,

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
  MOUNT_HEIGHT:  32,   // inches of wall between the floor and the case's underside (0 = stands on the floor)
};

// The floor plane's Y. The bookcase is modelled centered on the origin, so
// hanging it on the wall is expressed as dropping the floor away beneath it —
// which leaves every shelf, book, label, and the camera framing untouched.
export const FLOOR_Y = -(
  BOOKSHELF_DIMENSIONS.HEIGHT / 2
  + BOOKSHELF_DIMENSIONS.SHELF_THICKNESS / 2
  + BOOKSHELF_DIMENSIONS.MOUNT_HEIGHT
);

// Wooden gusset brackets carrying each wall-mounted shelf (see
// items/shelf/shelfBracket.js). The profile is drawn in the plane of the
// bracket and extruded sideways into a plate; it wears the same wood as the
// planks it holds up.
export const SHELF_BRACKET = {
  COUNT:      3,     // brackets per shelf, spread evenly across its span
  END_INSET:  9,     // inches from each shelf end to the outermost bracket
  ARM:        5.2,   // how far it reaches forward under the shelf (shelf DEPTH is 7.2)
  DROP:       6.4,   // how far the wall arm hangs below the shelf
  STOCK:      1.0,   // thickness of each arm
  PLATE:      1.25,  // how thick the corbel is (its extrusion)

  // Rounded ends — every corner eased so the outline reads as one flowing curve
  TIP:      1.1,     // height of the front tip face (must exceed NOSE_R)
  NOSE_R:   0.35,    // rounding at the top and bottom of that tip face
  FOOT_R:   0.55,    // rounding where the wall arm meets its underside
  SEGMENTS: 32,      // curve subdivisions

  // Same grain as the planks, a half-shade darker so the supports read as their
  // own pieces without going muddy under the shelf.
  COLOR:     0xb0906a,
  ROUGHNESS: 0.7,
};

// Flex-style shelf layout: groups are distributed across the shelf's inner span
// rather than pinned to fixed section centers, so each shelf fills its width
// evenly and rows stagger naturally instead of aligning column-to-column.
export const SHELF_LAYOUT = {
  JUSTIFY:      'space-around', // 'space-around' | 'space-between' | 'space-evenly'
  EDGE_PADDING: 1.5,           // inches kept clear inside each frame end
};

// Shelf nameplate — a thin brass plaque fixed flat to the front face of a shelf plank
export const SHELF_LABEL = {
  PIXELS_PER_UNIT: 140,        // canvas px per inch (crisp engraved text)
  HEIGHT:          0.66,       // plate height — a bit under SHELF_THICKNESS so it sits within the plank
  DEPTH:           0.1,        // plate thickness
  FRONT_PROUD:     0.05,       // how far the plate stands proud of the plank's front face
  PAD_X:           0.34,       // horizontal text padding
  FONT_IN:         0.42,       // engraved cap text size — fills most of the plate height
  MIN_WIDTH:       1.8,        // plate width clamp
  MAX_WIDTH:       11.0,       // stays within a 12in section bay
  CORNER_RADIUS:   0.4,       // generous rounded corners (≈ the original CSS pill shape)

  // Polished-brass surface
  BASE_COLOR:      0xffffff,   // white = let the gradient map define the face color unmodified
  SIDE_COLOR:      0xc9b06a,   // gold tone for the plate's edges (no text map)
  METALNESS:       0.45,
  ROUGHNESS:       0.3,
  ENV_INTENSITY:   1.5,
  EMISSIVE_INTENSITY: 0.4,     // self-illuminate the gold (text stays dark) so it reads bright vs the dim env

  // Engraved plate face (canvas) colors
  GRADIENT_TOP:    '#b5a66b',  // darker gold at top
  GRADIENT_BOTTOM: '#dbc688',  // lighter gold toward the bottom
  GLARE:           'rgba(255, 255, 255, 0.7)',  // soft light glare across the top half
  TEXT_COLOR:      'rgb(122, 92, 18)',          // warm brown engraved lettering
};

// Wood material for bookshelf frame and shelves
export const WOOD_MATERIAL = {
  COLOR:     0xc8a87a,
  ROUGHNESS: 0.85,
  METALNESS: 0.0,
};

// Pointer interaction thresholds
export const INTERACTION = {
  DRAG_THRESHOLD_PX: 6,  // pointer travel (press→release) beyond this counts as a camera drag, not a click
};

// Corner navigation-hints guide
export const NAV_HINTS = {
  CORNER:      'bottom-left', // top-left | top-right | bottom-left | bottom-right
  MARGIN_PX:   16,
  BG:          'rgba(15,15,20,0.82)',
  TEXT:        '#e8e4dc',
  ACCENT:      '#f0c060', // highlighted mouse button + key terms
};

// Camera settings
export const CAMERA_SETTINGS = {
  FOV:  10,
  NEAR: 1.2,
  FAR:  12000,
  // Extra vertical headroom around the shelf so the top/bottom plank labels
  // aren't clipped at the viewport edges (1.0 = fit HEIGHT exactly).
  FRAME_MARGIN: 1.1,
  // Aspect the fixed showcase distances were tuned at; narrower screens push opened items back to fit by width.
  SHOWCASE_BASE_ASPECT: 1.1,
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
  // Closest the camera may get to an open item while reading it (target is on the item).
  FOCUS_MIN_DISTANCE:    8,
  // maxDistance floor = auto-fit distance × this, so portrait can frame the shelf.
  MAX_DISTANCE_FIT_MARGIN: 1.2,
  // Camera and look-at target stay this many inches clear of the floor and back-wall planes.
  BOUNDS_CLEARANCE: 2,
  ZOOM_SPEED:            3,
  ROTATE_SPEED:          0.8,
  PAN_SPEED:             0.8,
  TOUCH_ZOOM_SPEED:      1,
  TOUCH_GESTURE_THRESHOLD_PX: 8,
};

// Book default properties
export const BOOK_DEFAULTS = {
  // Standard book dimensions in inches
  WIDTH: 6,        // 6 inches
  HEIGHT: 9.6,     // 9.6 inches
  THICKNESS: 1.2,  // 1.2 inches

  // Cover properties
  COVER: {
    THICKNESS: 0.24,            // Cover thickness in inches
    LOGO_CANVAS_SIZE:     512,  // higher-res canvas for covers bearing a logo/crest
    LOGO_MAX_FRACTION:    0.6,  // largest fraction of the cover the logo may span (× per-book logoScale)
    LOGO_ALPHA:           0.82, // logo opacity — <1 lets the cloth color/weave bleed through
    LOGO_GRAIN_AMPLITUDE: 110,  // ±brightness of the weave grain blended into the logo
    LOGO_GRAIN_ALPHA:     0.9,  // strength of that weave overlay
    LOGO_DARKEN:          0.2,  // translucent black blended over the logo (0 = none)
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
    // Brightness lift applied to the painted cover/spine color. The palette is
    // sampled in sRGB and decoded correctly, which renders the muted source
    // colors fairly dark; this gain lifts them back up while keeping their hue
    // and saturation. 1.0 = raw palette.
    COLOR_GAIN: 1.4,

    // Filtering — anisotropic sampling stops the spine/cover grain from
    // shimmering ("hashing") along edges seen at grazing camera angles.
    ANISOTROPY: 8,

    // Spine texture
    SPINE_PIXELS_PER_UNIT:      50,    // canvas pixels per scene unit
    SPINE_DARKEN:               0.8,   // spine color darkened slightly vs cover
    SPINE_CURVE_DEPTH:          0.16,  // inches the rounded spine bulges toward the viewer
    SPINE_CURVE_SEGMENTS:       24,    // cross-section subdivisions for a smooth curve
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

    // Content page texture (pages +Z face — right page when open); type sized in inches.
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

  // Content-driven dimension sizing (inches); see Book._computeContentSizing().
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

  // Distance in front of the camera the card flies to when opened
  SHOWCASE_DISTANCE: 21,

  // Lean angle in radians (~22° back from vertical, face tilts toward viewer)
  LEAN_ANGLE: -0.38,
};

// All animation parameters — single source of truth, mutated by the debug panel.
export const ANIM_PARAMS = {
    open: {
        duration:     0.8,            // base seconds; individual steps are multiples of this
        zOut:         55,             // distance in front of the camera the open book sits (keeps on-screen size constant at any zoom)
        showcaseY:    0,              // optional vertical nudge from the camera's view center
        coverAngle:   -Math.PI * 0.9, // radians the cover swings open (~162°)
        bookRotation: 0,              // rotation.y when open; 0 = front cover faces viewer
        ease:         "power2.inOut",
        pageFanAngle: 0.08,           // radians pages fan out as cover opens
        pullOffDist:  30,              // inches the Bézier control point sits straight off the shelf (+z); shapes the arc so the book leaves the shelf moving forward before curving to showcase

        // Step duration multipliers (× base duration)
        moveMult:      1.05,  // total duration of the curved move from shelf to showcase
        rotateMult:    1.0,
        coverOpenMult: 1.2,
        pageFanMult:   0.8,

        // Timeline overlap/delay offsets (seconds)
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
        moveMult:       1.05,  // total duration of the curved move from showcase back to the shelf

        // Timeline overlap offsets (seconds)
        rotateOverlap: 0.3,   // seconds before cover closes that rotation starts
    },
    hover: {
        duration: 0.3,
        zOffset:  5,
        ease:     "power2.out",
    },
};


// Tall floor lamp standing beside the bookcase (see items/floorLamp/FloorLamp.js).
// All Y values are inches above the floor; the lamp's origin sits on the floor plane.
export const FLOOR_LAMP = {
  POSITION:   { x: 41, z: 5 },  // floor position; clears the wall-mounted case (x ±30, front face z 3.6)
  ROTATION_Y: 0.35,             // slight turn so the shade seam faces away

  // Metalwork (base, pole, collars, harp, finial) — aged brass
  METAL_COLOR:         0x9a7b45,
  METAL_ROUGHNESS:     0.32,
  METAL_METALNESS:     0.95,
  METAL_ENV_INTENSITY: 1.3,

  // Weighted foot — a lathed dome that flows up into the pole
  BASE_RADIUS:   6.4,
  BASE_HEIGHT:   2.2,
  BASE_SEGMENTS: 64,

  // Pole and the decorative rings banding it
  POLE_RADIUS:     0.34,
  POLE_TOP_Y:      46,
  COLLAR_YS:       [3.2, 23],
  COLLAR_RADIUS:   0.62,
  COLLAR_HEIGHT:   0.9,

  SOCKET_RADIUS: 0.85,
  SOCKET_HEIGHT: 2.4,

  BULB_RADIUS:             1.25,
  BULB_Y:                  49.5,
  BULB_COLOR:              0xfff2d0,
  BULB_EMISSIVE_INTENSITY: 3.0,

  // Pull chain dangling from the socket
  CHAIN_LENGTH:      4.5,
  CHAIN_RADIUS:      0.05,
  CHAIN_BEAD_RADIUS: 0.16,
  CHAIN_OFFSET:      1.0,   // how far off the pole axis it hangs

  // Harp — two bowed wires carrying the shade
  HARP_BASE_Y:     45.0,
  HARP_TOP_Y:      57.4,
  HARP_WIDTH:      4.6,     // how far the wires bow out
  HARP_WIRE_RADIUS: 0.14,

  FINIAL_Y:      57.6,
  FINIAL_RADIUS: 0.8,

  // Empire (tapered drum) shade
  SHADE_BOTTOM_Y:      45.5,
  SHADE_HEIGHT:        11.5,
  SHADE_BOTTOM_RADIUS: 9.2,
  SHADE_TOP_RADIUS:    6.6,
  SHADE_SEGMENTS:      64,
  SHADE_ROUGHNESS:     0.9,
  SHADE_EMISSIVE:      0xffb765,  // warm light bleeding through the linen
  SHADE_EMISSIVE_INTENSITY: 1.1,
  SHADE_OPACITY:       0.96,
  SHADE_BUMP_SCALE:    0.035,
  TRIM_TUBE_RADIUS:    0.11,      // rolled rim at the shade's top and bottom edges

  // Warm bulb light thrown into the room (physical falloff: irradiance ≈ INTENSITY / d²)
  LIGHT_COLOR:     0xffc98a,
  LIGHT_INTENSITY: 1100,
  LIGHT_DISTANCE:  260,
  LIGHT_DECAY:     2,

  // The bulb casts, so the shelves, corbels, and books throw their own shadows
  // from it. The shade deliberately does not: blocking the light sideways would
  // shape it into up/down cones, but then nothing on the shelves is lit by the
  // lamp at all, and none of it casts. Treat the linen as translucent instead.
  SHADE_CASTS_SHADOW:       false,
  LIGHT_SHADOW_MAP:         1024,   // per cube face
  LIGHT_SHADOW_NEAR:        1,
  LIGHT_SHADOW_BIAS:       -0.001,
  LIGHT_SHADOW_NORMAL_BIAS: 0.3,
  LIGHT_SHADOW_RADIUS:      8,

  // Procedurally woven linen for the shade (see floorLampTextures.js)
  TEXTURE: {
    SIZE_X:        1024,
    SIZE_Y:        512,
    LINEN:         [239, 224, 194],  // RGB of the undyed linen
    WEAVE_PERIOD:  5,     // px per warp/weft thread
    WEAVE_DEPTH:   16,    // ±brightness of the weave crosshatch
    SLUB_DEPTH:    10,    // ±brightness of the thicker irregular threads
    GRAIN:         7,     // ±per-pixel fibre noise
    SEAM_WIDTH:    6,     // px of the vertical stitched seam
    SEAM_DARKEN:   0.82,
    GLOW_CENTER:   0.58,  // v of the hottest band (roughly the bulb's height)
    GLOW_FALLOFF:  0.62,  // how fast the glow fades toward the rims
    GLOW_FLOOR:    0.35,  // dimmest the shade ever glows
  },
};
