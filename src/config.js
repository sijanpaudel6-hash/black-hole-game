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

export const SANDBOX_UNLOCK_LEVEL = 3; // sandbox opens after clearing this Classic level...
export const SANDBOX_UNLOCK_ERA = 2; // ...or after reaching this era in a run

// ---------------------------------------------------------------------------
// Run mode: "One Life of a Black Hole" (the main mode)
// ---------------------------------------------------------------------------
// One run takes the black hole through five eras. Each era has a mass goal (the next era's
// starting mass); reaching it triggers the tier-up moment and the next era. No timer:
// in Cosmic Dawn the black hole evaporates (Hawking radiation) unless it keeps eating.
// The Far Future has no goal: food runs out and the run ends with the black hole as the
// last light, evaporating.
//
// gain: × mass gained from each swallow in this era (on top of EATING.massGain); the main
// per-era knob for era length (targets: Cosmic Dawn under 1 min, a full run 6–10 min).
// evaporation: mass lost per second = rate × eraStartMass × (eraStartMass ÷ mass)^exponent
// (small black holes evaporate faster, like real Hawking radiation). canKill: whether it can
// evaporate you completely (mass below RUN.deathFactor × the run's starting mass).
// age: [start, end] cosmic age in years shown on the HUD (log-interpolated by progress).
// stars: starfield brightness [at era start, at era end]. countScale: × SPAWNER.count objects.
export const RUN = {
  deathFactor: 0.5,
  completeBonus: 1.5, // Stardust × this when you reach the end of the Far Future
  eraEndDelay: 1.6, // seconds of tier-up slow motion before the new era's objects take over
  eras: [
    {
      id: 1, name: 'Cosmic Dawn', startMass: 20, goal: 100, gain: 2.5,
      blurb: 'A primordial black hole in a fog of gas. Eat, or evaporate.',
      weights: { gasWisp: 35, dust: 20, iceCrystal: 15, gasCloud: 25, protostar: 5 },
      background: 0x0e0b1a, stars: [0.15, 0.3], age: [5e7, 2e8],
      evaporation: { rate: 0.008, exponent: 2, canKill: true },
    },
    {
      id: 2, name: 'First Stars', startMass: 100, goal: 1000, gain: 0.45,
      blurb: 'Giant early stars light up the dark.',
      weights: { gasWisp: 15, gasCloud: 25, protostar: 30, youngStar: 13, blueStar: 12, blueGiant: 5 },
      background: 0x080a17, stars: [0.45, 0.8], age: [2e8, 1e9],
    },
    {
      id: 3, name: 'Galaxy Era', startMass: 1000, goal: 10000, gain: 0.3,
      blurb: 'Rival black holes compete for the same food. Outgrow them or flee.',
      weights: { youngStar: 10, blueStar: 15, blueGiant: 20, moon: 15, comet: 10, dwarfPlanet: 10, rockyPlanet: 10, gasGiant: 5, rival: 10 },
      background: 0x07080c, stars: [0.9, 1], age: [1e9, 3e9],
    },
    {
      id: 4, name: 'Quasar Era', startMass: 10000, goal: 100000, gain: 0.22, countScale: 1.4, quasar: true,
      blurb: 'Food is everywhere. Feed fast enough to ignite as a quasar.',
      weights: { moon: 15, dwarfPlanet: 10, rockyPlanet: 20, gasGiant: 25, redDwarf: 15, sunLikeStar: 10, giantStar: 5 },
      background: 0x0e0a08, stars: [1, 1], age: [3e9, 1.38e10],
    },
    {
      id: 5, name: 'Far Future', startMass: 100000, goal: null, duration: 40,
      blurb: 'The stars are dying. Eat what is left.',
      weights: { whiteDwarf: 30, redDwarf: 30, gasGiant: 15, giantStar: 10, rival: 8, clusterStar: 7 },
      background: 0x030304, stars: [0.6, 0], age: [1e14, 1e100],
      evaporation: { rate: 0.003, exponent: 1, canKill: false },
    },
  ],
};

