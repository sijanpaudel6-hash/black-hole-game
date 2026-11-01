import Phaser from 'phaser';
import { GAME, COLORS, HUD, RECORDING } from '../config.js';
import { splitSci } from '../systems/format.js';

const W = GAME.width;
const H = GAME.height;

/**
 * Overlays drawn INSIDE the canvas, so they appear in recorded clips:
 *  - recording overlay: big mass counter (≈14% down) and watermark (ending ≈86% down)
 *  - swallow labels next to the black hole ("EARTH · 5.97 × 10²⁴ kg")
 *  - milestone flashes, banners (tier-up, sector), scenario caption and fact card
 *  - a full-screen fade used to end clips on a dark frame
 * Everything sits inside the central safe area of a 9:16 frame.
 */
export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.recording = false;

    this.fadeRect = this.add.rectangle(0, 0, W, H, COLORS.void, 1).setOrigin(0).setAlpha(0).setDepth(50);

    this.buildRecordOverlay();
    this.labels = [];
    this.milestone = this.text(W / 2, H * 0.3, '', HUD.fontHead, 60, COLORS.amberCss).setOrigin(0.5).setAlpha(0).setDepth(20);
    this.milestone.setLetterSpacing(4).setStroke(COLORS.voidCss, 8);
    this.bannerTitle = this.text(W / 2, H * 0.31, '', HUD.fontHead, 76, COLORS.textCss).setOrigin(0.5).setAlpha(0).setDepth(20);
    this.bannerTitle.setLetterSpacing(5).setStroke(COLORS.voidCss, 10);
    this.bannerSub = this.text(W / 2, H * 0.31 + 62, '', HUD.fontMono, 24, COLORS.amberCss).setOrigin(0.5).setAlpha(0).setDepth(20);
    this.bannerSub.setLetterSpacing(3).setStroke(COLORS.voidCss, 6);
    this.caption = this.text(W / 2, H * 0.25, '', HUD.fontHead, 66, COLORS.textCss, { align: 'center', wordWrap: { width: 560 } })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(21);
    this.caption.setLetterSpacing(3).setStroke(COLORS.voidCss, 12);
    this.factKicker = this.text(W / 2, H * 0.4, '● REAL FACT', HUD.fontMono, 22, COLORS.scienceCss).setOrigin(0.5).setAlpha(0).setDepth(60);
    this.factKicker.setLetterSpacing(4);
    this.fact = this.text(W / 2, H * 0.5, '', HUD.fontBody, 34, COLORS.textCss, { align: 'center', wordWrap: { width: 560 }, lineSpacing: 10 })
      .setOrigin(0.5, 0)
      .setAlpha(0)
      .setDepth(60);
    this.ready = true;
  }

  text(x, y, s, font, size, color, extra = {}) {
    return this.add.text(x, y, s, { fontFamily: font, fontSize: `${size}px`, color, fontStyle: font === HUD.fontMono ? 'bold' : '', ...extra });
  }

  // ---- Recording overlay ----

  buildRecordOverlay() {
    const top = H * RECORDING.massPanelTop;
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 0.85).fillRoundedRect(60, top, W - 120, 150, 8);
    g.lineStyle(2, COLORS.hairline, 1).strokeRoundedRect(60, top, W - 120, 150, 8);
    const label = this.text(W / 2, top + 34, '•  BLACK HOLE MASS  •', HUD.fontMono, 22, COLORS.textMutedCss).setOrigin(0.5);
    label.setLetterSpacing(4).setFontStyle('');
    this.recMantissa = this.text(0, top + 70, '', HUD.fontMono, 62, COLORS.amberCss).setOrigin(0, 0);
    this.recTimes = this.text(0, top + 92, '× 10', HUD.fontMono, 32, COLORS.textCss).setOrigin(0, 0);
    this.recExp = this.text(0, top + 80, '', HUD.fontMono, 24, COLORS.amberCss).setOrigin(0, 0);
    this.recUnit = this.text(0, top + 98, 'kg', HUD.fontMono, 24, COLORS.textMutedCss).setOrigin(0, 0).setFontStyle('');

    const bottom = H * RECORDING.watermarkBottom;
    const pillH = 74;
    const wg = this.add.graphics();
    wg.fillStyle(COLORS.panelRaised, 0.92).fillRoundedRect(50, bottom - pillH, W - 100, pillH, 18);
    const cy = bottom - pillH / 2;
    const dot = this.add.circle(0, cy, 8, COLORS.amber);
    const name = this.text(0, cy, 'BLACK HOLE: EVENT HORIZON', HUD.fontHead, 36, COLORS.textCss).setOrigin(0, 0.5);
    name.setLetterSpacing(2).setFontStyle('');
    const sep = this.text(0, cy, '·', HUD.fontHead, 36, COLORS.textMutedCss).setOrigin(0, 0.5).setFontStyle('');
    const play = this.text(0, cy, 'PLAY FREE', HUD.fontHead, 36, COLORS.amberCss).setOrigin(0, 0.5);
    play.setLetterSpacing(2).setFontStyle('');
    const total = 16 + 18 + name.width + 18 + sep.width + 18 + play.width;
    let x = W / 2 - total / 2;
    dot.x = x + 8;
    x += 34;
    name.x = x;
    x += name.width + 18;
    sep.x = x;
    x += sep.width + 18;
    play.x = x;

    this.recGroup = this.add.container(0, 0, [g, label, this.recMantissa, this.recTimes, this.recExp, this.recUnit, wg, dot, name, sep, play]);
    this.recGroup.setVisible(false).setDepth(10);
    this.lastMass = '';
  }

  setRecording(on) {
    if (!this.ready) return;
    this.recording = on;
    this.recGroup.setVisible(on);
  }

  updateRecordMass(kg) {
    const { mantissa, exponent } = splitSci(kg, 3);
    const key = `${mantissa}e${exponent}`;
    if (key === this.lastMass) return;
    this.lastMass = key;
    this.recMantissa.setText(mantissa);
    this.recExp.setText(String(exponent));
    const total = this.recMantissa.width + 14 + this.recTimes.width + 4 + this.recExp.width + 14 + this.recUnit.width;
    let x = W / 2 - total / 2;
    this.recMantissa.x = x;
    x += this.recMantissa.width + 14;
    this.recTimes.x = x;
    x += this.recTimes.width + 4;
    this.recExp.x = x;
    x += this.recExp.width + 14;
    this.recUnit.x = x;
  }

  // ---- Labels next to the black hole ----

  showLabel(name, value, named = false, danger = false) {
    if (!this.ready) return;
    // Reuse the oldest if three are showing.
    let l = this.labels.find((x) => !x.alive);
    if (!l) {
      if (this.labels.length < 3) {
        const bg = this.add.graphics();
        const t1 = this.text(24, 16, '', HUD.fontHead, 30, COLORS.amberCss);
        t1.setLetterSpacing(2).setFontStyle('');
        const t2 = this.text(24, 52, '', HUD.fontMono, 26, COLORS.textCss).setFontStyle('');
        l = { c: this.add.container(0, 0, [bg, t1, t2]).setDepth(15), bg, t1, t2 };
        this.labels.push(l);
      } else {
        l = this.labels.reduce((a, b) => (a.born < b.born ? a : b));
      }
    }
    l.alive = true;
    l.born = this.time.now;
    l.life = HUD.labelTime * (named ? 1.6 : 1);
    l.t1.setText(`● ${name.toUpperCase()}${named ? '' : danger ? '' : ' · SWALLOWED'}`);
    l.t1.setColor(danger ? COLORS.dangerCss : COLORS.amberCss);
    l.t2.setText(value);
    const w = Math.max(l.t1.width, l.t2.width) + 48;
    l.w = w;
    l.bg.clear();
    l.bg.fillStyle(COLORS.panel, 0.92).fillRoundedRect(0, 0, w, 94, 6);
    l.bg.lineStyle(2, danger ? COLORS.danger : COLORS.amber, 1).strokeRoundedRect(0, 0, w, 94, 6);
    l.c.setAlpha(0).setScale(0.9);
    // Push older labels up.
    this.labels.filter((x) => x !== l && x.alive).forEach((x) => (x.slot = (x.slot ?? 0) + 1));
    l.slot = 0;
  }

  showMilestone(text) {
    if (!this.ready) return;
    this.milestone.setText(text).setAlpha(1).setScale(0.6);
    this.tweens.killTweensOf(this.milestone);
    this.tweens.add({ targets: this.milestone, scale: 1, duration: 300, ease: 'Back.Out' });
    this.tweens.add({ targets: this.milestone, alpha: 0, delay: HUD.milestoneTime * 1000, duration: 400 });
  }

  showBanner(title, sub = '', seconds = 2) {
    if (!this.ready) return;
    const items = [this.bannerTitle, this.bannerSub];
    this.tweens.killTweensOf(items);
    this.bannerTitle.setText(title.toUpperCase()).setAlpha(0).setScale(1.15);
    this.bannerSub.setText(sub.toUpperCase()).setAlpha(0);
    this.tweens.add({ targets: items, alpha: 1, scale: 1, duration: 260, ease: 'Cubic.Out' });
    this.tweens.add({ targets: items, alpha: 0, delay: seconds * 1000, duration: 450 });
  }

  showCaption(text, seconds) {
    if (!this.ready) return;
    this.caption.setText(text.toUpperCase()).setAlpha(0);
    this.tweens.add({ targets: this.caption, alpha: 1, duration: 200 });
    this.tweens.add({ targets: this.caption, alpha: 0, delay: seconds * 1000, duration: 400 });
  }

  showFact(text, seconds) {
    if (!this.ready) return;
    this.fact.setText(text);
    const items = [this.fact, this.factKicker];
    this.factKicker.y = this.fact.y - 50;
    this.tweens.add({ targets: items, alpha: 1, duration: 400 });
    this.tweens.add({ targets: items, alpha: 0, delay: seconds * 1000, duration: 500 });
  }

  /** Fade the whole frame to (1) or from (0) the void colour. */
  fade(to, seconds) {
    if (!this.ready) return;
    this.tweens.killTweensOf(this.fadeRect);
    this.tweens.add({ targets: this.fadeRect, alpha: to, duration: seconds * 1000 });
  }

  update() {
    const gs = this.gameScene;
    if (!gs?.bh || !(gs.sys.isActive() || gs.sys.isPaused())) return;
    if (this.recording) this.updateRecordMass(gs.currentKg());

    // Labels follow the black hole on screen.
    const cam = gs.cameras.main;
    const bx = (gs.bh.x - cam.worldView.x) * cam.zoom;
    const by = (gs.bh.y - cam.worldView.y) * cam.zoom;
    const br = gs.bh.drawnRadius * cam.zoom;
    const now = this.time.now;
    for (const l of this.labels) {
      if (!l.alive) continue;
      const age = (now - l.born) / 1000;
      if (age > l.life) {
        l.alive = false;
        l.c.setVisible(false);
        continue;
      }
      l.c.setVisible(true);
      const a = age < 0.15 ? age / 0.15 : age > l.life - 0.3 ? (l.life - age) / 0.3 : 1;
      l.c.setAlpha(a).setScale(0.9 + 0.1 * Math.min(1, age / 0.15));
      const x = Phaser.Math.Clamp(bx + br + 24, 70, W - 70 - l.w);
      const y = Phaser.Math.Clamp(by - br - 110 - l.slot * 104, H * 0.26, H * 0.78);
      l.c.setPosition(x, y);
    }
  }
}
