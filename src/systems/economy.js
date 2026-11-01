// Stardust, upgrades and the numbers they change.

import { ECONOMY, EATING, LEVEL, MOVEMENT, DANGER, UPGRADES } from '../config.js';
import { getSave, writeSave } from './save.js';
import { todayKey } from './format.js';

export function upgradeLevel(id) {
  return getSave().upgrades[id] || 0;
}

export function upgradeCost(id, level = upgradeLevel(id)) {
  return Math.round(UPGRADES[id].cost * ECONOMY.costGrowth ** level);
}

export function isMaxed(id) {
  return upgradeLevel(id) >= UPGRADES[id].maxLevel;
}

/** Buy one level. `free` skips the cost (rewarded ad). @returns true if bought */
export function buyUpgrade(id, free = false) {
  const save = getSave();
  if (isMaxed(id)) return false;
  const cost = upgradeCost(id);
  if (!free && save.stardust < cost) return false;
  if (!free) save.stardust -= cost;
  save.upgrades[id] += 1;
  if (free) save.lastFreeUpgrade = todayKey();
  writeSave();
  return true;
}

export function freeUpgradeAvailable() {
  return getSave().lastFreeUpgrade !== todayKey();
}

// ---- Upgrade effects ----

export const effects = {
  pullRange: () => EATING.pullRangeMultiplier * (1 + UPGRADES.gravityPull.perLevel * upgradeLevel('gravityPull')),
  speedMultiplier: () => 1 + UPGRADES.thrusters.perLevel * upgradeLevel('thrusters'),
  startMassMultiplier: () => 1 + UPGRADES.headStart.perLevel * upgradeLevel('headStart'),
  timeLimit: () => LEVEL.timeLimit + UPGRADES.timeDilation.perLevel * upgradeLevel('timeDilation'),
  massLoss: () => Math.max(0, DANGER.massLoss - UPGRADES.hawkingShield.perLevel * upgradeLevel('hawkingShield')),
  idlePerHour: () => UPGRADES.darkMatterDrip.perLevel * upgradeLevel('darkMatterDrip'),
  // Runs have no timer, so Time Dilation slows Hawking evaporation instead.
  evaporationMultiplier: () => Math.max(0.1, 1 - UPGRADES.timeDilation.evaporationPerLevel * upgradeLevel('timeDilation')),
  maxSpeed: () => MOVEMENT.maxSpeed * (1 + UPGRADES.thrusters.perLevel * upgradeLevel('thrusters')),
};

// ---- Earning ----

/**
 * Stardust for a level. `bonusMass` is extra mass counted again (satellites, comets).
 * @returns {{base:number, daily:boolean, total:number}}
 */
export function levelStardust(massEaten, bonusMass, startMass, won) {
  let amount = Math.floor((ECONOMY.stardustPerStartMass * (massEaten + bonusMass)) / startMass);
  if (!won) amount = Math.floor(amount * ECONOMY.failKeep);
  const daily = won && getSave().lastDailyWin !== todayKey();
  return { base: amount, daily, total: daily ? amount * ECONOMY.dailyWinMultiplier : amount };
}

/**
 * Stardust for one era of a run: same rule as levels, measured against the era's
 * starting mass (so every era is worth about the same).
 */
export function eraStardust(massEaten, bonusMass, eraStartMass) {
  return Math.floor((ECONOMY.stardustPerStartMass * (massEaten + bonusMass)) / eraStartMass);
}

/** Total for a finished run. Runs always end, so nothing is halved; completing gives a bonus. */
export function runStardust(eraTotal, completed, completeBonus) {
  const amount = Math.floor(eraTotal * (completed ? completeBonus : 1));
  const daily = amount > 0 && getSave().lastDailyWin !== todayKey();
  return { base: amount, daily, total: daily ? amount * ECONOMY.dailyWinMultiplier : amount };
}

/** Dark Matter Drip: Stardust earned while away. Call once at start-up. */
export function collectIdleEarnings(now = Date.now()) {
  const save = getSave();
  const perHour = effects.idlePerHour();
  const hours = Math.min(UPGRADES.darkMatterDrip.capHours, Math.max(0, (now - (save.lastPlayed || now)) / 3600000));
  const earned = Math.floor(perHour * hours);
  if (earned > 0) {
    save.stardust += earned;
    writeSave();
  }
  return earned;
}

/** The cheapest upgrade you can't afford yet, for the "next upgrade" progress bar. */
export function nextUpgradeGoal() {
  const save = getSave();
  let best = null;
  for (const id of Object.keys(UPGRADES)) {
    if (isMaxed(id)) continue;
    const cost = upgradeCost(id);
    if (!best || cost < best.cost) best = { id, name: UPGRADES[id].name, cost };
  }
  if (!best) return null;
  return { ...best, have: save.stardust };
}
