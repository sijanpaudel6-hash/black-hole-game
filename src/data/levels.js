import { LEVELS, TIERS } from '../config.js';

// Flavour names for each level (shown on the level select star chart).
const NAMES = [
  'Micro-Debris', 'Ice Drift', 'Pebble Stream',
  'Asteroid Belt', 'Comet Lane', 'Satellite Graveyard',
  'Lunar Field', 'Dwarf Frontier', 'Rocky Worlds',
  'Red Dwarf Reach', 'Main Sequence', "Giant's Edge",
  'Globular Swarm', 'Rival Core', 'Sagittarius A*',
];

// Results-screen title per tier.
const WIN_TITLES = ['Dust Devoured', 'Belt Crushed', 'Worlds Devoured', 'Stars Swallowed', 'Galaxy Consumed'];

/** @returns full info for level n (1-based) */
export function getLevel(n) {
  const def = LEVELS[n - 1];
  const tier = TIERS[def.tier - 1];
  const indexInTier = LEVELS.slice(0, n - 1).filter((l) => l.tier === def.tier).length; // 0..2
  const isLastInTier = n === LEVELS.length || LEVELS[n].tier !== def.tier;
  return {
    number: n,
    name: NAMES[n - 1],
    tier,
    indexInTier,
    isLastInTier,
    target: def.target,
    boss: !!def.boss,
    winTitle: WIN_TITLES[def.tier - 1],
  };
}

export const LEVEL_COUNT = LEVELS.length;
