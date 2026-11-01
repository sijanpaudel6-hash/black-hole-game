// Cosmic Craft: smash two things together and see what real physics makes.
// Every recipe here is hand-written and based on real astrophysics or chemistry (REAL).
// Order doesn't matter: A + B = B + A. Several recipes can make the same thing.
//
// Hook for later (needs a server + AI key, see SPEC "Later"): combinations not listed here
// could get an AI-imagined result, saved for every player with "First Discovery" credit and
// marked IMAGINED. Offline, unknown pairs simply don't react (src/systems/craft.js → combine()).

// Items: how each one looks. `tex` reuses a game object's texture; otherwise `draw` picks a
// drawn icon in src/systems/craftTextures.js (symbol = text on an orb).
export const ITEMS = {
  // ---- Starting items ----
  hydrogen: { name: 'Hydrogen', draw: 'atom', symbol: 'H', color: 0x9aa4ff, start: true },
  dust: { name: 'Dust', tex: 'dust', start: true },
  ice: { name: 'Ice', tex: 'iceCrystal', start: true },
  gasCloud: { name: 'Gas cloud', tex: 'gasCloud', start: true },
  gravity: { name: 'Gravity', draw: 'gravity', color: 0xb9a3ff, start: true },
  time: { name: 'Time', draw: 'time', color: 0xedeae4, start: true },
  spin: { name: 'Spin', draw: 'spin', color: 0x9fc7ff, start: true },
  light: { name: 'Light', draw: 'light', color: 0xfff0c8, start: true },
  darkMatter: { name: 'Dark matter', tex: 'darkMatter', start: true },
  // ---- Elements ----
  helium: { name: 'Helium', draw: 'atom', symbol: 'He', color: 0xffe08a },
  beryllium: { name: 'Beryllium-8', draw: 'atom', symbol: 'Be', color: 0xc9ccd2 },
  carbon: { name: 'Carbon', draw: 'atom', symbol: 'C', color: 0x8a8f98 },
  oxygen: { name: 'Oxygen', draw: 'atom', symbol: 'O', color: 0x7fb4ff },
  silicon: { name: 'Silicon', draw: 'atom', symbol: 'Si', color: 0xb4a48c },
  iron: { name: 'Iron', draw: 'atom', symbol: 'Fe', color: 0xd06a4a },
  gold: { name: 'Gold', draw: 'atom', symbol: 'Au', color: 0xffc94d },
  water: { name: 'Water', draw: 'atom', symbol: 'H2O', color: 0x4f8fe0 },
  // ---- Rocks and planets ----
  pebble: { name: 'Pebble', tex: 'pebble' },
  rock: { name: 'Silicate rock', tex: 'asteroid' },
  planetesimal: { name: 'Planetesimal', tex: 'smallRock' },
  rockyPlanet: { name: 'Rocky planet', tex: 'rockyPlanet' },
  oceanWorld: { name: 'Ocean world', tex: 'neptune' },
  gasGiant: { name: 'Gas giant', tex: 'gasGiant' },
  moon: { name: 'Moon', tex: 'moon' },
  comet: { name: 'Comet', tex: 'comet' },
  // ---- Stars ----
  protostar: { name: 'Protostar', tex: 'protostar' },
  star: { name: 'Star', tex: 'sunLikeStar' },
  blueGiant: { name: 'Blue giant', tex: 'blueGiant' },
  redGiant: { name: 'Red giant', tex: 'giantStar' },
  whiteDwarf: { name: 'White dwarf', tex: 'whiteDwarf' },
  blueStraggler: { name: 'Blue straggler', tex: 'blueStar' },
  starCluster: { name: 'Star cluster', tex: 'starCluster' },
  engulfedPlanet: { name: 'Engulfed planet', draw: 'burst', color: 0xffab66 },
  // ---- Dead stars and explosions ----
  supernova: { name: 'Supernova', draw: 'burst', color: 0xff9a4d },
  typeIa: { name: 'Type Ia supernova', draw: 'burst', color: 0xdfe8ff },
  nova: { name: 'Nova', draw: 'burst', color: 0xfff0c8 },
  kilonova: { name: 'Kilonova', draw: 'burst', color: 0xffc94d },
  neutronStar: { name: 'Neutron star', tex: 'neutronStar' },
  pulsar: { name: 'Pulsar', draw: 'pulsar', color: 0x9fc7ff },
  superbubble: { name: 'Superbubble', draw: 'bubble', color: 0xff6a3d },
  // ---- Black holes ----
  blackHole: { name: 'Black hole', draw: 'blackHole', color: 0xff9a4d },
  kerrBlackHole: { name: 'Spinning black hole', draw: 'blackHole', color: 0x9fc7ff },
  supermassive: { name: 'Supermassive black hole', draw: 'blackHole', color: 0xffe0b0 },
  quasar: { name: 'Quasar', draw: 'quasar', color: 0xcfe4ff },
  tidalDisruption: { name: 'Tidal disruption', draw: 'stream', color: 0xffe08a },
  gravitationalWaves: { name: 'Gravitational waves', draw: 'waves', color: 0x9fc7ff },
  photonRing: { name: 'Photon ring', draw: 'ring', color: 0xff9a4d },
  gravitationalLens: { name: 'Gravitational lens', draw: 'lens', color: 0x9fc7ff },
  // ---- Galaxies ----
  galaxy: { name: 'Spiral galaxy', draw: 'galaxy', color: 0xcfe0ff },
  ellipticalGalaxy: { name: 'Elliptical galaxy', draw: 'elliptical', color: 0xffe0b0 },
};

