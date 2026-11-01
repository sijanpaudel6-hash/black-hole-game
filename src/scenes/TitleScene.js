import Phaser from 'phaser';
import { COLORS, GROWTH, GAME } from '../config.js';
import BlackHole from '../objects/BlackHole.js';
import Starfield from '../systems/starfield.js';
import { createTextures } from '../systems/textures.js';
import { getSave } from '../systems/save.js';
import { collectIdleEarnings } from '../systems/economy.js';
import { audio } from '../systems/audio.js';
import { formatInt } from '../systems/format.js';
import { toast, clear } from '../ui/dom.js';
import { renderTitle, renderLevelSelect, renderSettings, renderLibrary, renderSandboxMenu } from '../ui/menus.js';

let idleChecked = false;

/**
 * Menu background (starfield + the title black hole drawn by Phaser) hosting the
 * HTML menus: title, level select, settings, science log, sandbox.
 */
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  init(data) {
    this.startView = data?.view ?? 'title';
    this.startData = data ?? {};
  }

  create() {
    createTextures(this);
    const low = getSave().settings.lowGraphics;
    this.cameras.main.setBackgroundColor(COLORS.void);
    this.starfield = new Starfield(this, low);

    // Title art: a big black hole a little above centre (≈ 36% down, like the mockup).
    const r = 96;
    const mass = GROWTH.baseMass * (r / GROWTH.baseRadius) ** 3;
    this.bh = new BlackHole(this, GAME.width / 2, GAME.height * 0.36, mass, { glowScale: 1.3 });
    this.bh.setLowGraphics(low);

    this.input.on('pointerdown', () => audio.unlock());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => clear('screen'));

    this.showView(this.startView, this.startData);

    if (!idleChecked) {
      idleChecked = true;
      const earned = collectIdleEarnings();
      if (earned > 0) setTimeout(() => toast(`Dark Matter Drip: +${formatInt(earned)} Stardust while you were away`, 3500), 600);
    }
  }

  showView(view, data = {}) {
    clear('modal');
    this.bh.setVisible(view === 'title');
    if (view === 'levels') renderLevelSelect(data);
    else if (view === 'settings') renderSettings(data);
    else if (view === 'library') renderLibrary(data);
    else if (view === 'sandbox') renderSandboxMenu(data);
    else renderTitle();
  }

  applySettings(s) {
    this.starfield.setLow(s.lowGraphics);
    this.bh.setLowGraphics(s.lowGraphics);
  }

  update(_t, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.bh.updateVisual(dt);
    this.bh.y = GAME.height * 0.36 + Math.sin(this.time.now / 1400) * 6;
    this.starfield.update(this.cameras.main, 0.25);
  }
}
