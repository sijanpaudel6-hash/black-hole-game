// Every tunable number in the game lives here, so balance changes need no code edits.
// Units: pixels (world space), seconds, pixels/second, pixels/second².

// Design resolution (portrait 9:16). Phaser scales this to fit any screen.
export const GAME = {
  width: 720,
  height: 1280,
  maxFrameDelta: 0.05, // seconds; clamp long frames (e.g. after a tab switch) so nothing teleports
};

// Colours from design/DESIGN.md. Numbers for Phaser, strings for CSS.
export const COLORS = {
  void: 0x07080c,
  voidCss: '#07080C',
  hairline: 0x2a2f3a,
  text: 0xedeae4,
  textCss: '#EDEAE4',
  textMutedCss: '#8A8F98',
  amber: 0xff9a4d,
};

// Draw order, back to front.
export const DEPTH = {
  stars: 0,
  worldEdge: 1,
  edibleObjects: 10, // edible objects pass under the black hole as it eats them
  blackHole: 20,
  inedibleObjects: 30, // too-big objects draw on top, so you can see you can't eat them
};

// The circular play area, centred on (0, 0).
export const WORLD = {
  radius: 2200,
  edgeLineWidth: 2,
  edgeLineAlpha: 0.9,
};

// The player's black hole (Session 1: a black disc with a thin bright photon ring).
export const BLACK_HOLE = {
  startRadius: 28, // ≈ 8% of screen width as a diameter (720 × 0.08 ≈ 57 px)
  photonRingWidth: 2,
  photonRingColor: COLORS.text,
  haloWidth: 4, // faint amber glow just outside the photon ring
  haloAlpha: 0.25,
  haloColor: COLORS.amber,
};

// Mass sets the radius: radius = baseRadius × (mass ÷ baseMass)^exponent.
// Cube root means doubling mass grows the radius by about 26%.
export const GROWTH = {
  baseMass: 20, // mass the black hole starts with
  baseRadius: BLACK_HOLE.startRadius, // radius at baseMass
  exponent: 1 / 3,
  radiusEase: 10, // per second: how fast the drawn size catches up after eating (higher = snappier)
};

// Movement feel: smooth acceleration and friction, never instant snapping.
export const MOVEMENT = {
  maxSpeed: 520, // px/s
  acceleration: 1400, // px/s²: how fast velocity turns toward the desired velocity
  arriveRadius: 220, // px: within this distance of the pointer the black hole eases off
  deadZone: 6, // px: pointer closer than this counts as "already there"
  friction: 1.6, // per second: drift decay after release (velocity × e^(-friction·t))
  stopSpeed: 4, // px/s: below this, drifting velocity snaps to zero
  // Max speed shrinks slightly as the black hole grows, so big feels heavy:
  // maxSpeed × (radius ÷ baseRadius)^(-sizeSpeedExponent), never below minSpeedFactor × maxSpeed.
  sizeSpeedExponent: 0.15, // doubling the radius → about 10% slower
  minSpeedFactor: 0.6,
};

// Eating: what can be swallowed and how nearby objects get pulled in.
export const EATING = {
  edibleRatio: 0.9, // edible only if object radius < 90% of the black hole's radius
  pullRangeMultiplier: 3, // pull zone = 3 × black hole radius
  pullAcceleration: 1200, // px/s² at the centre, fading to 0 at the zone edge (scales with black hole size)
  pullDrag: 3, // per second: pulled objects match the black hole's motion so they fall in instead of slingshotting
  releaseDrag: 1.5, // per second: objects that escape the pull zone slow back down to their lazy drift
};

// Space objects, by type. Masses from SPEC.md. Radius is in world px.
// drift: [min, max] px/s. spin: [min, max] radians/s (random direction).
// sparkle: alpha twinkle amount (0 = none) and speed (radians/s).
export const OBJECTS = {
  dust: {
    name: 'Dust', tier: 1, mass: 1, radius: 8,
    color: 0xd6b48c, drift: [6, 22], spin: [0, 0], sparkle: 0, sparkleSpeed: 0,
  },
  iceCrystal: {
    name: 'Ice crystal', tier: 1, mass: 2, radius: 10,
    color: 0xcfe3f5, drift: [6, 20], spin: [0.2, 0.6], sparkle: 0.45, sparkleSpeed: 4,
  },
  pebble: {
    name: 'Pebble', tier: 1, mass: 4, radius: 15,
    color: 0x8a837c, drift: [5, 16], spin: [0.1, 0.4], sparkle: 0, sparkleSpeed: 0,
  },
  smallRock: {
    name: 'Small rock', tier: 1, mass: 10, radius: 36,
    color: 0x8c7b6b, drift: [4, 12], spin: [0.15, 0.45], sparkle: 0, sparkleSpeed: 0,
  },
};

// Spawner: keeps the play area full of objects.
export const SPAWNER = {
  // Relative spawn weights per tier. Tier 1: ~70% edible at the start, ~25% (small rocks) edible after some growth.
  weights: {
    1: { dust: 35, iceCrystal: 20, pebble: 15, smallRock: 25 },
  },
  count: 300, // objects alive at once (spec cap: 300)
  startClearRadius: 90, // px around the start point kept empty at level start
  respawnMargin: 80, // px beyond the edge of the view where eaten objects reappear...
  respawnRingWidth: 700, // ...up to this much farther out, so the area around the player never empties
  activeMargin: 600, // px beyond the view; objects farther away than this are paused
  textureScale: 2, // object textures are drawn at this multiple of their size for crisp edges
};

// Camera follows the black hole with a slight lag.
export const CAMERA = {
  lerp: 0.1, // 0..1 per frame; lower = more lag
};

// HUD sizes are in design pixels (the 720-wide canvas, ~1.85× a 390 px phone).
export const HUD = {
  margin: 30, // ≈ 16 px on a phone
  labelSize: 22, // ≈ 12 px on a phone (DESIGN.md minimum is 11 px)
  labelSpacing: 2,
  metricSize: 54, // ≈ 29 px on a phone (DESIGN.md metric-lg)
  fontMono: '"Space Mono", ui-monospace, Menlo, Consolas, monospace',
};

// Starfield: parallax layers drawn as tiling textures. Far layers move slower.
export const STARFIELD = {
  tileSize: 1024,
  layers: [
    { scrollFactor: 0.15, count: 220, minRadius: 0.5, maxRadius: 1.1, minAlpha: 0.25, maxAlpha: 0.55 },
    { scrollFactor: 0.35, count: 110, minRadius: 0.8, maxRadius: 1.6, minAlpha: 0.4, maxAlpha: 0.75 },
    { scrollFactor: 0.65, count: 45, minRadius: 1.2, maxRadius: 2.2, minAlpha: 0.6, maxAlpha: 1.0 },
  ],
  // Share of stars tinted amber instead of white, for a little warmth.
  amberShare: 0.08,
};
