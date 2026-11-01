import Phaser from 'phaser';
import { COLORS, GAME, CRAFT } from '../config.js';
import Starfield from '../systems/starfield.js';
import Effects from '../systems/effects.js';
import { createTextures } from '../systems/textures.js';
import { createCraftTextures, craftTexture, craftPreview } from '../systems/craftTextures.js';
import { combine } from '../systems/craft.js';
import { getSave } from '../systems/save.js';
import { audio } from '../systems/audio.js';
import { renderCraft } from '../ui/craft.js';
import { clear } from '../ui/dom.js';
import * as flow from '../flow.js';

const W = GAME.width;
const H = GAME.height;

/**
 * Cosmic Craft (Sandbox): pick two things, watch them fly together and collide, and see
 * what real physics makes. Collisions play out in the canvas (so they can be recorded);
 * the item tray and result card are HTML.
 */
export default class CraftScene extends Phaser.Scene {
  constructor() {
    super('CraftScene');
  }

  create() {
    createTextures(this);
    createCraftTextures(this);
    this.cameras.main.setBackgroundColor(COLORS.void);
    this.starfield = new Starfield(this, getSave().settings.lowGraphics);
    this.effects = new Effects(this, getSave().settings.lowGraphics);
    this.slots = [null, null];
    this.sprites = [];
    this.busy = false;
    this.slotPos = [
      { x: W * 0.24, y: H * CRAFT.slotY },
      { x: W * 0.76, y: H * CRAFT.slotY },
    ];
    // Faint guide rings where the two picks sit.
    const g = this.add.graphics();
    g.lineStyle(2, COLORS.hairline, 1);
    for (const p of this.slotPos) g.strokeCircle(p.x, p.y, CRAFT.itemRadius * 1.25);
    g.lineStyle(2, COLORS.hairline, 0.6).lineBetween(this.slotPos[0].x + 90, this.slotPos[0].y, this.slotPos[1].x - 90, this.slotPos[1].y);
    this.plus = this.add.text(W / 2, H * CRAFT.slotY, '+', { fontFamily: '"Barlow Condensed", sans-serif', fontSize: '64px', color: COLORS.textMutedCss }).setOrigin(0.5);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => clear('screen'));
    this.input.on('pointerdown', () => audio.unlock());
    this.ui = renderCraft({
      preview: (id) => craftPreview(this, id),
      onPick: (id) => this.pick(id),
      onClear: () => this.reset(),
      onBack: () => flow.goMenu('sandbox'),
    });
  }

  applySettings(s) {
    this.starfield.setLow(s.lowGraphics);
    this.effects.setLow(s.lowGraphics);
  }

  sprite(id, x, y, radius) {
    const t = craftTexture(id);
    const img = this.add.image(x, y, t.key).setOrigin(t.originX, t.originY);
    img.setScale(radius / t.bodyRadius);
    img.itemRadius = radius;
    img.baseScale = radius / t.bodyRadius;
    return img;
  }

  reset() {
    this.sprites.forEach((s) => s.destroy());
    this.sprites = [];
    this.slots = [null, null];
    this.busy = false;
    this.plus.setVisible(true);
    this.ui.setSlots(this.slots);
  }

  pick(id) {
    if (this.busy) return;
    if (this.slots[0] && this.slots[1]) this.reset();
    if (!this.slots[0]) {
      // Starting a new pair: clear the last result off the stage.
      this.sprites.forEach((s) => s.destroy());
      this.sprites = [];
    }
    const i = this.slots[0] ? 1 : 0;
    this.slots[i] = id;
    const p = this.slotPos[i];
    const img = this.sprite(id, p.x, p.y, CRAFT.itemRadius);
    img.setScale(0);
    this.tweens.add({ targets: img, scale: img.baseScale, duration: 260, ease: 'Back.Out' });
    this.sprites.push(img);
    audio.blip(500 + i * 200, 0.05);
    this.ui.setSlots(this.slots);
    if (i === 1) this.time.delayedCall(350, () => this.collide());
  }

  collide() {
    this.busy = true;
    this.plus.setVisible(false);
    const [a, b] = this.slots;
    const result = combine(a, b);
    const cx = W / 2;
    const cy = H * CRAFT.slotY;
    // Fly together, faster and faster.
    this.sprites.forEach((s, i) => {
      this.tweens.add({ targets: s, x: cx + (i ? 1 : -1) * CRAFT.itemRadius * 0.4, y: cy, duration: CRAFT.flyTime * 1000, ease: 'Cubic.In' });
      this.tweens.add({ targets: s, angle: i ? -200 : 200, duration: CRAFT.flyTime * 1000, ease: 'Cubic.In' });
    });
    this.time.delayedCall(CRAFT.flyTime * 1000, () => {
      this.cameras.main.shake(260, 0.012);
      if (!result) {
        // No reaction: they bounce apart and fade.
        audio.collide();
        this.effects.flash(cx, cy, 160, COLORS.textMuted, 0.3);
        this.sprites.forEach((s, i) => this.tweens.add({ targets: s, x: this.slotPos[i].x, alpha: 0.35, duration: 500, ease: 'Cubic.Out' }));
        this.ui.showResult(null, a, b);
        this.busy = false;
        return;
      }
      audio.bassDrop(0.9);
      this.effects.flash(cx, cy, 420, 0xffffff, 0.6);
      this.effects.shockwave(cx, cy, 340, COLORS.amber, 0.9);
      this.time.delayedCall(120, () => this.effects.shockwave(cx, cy, 480, COLORS.science, 1.1));
      this.sprites.forEach((s) => s.destroy());
      const img = this.sprite(result.result, cx, cy, CRAFT.resultRadius);
      img.setScale(0);
      this.tweens.add({ targets: img, scale: img.baseScale, duration: 520, ease: 'Back.Out' });
      this.sprites = [img];
      if (result.isNew) audio.chime();
      this.ui.showResult(result, a, b);
      this.busy = false;
      this.slots = [null, null];
      this.ui.setSlots(this.slots);
      this.ui.refreshTray();
    });
  }

  update(_t, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.starfield.update(this.cameras.main, 0.2);
    this.effects.update(dt);
    for (const s of this.sprites) if (!this.busy) s.rotation += dt * 0.15;
  }
}

