// Every tunable number in the game lives here, so balance changes need no code edits.
//
// Units:
//  - World sizes are in world pixels. The camera zooms so the black hole always looks
//    about the same size on screen, so most speeds and distances below are given in
//    "screen pixels at the 720-wide design size" and are scaled to the world for you.
//  - Times are in seconds, speeds in px/s, accelerations in px/s².

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

// Design resolution (portrait 9:16). Phaser scales this to fit any screen.
export const GAME = {
  width: 720,
  height: 1280,
  maxFrameDelta: 0.05, // clamp long frames (e.g. after a tab switch) so nothing teleports
};

// Colours from design/DESIGN.md. Numbers for Phaser, strings for CSS/canvas text.
export const COLORS = {
  void: 0x07080c,
  voidCss: '#07080C',
  panel: 0x10131a,
  panelCss: '#10131A',
  panelRaised: 0x1a1d24,
  hairline: 0x2a2f3a,
  hairlineCss: '#2A2F3A',
  text: 0xedeae4,
  textCss: '#EDEAE4',
  textMuted: 0x8a8f98,
  textMutedCss: '#8A8F98',
  amber: 0xff9a4d,
  amberCss: '#FF9A4D',
  science: 0x9fc7ff,
  scienceCss: '#9FC7FF',
  danger: 0xff5a5f,
  dangerCss: '#FF5A5F',
  rivalRing: 0xb9a3ff, // rival black holes get a violet ring so you can tell them apart
};

// Draw order, back to front.
export const DEPTH = {
  stars: 0,
  worldEdge: 1,
  boss: 5,
  edibleObjects: 10, // edible objects pass under the black hole as it eats them
  ghosts: 12, // spaghettified objects falling in
  particles: 13,
  blackHole: 20,
  inedibleObjects: 30, // too-big objects draw on top, so you can see you can't eat them
  dangerRings: 31,
  effects: 40,
};

// ---------------------------------------------------------------------------
// Black hole: size, look and movement
// ---------------------------------------------------------------------------

// Mass sets the radius: radius = baseRadius × (mass ÷ baseMass)^exponent.
// Cube root means doubling mass grows the radius by about 26%.
export const GROWTH = {
  baseMass: 20,
  baseRadius: 28, // world px at baseMass (≈ 8% of screen width as a diameter at zoom 1)
  exponent: 1 / 3,
  radiusEase: 10, // per second: how fast the drawn size catches up after eating
  minMassFactor: 0.5, // collisions can't shrink you below this × the level's starting mass
};

export const BLACK_HOLE = {
  photonRingWidth: 2, // screen px
  photonRingColor: COLORS.text,
  haloWidth: 4,
  haloAlpha: 0.25,
  haloColor: COLORS.amber,
};

// Accretion disk: a tilted, rotating amber ring around the black hole.
export const DISK = {
  innerRadius: 1.12, // × black hole radius
  outerRadius: 2.5,
  tilt: 0.34, // vertical squash: 1 = seen from above, smaller = more edge-on
  angle: -0.18, // radians; slight roll so it doesn't look perfectly flat
  spin: 0.9, // radians per second
  alpha: 0.8,
  eatBoost: 0.5, // extra brightness right after eating...
  boostDecay: 2.2, // ...fading at this rate per second
  maxBoost: 0.9,
  glowRadius: 3.4, // soft amber bloom, × black hole radius
  glowAlpha: 0.35,
};

// Movement feel: smooth acceleration and friction, never instant snapping.
// Speeds are in screen px/s and scale with the black hole so on-screen feel stays the same.
export const MOVEMENT = {
  maxSpeed: 520,
  acceleration: 1400, // how fast velocity turns toward the desired velocity
  arriveRadius: 220, // within this distance of the pointer the black hole eases off
  deadZone: 6,
  friction: 1.6, // drift decay after release (velocity × e^(-friction·t))
  stopSpeed: 4,
  // Max speed shrinks slightly as the black hole grows within a level, so big feels heavy:
  // × (radius ÷ level start radius)^(-sizeSpeedExponent), never below minSpeedFactor.
  sizeSpeedExponent: 0.15,
  minSpeedFactor: 0.6,
};

