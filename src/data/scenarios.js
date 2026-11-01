// "What if…?" Sandbox presets: one tap loads a ready-made, clip-sized scene.
// The scripts that run them live in src/systems/scenarios.js.

export const SCENARIOS = [
  {
    id: 'earth',
    title: 'Black hole vs Earth',
    caption: 'What if a black hole hit Earth?',
    blurb: 'A tiny black hole falls into Earth and eats it from the inside.',
    fact: "If Earth were squeezed into a black hole, its event horizon would be under 2 cm across: about the size of a marble.",
  },
  {
    id: 'sun',
    title: 'Black hole vs the Sun',
    caption: 'A black hole eats the Sun',
    blurb: 'The black hole tears the Sun into a glowing spiral.',
    fact: 'To become a black hole, the Sun would have to be crushed to about 6 km across. It never will: it is not heavy enough.',
  },
  {
    id: 'solar',
    title: 'Eat the whole Solar System',
    caption: 'Eating the Solar System in 20 seconds',
    blurb: 'Mercury to Neptune, in order, at speed.',
    fact: 'Jupiter has more than twice the mass of all the other planets in the Solar System combined.',
  },
  {
    id: 'merger',
    title: 'Two black holes collide',
    caption: 'When two black holes collide',
    blurb: 'Two black holes spiral together and merge in a flash.',
    fact: 'In 2015 LIGO detected two black holes of about 29 and 36 Suns merging. The new one weighed about 62 Suns: 3 Suns of mass became gravitational waves.',
  },
  {
    id: 'sgra',
    title: 'Tiny vs supermassive',
    caption: 'The biggest black hole in our galaxy',
    blurb: 'Your black hole vs Sagittarius A*.',
    fact: 'Sagittarius A* has about 4 million times the mass of the Sun. In 2022 the Event Horizon Telescope took the first picture of it.',
  },
  // Cosmic events (Session E)
  {
    id: 'supernova',
    title: 'A star goes supernova',
    caption: 'A star explodes next to a black hole',
    blurb: 'A giant star collapses and blows up: ride the shockwave, eat the debris.',
    fact: 'When a giant star runs out of fuel, its core collapses in under a second and the star explodes. For a few weeks a supernova can outshine its whole galaxy, and it scatters the oxygen, silicon and iron that later build planets.',
  },
  {
    id: 'tidal',
    title: 'Spaghettify a star',
    caption: 'A black hole turns a star into spaghetti',
    blurb: 'A star strays too close and is stretched into a glowing stream.',
    fact: 'This is a tidal disruption event. In 2019 telescopes watched a black hole 215 million light-years away (AT2019qiz) stretch a star like this and swallow part of it.',
  },
  {
    id: 'wanderer',
    title: 'Runaway black hole',
    caption: 'A runaway black hole races past',
    blurb: 'A huge black hole tears through, leaving newborn stars behind it.',
    fact: 'In 2026 the James Webb Space Telescope confirmed RBH-1: a supermassive black hole racing through space at over 1,000 km/s, with a long trail of newborn stars behind it.',
  },
  {
    id: 'wormhole',
    title: 'Through a wormhole',
    caption: 'What if a black hole fell into a wormhole?',
    blurb: 'A portal opens. Dive in and come out somewhere else. (Theoretical)',
    fact: "THEORETICAL. Einstein's equations allow wormholes, but nobody has ever found one, and keeping one open would need exotic matter that may not exist.",
  },
  {
    id: 'whitehole',
    title: 'Meet a white hole',
    caption: 'The opposite of a black hole',
    blurb: 'A black hole run backwards: it spits matter out. (Hypothetical)',
    fact: 'HYPOTHETICAL. A white hole is a black hole run backwards in time: nothing can fall in, matter only comes out. The maths allows it, but none has ever been seen.',
  },
  {
    id: 'darkmatter',
    title: 'Eat dark matter',
    caption: 'Eating something invisible',
    blurb: 'Invisible clumps, found only by the starlight they bend.',
    fact: 'About 85% of the matter in the universe is dark matter. Nobody has seen it: we know it is there because its gravity bends light and holds galaxies together.',
  },
];

// Feed Your Hometown is reached from its own screen (src/ui/hometown.js); its words depend on the place.
export const HOMETOWN_SCENARIO = {
  id: 'hometown',
  title: 'Feed your hometown',
  blurb: 'Pick a city or country and watch your black hole swallow it.',
  caption: 'Feeding {name} to a black hole',
  cta: "Comment your city · I'll feed it next",
  fact: 'The nearest known black hole, Gaia BH1, is about {ly} light-years from {name}. {name} is safe.',
};

export function getScenario(id, data) {
  if (id === 'hometown') {
    const name = data?.place?.name ?? 'your hometown';
    const fill = (t) => t.replaceAll('{name}', name).replaceAll('{ly}', '1,560');
    return { ...HOMETOWN_SCENARIO, caption: fill(HOMETOWN_SCENARIO.caption), fact: fill(HOMETOWN_SCENARIO.fact) };
  }
  return SCENARIOS.find((s) => s.id === id);
}
