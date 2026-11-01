import Phaser from 'phaser';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/space-mono/latin-400.css';
import '@fontsource/space-mono/latin-700.css';
import './ui/styles.css';

import { GAME, COLORS } from './config.js';
import { loadSave, getSave, writeSave } from './systems/save.js';
import { audio } from './systems/audio.js';
import { initUI } from './ui/dom.js';
import * as flow from './flow.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import ShopScene from './scenes/ShopScene.js';
import UIScene from './scenes/UIScene.js';
import CraftScene from './scenes/CraftScene.js';

loadSave();
const settings = getSave().settings;
audio.setMusic(settings.music);
audio.setSfx(settings.sfx);

// Canvas text needs the bundled fonts loaded before Phaser draws with them.
async function loadFonts() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('600 32px "Barlow Condensed"'),
        document.fonts.load('400 16px "IBM Plex Sans"'),
        document.fonts.load('400 16px "Space Mono"'),
        document.fonts.load('700 16px "Space Mono"'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    // fall back to system fonts
  }
}

let game;

async function start() {
  await loadFonts();
  // Phaser game setup: WebGL, portrait 720×1280 design size, scaled to fit and
  // letterboxed on wide screens.
  game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'game',
    width: GAME.width,
    height: GAME.height,
    backgroundColor: COLORS.voidCss,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      powerPreference: 'high-performance',
    },
    input: { activePointers: 2 },
    scene: [TitleScene, GameScene, ShopScene, UIScene, CraftScene],
  });
  flow.initFlow(game);
  initUI(game); // before any scene starts, so menus can mount

  // Save whenever the tab is hidden; pause audio while away.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      writeSave();
      audio.suspend();
    } else {
      audio.resume();
    }
  });

  // Handy for debugging in the browser console during development only.
  if (import.meta.env.DEV || import.meta.env.MODE === 'bot') {
    window.game = game;
    window.flow = flow;
  }
}

start();
