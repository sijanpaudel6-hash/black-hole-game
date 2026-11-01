// localStorage save/load. Every storage access is wrapped in try/catch so the game
// still runs (without saving) if storage is blocked.

import { UPGRADES } from '../config.js';

const KEY = 'black-hole-event-horizon-save-v1';

function defaults() {
  const lowEnd = (navigator.deviceMemory && navigator.deviceMemory <= 2) || false;
  return {
    version: 1,
    levelsCleared: 0, // highest level number cleared (0–15)
    stardust: 0,
    upgrades: Object.fromEntries(Object.keys(UPGRADES).map((k) => [k, 0])),
    cards: [], // unlocked science card ids
    settings: { music: true, sfx: true, lowGraphics: lowEnd, autoRecord: true },
    lastPlayed: Date.now(),
    lastDailyWin: '', // YYYY-MM-DD of the last first-win-of-the-day bonus
    lastFreeUpgrade: '', // YYYY-MM-DD of the last free (ad) upgrade
    gameCompleted: false,
  };
}

let data = defaults();

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base = defaults();
      data = {
        ...base,
        ...parsed,
        upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
        settings: { ...base.settings, ...(parsed.settings || {}) },
        cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      };
    }
  } catch (e) {
    console.warn('Save could not be loaded; starting fresh.', e);
    data = defaults();
  }

  // Developer/testing switches: ?reset wipes the save, ?unlockall opens every level.
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('reset')) {
      data = defaults();
      writeSave();
    }
    if (params.has('unlockall')) {
      data.levelsCleared = Math.max(data.levelsCleared, 15);
      data.cards = [1, 2, 3, 4, 5];
    }
  } catch {
    // ignore
  }
  return data;
}

export function getSave() {
  return data;
}

export function writeSave() {
  data.lastPlayed = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Save could not be written.', e);
  }
}

export function resetSave() {
  data = defaults();
  writeSave();
  return data;
}
