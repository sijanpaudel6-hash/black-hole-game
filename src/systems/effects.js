import Phaser from 'phaser';
import { DEPTH, EFFECTS, LOW_GRAPHICS, COLORS } from '../config.js';

/**
 * Pooled visual effects: spaghettification, flashes, shockwaves and debris particles
 * that spiral into a black hole. Everything respects the Low graphics setting.
 */
export default class Effects {
  constructor(scene, low) {
    this.scene = scene;
    this.low = low;
    this.ghosts = [];
    this.flashes = [];
    this.waves = [];
    this.particles = [];
    this.activeParticles = 0;
  }

  setLow(low) {
    this.low = low;
  }

  getFrom(pool, factory) {
    let item = pool.find((p) => !p.alive);
    if (!item) {
      item = factory();
      pool.push(item);
    }
    item.alive = true;
    return item;
  }

  /**
   * The swallowed object stretches toward the centre, shrinks and fades.
   * @param {object} obj the swallowed SpaceObject (copied; the original is reused at once)
   * @param {{x:number,y:number,radius:number}} target what's eating it
   * @param {boolean} big long, dramatic version for big swallows
   */
  spaghetti(obj, target, big = false) {
    const g = this.getFrom(this.ghosts, () => ({ img: this.scene.add.image(0, 0, 'spark').setDepth(DEPTH.ghosts) }));
    const img = g.img;
    img.setTexture(obj.texture.key).setOrigin(obj.originX, obj.originY).setVisible(true).setAlpha(1);
    if (obj.isTinted) img.setTint(obj.tintTopLeft);
    else img.clearTint();
    img.setPosition(obj.x, obj.y);
    g.baseScale = obj.scaleX;
    g.startX = obj.x;
    g.startY = obj.y;
    g.offX = obj.x - target.x;
    g.offY = obj.y - target.y;
    g.target = target;
    g.t = 0;
    g.duration = big ? EFFECTS.bigSpaghettiTime : EFFECTS.spaghettiTime;
    g.stretch = this.low && !LOW_GRAPHICS.spaghetti ? 0 : big ? EFFECTS.bigSpaghettiStretch : EFFECTS.spaghettiStretch;
    g.spin = (Math.random() < 0.5 ? -1 : 1) * (big ? 1.2 : 2.5);
    img.setDepth(big ? DEPTH.effects - 1 : DEPTH.ghosts);
  }

  flash(x, y, size, color = 0xffffff, duration = EFFECTS.flashTime) {
    const f = this.getFrom(this.flashes, () => ({ img: this.scene.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.effects) }));
    f.img.setPosition(x, y).setTint(color).setVisible(true).setAlpha(1);
    f.size = size;
    f.t = 0;
    f.duration = duration;
  }

  shockwave(x, y, radius, color = COLORS.amber, duration = EFFECTS.shockwaveTime) {
    const w = this.getFrom(this.waves, () => ({ img: this.scene.add.image(0, 0, 'shockwave').setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.effects) }));
    w.img.setPosition(x, y).setTint(color).setVisible(true).setAlpha(1);
    w.radius = radius;
    w.t = 0;
    w.duration = duration;
  }

  /** Debris that spirals into `target` (a black hole). */
  debris(x, y, colors, count, target, speed) {
    if (this.low && !LOW_GRAPHICS.particles) return;
    for (let i = 0; i < count; i++) {
      if (this.activeParticles >= EFFECTS.maxParticles) return;
      const p = this.getFrom(this.particles, () => ({ img: this.scene.add.image(0, 0, 'spark').setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.particles) }));
      this.activeParticles++;
      const color = Array.isArray(colors) ? Phaser.Utils.Array.GetRandom(colors) : colors;
      p.img.setTint(color).setVisible(true).setAlpha(1);
      p.x = x + Phaser.Math.FloatBetween(-1, 1) * target.radius * 0.3;
      p.y = y + Phaser.Math.FloatBetween(-1, 1) * target.radius * 0.3;
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const s = (speed ?? target.radius * 3) * Phaser.Math.FloatBetween(0.6, 1.2);
      const side = Math.random() < 0.5 ? -1 : 1;
      // Mostly sideways (so it spirals), a little inward.
      p.vx = (-dy / d) * s * side + (dx / d) * s * 0.3;
      p.vy = (dx / d) * s * side + (dy / d) * s * 0.3;
      p.target = target;
      p.life = 0;
      p.maxLife = Phaser.Math.FloatBetween(EFFECTS.particleLife[0], EFFECTS.particleLife[1]);
      p.size = target.radius * Phaser.Math.FloatBetween(0.06, 0.16);
    }
  }

  update(dt) {
    for (const g of this.ghosts) {
      if (!g.alive) continue;
      g.t += dt / g.duration;
      const img = g.img;
      if (g.t >= 1) {
        g.alive = false;
        img.setVisible(false);
        if (!this.low) this.flash(g.target.x, g.target.y, g.target.radius * 0.9, COLORS.amber, 0.2);
        continue;
      }
      const t = g.t;
      const ease = t * t;
      // Fall toward the (moving) centre.
      const x = g.target.x + g.offX * (1 - ease);
      const y = g.target.y + g.offY * (1 - ease);
      img.setPosition(x, y);
      const angle = Math.atan2(g.target.y - y, g.target.x - x);
      img.setRotation(angle + g.spin * t * 0.3);
      img.setScale(g.baseScale * (1 + g.stretch * t) * (1 - 0.6 * t), g.baseScale * Math.max(0.04, 1 - 0.92 * t));
      img.setAlpha(1 - t * t * t);
    }
    for (const f of this.flashes) {
      if (!f.alive) continue;
      f.t += dt / f.duration;
      if (f.t >= 1) {
        f.alive = false;
        f.img.setVisible(false);
        continue;
      }
      f.img.setScale((f.size * (0.6 + f.t * 0.8)) / 128);
      f.img.setAlpha(1 - f.t);
    }
    for (const w of this.waves) {
      if (!w.alive) continue;
      w.t += dt / w.duration;
      if (w.t >= 1) {
        w.alive = false;
        w.img.setVisible(false);
        continue;
      }
      w.img.setScale((w.radius * (0.2 + w.t * 1.2)) / 128);
      w.img.setAlpha(1 - w.t);
    }
    for (const p of this.particles) {
      if (!p.alive) continue;
      p.life += dt;
      const tx = p.target.x - p.x;
      const ty = p.target.y - p.y;
      const d = Math.hypot(tx, ty) || 1;
      if (p.life > p.maxLife || d < p.target.radius * 0.6) {
        p.alive = false;
        this.activeParticles--;
        p.img.setVisible(false);
        continue;
      }
      const pull = p.target.radius * 14;
      p.vx += (tx / d) * pull * dt;
      p.vy += (ty / d) * pull * dt;
      const drag = Math.exp(-1.2 * dt);
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = 1 - p.life / p.maxLife;
      p.img.setPosition(p.x, p.y).setScale((p.size * (0.4 + k)) / 16).setAlpha(Math.min(1, k * 1.5));
    }
  }
}