// Quasar Era: gain this fraction of your mass within `window` seconds to ignite as a quasar.
export const QUASAR = {
  window: 4,
  igniteGain: 0.1,
  duration: 8, // seconds ignited
  pullBoost: 1.8, // × pull range while ignited
  cooldown: 6,
  jetLength: 9, // × black hole radius
  jetWidth: 0.55,
};

// The end of the Far Future: everything fades and the black hole evaporates into the dark.
export const FINALE = {
  fadeObjects: 2.5,
  evaporateTime: 8, // seconds to evaporate completely
  zoomOut: 0.45,
  sparkEvery: 0.18, // seconds between little flashes of Hawking radiation
  factTime: 4.5,
  fact: 'When the last black holes evaporate, around 10¹⁰⁰ years from now, the universe goes dark.',
};

// ---------------------------------------------------------------------------
// Cosmic powers (runs only): pick 1 of 3 at every era change
// ---------------------------------------------------------------------------
// Each power has 3 levels; picking it again levels it up. Per-level values are arrays
// indexed by level − 1. Names, descriptions and synergies' text live in src/data/powers.js.
export const POWERS = {
  choices: 3, // cards offered at each era change
  maxLevel: 3,
  offerOwnedChance: 0.6, // chance one of the cards is a power you already own (to level it)
  synergyOfferChance: 0.5, // chance one card completes a synergy when one is possible
  // Kerr Spin: the pull swirls, so objects orbit in; also widens the pull.
  kerrSpin: {
    pullBonus: [0.2, 0.35, 0.5], // + × pull range
    swirl: [0.9, 1.25, 1.6], // tangential pull, × the normal pull acceleration
    diskSpin: [1.8, 2.4, 3], // × accretion disk spin (looks)
  },
  // Relativistic Jets: tap the JETS button (or Space) to fire twin jets along your motion.
  jets: {
    cooldown: [7, 5.5, 4], // seconds between shots
    duration: 0.9, // seconds a shot lasts
    length: [7, 9, 11], // × your radius
    width: 0.45, // half-width, × your radius
    breakRatio: [2.2, 3, 4], // shatters objects up to this × your radius (bigger ones get knocked back)
    rivalShrink: 0.25, // rivals hit lose this share of their mass
    knockback: 900, // screen px/s given to things too big to shatter
  },
  // Tidal Shredder: objects a bit bigger than you crumble when you pass close.
  shredder: {
    maxRatio: [1.35, 1.7, 2.1], // crumbles objects up to this × your radius
    range: [1.25, 1.4, 1.55], // when the gap is under (your radius + theirs) × (range − 1)
  },
  // Dark Matter Halo: an invisible halo widens and strengthens your pull.
  halo: {
    pullBonus: [0.4, 0.75, 1.1],
    pullStrength: [0.25, 0.5, 0.75], // + × pull acceleration
    ringAlpha: 0.14,
  },
  // Gravitational Lens: the world slows near massive objects (you don't), and hidden
  // treasures appear: some objects glow blue and are worth extra.
  lens: {
    slowRange: [3, 4, 5], // world slows when a dangerous object's edge is within this × your radius
    slowScale: [0.65, 0.55, 0.45], // world speed at the closest
    hiddenChance: [0.08, 0.12, 0.16], // share of new objects that are hidden treasures
    hiddenMass: 2.5, // treasures give this × mass...
    hiddenStardust: 3, // ...and count this × for Stardust
  },
  // Hawking Bloom: losing mass releases a burst that pushes hazards away.
  bloom: {
    lossCut: [0.3, 0.5, 0.7], // share of collision mass loss prevented
    radius: [7, 9, 11], // burst radius, × your radius
    push: 1400, // screen px/s given to hazards at the centre
    invulnerable: [1.4, 1.8, 2.2], // seconds of protection after a burst
    lastGasp: [false, false, true], // level 3: once per run, a rival about to eat you is blasted away
  },
  // Synergies: owning both powers unlocks the combo.
  pulsar: { sweepTurns: 1, autoFire: true, cooldownScale: 0.85 }, // Kerr Spin + Jets: jets fire themselves and sweep a full circle
  buzzsaw: { ratioBonus: 0.6, rangeBonus: 0.35, chunkPull: 2.5, ringRadius: 1.7 }, // Kerr Spin + Shredder: a spinning debris saw
  lensedJets: { lengthScale: 1.5, seekCone: 1.1 }, // Jets + Lens: jets bend toward stars (cone in radians)
  fragments: { pieces: [4, 6], keep: 0.8, maxRadius: 0.55, speed: 2.2 }, // shattered objects: pieces, mass kept, size × your radius, fling speed (own radii/s)
};

