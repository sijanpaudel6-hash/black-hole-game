// Daily Universe: one seed per UTC day, the same for every player, no server needed.
// The seed drives the power offers, civilisations, cosmic events, which objects spawn and
// the day's modifier, so everyone's universe plays out the same way (your moves still differ).

import { DAILY } from '../config.js';
import { hashString, mulberry32 } from './rng.js';
import { getSave, writeSave } from './save.js';

/** "2026-11-01" for the current UTC day. */
export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Universe #N: days since the first Daily Universe (DAILY.epoch is #1). */
export function universeNumber(dayKey = utcDayKey()) {
  const ms = Date.parse(`${dayKey}T00:00:00Z`) - Date.parse(`${DAILY.epoch}T00:00:00Z`);
  return Math.floor(ms / 86400000) + 1;
}

export function dailySeed(dayKey = utcDayKey()) {
  return hashString(`black-hole-daily-${dayKey}`);
}

/** Today's modifier (one of DAILY.modifiers), picked from the seed. */
export function dailyModifier(dayKey = utcDayKey()) {
  const rng = mulberry32(dailySeed(dayKey) ^ 0x9e3779b9);
  const list = DAILY.modifiers;
  return list[Math.floor(rng() * list.length)];
}

/** Saved state for today's Daily Universe: { key, attempts, best } (reset each UTC day). */
export function dailyRecord() {
  const save = getSave();
  const key = utcDayKey();
  if (!save.daily || save.daily.key !== key) save.daily = { key, attempts: 0, best: null };
  return save.daily;
}

/** Record a finished daily run; keeps the best (furthest era, then biggest mass). */
export function recordDaily(result) {
  const d = dailyRecord();
  d.attempts += 1;
  const better = !d.best || result.era > d.best.era || (result.era === d.best.era && result.peakKg > d.best.peakKg);
  if (better) d.best = result;
  writeSave();
  return { first: d.attempts === 1, best: better };
}
