// Cosmic Craft rules and save data. Recipes and words live in src/data/recipes.js.
//
// Hook for later (needs a server + AI key; see SPEC "Later"): when findRecipe() has no
// answer, imagine() is where an AI-generated result (marked IMAGINED, saved for everyone,
// with "First Discovery" credit for the first player) would be fetched. Offline it returns
// null and the pair simply doesn't react.

import { ITEMS, START_ITEMS, DISCOVERABLE, findRecipe } from '../data/recipes.js';
import { getSave, writeSave } from './save.js';

/** { found: [item ids], firsts: { id: 'YYYY-MM-DD' } } in the save. */
export function craftSave() {
  const save = getSave();
  if (!save.craft || !Array.isArray(save.craft.found)) save.craft = { found: [...START_ITEMS], firsts: {} };
  for (const id of START_ITEMS) if (!save.craft.found.includes(id)) save.craft.found.push(id);
  return save.craft;
}

/** Items you can use, in discovery order. */
export function foundItems() {
  return craftSave().found.filter((id) => ITEMS[id]);
}

/** How many of the makeable things you've discovered. */
export function craftProgress() {
  const found = new Set(craftSave().found);
  return { found: DISCOVERABLE.filter((id) => found.has(id)).length, total: DISCOVERABLE.length };
}

/** Offline: no AI. Returns null (see the note at the top). */
export function imagine() {
  return null;
}

/**
 * Smash two items together.
 * @returns {{result:string, why:string, real:boolean, isNew:boolean}|null}
 */
export function combine(a, b) {
  const r = findRecipe(a, b) ?? imagine(a, b);
  if (!r) return null;
  const c = craftSave();
  const isNew = !c.found.includes(r.result);
  if (isNew) {
    c.found.push(r.result);
    c.firsts[r.result] = new Date().toISOString().slice(0, 10);
    writeSave();
  }
  return { ...r, isNew };
}