// Camera: centred on the black hole with slight lag; zooms out as it grows.
export const CAMERA = {
  followRate: 6, // per second: how fast the camera catches up with the black hole (lower = more lag)
  screenRadius: 28.8, // the black hole's on-screen radius (8% of 720 as a diameter)
  zoomEase: 3, // per second
  tierUpZoom: 0.42, // tier-up moment: zoom out to this × normal...
  tierUpHold: 1.2, // ...hold for this long (real seconds)...
  tierUpEase: 1.2, // ...then ease back at this rate per second
  closeUpZoom: 1.7, // big-swallow close-up: push in to this × normal
  closeUpTime: 1.0,
};

// ---------------------------------------------------------------------------
// Eating, danger and growth rules
// ---------------------------------------------------------------------------

export const EATING = {
  edibleRatio: 0.9, // edible only if object radius < 90% of the black hole's radius
  // Fraction of an object's mass value added when you swallow it. The single main knob for
  // level length: lower = more eating needed (levels tuned to last about 1–2.5 minutes).
  massGain: 0.3,
  pullRangeMultiplier: 3, // pull zone = 3 × black hole radius (more with Gravity Pull)
  pullAcceleration: 1200, // screen px/s² at the centre, fading to 0 at the zone edge
  pullDrag: 3, // pulled objects match the black hole's motion so they fall in
  releaseDrag: 1.5, // objects that escape the pull zone slow back to their lazy drift
};

// Touching anything bigger than you.
export const DANGER = {
  massLoss: 0.1, // 10% of current mass (Hawking Shield reduces it)
  bounceSpeed: 620, // screen px/s pushed away from the object
  invulnerableTime: 0.9, // seconds after a hit before the next one can cost mass
  contactFactor: 0.85, // touching = distance < (your radius + theirs × this); a bit forgiving
  shake: 0.012,
  shakeTime: 0.22,
};

// Sandbox and scenarios: no danger; sitting inside something bigger eats it from the inside.
export const FEEDING = {
  rate: 0.02, // mass per second = rate × (black hole radius in world px)²
  debrisPerSecond: 40,
  shake: 0.004,
};

// ---------------------------------------------------------------------------
// Levels and tiers
// ---------------------------------------------------------------------------

export const LEVEL = {
  timeLimit: 180, // seconds (3 minutes in the prototype)
  worldRadius: 80, // play area radius, × the black hole's starting radius
  reviveSeconds: 30,
  winDelay: 1.4, // seconds of slow-motion after reaching the target before the results screen
  timeWarning: 20, // timer turns red under this many seconds
};

// Five tiers. A level starts at its tier's starting mass (plus Head Start).
// Spawn weights: ~70% edible at the start, ~25% edible after some growth, ~5% dangerous all level.
export const TIERS = [
  {
    id: 1, name: 'Dust Eater', startMass: 20,
    weights: { dust: 30, iceCrystal: 20, pebble: 20, smallRock: 25, asteroid: 5 },
  },
  {
    id: 2, name: 'Rock Crusher', startMass: 100,
    weights: { dust: 10, pebble: 25, smallRock: 22, asteroid: 13, comet: 13, satellite: 12, moon: 5 },
  },
  {
    id: 3, name: 'World Devourer', startMass: 1000,
    weights: { smallRock: 15, asteroid: 22, comet: 10, satellite: 10, moon: 13, dwarfPlanet: 15, rockyPlanet: 10, gasGiant: 5 },
  },
  {
    id: 4, name: 'Star Swallower', startMass: 10000,
    weights: { satellite: 15, moon: 20, dwarfPlanet: 12, rockyPlanet: 10, gasGiant: 13, redDwarf: 15, sunLikeStar: 10, giantStar: 5 },
  },
  {
    id: 5, name: 'Galaxy Eater', startMass: 100000,
    weights: { gasGiant: 15, redDwarf: 15, sunLikeStar: 15, giantStar: 15, clusterStar: 10, starCluster: 20, rival: 10 },
  },
];

// 15 levels, 3 per tier. The last level of each tier ends at the next tier's starting mass.
// Level 15 is the boss: reach the target mass, then dive into Sagittarius A* to merge.
export const LEVELS = [
  { tier: 1, target: 50 },
  { tier: 1, target: 75 },
  { tier: 1, target: 100 },
  { tier: 2, target: 200 },
  { tier: 2, target: 450 },
  { tier: 2, target: 1000 },
  { tier: 3, target: 2000 },
  { tier: 3, target: 4500 },
  { tier: 3, target: 10000 },
  { tier: 4, target: 20000 },
  { tier: 4, target: 45000 },
  { tier: 4, target: 100000 },
  { tier: 5, target: 180000 },
  { tier: 5, target: 300000 },
  { tier: 5, target: 500000, boss: true },
];

