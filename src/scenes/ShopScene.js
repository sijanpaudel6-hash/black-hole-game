import Phaser from 'phaser';
import { COLORS } from '../config.js';
import Starfield from '../systems/starfield.js';
import { createTextures } from '../systems/textures.js';
import { getSave } from '../systems/save.js';
import { renderShop } from '../ui/shop.js';
import { clear } from '../ui/dom.js';
import * as flow from '../flow.js';

/** Upgrade shop between levels, over a drifting starfield. */
export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  init(data) {
    this.nextLevel = data?.nextLevel;
    this.from = data?.from;
  }

  create() {
    createTextures(this);
    this.cameras.main.setBackgroundColor(COLORS.void);
    this.starfield = new Starfield(this, getSave().settings.lowGraphics);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => clear('screen'));
    renderShop({
      nextLevel: this.nextLevel,
      onBack: () => flow.goMenu('levels', this.nextLevel ? { selected: this.nextLevel } : {}),
      onLaunch: (n) => flow.startLevel(n),
    });
  }

  applySettings(s) {
    this.starfield.setLow(s.lowGraphics);
  }

  update() {
    this.starfield.update(this.cameras.main, 0.25);
  }
}
