import Phaser from 'phaser';
import { GAME, COLORS, HUD, RECORDING, NEWS } from '../config.js';
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
    this.caption = this.text(W / 2, H * 0.36, '', HUD.fontHead, 66, COLORS.textCss, { align: 'center', wordWrap: { width: 560 } })
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
    this.buildCivCard();
    this.buildTicker();
    this.quote = this.text(W / 2, H * 0.62, '', HUD.fontBody, 30, COLORS.textCss, { align: 'center', wordWrap: { width: 600 }, fontStyle: 'italic' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(19);
    this.quote.setStroke(COLORS.voidCss, 8);
    this.pointers = {};
    this.ready = true;
  }

  // ---- Civilisation message card (in the canvas, so it's in clips) ----

  buildCivCard() {
    const c = this.add.container(0, 0).setDepth(25).setVisible(false);
    this.civBg = this.add.graphics();
    this.civKicker = this.text(40, 26, '', HUD.fontMono, 20, COLORS.amberCss).setFontStyle('');
    this.civKicker.setLetterSpacing(3);
    this.civName = this.text(40, 56, '', HUD.fontHead, 40, COLORS.textCss);
    this.civName.setLetterSpacing(2).setFontStyle('');
    this.civMeta = this.text(40, 102, '', HUD.fontMono, 19, COLORS.textMutedCss).setFontStyle('');
    this.civText = this.text(40, 140, '', HUD.fontBody, 29, COLORS.textCss, { wordWrap: { width: W - 160 }, lineSpacing: 6 });
    this.civOffer = this.text(40, 0, '', HUD.fontMono, 20, COLORS.scienceCss).setFontStyle('');
    this.civOffer.setLetterSpacing(2);
    c.add([this.civBg, this.civKicker, this.civName, this.civMeta, this.civText, this.civOffer]);
    this.civCard = c;
  }

  /** Top of the civilisation card: below the HUD normally, below the mass panel while recording. */
  civCardTop() {
    return this.recording ? H * 0.31 : H * 0.215;
  }

  showCivCard(c) {
    if (!this.ready) return;
    this.civKicker.setText(`●  INCOMING TRANSMISSION`).setColor(c.hostile ? COLORS.dangerCss : COLORS.amberCss);
    this.civName.setText(`${c.species.toUpperCase()} OF ${c.planet.toUpperCase()}`);
    this.civMeta.setText(`${c.tech.toUpperCase()} · ${c.kind.toUpperCase()} · ${c.mood.toUpperCase()}`);
    this.civText.setText(`“${c.text}”`);
    let h = this.civText.y + this.civText.height + 22;
    if (c.offer) {
      this.civOffer.setText(`SPARE US → ${c.offer.toUpperCase()}`).setY(h).setVisible(true);
      h += 34;
    } else this.civOffer.setVisible(false);
    h += 10;
    const w = W - 80;
    this.civBg.clear();
    this.civBg.fillStyle(COLORS.panel, 0.94).fillRoundedRect(0, 0, w, h, 8);
    this.civBg.lineStyle(2, c.hostile ? COLORS.danger : COLORS.amber, 1).strokeRoundedRect(0, 0, w, h, 8);
    this.civCardHeight = h;
    this.civCard.setPosition(40, this.civCardTop()).setVisible(true).setAlpha(0);
    this.tweens.killTweensOf(this.civCard);
    this.tweens.add({ targets: this.civCard, alpha: 1, duration: 220 });
  }

  hideCivCard() {
    if (!this.ready || !this.civCard.visible) return;
    this.tweens.killTweensOf(this.civCard);
    this.tweens.add({ targets: this.civCard, alpha: 0, duration: 220, onComplete: () => this.civCard.setVisible(false) });
  }

  /** Bottom edge of the civ card in design px (the HUD puts the EAT / SPARE buttons under it). */
  civCardBottom() {
    return this.civCardTop() + (this.civCardHeight ?? 260);
  }

  /** A line of dialogue (last words, thanks) under the black hole. */
  showQuote(text, seconds = 3) {
    if (!this.ready) return;
    this.quote.setText(text).setAlpha(0);
    this.tweens.killTweensOf(this.quote);
    this.tweens.add({ targets: this.quote, alpha: 1, duration: 250 });
    this.tweens.add({ targets: this.quote, alpha: 0, delay: seconds * 1000, duration: 400 });
  }

  // ---- Galactic News ticker ----

  buildTicker() {
    const h = 44;
    this.tickerH = h;
    this.tickerBg = this.add.graphics();
    this.tickerTag = this.text(18, h / 2, 'GALACTIC NEWS', HUD.fontHead, 24, COLORS.voidCss).setOrigin(0, 0.5).setFontStyle('');
    this.tickerTag.setLetterSpacing(2);
    const tagW = this.tickerTag.width + 36;
    this.tickerTagW = tagW;
    this.tickerText = this.text(tagW + 14, h / 2, '', HUD.fontMono, 22, COLORS.textCss).setOrigin(0, 0.5).setFontStyle('');
    const maskG = this.make.graphics({ add: false });
    this.tickerMaskG = maskG;
    this.tickerText.setMask(maskG.createGeometryMask());
    this.ticker = this.add.container(0, 0, [this.tickerBg, this.tickerTag, this.tickerText]).setDepth(18).setVisible(false);
    this.drawTicker();
  }

  tickerTop() {
    return this.recording ? H * 0.268 : H * 0.165;
  }

  drawTicker() {
    // Leaves room for the record button on the right.
    const w = W - 32 - 150;
    const h = this.tickerH;
    this.tickerBg.clear();
    this.tickerBg.fillStyle(COLORS.panel, 0.9).fillRect(0, 0, w, h);
    this.tickerBg.lineStyle(2, COLORS.hairline, 1).strokeRect(0, 0, w, h);
    this.tickerBg.fillStyle(COLORS.amber, 1).fillRect(0, 0, this.tickerTagW, h);
    this.tickerW = w;
  }

  /** @returns {number} seconds the headline will be on screen */
  showHeadline(text, seconds) {
    if (!this.ready) return seconds;
    const top = this.tickerTop();
    this.ticker.setPosition(32, top).setVisible(true).setAlpha(0);
    this.tickerText.setText(text.toUpperCase());
    const room = this.tickerW - this.tickerTagW - 28;
    const over = Math.max(0, this.tickerText.width - room);
    const scroll = over > 0 ? over / NEWS.scrollSpeed : 0;
    const total = seconds + scroll;
    this.tickerMaskG.clear().fillStyle(0xffffff).fillRect(32 + this.tickerTagW + 4, top, this.tickerW - this.tickerTagW - 8, this.tickerH);
    this.tickerText.x = this.tickerTagW + 14;
    this.tweens.killTweensOf([this.ticker, this.tickerText]);
    this.tweens.add({ targets: this.ticker, alpha: 1, duration: 250 });
    if (scroll > 0) this.tweens.add({ targets: this.tickerText, x: this.tickerTagW + 14 - over, delay: 1200, duration: scroll * 1000, ease: 'Linear' });
    this.tweens.add({ targets: this.ticker, alpha: 0, delay: (total + 1) * 1000, duration: 350 });
    return total + 1.6;
  }

  // ---- Scanner arrows pointing at off-screen things (civilisations, gifts, events) ----

  /**
   * @param {string} id
   * @param {{x:number,y:number,inUse?:boolean}} target world position (an object is followed while inUse)
   * @param {number} color
   * @param {string} label
   * @param {number} [seconds] auto-clear after this long
   */
  setPointer(id, target, color, label, seconds = 0) {
    if (!this.ready) return;
    let p = this.pointers[id];
    if (!p) {
      const g = this.add.graphics();
      const t = this.text(0, 0, '', HUD.fontMono, 20, COLORS.textCss).setOrigin(0.5).setFontStyle('');
      t.setStroke(COLORS.voidCss, 6);
      p = { g, t };
      this.pointers[id] = p;
    }
    p.target = target;
    p.gen = target.gen;
    p.color = color;
    p.t.setText(label.toUpperCase()).setColor(`#${color.toString(16).padStart(6, '0')}`);
    p.until = seconds ? this.time.now + seconds * 1000 : 0;
    p.g.setVisible(true);
    p.t.setVisible(true);
  }

  clearPointer(id) {
    const p = this.pointers?.[id];
    if (!p) return;
    p.target = null;
    p.g.setVisible(false);
    p.t.setVisible(false);
  }

  updatePointers(cam) {
    for (const [id, p] of Object.entries(this.pointers)) {
      if (!p.target) continue;
      const tg = p.target;
      if ((p.until && this.time.now > p.until) || tg.inUse === false || (p.gen !== undefined && tg.gen !== p.gen)) {
        this.clearPointer(id);
        continue;
      }
      const sx = (tg.x - cam.worldView.x) * cam.zoom;
      const sy = (tg.y - cam.worldView.y) * cam.zoom;
      const m = 70;
      const onScreen = sx > m && sx < W - m && sy > H * 0.2 && sy < H * 0.8;
      if (onScreen && id !== 'gift') {
        p.g.setVisible(false);
        p.t.setVisible(false);
        continue;
      }
      p.g.setVisible(true);
      p.t.setVisible(true);
      const cx = W / 2;
      const cy = H / 2;
      const ang = Math.atan2(sy - cy, sx - cx);
      // Clamp to an inner rectangle so the arrow never hides under the HUD.
      const rx = W / 2 - m;
      const ry = H * 0.27;
      const k = Math.min(rx / Math.abs(Math.cos(ang) || 1e-6), ry / Math.abs(Math.sin(ang) || 1e-6));
      const x = onScreen ? sx : cx + Math.cos(ang) * k;
      const y = onScreen ? sy - 60 : cy + Math.sin(ang) * k;
      const pulse = 0.7 + 0.3 * Math.sin(this.time.now / 160);
      p.g.clear();
      p.g.fillStyle(p.color, pulse);
      const a = onScreen ? Math.PI / 2 : ang;
      const s = 18;
      p.g.fillTriangle(
        x + Math.cos(a) * s, y + Math.sin(a) * s,
        x + Math.cos(a + 2.5) * s, y + Math.sin(a + 2.5) * s,
        x + Math.cos(a - 2.5) * s, y + Math.sin(a - 2.5) * s,
      );
      p.t.setPosition(x - Math.cos(a) * 34, y - Math.sin(a) * 34);
    }
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
    // Keep the ticker and message card clear of the recording mass panel.
    if (this.ticker.visible) this.ticker.y = this.tickerTop();
    if (this.civCard.visible) this.civCard.y = this.civCardTop();
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
      if (this.labels.length < 2) {
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
    this.updatePointers(cam);
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
      l.c.setAlpha(a * (this.civCard.visible ? 0.25 : 1)).setScale(0.9 + 0.1 * Math.min(1, age / 0.15));
      const x = Phaser.Math.Clamp(bx + br + 24, 70, W - 70 - l.w);
      // Newest label just above the black hole, the older one stacked above it; both stay
      // below the recording mass panel.
      const y = Phaser.Math.Clamp(by - br - 110, H * 0.28 + 104, H * 0.78) - l.slot * 104;
      l.c.setPosition(x, y);
    }
  }
}