// ---------------------------------------------------------------------------
// The Universe Talks Back: civilisations (runs only). Words in src/data/civilisations.js.
// ---------------------------------------------------------------------------
export const CIVS = {
  eras: [3, 4, 5], // eras with civilisations (life needs the heavy elements earlier stars made)
  firstDelay: 10, // seconds into an era before the first one appears
  interval: [20, 30], // seconds between civilisations (after the last one is dealt with)
  sizeRatio: [0.5, 0.68], // planet radius × yours when it appears (always edible)
  eatMass: 0.08, // eating one adds this share of your current mass
  eatStardust: 40, // Stardust bonus for eating one...
  spareStardust: 0, // ...and for sparing one (sparing gives a boon instead)
  hailRange: 6, // they hail you when your edge is within this × your radius of theirs
  choiceTime: 9, // real seconds to decide before the message closes
  slowMo: 0.35, // world speed while you read
  types: { 3: ['rockyPlanet', 'moon', 'dwarfPlanet'], 4: ['rockyPlanet', 'gasGiant', 'moon'], 5: ['rockyPlanet', 'dwarfPlanet'] },
  techWeights: {
    3: { tribal: 3, industrial: 3, spacefaring: 2 },
    4: { industrial: 1, spacefaring: 3, empire: 2, ancient: 1 },
    5: { spacefaring: 1, empire: 2, ancient: 3 },
  },
  // Reputation: every civilisation you eat makes the next ones more scared, hostile or
  // likely to flee; every one you spare makes them hopeful.
  terrifiedPerEat: 1.2, // mood weight added per civilisation eaten
  hostilePerEat: 1.0,
  hopefulPerSpare: 1.4,
  fleeChancePerEat: 0.1, // chance a civilisation just runs away (max fleeChanceMax)
  fleeChanceMax: 0.4,
  fleeSpeed: 2.6, // own radii per second
  eatPull: 2.2, // EAT: the planet is hauled in at this × your radius per second
  // Hostile civilisations fire missiles at you.
  missiles: { count: 4, every: 1.1, speed: 430, turn: 2.2, life: 4.5, massLoss: 0.025, knock: 260, size: 0.22 },
  // What sparing one gives (see BOONS in src/data/civilisations.js).
  boons: {
    weights: { map: 3, neutron: 2, shield: 2, fuel: 3, stardust: 2, gravity: 2, escort: 1 },
    fuel: 0.06, // + share of your mass
    shieldHits: 2,
    gravity: 0.15, // + × pull range for the rest of the run
    escort: 40, // seconds rivals keep away
    stardust: 60,
    feastCount: 14, // star map: this many meals...
    feastDistance: 1.4, // ...this × the view's half-diagonal away
    neutronMass: 0.14, // hidden neutron star: eating it adds this share of your mass
    pointerTime: 30, // seconds the scanner arrow points at a gift
  },
};

// Galactic News ticker (headlines in src/data/news.js).
export const NEWS = {
  showTime: 6.5, // seconds per headline (long ones scroll)
  scrollSpeed: 110, // design px/s for long headlines
  fillerEvery: [28, 40], // seconds of quiet before a filler headline
  maxQueue: 3,
};

// ---------------------------------------------------------------------------
// Go viral: Daily Universe, share card, Milky Way challenge, Feed Your Hometown
// ---------------------------------------------------------------------------

