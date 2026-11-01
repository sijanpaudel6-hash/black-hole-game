// Navigation between screens and scenes.

import { getSave } from './systems/save.js';
import { clear } from './ui/dom.js';

let game = null;

export function initFlow(g) {
  game = g;
}

function switchTo(key, data = {}) {
  clear();
  for (const s of game.scene.getScenes(false)) {
    const k = s.sys.settings.key;
    if (k !== key && (s.sys.isActive() || s.sys.isPaused() || s.sys.isSleeping())) game.scene.stop(k);
  }
  const target = game.scene.getScene(key);
  if (target.sys.isActive() || target.sys.isPaused()) target.scene.restart(data);
  else game.scene.start(key, data);
}

/** Menus: 'title' | 'levels' | 'settings' | 'library' | 'sandbox' */
export function goMenu(view = 'title', data = {}) {
  const title = game.scene.getScene('TitleScene');
  if (title.sys.isActive()) title.showView(view, data);
  else switchTo('TitleScene', { view, ...data });
}

export function goShop(data = {}) {
  switchTo('ShopScene', data);
}

/** The main mode: one life of a black hole, through five eras. */
export function startRun() {
  switchTo('GameScene', { mode: 'run' });
}

/** Classic mode: one of the 15 fixed levels. */
export function startLevel(level) {
  switchTo('GameScene', { mode: 'level', level });
}

export function startSandbox(tier) {
  switchTo('GameScene', { mode: 'sandbox', tier });
}

export function startScenario(scenario) {
  switchTo('GameScene', { mode: 'scenario', scenario });
}

/** Tell running scenes the settings changed (Low graphics etc.). */
export function applySettings() {
  const s = getSave().settings;
  for (const scene of game.scene.getScenes(true)) scene.applySettings?.(s);
}
