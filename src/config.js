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
  amber: 0xff9a4d,
};

// The circular play area, centred on (0, 0).
export const WORLD = {
  radius: 3000,
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

// Movement feel: smooth acceleration and friction, never instant snapping.
export const MOVEMENT = {
  maxSpeed: 520, // px/s
  acceleration: 1400, // px/s²: how fast velocity turns toward the desired velocity
  arriveRadius: 220, // px: within this distance of the pointer the black hole eases off
  deadZone: 6, // px: pointer closer than this counts as "already there"
  friction: 1.6, // per second: drift decay after release (velocity × e^(-friction·t))
  stopSpeed: 4, // px/s: below this, drifting velocity snaps to zero
};

// Camera follows the black hole with a slight lag.
export const CAMERA = {
  lerp: 0.1, // 0..1 per frame; lower = more lag
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