export const SANDBOX_UNLOCK_LEVEL = 3; // sandbox opens after clearing this level

// ---------------------------------------------------------------------------
// Objects
// ---------------------------------------------------------------------------
// mass: game mass (SPEC.md). radius: world px, chosen so each object becomes edible at a
// sensible point (edible when radius < 0.9 × black hole radius).
// drift: [min, max] speed in the object's own radii per second. spin: [min, max] rad/s.
// texRadius: texture resolution (px) for the body; keep small for performance.
// bonus: Stardust multiplier on this object's mass (satellites and comets give 2×).

export const OBJECTS = {
  dust: {
    name: 'Dust', mass: 1, radius: 8, behaviour: 'drift',
    drift: [0.8, 2.6], spin: [0, 0], color: 0xd6b48c, texRadius: 16,
  },
  iceCrystal: {
    name: 'Ice crystal', mass: 2, radius: 10, behaviour: 'drift',
    drift: [0.6, 2], spin: [0.2, 0.6], color: 0xcfe3f5, sparkle: 0.45, sparkleSpeed: 4, texRadius: 20,
  },
  pebble: {
    name: 'Pebble', mass: 4, radius: 15, behaviour: 'drift',
    drift: [0.4, 1.1], spin: [0.1, 0.4], color: 0x8a837c, texRadius: 30,
  },
  smallRock: {
    name: 'Small rock', mass: 10, radius: 36, behaviour: 'drift',
    drift: [0.12, 0.35], spin: [0.15, 0.45], color: 0x8c7b6b, texRadius: 64,
  },
  asteroid: {
    name: 'Asteroid', mass: 30, radius: 41, behaviour: 'drift', // moves in a straight line
    drift: [0.6, 1.2], spin: [0.1, 0.35], color: 0x6f665e, texRadius: 72,
  },
  comet: {
    name: 'Comet', mass: 60, radius: 52, behaviour: 'comet',
    drift: [2.6, 3.8], spin: [0, 0], color: 0xbfe4ff, texRadius: 40, bonus: 2,
  },
  satellite: {
    name: 'Satellite', mass: 90, radius: 59, behaviour: 'orbitPoint',
    orbitRadius: [2.5, 5], orbitPeriod: [9, 16], spin: [0.3, 0.8], color: 0xc9ccd2, texRadius: 64, bonus: 2,
  },
  moon: {
    name: 'Moon', mass: 300, radius: 89, behaviour: 'orbitPoint',
    orbitRadius: [1.5, 3], orbitPeriod: [20, 34], spin: [0.05, 0.15], color: 0xa9a8a4, texRadius: 80,
  },
  dwarfPlanet: {
    name: 'Dwarf planet', mass: 600, radius: 112, behaviour: 'orbitPoint',
    orbitRadius: [1, 2], orbitPeriod: [40, 60], spin: [0.03, 0.1], color: 0xc8b8a0, texRadius: 80,
  },
  rockyPlanet: {
    name: 'Rocky planet', mass: 1000, radius: 133, behaviour: 'drift',
    drift: [0.05, 0.15], spin: [0.03, 0.08], color: 0xb4674a, texRadius: 88,
    tints: [0xffffff, 0x9fc0ff, 0xd8e7a8, 0xffd2a8],
    children: [{ type: 'moon', count: [0, 1], orbitRadius: [2.0, 2.6], orbitPeriod: [14, 22] }],
  },
  gasGiant: {
    name: 'Gas giant', mass: 3000, radius: 192, behaviour: 'drift',
    drift: [0.04, 0.1], spin: [0, 0], color: 0xd9a066, texRadius: 88, tints: [0xffffff, 0xcfe0ff, 0xffe0c0],
    children: [{ type: 'moon', count: [1, 2], orbitRadius: [2.2, 3.0], orbitPeriod: [16, 26] }],
  },
  redDwarf: {
    name: 'Red dwarf', mass: 6000, radius: 242, behaviour: 'drift',
    drift: [0.03, 0.08], spin: [0, 0], color: 0xff6a3d, texRadius: 80, glow: true,
    children: [{ type: 'rockyPlanet', count: [0, 2], orbitRadius: [2.4, 3.4], orbitPeriod: [24, 40] }],
  },
  sunLikeStar: {
    name: 'Sun-like star', mass: 10000, radius: 288, behaviour: 'drift',
    drift: [0.03, 0.07], spin: [0, 0], color: 0xffe08a, texRadius: 80, glow: true,
    push: { range: 3.2, accel: 700, maxSizeRatio: 0.4 }, // pushes small objects outward (screen px/s²)
  },
  giantStar: {
    name: 'Giant star', mass: 30000, radius: 415, behaviour: 'drift',
    drift: [0.02, 0.05], spin: [0, 0], color: 0xff8a4a, texRadius: 88, glow: true,
  },
  starCluster: {
    name: 'Star cluster', mass: 60000, radius: 524, behaviour: 'cluster',
    drift: [0.02, 0.05], spin: [0.05, 0.12], color: 0xcfe0ff, texRadius: 96,
    scatter: { range: 3.5, pieces: 6, piece: 'clusterStar', speed: 1.4 }, // scatters when you get this close (× its radius)
  },
  clusterStar: {
    name: 'Cluster star', mass: 10000, radius: 200, behaviour: 'drift',
    drift: [0.05, 0.12], spin: [0, 0], color: 0xd8e6ff, texRadius: 64, glow: true,
  },
  rival: {
    name: 'Rival black hole', mass: 100000, radius: 0, behaviour: 'rival', // radius comes from its mass
    spin: [0, 0], color: COLORS.rivalRing, texRadius: 96,
  },

  // Named objects for the "What if…?" scenarios. realKg is the real mass shown on labels.
  earth: { name: 'Earth', mass: 1000, radius: 300, behaviour: 'static', spin: [0.05, 0.05], color: 0x3a7bd5, texRadius: 256, realKg: 5.97e24, named: true, debris: [0x3a7bd5, 0x5d9b4a, 0x9b7a55, 0xffffff] },
  theMoon: { name: 'The Moon', mass: 300, radius: 80, behaviour: 'static', spin: [0.02, 0.02], color: 0xa9a8a4, texRadius: 128, realKg: 7.35e22, named: true },
  sun: { name: 'The Sun', mass: 10000, radius: 520, behaviour: 'static', spin: [0, 0], color: 0xffd36b, texRadius: 256, realKg: 1.989e30, named: true, glow: true, debris: [0xffe08a, 0xff9a4d, 0xff6a3d, 0xfff4d6] },
  mercury: { name: 'Mercury', mass: 450, radius: 40, behaviour: 'static', spin: [0.05, 0.05], color: 0x9a8f86, texRadius: 64, realKg: 3.30e23, named: true },
  venus: { name: 'Venus', mass: 950, radius: 75, behaviour: 'static', spin: [0.05, 0.05], color: 0xe3c58c, texRadius: 64, realKg: 4.87e24, named: true },
  earthSmall: { name: 'Earth', mass: 1000, radius: 78, behaviour: 'static', spin: [0.05, 0.05], color: 0x3a7bd5, texRadius: 64, realKg: 5.97e24, named: true, textureOf: 'earth' },
  mars: { name: 'Mars', mass: 520, radius: 50, behaviour: 'static', spin: [0.05, 0.05], color: 0xc1603a, texRadius: 64, realKg: 6.42e23, named: true },
  jupiter: { name: 'Jupiter', mass: 3000, radius: 195, behaviour: 'static', spin: [0, 0], color: 0xd9a066, texRadius: 128, realKg: 1.898e27, named: true, textureOf: 'gasGiant' },
  saturn: { name: 'Saturn', mass: 2200, radius: 172, behaviour: 'static', spin: [0, 0], color: 0xe8cf94, texRadius: 128, realKg: 5.68e26, named: true },
  uranus: { name: 'Uranus', mass: 1500, radius: 120, behaviour: 'static', spin: [0, 0], color: 0x9fd9e0, texRadius: 96, realKg: 8.68e25, named: true },
  neptune: { name: 'Neptune', mass: 1550, radius: 118, behaviour: 'static', spin: [0, 0], color: 0x4f74d9, texRadius: 96, realKg: 1.02e26, named: true },
};

