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
];

export function getScenario(id) {
  return SCENARIOS.find((s) => s.id === id);
}
