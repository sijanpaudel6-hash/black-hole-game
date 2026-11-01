// "Eat the Milky Way in under 10 minutes": local best times.
//
// Hook for later (needs a small server, see SPEC "Later"): submitTime() is the one place a
// finished challenge is recorded, so a global leaderboard can be added here (POST the time
// to a server function that validates and stores it). Offline, it keeps the top times on
// this device only.

import { CHALLENGE } from '../config.js';
import { getSave, writeSave } from './save.js';

export function bestTimes() {
  const save = getSave();
  if (!Array.isArray(save.challengeTimes)) save.challengeTimes = [];
  return save.challengeTimes;
}

/** @returns {{rank:number|null, best:number|null}} rank 1 = new personal best */
export function submitTime(seconds, details = {}) {
  const list = bestTimes();
  list.push({ seconds, date: new Date().toISOString().slice(0, 10), ...details });
  list.sort((a, b) => a.seconds - b.seconds);
  list.length = Math.min(list.length, CHALLENGE.boardSize);
  writeSave();
  const i = list.findIndex((x) => x.seconds === seconds);
  return { rank: i >= 0 ? i + 1 : null, best: list[0]?.seconds ?? null };
}
