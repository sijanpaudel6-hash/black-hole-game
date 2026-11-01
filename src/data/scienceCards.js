// Text for each science card. Card N is unlocked by reaching tier N
// (card 1 after your first level clear). Facts are real; the game's growth is not.

export const SCIENCE_CARDS = [
  {
    id: 1,
    title: 'What is a black hole?',
    subtitle: 'Gravity that even light cannot escape',
    body:
      'A black hole is a place where so much mass is squeezed into so small a space that nothing, not even light, can escape its gravity. Most form when a very massive star runs out of fuel and its core collapses. In this game black holes grow by eating dust and planets; real ones grow mostly by pulling in gas, and far more slowly.',
    tags: ['Stellar collapse', 'Escape velocity > c'],
    art: 'collapse',
  },
  {
    id: 2,
    title: 'The event horizon',
    subtitle: 'The point of no return',
    body:
      "The event horizon is the boundary around a black hole beyond which nothing can ever come back out. It isn't a solid surface: someone falling through it wouldn't feel anything special at that moment, but no signal from inside can reach the outside. A black hole with the Sun's mass would have an event horizon only about 6 km across.",
    tags: ['Schwarzschild radius', 'One-way boundary'],
    art: 'horizon',
  },
  {
    id: 3,
    title: 'Spaghettification',
    subtitle: 'Tidal forces stretch infalling matter',
    body:
      "Near a black hole, gravity pulls much harder on the side of an object that is closer than on its far side. That difference, a tidal force, stretches the object lengthwise and squeezes it sideways, like a noodle. Astronomers have watched distant stars being torn apart this way in events called tidal disruptions.",
    tags: ['Tidal force', 'Tidal disruption event'],
    art: 'spaghetti',
  },
  {
    id: 4,
    title: 'Hawking radiation',
    subtitle: 'Black holes are not completely black',
    body:
      'In 1974 Stephen Hawking predicted that quantum effects near the event horizon make black holes glow very faintly and slowly lose mass. For a black hole as heavy as the Sun the glow is far too weak to detect, and evaporating completely would take vastly longer than the current age of the universe.',
    tags: ['Quantum effect', 'Slow evaporation'],
    art: 'hawking',
  },
  {
    id: 5,
    title: 'Sagittarius A*',
    subtitle: 'The giant at the centre of our galaxy',
    body:
      "At the centre of the Milky Way, about 27,000 light-years away, sits Sagittarius A*: a supermassive black hole roughly 4 million times the mass of the Sun. In 2022 the Event Horizon Telescope released the first image of it, a dark shadow ringed by glowing gas. Real black holes don't grow from dust to galaxy-eaters like in this game; that part is make-believe.",
    tags: ['Supermassive', 'Event Horizon Telescope'],
    art: 'sgra',
  },
];

export function getCard(id) {
  return SCIENCE_CARDS.find((c) => c.id === id);
}
