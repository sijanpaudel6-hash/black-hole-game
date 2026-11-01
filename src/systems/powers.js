// Cosmic powers for runs: pick 1 of 3 at every era change (see POWERS in config.js and
// src/data/powers.js). GameScene creates one Powers per run and asks it for the numbers
// it changes (pull range, swirl, shredding, world slow-down, hit protection) and lets it
// run the active bits (jets, bursts, synergy visuals) every frame.

import Phaser from 'phaser';
import { POWERS, DEPTH, EATING, GROWTH, COLORS } from '../config.js';
import { POWER_LIST, SYNERGIES, POWERS_BY_ID } from '../data/powers.js';
import { audio } from './audio.js';

const TAU = Math.PI * 2;

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = Phaser.Math.Clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

export default class Powers {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {() => number} rng random source (seeded for the Daily Universe)
   */
  constructor(scene, rng = Math.random) {
    this.scene = scene;
    this.rng = rng;
    this.levels = {};
    this.synergies = new Set();
    this.jetCooldown = 0;
    this.jetTime = 0;
    this.jetAngle = -Math.PI / 2;
    this.jetStart = 0;
    this.jetHits = new Map();
    this.lastGaspUsed = false;
    this.worldScale = 1;
    this.sawAngle = 0;
    this.gfx = scene.add.graphics().setDepth(DEPTH.blackHole - 1).setBlendMode(Phaser.BlendModes.ADD);
    this.haloRing = scene.add.image(0, 0, 'ring').setTint(COLORS.science).setVisible(false).setDepth(DEPTH.edibleObjects - 1);
  }

  // ---- Levels ----

  level(id) {
    return this.levels[id] ?? 0;
  }

  has(id) {
    return this.level(id) > 0;
  }

  /** Per-level value of a power's setting (or `fallback` when not owned). */
  val(id, key, fallback = 0) {
    const l = this.level(id);
    if (!l) return fallback;
    const v = POWERS[id][key];
    return Array.isArray(v) ? v[Math.min(l, v.length) - 1] : v;
  }

  owned() {
    return POWER_LIST.filter((p) => this.has(p.id)).map((p) => ({ id: p.id, level: this.level(p.id) }));
  }

  canOffer() {
    return POWER_LIST.some((p) => this.level(p.id) < POWERS.maxLevel);
  }

  /** Up to POWERS.choices distinct power ids to choose from. */
  offer() {
    const open = POWER_LIST.map((p) => p.id).filter((id) => this.level(id) < POWERS.maxLevel);
    const picks = [];
    const take = (list) => {
      const pool = list.filter((id) => !picks.includes(id));
      if (pool.length) picks.push(pool[Math.floor(this.rng() * pool.length)]);
    };
    const ownedOpen = open.filter((id) => this.has(id));
    if (ownedOpen.length && this.rng() < POWERS.offerOwnedChance) take(ownedOpen);
    const completes = open.filter((id) => !this.has(id) && SYNERGIES.some((s) => s.needs.includes(id) && s.needs.every((n) => n === id || this.has(n))));
    if (completes.length && this.rng() < POWERS.synergyOfferChance) take(completes);
    while (picks.length < Math.min(POWERS.choices, open.length)) take(open);
    // Shuffle so the "owned" card isn't always first.
    for (let i = picks.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [picks[i], picks[j]] = [picks[j], picks[i]];
    }
    return picks;
  }

  /** Synergy this power would complete (if its partner is owned and it isn't), else null. */
  completesSynergy(id) {
    if (this.has(id)) return null;
    return SYNERGIES.find((s) => !this.synergies.has(s.id) && s.needs.includes(id) && s.needs.every((n) => n === id || this.has(n))) ?? null;
  }

  /** Learn or level up a power. @returns {{ synergies: object[] }} newly unlocked synergies */
  take(id) {
    this.levels[id] = Math.min(POWERS.maxLevel, this.level(id) + 1);
    const fresh = [];
    for (const s of SYNERGIES) {
      if (!this.synergies.has(s.id) && s.needs.every((n) => this.has(n))) {
        this.synergies.add(s.id);
        fresh.push(s);
      }
    }
    if (id === 'kerrSpin') this.scene.bh.opts.spinScale = this.val('kerrSpin', 'diskSpin', 1);
    if (id === 'jets') this.jetCooldown = 0;
    return { synergies: fresh };
  }