// Daily Universe: the same seed for everyone on the same UTC day (no server needed).
// One modifier per day, picked from the seed. Each modifier's fields are read where noted.
export const DAILY = {
  epoch: '2026-11-01', // Daily Universe #1
  modifiers: [
    { id: 'thickFog', name: 'Thick fog', desc: 'Cosmic Dawn is 40% fuller of gas', dawnCount: 1.4 },
    { id: 'crowded', name: 'Crowded galaxy', desc: 'Twice as many rival black holes', rivalWeight: 2 },
    { id: 'chatty', name: 'Chatty galaxy', desc: 'Civilisations call twice as often', civInterval: 0.5 },
    { id: 'quasarSeason', name: 'Quasar season', desc: 'Igniting as a quasar is 30% easier', quasarIgnite: 0.7 },
    { id: 'gifted', name: 'Gifted start', desc: 'Start with a random cosmic power', startPower: true },
    { id: 'heavySeed', name: 'Heavy seed', desc: 'Start 30% heavier', startMass: 1.3 },
    { id: 'restless', name: 'Restless cosmos', desc: 'Cosmic events come twice as often', eventInterval: 0.5 },
    { id: 'longNight', name: 'Long night', desc: 'The Far Future lasts 50% longer', farFuture: 1.5 },
  ],
};

// End-of-run share card (src/systems/share.js).
export const SHARE = {
  url: '', // link in the share text; '' = the page the game is on
  eraEmoji: ['🌑', '⭐', '🌌', '💥', '🕯️'], // one per era reached
  deathEmoji: '💀',
  emptyEmoji: '⬛',
  challengeSeconds: 600, // "under 10 minutes"
};

// "Eat the Milky Way in under 10 minutes": clear Cosmic Dawn → Quasar Era against the clock.
export const CHALLENGE = {
  seconds: 600,
  boardSize: 10, // local best times kept (a global leaderboard needs a server: see SPEC "Later")
};

// Feed Your Hometown (Sandbox): pick a city or country, watch your black hole swallow it.
export const HOMETOWN = {
  maxResults: 8,
  minChars: 2,
  earthRadius: 520, // world px
  globeTexture: 768, // px
  approachTime: 3.2, // seconds for the black hole to reach the city
  zoomIn: 1.9, // camera zoom on the city
  biteTime: 2.2, // seconds of swallowing
  biteRadius: 0.16, // hole left in the globe, × Earth's radius
  nearestBlackHoleLy: 1560, // Gaia BH1, the nearest known black hole (light-years)
};

// ---------------------------------------------------------------------------
// Cosmic events (src/systems/events.js): random 10–30 s situations in runs, and What if…?s
// ---------------------------------------------------------------------------
// Sizes are × your radius, speeds in your radii per second, shares are "eating it adds this
// share of your mass". perEra lists which events can happen in each era.
export const EVENTS = {
  firstDelay: 22, // seconds into an era before the first event
  interval: [38, 55], // seconds between events
  perEra: {
    1: ['darkMatter'],
    2: ['supernova', 'darkMatter', 'wormhole'],
    3: ['supernova', 'tidal', 'wanderer', 'wormhole', 'darkMatter'],
    4: ['supernova', 'tidal', 'wanderer', 'wormhole', 'whiteHole', 'darkMatter'],
    5: ['wanderer', 'whiteHole', 'darkMatter', 'tidal'],
  },
  supernova: {
    starSize: 1.6, warn: 3, collapse: 0.45, linger: 8,
    debris: 22, debrisSize: [0.3, 0.55], debrisSpeed: 3.2, debrisShare: 0.008,
    neutronShare: 0.06, shockRadius: 13, push: 1100,
  },
  tidal: { starSize: 1.5, missBy: 3, speed: 2.2, tidalRange: 2.2, pieces: 16, inward: 2.4, linger: 6, maxTime: 14 },
  wanderer: {
    massRatio: 3, startDistance: 1.3, speed: 7, missBy: 5, life: 11, pullRange: 7, pull: 900, playerPull: 500,
    trailEvery: 0.3, starSize: [0.35, 0.6], starShare: 0.012,
  },
  wormhole: { size: 1.5, life: 16, pull: 500, exitDistance: 3.5, feast: 22 },
  whiteHole: {
    size: 1.4, life: 15, every: 0.28, speed: 5, push: 700, pushRange: 5,
    bigChance: 0.25, bigSize: [1.15, 1.5], smallSize: [0.3, 0.55], smallShare: 0.006,
  },
  darkMatter: { clumps: 9, size: [0.4, 0.7], spread: 7, share: 0.015, alpha: 0.35, lensAlpha: 0.9, life: 40 },
  merger: { rings: 6, ringEvery: 0.12, chirpTime: 1.4 },
};