export const SPAWNER = {
  count: 160, // free-floating objects kept around the player
  reserve: 80, // extra pooled objects for moons, orbiting planets and scattered stars (cap 300 total)
  spawnRadius: 2.2, // objects live within this × the view's half-diagonal around the camera...
  recycleRadius: 2.8, // ...and are moved back near the player once they drift past this
  respawnMargin: 80, // screen px beyond the view edge where eaten objects reappear
  activeMargin: 500, // screen px beyond the view; objects farther away are paused
  startClear: 3.5, // × black hole radius kept empty at level start
  maxRivals: 4,
  maxDangerRings: 40,
  dangerRingAlpha: 0.7,
  dangerRingWidth: 1.06, // ring drawn at this × the object's radius
};

// Rival black holes (Tier 5): wander, eat objects, chase you if bigger, flee if smaller.
export const RIVAL = {
  massRange: [0.45, 1.9], // spawn mass × your current mass
  maxMassFactor: 3, // rivals stop growing at this × your level's starting mass
  maxSpeed: 330, // screen px/s (slower than you)
  acceleration: 700,
  chaseRange: 9, // × its radius: chases you if it's big enough to eat you
  fleeRange: 7, // × its radius: flees if you can eat it
  seekRange: 10, // looks for food within this × its radius
  thinkInterval: 0.4,
  eatInset: 0.35, // you're eaten when your centre is this far inside its edge (× your radius)
};

