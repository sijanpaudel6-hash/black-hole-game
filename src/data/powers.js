// Cosmic powers: names and words. All numbers live in POWERS in src/config.js.
// `levels` describes what each level adds (shown on the pick-a-power cards).

export const POWER_LIST = [
  {
    id: 'kerrSpin',
    name: 'Kerr Spin',
    tag: 'Swirl',
    blurb: 'Your pull becomes a whirlpool: things orbit, then fall in.',
    levels: ['Swirling pull · +20% range', 'Faster swirl · +35% range', 'Maelstrom · +50% range'],
    science: 'Real black holes spin. Roy Kerr found the maths for it in 1963.',
  },
  {
    id: 'jets',
    name: 'Relativistic Jets',
    tag: 'Tap JETS',
    blurb: 'Fire twin jets that smash big objects into edible chunks.',
    levels: ['Jets · every 7 s', 'Longer jets · every 5.5 s', 'Huge jets · every 4 s'],
    science: 'Some black holes shoot jets of plasma at nearly the speed of light.',
  },
  {
    id: 'shredder',
    name: 'Tidal Shredder',
    tag: 'Passive',
    blurb: 'Objects a bit bigger than you crumble when you pass close.',
    levels: ['Shred up to 1.35× your size', 'Shred up to 1.7× your size', 'Shred up to 2.1× your size'],
    science: 'Tidal forces stretch anything that gets too close: spaghettification.',
  },
  {
    id: 'halo',
    name: 'Dark Matter Halo',
    tag: 'Passive',
    blurb: 'An invisible halo widens and strengthens your pull.',
    levels: ['+40% pull range', '+75% pull range', '+110% pull range'],
    science: 'Every galaxy sits inside a halo of dark matter we can only detect by its gravity.',
  },
  {
    id: 'lens',
    name: 'Gravitational Lens',
    tag: 'Passive',
    blurb: 'Time slows near massive objects (not for you), and hidden treasures glow blue.',
    levels: ['Slow time near danger · reveal treasures', 'Stronger slow · more treasures', 'Deep slow · many treasures'],
    science: 'Mass bends light and slows time: Einstein predicted both.',
  },
  {
    id: 'bloom',
    name: 'Hawking Bloom',
    tag: 'Passive',
    blurb: 'Getting hit releases a burst that blasts hazards away, and you lose less.',
    levels: ['−30% mass lost · burst', '−50% mass lost · bigger burst', '−70% lost · Last Gasp: survive one rival once'],
    science: 'Stephen Hawking showed black holes glow faintly and lose mass.',
  },
];

export const POWERS_BY_ID = Object.fromEntries(POWER_LIST.map((p) => [p.id, p]));

// Owning both powers in `needs` unlocks the synergy.
export const SYNERGIES = [
  {
    id: 'pulsar',
    name: 'Pulsar Lighthouse',
    needs: ['kerrSpin', 'jets'],
    blurb: 'Your jets fire on their own and sweep a full circle.',
  },
  {
    id: 'buzzsaw',
    name: 'Accretion Buzzsaw',
    needs: ['kerrSpin', 'shredder'],
    blurb: 'A spinning saw of debris shreds bigger things and reels the pieces in.',
  },
  {
    id: 'lensedJets',
    name: 'Lensed Jets',
    needs: ['jets', 'lens'],
    blurb: 'Your jets bend around gravity and curve toward stars.',
  },
];