// ---------------------------------------------------------------------------
// Cosmic Craft (Sandbox): collide two things, see what real physics makes
// ---------------------------------------------------------------------------
// Recipes and words: src/data/recipes.js. Positions are fractions of the 720×1280 canvas.
export const CRAFT = {
  slotY: 0.3, // where the two picks sit (× height)
  itemRadius: 70, // design px
  resultRadius: 120,
  flyTime: 0.7, // seconds for the two to fly together
};

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
  // Run-mode era objects (sizes sit in the same slots as the tier objects above).
  gasWisp: {
    name: 'Gas wisp', mass: 2, radius: 12, behaviour: 'drift',
    drift: [0.5, 1.6], spin: [0.1, 0.3], color: 0x9aa4ff, texRadius: 24, gas: true,
  },
  gasCloud: {
    name: 'Gas cloud', mass: 10, radius: 36, behaviour: 'drift',
    drift: [0.12, 0.35], spin: [0.05, 0.15], color: 0x8a76e0, texRadius: 56, gas: true,
  },
  protostar: {
    name: 'Protostar', mass: 30, radius: 41, behaviour: 'drift',
    drift: [0.3, 0.7], spin: [0, 0], color: 0xffab66, texRadius: 40, glow: true,
  },
  youngStar: {
    name: 'Young star', mass: 60, radius: 52, behaviour: 'drift',
    drift: [0.2, 0.5], spin: [0, 0], color: 0xfff0c8, texRadius: 40, glow: true,
  },
  blueStar: {
    name: 'Blue star', mass: 90, radius: 59, behaviour: 'drift',
    drift: [0.15, 0.4], spin: [0, 0], color: 0xa8c4ff, texRadius: 44, glow: true,
  },
  blueGiant: {
    name: 'Blue giant', mass: 300, radius: 89, behaviour: 'drift',
    drift: [0.08, 0.2], spin: [0, 0], color: 0x7aa2ff, texRadius: 64, glow: true,
  },
  whiteDwarf: {
    name: 'White dwarf', mass: 6000, radius: 240, behaviour: 'drift',
    drift: [0.03, 0.08], spin: [0, 0], color: 0xdfe8ff, texRadius: 56, glow: true,
  },
  // A super-dense dead star, revealed by spared civilisations: small, but a huge meal (mass set when made).
  neutronStar: {
    name: 'Neutron star', mass: 1, radius: 10, behaviour: 'drift',
    drift: [0.2, 0.4], spin: [4, 6], color: 0xcfe4ff, texRadius: 40, glow: true,
  },
  // Dark matter clump: invisible except as a faint ring of bent starlight (mass set when made).
  darkMatter: {
    name: 'Dark matter', mass: 1, radius: 10, behaviour: 'drift',
    drift: [0.1, 0.3], spin: [0.2, 0.5], color: 0x9fc7ff, texRadius: 48,
  },
  // Chunks of something shattered by jets, the shredder or a cosmic event (size and mass set when made).
  fragment: {
    name: 'Fragment', mass: 1, radius: 10, behaviour: 'drift',
    drift: [0.3, 0.8], spin: [1, 3], color: 0xffffff, texRadius: 32,
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
  reserve: 140, // extra pooled objects: moons, orbiting planets, scattered stars, busier eras (cap 300 total)
  spawnRadius: 2.2, // objects live within this × the view's half-diagonal around the camera...
  recycleRadius: 2.8, // ...and are moved back near the player once they drift past this
  respawnMargin: 80, // screen px beyond the view edge where eaten objects reappear
  activeMargin: 500, // screen px beyond the view; objects farther away are paused
  startClear: 3.5, // × black hole radius kept empty at level start
  maxRivals: 4,
  maxDangerRings: 40,
  maxTreasureRings: 16, // Gravitational Lens treasures
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
  timeDilation: { name: 'Time Dilation', effect: '+10 s per level · −8% evaporation in runs', perLevel: 10, evaporationPerLevel: 0.08, cost: 75, maxLevel: 10 },
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