// Level 15 boss.
export const BOSS = {
  name: 'Sagittarius A*',
  mass: 1900000, // game mass (≈ 8 × 10³⁶ kg on the display scale)
  realKg: 8.0e36,
  startDistance: 7, // you start this many boss radii away
  pull: 760, // screen px/s² pulling you in at the boss's edge...
  pullFalloff: 1.6, // ...falling off with (edge distance ratio)^this
  pullRange: 16, // × boss radius: no pull beyond this
  objectPull: 400, // screen px/s² on objects
};

// ---------------------------------------------------------------------------
// Economy and upgrades
// ---------------------------------------------------------------------------

export const ECONOMY = {
  // SPEC says "mass eaten ÷ 10", but game mass spans 20 → 1,000,000 across tiers, so raw mass
  // would make Tier 1 worthless and Tier 5 break the shop. Instead Stardust scales with how
  // many times your starting mass you ate: floor(perStartMass × massEaten ÷ levelStartMass).
  // ~60 Stardust for a first clear of level 1, so the first upgrade (50) is affordable.
  stardustPerStartMass: 50,
  failKeep: 0.5, // fraction kept on fail
  dailyWinMultiplier: 2, // first win of the day
  costGrowth: 1.5, // each upgrade level costs 1.5× the previous
};

export const UPGRADES = {
  gravityPull: { name: 'Gravity Pull', effect: '+10% pull range', perLevel: 0.1, cost: 50, maxLevel: 10 },
  thrusters: { name: 'Thrusters', effect: '+8% top speed', perLevel: 0.08, cost: 50, maxLevel: 10 },
  headStart: { name: 'Head Start', effect: '+10% starting mass', perLevel: 0.1, cost: 100, maxLevel: 10 },
  timeDilation: { name: 'Time Dilation', effect: '+10 s per level', perLevel: 10, cost: 75, maxLevel: 10 },
  hawkingShield: { name: 'Hawking Shield', effect: '−1% mass lost on impact', perLevel: 0.01, cost: 100, maxLevel: 10 },
  darkMatterDrip: { name: 'Dark Matter Drip', effect: '+5 Stardust per hour offline', perLevel: 5, cost: 150, maxLevel: 10, capHours: 8 },
};

export const ADS = {
  fakeDelay: 1, // seconds: placeholder for a real rewarded ad
  reviveSeconds: 30,
};

// ---------------------------------------------------------------------------
// Visual effects
// ---------------------------------------------------------------------------

export const EFFECTS = {
  spaghettiTime: 0.4, // swallow animation length
  spaghettiStretch: 3.2, // how long the object stretches toward the centre
  bigSpaghettiTime: 1.0,
  bigSpaghettiStretch: 7,
  flashSize: 1.6, // × black hole radius
  flashTime: 0.28,
  debrisCount: 8, // particles per swallow (scaled down for tiny objects)
  maxParticles: 160,
  particleLife: [0.5, 1.1],
  eatShake: 0.006, // shake for eating something big (relative size ≥ shakeRatio)
  shakeRatio: 0.55,
  shakeTime: 0.18,
  // Big swallow: close-up + slow motion + bass drop
  bigSwallowRatio: 0.7, // object radius ≥ this × yours counts as a big swallow
  bigSwallowCooldown: 7,
  slowMoScale: 0.3,
  slowMoTime: 1.0, // real seconds
  tierUpSlowMo: 0.25,
  tierUpSlowMoTime: 1.4,
  bigShake: 0.02,
  bigShakeTime: 0.45,
  shockwaveTime: 0.9,
};