  // ---- Numbers other systems read ----

  pullRangeMul() {
    return 1 + this.val('kerrSpin', 'pullBonus') + this.val('halo', 'pullBonus');
  }

  pullStrengthMul() {
    return 1 + this.val('halo', 'pullStrength');
  }

  swirl() {
    return this.val('kerrSpin', 'swirl');
  }

  /** Shredding rule for the spawner, or null. */
  shred() {
    if (!this.has('shredder')) return null;
    const saw = this.synergies.has('buzzsaw');
    return {
      ratio: this.val('shredder', 'maxRatio') + (saw ? POWERS.buzzsaw.ratioBonus : 0),
      range: this.val('shredder', 'range') + (saw ? POWERS.buzzsaw.rangeBonus : 0),
      inward: saw ? POWERS.buzzsaw.chunkPull : 0,
    };
  }

  hiddenChance() {
    return this.val('lens', 'hiddenChance');
  }

  /**
   * Gravitational Lens: how fast the world runs (you don't slow down).
   * @param {number} gap distance from your edge to the nearest dangerous edge, in your radii
   */
  updateWorldScale(gap, realDt) {
    let want = 1;
    if (this.has('lens')) {
      const range = this.val('lens', 'slowRange');
      if (gap < range) want = Phaser.Math.Linear(this.val('lens', 'slowScale'), 1, Math.max(0, gap) / range);
    }
    this.worldScale += (want - this.worldScale) * (1 - Math.exp(-6 * realDt));
    return this.worldScale;
  }

  // ---- Hawking Bloom ----

  /** Mass loss after a hit: Bloom lowers it and blasts hazards away. */
  onHitLoss(loss) {
    if (!this.has('bloom')) return loss;
    this.burst(this.val('bloom', 'radius'));
    this.scene.invulnerable = Math.max(this.scene.invulnerable, this.val('bloom', 'invulnerable'));
    return loss * (1 - this.val('bloom', 'lossCut'));
  }