/** [a, b, result, why] — every one REAL. */
export const RECIPES = [
  // Making the elements
  ['hydrogen', 'hydrogen', 'helium', 'Stars fuse hydrogen into helium in their cores. That fusion is what makes the Sun shine.'],
  ['helium', 'helium', 'beryllium', 'Two helium nuclei fuse into beryllium-8, which falls apart again in a tiny fraction of a second.'],
  ['beryllium', 'helium', 'carbon', 'The triple-alpha process: inside red giants, a third helium nucleus hits the beryllium in time to make carbon.'],
  ['carbon', 'helium', 'oxygen', 'In old stars, carbon captures another helium nucleus and becomes oxygen.'],
  ['oxygen', 'oxygen', 'silicon', 'In stars many times heavier than the Sun, oxygen burning makes silicon in the last months of their lives.'],
  ['silicon', 'silicon', 'iron', 'Silicon burning, in a giant star\'s final day, builds iron. Fusing iron gives no energy back, so it\'s the end of the line.'],
  ['hydrogen', 'oxygen', 'water', 'Two hydrogen atoms and one oxygen make water, one of the most common molecules in the universe.'],
  ['silicon', 'oxygen', 'rock', 'Most rocks in planets are silicates: silicon and oxygen bonded together.'],
  // Building planets
  ['dust', 'dust', 'pebble', 'In a young solar system, dust grains stick together and grow into pebbles.'],
  ['pebble', 'pebble', 'planetesimal', 'Pebbles clump into kilometre-sized planetesimals, the building blocks of planets.'],
  ['planetesimal', 'planetesimal', 'rockyPlanet', 'Over millions of years, planetesimals collide and merge into rocky planets like Earth.'],
  ['ice', 'dust', 'comet', 'Comets are "dirty snowballs" of ice and dust left over from the birth of the Solar System.'],
  ['rockyPlanet', 'gasCloud', 'gasGiant', 'A big rocky core that grabs lots of gas grows into a gas giant like Jupiter.'],
  ['rockyPlanet', 'rockyPlanet', 'moon', 'Our Moon most likely formed when a Mars-sized world hit the young Earth and the debris clumped together.'],
  ['rockyPlanet', 'water', 'oceanWorld', 'A rocky planet with enough water is covered in oceans. Some moons, like Europa, hide oceans under their ice.'],
  // Making stars
  ['gasCloud', 'gravity', 'protostar', 'Gravity pulls a cloud of gas inward until its centre gets hot and dense: a protostar.'],
  ['protostar', 'time', 'star', 'After tens of millions of years a protostar\'s core starts fusing hydrogen, and a star is born.'],
  ['protostar', 'gasCloud', 'blueGiant', 'A young star that keeps gathering gas can grow into a huge, hot blue giant.'],
  ['protostar', 'protostar', 'starCluster', 'Stars are born in batches from the same cloud, so they start life in clusters.'],
  ['supernova', 'gasCloud', 'protostar', 'Supernova shockwaves squeeze nearby gas clouds and trigger new stars to form.'],
  ['star', 'star', 'blueStraggler', 'When two stars in a crowded cluster merge, the result looks younger and bluer than its neighbours: a blue straggler.'],
  ['star', 'rockyPlanet', 'engulfedPlanet', 'Stars can swallow close-in planets. In 2023 astronomers watched one do it for the first time (ZTF SLRN-2020).'],
  // How stars die
  ['star', 'time', 'redGiant', 'When a Sun-like star runs low on hydrogen in its core, it swells into a red giant. The Sun will in about 5 billion years.'],
  ['redGiant', 'time', 'whiteDwarf', 'A red giant puffs off its outer layers. The leftover core is a white dwarf about the size of Earth.'],
  ['blueGiant', 'time', 'supernova', 'A star more than about 8 times the Sun\'s mass ends its life in a core-collapse supernova.'],
  ['blueGiant', 'iron', 'supernova', 'Once a giant star\'s core fills with iron, fusion stops, the core collapses in under a second and the star explodes.'],
  ['whiteDwarf', 'star', 'nova', 'A white dwarf stealing gas from a companion star flares up as a nova, again and again.'],
  ['whiteDwarf', 'whiteDwarf', 'typeIa', 'Two white dwarfs merging can blow up as a Type Ia supernova, so evenly bright that astronomers use them to measure the universe.'],
  ['supernova', 'supernova', 'superbubble', 'Many supernovae in one region blow a hot bubble hundreds of light-years wide.'],
  ['supernova', 'gravity', 'neutronStar', 'The collapsed core of a supernova can become a neutron star: a city-sized ball heavier than the Sun.'],
  ['neutronStar', 'spin', 'pulsar', 'A fast-spinning neutron star sweeps beams of radio waves across space like a lighthouse: a pulsar.'],
  ['neutronStar', 'neutronStar', 'kilonova', 'Two neutron stars merging make a kilonova. In 2017 one (GW170817) was seen in both gravitational waves and light.'],
  ['kilonova', 'time', 'gold', 'Within days, the debris of a kilonova forms heavy elements like gold and platinum. Much of the gold on Earth may come from these.'],
  // Black holes
  ['neutronStar', 'gravity', 'blackHole', 'Pile enough mass onto a neutron star and nothing can stop the collapse: it becomes a black hole.'],
  ['neutronStar', 'blackHole', 'blackHole', 'A black hole can swallow a neutron star whole. Detectors first caught this in 2020 (GW200105).'],
  ['blackHole', 'blackHole', 'gravitationalWaves', 'Two black holes spiralling together shake spacetime itself. LIGO first heard it in 2015.'],
  ['blackHole', 'star', 'tidalDisruption', 'A star that strays too close is stretched into a stream and partly swallowed: a tidal disruption event.'],
  ['blackHole', 'spin', 'kerrBlackHole', 'Real black holes spin. Roy Kerr found the maths for spinning black holes in 1963.'],
  ['blackHole', 'light', 'photonRing', 'Light skimming a black hole circles around it. The Event Horizon Telescope photographed this glowing ring around M87* in 2019.'],
  ['light', 'gravity', 'gravitationalLens', 'Mass bends light, so a galaxy can act like a giant magnifying glass: gravitational lensing.'],
  // Galaxies
  ['starCluster', 'darkMatter', 'galaxy', 'Galaxies form inside huge halos of dark matter, whose gravity gathers gas and stars together.'],
  ['galaxy', 'blackHole', 'supermassive', 'Nearly every big galaxy has a supermassive black hole at its centre. Ours, Sagittarius A*, weighs 4 million Suns.'],
  ['supermassive', 'gasCloud', 'quasar', 'A supermassive black hole gulping gas heats it so much that it outshines its whole galaxy: a quasar.'],
  ['galaxy', 'galaxy', 'ellipticalGalaxy', 'When two spiral galaxies collide they merge into a big, round elliptical galaxy. The Milky Way and Andromeda will, in about 4.5 billion years.'],
];

export const START_ITEMS = Object.keys(ITEMS).filter((id) => ITEMS[id].start);

/** The recipe for a pair (order doesn't matter), or null. */
export function findRecipe(a, b) {
  for (const r of RECIPES) {
    if ((r[0] === a && r[1] === b) || (r[0] === b && r[1] === a)) return { a: r[0], b: r[1], result: r[2], why: r[3], real: true };
  }
  return null;
}

/** Every item that some recipe can make (for the "discovered N / M" counter). */
export const DISCOVERABLE = [...new Set(RECIPES.map((r) => r[2]))];