// "Low graphics" turns these off.
export const LOW_GRAPHICS = {
  starLayers: 1, // only the first starfield layer
  particles: false,
  glow: false,
  spaghetti: false, // swallowed objects just shrink and fade
  shakeScale: 0.4,
};

// Starfield: parallax layers drawn as tiling textures. Far layers move slower.
export const STARFIELD = {
  tileSize: 1024,
  layers: [
    { scrollFactor: 0.15, count: 220, minRadius: 0.5, maxRadius: 1.1, minAlpha: 0.25, maxAlpha: 0.55 },
    { scrollFactor: 0.35, count: 110, minRadius: 0.8, maxRadius: 1.6, minAlpha: 0.4, maxAlpha: 0.75 },
    { scrollFactor: 0.65, count: 45, minRadius: 1.2, maxRadius: 2.2, minAlpha: 0.6, maxAlpha: 1.0 },
  ],
  amberShare: 0.08,
};

export const WORLD_EDGE = {
  lineWidth: 2, // screen px
  alpha: 0.9,
};

// ---------------------------------------------------------------------------
// Mass display: game mass → kilograms
// ---------------------------------------------------------------------------
// Game mass spans 1 → 2,000,000; real masses span ~10¹² → 10³⁷ kg. The counter maps one to
// the other by interpolating log10(kg) between these anchors, picked so the real-object
// levels land near real values: 300 ≈ the Moon, 1,000 ≈ Earth, 3,000 ≈ Jupiter,
// 10,000 ≈ the Sun. It's a game scale, not physics.
export const MASS_SCALE = [
  [1, 12],
  [20, 15],
  [100, 18.3],
  [300, 22.866],
  [1000, 24.776],
  [3000, 27.278],
  [10000, 30.299],
  [30000, 31.0],
  [100000, 31.8],
  [1000000, 35.0],
  [2000000, 37.0],
];

// Mass counter flashes when you pass these.
export const MILESTONES = [
  { kg: 7.35e22, label: '1 MOON MASS' },
  { kg: 5.97e24, label: '1 EARTH MASS' },
  { kg: 1.898e27, label: '1 JUPITER MASS' },
  { kg: 1.989e30, label: '1 SUN MASS' },
  { kg: 1.989e31, label: '10 SUN MASSES' },
  { kg: 1.989e33, label: '1,000 SUN MASSES' },
  { kg: 1.989e36, label: '1 MILLION SUNS' },
];

// ---------------------------------------------------------------------------
// HUD, recording and sound
// ---------------------------------------------------------------------------

// In-canvas text sizes are in design pixels (the 720-wide canvas, ~1.85× a 390 px phone).
export const HUD = {
  labelTime: 1.5, // swallow label on screen time
  labelMinRatio: 0.35, // label swallows of objects at least this × your radius (always for named)
  milestoneTime: 2.2,
  fontMono: '"Space Mono", ui-monospace, Menlo, Consolas, monospace',
  fontHead: '"Barlow Condensed", "Arial Narrow", sans-serif',
  fontBody: '"IBM Plex Sans", system-ui, sans-serif',
};

export const RECORDING = {
  clipSeconds: 20, // keep about the last 20 s
  restartEvery: 10, // a fresh recorder starts every 10 s...
  recorders: 3, // ...and up to 3 overlap, so a clip is 20–30 s long
  fps: 30,
  videoBitsPerSecond: 5000000,
  massPanelTop: 0.14, // recording overlay: mass counter starts 14% from the top...
  watermarkBottom: 0.86, // ...watermark ends 86% down (inside YouTube's safe area)
  fadeOut: 0.5, // fade to a dark frame before the clip ends (loops cleanly)
  captionTime: 2.5, // scenario title caption at the start
  factTime: 4.5,
};

export const AUDIO = {
  master: 0.8,
  music: 0.18, // kept quiet so trending audio can go over clips
  sfx: 0.9,
  rumbleMax: 0.35, // rumble volume at full pull
  swallowCooldown: 0.05,
};