  burst(radiusMul) {
    const s = this.scene;
    const bh = s.bh;
    const R = bh.radius * radiusMul;
    const scale = bh.radius / GROWTH.baseRadius;
    const edible = bh.radius * EATING.edibleRatio;
    for (const o of s.spawner.objects) {
      if (!o.inUse || o.radius < edible || o.role === 'persistent') continue;
      const dx = o.x - bh.x;
      const dy = o.y - bh.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > R + o.radius) continue;
      if (o.orbiting) o.freeFromOrbit();
      const k = POWERS.bloom.push * scale * Math.max(0.3, 1 - d / (R + o.radius));
      o.vx += (dx / d) * k;
      o.vy += (dy / d) * k;
      o.driftX = o.vx * 0.2;
      o.driftY = o.vy * 0.2;
    }
    s.effects.shockwave(bh.x, bh.y, R, COLORS.science, 0.7);
    s.effects.flash(bh.x, bh.y, bh.radius * 3, COLORS.science, 0.4);
    audio.blip(520, 0.08);
  }

  /** Level 3 Bloom: once per run, a rival about to eat you is blasted away instead. */
  trySaveFromRival(rival) {
    if (!this.val('bloom', 'lastGasp', false) || this.lastGaspUsed) return false;
    this.lastGaspUsed = true;
    const s = this.scene;
    const bh = s.bh;
    const dx = rival.x - bh.x;
    const dy = rival.y - bh.y;
    const d = Math.hypot(dx, dy) || 1;
    const away = rival.radius + bh.radius * 4;
    rival.x = bh.x + (dx / d) * away;
    rival.y = bh.y + (dy / d) * away;
    const scale = bh.radius / GROWTH.baseRadius;
    rival.vx = (dx / d) * POWERS.bloom.push * scale * 1.5;
    rival.vy = (dy / d) * POWERS.bloom.push * scale * 1.5;
    this.burst(this.val('bloom', 'radius') * 1.6);
    s.invulnerable = 2.5;
    s.ui.showBanner('Last gasp', 'Hawking Bloom saved you', 1.8);
    s.shake(0.02, 0.4);
    return true;
  }

  // ---- Relativistic Jets ----

  jetCooldownTime() {
    const base = this.val('jets', 'cooldown', 1);
    return this.synergies.has('pulsar') ? base * POWERS.pulsar.cooldownScale : base;
  }

  /** 0 = ready, 1 = just fired. */
  jetCharge() {
    return this.has('jets') ? Phaser.Math.Clamp(this.jetCooldown / this.jetCooldownTime(), 0, 1) : 0;
  }

  fireJets() {
    if (!this.has('jets') || this.jetCooldown > 0 || this.scene.ended) return false;
    const bh = this.scene.bh;
    if (bh.velocity.lengthSq() > 1) this.jetAngle = Math.atan2(bh.velocity.y, bh.velocity.x);
    this.jetStart = this.jetAngle;
    this.jetTime = POWERS.jets.duration;
    this.jetCooldown = this.jetCooldownTime();
    this.jetHits.clear();
    bh.boostDisk(0.5);
    audio.bassDrop(0.5);
    this.scene.shake(0.006, 0.25);
    return true;
  }

  /** The two jet paths as lists of points (straight, or bent toward stars with Lensed Jets). */
  jetPaths() {
    const s = this.scene;
    const bh = s.bh;
    const r = bh.radius;
    const lensed = this.synergies.has('lensedJets');
    const L = r * this.val('jets', 'length') * (lensed ? POWERS.lensedJets.lengthScale : 1);
    const edible = r * EATING.edibleRatio;
    const paths = [];
    for (const side of [0, Math.PI]) {
      const a = this.jetAngle + side;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      let target = null;
      if (lensed) {
        let best = Infinity;
        for (const o of s.spawner.objects) {
          if (!o.inUse || !o.visible || o.radius < edible || o.role === 'persistent') continue;
          const dx = o.x - bh.x;
          const dy = o.y - bh.y;
          const d = Math.hypot(dx, dy);
          if (d > L * 1.1 || d < r) continue;
          const off = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - a));
          if (off > POWERS.lensedJets.seekCone) continue;
          if (d < best) {
            best = d;
            target = o;
          }
        }
      }
      if (target) {
        // Quadratic curve: leaves along the jet axis, bends onto the target.
        const cx = bh.x + ux * L * 0.45; // (curve starts at the edge of the black hole)
        const cy = bh.y + uy * L * 0.45;
        const pts = [];
        for (let i = 0; i <= 8; i++) {
          const t = 0.1 + (i / 8) * 0.9;
          const m = 1 - t;
          pts.push({ x: m * m * bh.x + 2 * m * t * cx + t * t * target.x, y: m * m * bh.y + 2 * m * t * cy + t * t * target.y });
        }
        paths.push(pts);
      } else {
        paths.push([
          { x: bh.x + ux * r, y: bh.y + uy * r },
          { x: bh.x + ux * L, y: bh.y + uy * L },
        ]);
      }
    }
    return paths;
  }

  updateJets(dt) {
    const s = this.scene;
    const bh = s.bh;
    if (this.jetCooldown > 0) this.jetCooldown -= dt;
    if (this.synergies.has('pulsar') && POWERS.pulsar.autoFire && this.jetCooldown <= 0 && !s.ended) this.fireJets();
    if (this.jetTime <= 0) return;
    this.jetTime -= dt;
    const progress = 1 - Math.max(0, this.jetTime) / POWERS.jets.duration;
    if (this.synergies.has('pulsar')) this.jetAngle = this.jetStart + progress * TAU * POWERS.pulsar.sweepTurns;
    else if (bh.velocity.lengthSq() > 1) this.jetAngle = Phaser.Math.Angle.RotateTo(this.jetAngle, Math.atan2(bh.velocity.y, bh.velocity.x), 4 * dt);

    const paths = this.jetPaths();
    const r = bh.radius;
    const W = r * POWERS.jets.width;
    // Draw: wide soft glow, then a bright core.
    const fade = Math.min(1, this.jetTime * 4, progress * 8);
    const g = this.gfx;
    for (const pts of paths) {
      for (const [w, color, alpha] of [[W * 2.2, COLORS.science, 0.18], [W * 1.2, 0xcfe4ff, 0.35], [W * 0.45, 0xffffff, 0.9]]) {
        g.lineStyle(w, color, alpha * fade);
        g.beginPath();
        g.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
        g.strokePath();
      }
    }

    // Hits: shatter what they can, shrink rivals, knock back the rest.
    const edible = r * EATING.edibleRatio;
    const breakR = r * this.val('jets', 'breakRatio');
    const scale = r / GROWTH.baseRadius;
    for (const o of s.spawner.objects) {
      if (!o.inUse || !o.visible || o.radius < edible || o.role === 'persistent') continue;
      if (this.jetHits.get(o) === o.gen) continue;
      let hit = false;
      for (const pts of paths) {
        for (let i = 1; i < pts.length && !hit; i++) {
          if (distToSegment(o.x, o.y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) < o.radius + W) hit = true;
        }
        if (hit) break;
      }
      if (!hit) continue;
      if (o.behaviour === 'rival') {
        this.jetHits.set(o, o.gen);
        o.setMass(o.mass * (1 - POWERS.jets.rivalShrink));
        s.effects.flash(o.x, o.y, o.radius * 2, COLORS.science, 0.4);
      } else if (o.radius <= breakR && o.behaviour !== 'static') {
        s.spawner.shatter(o, bh);
      } else {
        this.jetHits.set(o, o.gen);
        if (o.orbiting) o.freeFromOrbit();
        const dx = o.x - bh.x;
        const dy = o.y - bh.y;
        const d = Math.hypot(dx, dy) || 1;
        o.vx += (dx / d) * POWERS.jets.knockback * scale;
        o.vy += (dy / d) * POWERS.jets.knockback * scale;
        s.effects.flash(o.x - (dx / d) * o.radius, o.y - (dy / d) * o.radius, r * 2, COLORS.science, 0.3);
      }
    }
  }

  // ---- Per frame ----

  update(dt) {
    const s = this.scene;
    const bh = s.bh;
    this.gfx.clear();
    this.updateJets(dt);

    // Dark Matter Halo: a faint ring at the edge of your pull.
    if (this.has('halo') && !s.ended) {
      const R = bh.radius * s.effectivePullRange();
      this.haloRing.setVisible(true).setPosition(bh.x, bh.y).setScale(R / 124).setAlpha(POWERS.halo.ringAlpha * (0.8 + 0.2 * Math.sin(s.elapsed * 2)));
    } else if (this.haloRing.visible) this.haloRing.setVisible(false);

    // Accretion Buzzsaw: a spinning ring of teeth.
    if (this.synergies.has('buzzsaw') && !s.ended && bh.visible) {
      this.sawAngle += dt * 5;
      const R = bh.drawnRadius * POWERS.buzzsaw.ringRadius;
      const teeth = 14;
      const g = this.gfx;
      g.fillStyle(COLORS.amber, 0.55);
      for (let i = 0; i < teeth; i++) {
        const a = this.sawAngle + (i / teeth) * TAU;
        const a2 = a + (TAU / teeth) * 0.55;
        g.fillTriangle(
          bh.x + Math.cos(a) * R, bh.y + Math.sin(a) * R,
          bh.x + Math.cos(a2) * R, bh.y + Math.sin(a2) * R,
          bh.x + Math.cos(a2) * R * 1.22, bh.y + Math.sin(a2) * R * 1.22,
        );
      }
      g.lineStyle(bh.drawnRadius * 0.05, 0xffe0b0, 0.5).strokeCircle(bh.x, bh.y, R);
    }
  }

  /** For the HUD and share card. */
  summary() {
    return {
      powers: this.owned().map((p) => ({ ...p, name: POWERS_BY_ID[p.id].name })),
      synergies: SYNERGIES.filter((x) => this.synergies.has(x.id)),
    };
  }
}
