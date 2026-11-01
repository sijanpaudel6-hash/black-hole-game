// Cosmic events: short (10–30 s) situations from real astrophysics that break up a run, and
// the same events as "What if…?" scenarios. Numbers in EVENTS (config.js).
//
//  supernova   a giant star collapses and explodes: a shockwave and a ring of debris to eat
//  tidal       a star wanders too close and is shredded into a glowing stream you slurp up
//  wanderer    a runaway black hole races through, leaving newborn stars behind (like RBH-1)
//  wormhole    a portal to a feast far away (THEORETICAL: wormholes may not exist)
//  whiteHole   a reversed black hole that spits matter out (HYPOTHETICAL: none seen)
//  darkMatter  invisible clumps, seen only as faint rings of bent starlight
//  merger      every black-hole merger: gravitational-wave ripples and a rising chirp

import Phaser from 'phaser';
import { EVENTS, EATING, GROWTH, COLORS, DEPTH, OBJECTS } from '../config.js';
import { audio } from './audio.js';

const TAU = Math.PI * 2;

export const EVENT_INFO = {
  supernova: { title: 'Supernova', sub: 'A giant star is about to explode', tag: null },
  tidal: { title: 'Tidal disruption', sub: 'A star is falling toward you', tag: null },
  wanderer: { title: 'Runaway black hole', sub: 'Something huge is coming through', tag: null },
  wormhole: { title: 'Wormhole', sub: 'Dive in for a shortcut', tag: 'Theoretical' },
  whiteHole: { title: 'White hole', sub: 'It spits matter out · dodge', tag: 'Hypothetical' },
  darkMatter: { title: 'Dark matter', sub: 'Watch for bent starlight', tag: null },
};

export default class CosmicEvents {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {() => number} rng seeded in a Daily Universe
   */
  constructor(scene, rng = Math.random) {
    this.scene = scene;
    this.rng = rng;
    this.active = null;
    this.timer = EVENTS.firstDelay;
    this.count = 0;
    this.gfx = scene.add.graphics().setDepth(DEPTH.edibleObjects - 1);
    this.fx = scene.add.graphics().setDepth(DEPTH.effects - 3).setBlendMode(Phaser.BlendModes.ADD);
  }

  get bh() {
    return this.scene.bh;
  }

  // ---- Scheduling (runs) ----

  onEraChange() {
    this.timer = EVENTS.firstDelay;
  }

  /** Random events in runs, one at a time, from the era's list. */
  updateSchedule(dt) {
    const s = this.scene;
    if (this.active || !s.run || s.run.finished || s.civs?.choice) return;
    const list = EVENTS.perEra[s.run.era.id];
    if (!list?.length) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    const [a, b] = EVENTS.interval;
    this.timer = (a + this.rng() * (b - a)) * (s.mod?.eventInterval ?? 1);
    this.start(list[Math.floor(this.rng() * list.length)]);
  }

  // ---- Helpers ----

  r(mul) {
    return this.bh.radius * mul;
  }

  /** A point on screen-ish distance `k` × the view's half-diagonal from you, inside the world. */
  pointAround(k, angle = this.rng() * TAU) {
    const s = this.scene;
    const v = s.spawner.view();
    const bh = this.bh;
    for (let i = 0; i < 12; i++) {
      const a = angle + i * 0.7;
      const x = bh.x + Math.cos(a) * v.halfDiag * k;
      const y = bh.y + Math.sin(a) * v.halfDiag * k;
      if (Math.hypot(x, y) < s.worldRadius * 0.88) return { x, y, a };
    }
    return { x: bh.x * 0.5, y: bh.y * 0.5, a: angle };
  }

  /** Spawn an object from the pool with a set size and mass. */
  spawn(type, x, y, radius, mass, opts = {}) {
    const o = this.scene.spawner.take();
    if (!o) return null;
    o.reset(type, x, y, { role: 'extra', radius, mass, ...opts });
    if (o.orbiting) o.freeFromOrbit();
    return o;
  }

  /** Mass so that swallowing it adds `share` of your current mass. */
  massFor(share) {
    const s = this.scene;
    const gain = EATING.massGain * (s.run?.era.gain ?? 1);
    return (share * this.bh.mass) / gain;
  }

  announce(type) {
    const s = this.scene;
    const info = EVENT_INFO[type];
    s.ui.showBanner(info.title, info.tag ? `${info.tag} · ${info.sub}` : info.sub, 2.4);
    if (info.tag) s.ui.showLabel(info.title, `${info.tag.toUpperCase()} PHYSICS`, true);
    audio.warning();
  }

  // ---- Start ----

  /**
   * @param {string} type
   * @param {object} [opts] { scenario: true } for What if…? scenes (bigger, closer, no randomness)
   */
  start(type, opts = {}) {
    if (this.active) this.end();
    const fn = this[`start_${type}`];
    if (!fn) return;
    this.count++;
    this.active = { type, t: 0, opts, done: false };
    this.announce(type);
    fn.call(this, this.active, opts);
    this.scene.news?.push(type === 'whiteHole' ? 'whitehole' : type);
  }

  end() {
    const a = this.active;
    if (!a) return;
    a.cleanup?.();
    this.scene.ui.clearPointer('event');
    this.gfx.clear();
    this.fx.clear();
    this.active = null;
  }

  update(dt) {
    this.updateSchedule(dt);
    const a = this.active;
    if (!a) return;
    a.t += dt;
    this.gfx.clear();
    this.fx.clear();
    if (a.update?.(dt) === false || a.done) {
      const cb = a.onEnd;
      this.end();
      cb?.();
    }
  }

  // ---- Supernova ----

  start_supernova(a, opts) {
    const E = EVENTS.supernova;
    const p = opts.at ?? this.pointAround(opts.scenario ? 0.45 : 0.6);
    const star = this.spawn('blueGiant', p.x, p.y, this.r(E.starSize), this.massFor(0.2));
    if (!star) {
      a.done = true;
      return;
    }
    star.vx = star.vy = star.driftX = star.driftY = 0;
    star.eventStar = true;
    a.star = star;
    a.gen = star.gen;
    a.phase = 'warn';
    this.scene.ui.setPointer('event', star, COLORS.amber, 'Supernova');
    a.update = (dt) => {
      const s = this.scene;
      const st = a.star;
      if (!st.inUse || st.gen !== a.gen) return false; // eaten or shredded before it blew
      if (a.phase === 'warn') {
        // Pulsing faster and faster, then a quick collapse.
        const k = a.t / E.warn;
        const pulse = 1 + Math.sin(a.t * (6 + k * 26)) * 0.06 * (1 + k);
        st.setScale((st.radius * pulse) / st.texBody);
        st.setTint(Phaser.Display.Color.GetColor(255, 255 - 90 * k, 255 - 160 * k));
        if (a.t > E.warn) {
          a.phase = 'collapse';
          a.t0 = a.t;
        }
      } else if (a.phase === 'collapse') {
        const k = (a.t - a.t0) / E.collapse;
        st.setScale((st.radius * (1 - 0.75 * k)) / st.texBody);
        if (k >= 1) this.explode(a);
      } else if (a.t - a.t0 > E.linger) return false;
      return true;
    };
  }

  explode(a) {
    const E = EVENTS.supernova;
    const s = this.scene;
    const bh = this.bh;
    const st = a.star;
    const x = st.x;
    const y = st.y;
    const R0 = st.radius;
    a.phase = 'boom';
    a.t0 = a.t;
    // The core becomes a neutron star (a hefty, edible prize).
    st.reset('neutronStar', x, y, { role: 'extra', radius: this.r(0.3), mass: this.massFor(E.neutronShare) });
    st.vx = st.vy = st.driftX = st.driftY = 0;
    a.gen = st.gen;
    s.ui.setPointer('event', st, COLORS.science, 'Neutron star', 12);
    // A ring of hot debris flying outward: the feast.
    for (let i = 0; i < E.debris; i++) {
      const ang = (i / E.debris) * TAU + this.rng() * 0.3;
      const size = this.r(Phaser.Math.Linear(E.debrisSize[0], E.debrisSize[1], this.rng()));
      const o = this.spawn(this.rng() < 0.5 ? 'gasCloud' : 'fragment', x + Math.cos(ang) * R0, y + Math.sin(ang) * R0, size, this.massFor(E.debrisShare));
      if (!o) break;
      o.setTint(this.rng() < 0.5 ? 0xffc27a : 0x9fc7ff);
      const sp = this.r(E.debrisSpeed) * Phaser.Math.FloatBetween(0.7, 1.2);
      o.vx = Math.cos(ang) * sp;
      o.vy = Math.sin(ang) * sp;
      o.driftX = o.vx * 0.05;
      o.driftY = o.vy * 0.05;
    }
    // Shockwave: shove you and everything nearby.
    const reach = this.r(E.shockRadius);
    const scale = bh.radius / GROWTH.baseRadius;
    const dx = bh.x - x;
    const dy = bh.y - y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < reach) {
      const k = E.push * scale * (1 - d / reach);
      bh.velocity.x += (dx / d) * k;
      bh.velocity.y += (dy / d) * k;
    }
    for (const o of s.spawner.objects) {
      if (!o.inUse || o === st || o.role === 'persistent') continue;
      const ox = o.x - x;
      const oy = o.y - y;
      const od = Math.hypot(ox, oy) || 1;
      if (od > reach) continue;
      if (o.orbiting) o.freeFromOrbit();
      const k = E.push * scale * 0.6 * (1 - od / reach);
      o.vx += (ox / od) * k;
      o.vy += (oy / od) * k;
    }
    s.effects.flash(x, y, this.r(E.shockRadius) * 0.8, 0xffffff, 1.2);
    for (let i = 0; i < 3; i++) {
      s.time.delayedCall(i * 160, () => s.effects.shockwave(x, y, reach * (0.6 + i * 0.35), i === 1 ? COLORS.science : COLORS.amber, 1.5));
    }
    s.shake(0.02, 0.6);
    audio.bassDrop(1.2);
    s.ui.showMilestone('SUPERNOVA!');
  }

  // ---- Tidal disruption ----

  start_tidal(a, opts) {
    const E = EVENTS.tidal;
    const bh = this.bh;
    const p = opts.at ?? this.pointAround(opts.scenario ? 0.55 : 0.75);
    const star = this.spawn('sunLikeStar', p.x, p.y, this.r(E.starSize), this.massFor(0.15));
    if (!star) {
      a.done = true;
      return;
    }
    // Aim it to pass just beside you.
    const side = this.rng() < 0.5 ? -1 : 1;
    const dx = bh.x - p.x;
    const dy = bh.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    const aimX = bh.x + (-dy / d) * this.r(E.missBy) * side;
    const aimY = bh.y + (dx / d) * this.r(E.missBy) * side;
    const ax = aimX - p.x;
    const ay = aimY - p.y;
    const al = Math.hypot(ax, ay) || 1;
    star.vx = star.driftX = (ax / al) * this.r(E.speed);
    star.vy = star.driftY = (ay / al) * this.r(E.speed);
    a.star = star;
    a.gen = star.gen;
    this.scene.ui.setPointer('event', star, COLORS.amber, 'Star');
    a.update = () => {
      const s = this.scene;
      const st = a.star;
      if (!st.inUse || st.gen !== a.gen) return a.shredded ? a.t - a.t0 < E.linger : false;
      if (a.shredded) return a.t - a.t0 < E.linger;
      const gap = Math.hypot(st.x - bh.x, st.y - bh.y) - st.radius - bh.radius;
      // Tidal stretching as it nears: the star gets longer toward you.
      const near = Phaser.Math.Clamp(1 - gap / this.r(E.tidalRange * 2), 0, 1);
      st.setRotation(Math.atan2(bh.y - st.y, bh.x - st.x));
      st.setScale((st.radius * (1 + near * 0.6)) / st.texBody, (st.radius * (1 - near * 0.25)) / st.texBody);
      if (gap < this.r(E.tidalRange)) {
        a.shredded = true;
        a.t0 = a.t;
        const x = st.x;
        const y = st.y;
        s.spawner.shatter(st, bh, { pieces: E.pieces, inward: E.inward });
        s.effects.flash(x, y, this.r(3), 0xfff0c8, 0.6);
        s.ui.showMilestone('SPAGHETTIFIED!');
        s.shake(0.01, 0.4);
        audio.bassDrop(0.8);
      }
      // Gave up: it flew past and away.
      return a.t < E.maxTime;
    };
  }

  // ---- Wandering (runaway) black hole ----

  start_wanderer(a, opts) {
    const E = EVENTS.wanderer;
    const s = this.scene;
    const bh = this.bh;
    const v = s.spawner.view();
    const ang = this.rng() * TAU;
    const from = { x: bh.x + Math.cos(ang) * v.halfDiag * E.startDistance, y: bh.y + Math.sin(ang) * v.halfDiag * E.startDistance };
    const o = s.spawner.take();
    if (!o) {
      a.done = true;
      return;
    }
    o.reset('rival', from.x, from.y, { role: 'extra', mass: bh.mass * E.massRatio });
    o.rivalName = 'A runaway black hole';
    o.wanderer = true;
    s.spawner.rivalCount++;
    // Cut across your path, a little off-centre.
    const off = (this.rng() - 0.5) * this.r(E.missBy) * 2;
    const tx = bh.x + Math.cos(ang + Math.PI / 2) * off;
    const ty = bh.y + Math.sin(ang + Math.PI / 2) * off;
    const dx = tx - from.x;
    const dy = ty - from.y;
    const dl = Math.hypot(dx, dy) || 1;
    a.vx = (dx / dl) * this.r(E.speed);
    a.vy = (dy / dl) * this.r(E.speed);
    a.obj = o;
    a.gen = o.gen;
    a.trail = 0;
    s.ui.setPointer('event', o, COLORS.danger, 'Runaway');
    a.update = (dt) => {
      const w = a.obj;
      if (!w.inUse || w.gen !== a.gen) return false; // you ate it (!) or it left
      w.vx = a.vx;
      w.vy = a.vy;
      w.targetX = w.x + a.vx;
      w.targetY = w.y + a.vy;
      // Its gravity tugs on everything nearby, you included.
      const reach = w.radius * E.pullRange;
      const scale = bh.radius / GROWTH.baseRadius;
      for (const o2 of s.spawner.objects) {
        if (!o2.inUse || o2 === w || !o2.visible || o2.role === 'persistent') continue;
        const ox = w.x - o2.x;
        const oy = w.y - o2.y;
        const od = Math.hypot(ox, oy) || 1;
        if (od > reach) continue;
        if (o2.orbiting) o2.freeFromOrbit();
        const k = E.pull * scale * (1 - od / reach);
        o2.vx += (ox / od) * k * dt;
        o2.vy += (oy / od) * k * dt;
      }
      const px = w.x - bh.x;
      const py = w.y - bh.y;
      const pd = Math.hypot(px, py) || 1;
      if (pd < reach) {
        const k = E.playerPull * scale * (1 - pd / reach);
        bh.velocity.x += (px / pd) * k * dt;
        bh.velocity.y += (py / pd) * k * dt;
      }
      // A wake of newborn stars (as seen behind the real runaway black hole RBH-1).
      a.trail -= dt;
      if (a.trail <= 0) {
        a.trail = E.trailEvery;
        const back = Math.atan2(-a.vy, -a.vx) + (this.rng() - 0.5) * 0.8;
        const star = this.spawn(this.rng() < 0.5 ? 'youngStar' : 'protostar', w.x + Math.cos(back) * w.radius * 1.6, w.y + Math.sin(back) * w.radius * 1.6, this.r(Phaser.Math.Linear(E.starSize[0], E.starSize[1], this.rng())), this.massFor(E.starShare));
        if (star) {
          star.vx = star.driftX = a.vx * 0.05;
          star.vy = star.driftY = a.vy * 0.05;
        }
      }
      // Faint streak behind it.
      this.fx.lineStyle(w.radius * 0.6, COLORS.rivalRing, 0.12);
      this.fx.lineBetween(w.x, w.y, w.x - a.vx * 0.8, w.y - a.vy * 0.8);
      return a.t < E.life;
    };
    // When the event ends it keeps flying straight (still a wanderer) until it leaves.
  }

  // ---- Wormhole (theoretical) ----

  start_wormhole(a, opts) {
    const E = EVENTS.wormhole;
    const s = this.scene;
    const p = opts.at ?? this.pointAround(opts.scenario ? 0.4 : 0.55);
    a.x = p.x;
    a.y = p.y;
    a.R = this.r(E.size);
    a.spin = 0;
    s.ui.setPointer('event', a, COLORS.science, 'Wormhole', 0, true);
    a.inUse = true;
    a.update = (dt) => {
      const bh = this.bh;
      a.spin += dt * 2.2;
      const life = Phaser.Math.Clamp(Math.min(a.t / 0.6, (E.life - a.t) / 0.8), 0, 1);
      const R = a.R * life;
      this.drawPortal(a.x, a.y, R, a.spin, COLORS.science);
      if (a.used) return a.t - a.t0 < (a.opts.scenario ? 4.5 : 1.2); // (scenarios: time to eat the feast)
      // Gentle suck toward the mouth.
      const dx = a.x - bh.x;
      const dy = a.y - bh.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < R * 4) {
        const scale = bh.radius / GROWTH.baseRadius;
        const k = E.pull * scale * (1 - d / (R * 4));
        bh.velocity.x += (dx / d) * k * dt;
        bh.velocity.y += (dy / d) * k * dt;
      }
      if (d < R * 0.8 && life > 0.5) this.travel(a);
      return a.t < E.life;
    };
    a.cleanup = () => {
      a.inUse = false;
    };
  }

  drawPortal(x, y, R, spin, color) {
    if (R <= 0) return;
    const g = this.fx;
    for (let i = 0; i < 4; i++) {
      g.lineStyle(R * (0.16 - i * 0.03), color, 0.5 - i * 0.1);
      g.strokeCircle(x, y, R * (1 - i * 0.18));
    }
    for (let i = 0; i < 6; i++) {
      const a0 = spin + (i / 6) * TAU;
      g.lineStyle(R * 0.06, 0xffffff, 0.35);
      g.beginPath();
      g.arc(x, y, R * 0.7, a0, a0 + 0.7);
      g.strokePath();
    }
    this.gfx.fillStyle(0x000000, 0.85).fillCircle(x, y, R * 0.42);
  }

  /** Through the wormhole: jump far away to a waiting feast. */
  travel(a) {
    const E = EVENTS.wormhole;
    const s = this.scene;
    const bh = this.bh;
    a.used = true;
    a.t0 = a.t;
    const exit = this.pointAround(E.exitDistance);
    s.effects.flash(bh.x, bh.y, bh.radius * 4, COLORS.science, 0.5);
    bh.setPosition(exit.x, exit.y);
    bh.velocity.set(0, 0);
    s.cameras.main.centerOn(exit.x, exit.y);
    s.starfield.resetTracking();
    s.effects.flash(exit.x, exit.y, bh.radius * 6, 0xffffff, 0.7);
    s.effects.shockwave(exit.x, exit.y, bh.radius * 8, COLORS.science, 1);
    s.slowMo(0.4, 0.8);
    audio.bassDrop(0.8);
    // A feast waiting at the other end.
    const edible = bh.radius * EATING.edibleRatio;
    const types = Object.keys(s.spawner.weights ?? { gasCloud: 1 }).filter((t) => t !== 'rival' && OBJECTS[t].radius < edible * 0.9);
    for (let i = 0; i < E.feast; i++) {
      const ang = this.rng() * TAU;
      const d = bh.radius * (2.5 + this.rng() * 6);
      const type = types.length ? types[i % types.length] : 'fragment';
      const o = this.spawn(type, exit.x + Math.cos(ang) * d, exit.y + Math.sin(ang) * d, Math.min(OBJECTS[type].radius, edible * 0.8) || this.r(0.4), undefined);
      if (o && !types.length) o.setMass(this.massFor(0.01));
    }
    a.x = exit.x;
    a.y = exit.y;
    s.ui.showMilestone('THROUGH THE WORMHOLE');
  }

  // ---- White hole (hypothetical) ----

  start_whiteHole(a, opts) {
    const E = EVENTS.whiteHole;
    const s = this.scene;
    const p = opts.at ?? this.pointAround(opts.scenario ? 0.5 : 0.6);
    a.x = p.x;
    a.y = p.y;
    a.inUse = true;
    a.R = this.r(E.size);
    a.emit = 0.5;
    s.ui.setPointer('event', a, COLORS.text, 'White hole', 0, true);
    a.update = (dt) => {
      const bh = this.bh;
      const life = Phaser.Math.Clamp(Math.min(a.t / 0.8, (E.life - a.t) / 1), 0, 1);
      const R = a.R * life;
      // Blinding white disc with a soft glow (the opposite of you).
      this.fx.fillStyle(0xffffff, 0.12 * life).fillCircle(a.x, a.y, R * 3);
      this.fx.fillStyle(0xffffff, 0.25 * life).fillCircle(a.x, a.y, R * 1.8);
      this.gfx.fillStyle(0xffffff, life).fillCircle(a.x, a.y, R);
      this.gfx.lineStyle(R * 0.08, COLORS.science, life).strokeCircle(a.x, a.y, R * 1.05);
      // It pushes everything away, you included.
      const scale = bh.radius / GROWTH.baseRadius;
      const reach = R * E.pushRange;
      const dx = bh.x - a.x;
      const dy = bh.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < reach) {
        const k = E.push * scale * (1 - d / reach);
        bh.velocity.x += (dx / d) * k * dt;
        bh.velocity.y += (dy / d) * k * dt;
      }
      // Spits out matter: mostly edible chunks, some too big to touch.
      a.emit -= dt;
      if (a.emit <= 0 && life > 0.6) {
        a.emit = E.every;
        const big = this.rng() < E.bigChance;
        const size = this.r(big ? Phaser.Math.Linear(E.bigSize[0], E.bigSize[1], this.rng()) : Phaser.Math.Linear(E.smallSize[0], E.smallSize[1], this.rng()));
        const ang = this.rng() * TAU;
        const o = this.spawn(big ? 'asteroid' : 'fragment', a.x + Math.cos(ang) * R, a.y + Math.sin(ang) * R, size, this.massFor(big ? 0.05 : E.smallShare));
        if (o) {
          if (!big) o.setTint(this.rng() < 0.5 ? 0xffffff : 0x9fc7ff);
          const sp = this.r(E.speed) * Phaser.Math.FloatBetween(0.8, 1.3);
          o.vx = Math.cos(ang) * sp;
          o.vy = Math.sin(ang) * sp;
          o.driftX = o.vx * 0.3;
          o.driftY = o.vy * 0.3;
        }
        if (this.rng() < 0.3) audio.blip(700 + this.rng() * 400, 0.03);
      }
      return a.t < E.life;
    };
    a.cleanup = () => {
      a.inUse = false;
    };
  }

  // ---- Dark matter ----

  start_darkMatter(a, opts) {
    const E = EVENTS.darkMatter;
    const s = this.scene;
    const p = opts.at ?? this.pointAround(opts.scenario ? 0.25 : 0.45);
    a.clumps = [];
    for (let i = 0; i < E.clumps; i++) {
      const ang = this.rng() * TAU;
      const d = this.r(2 + this.rng() * E.spread);
      const o = this.spawn('darkMatter', p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d, this.r(Phaser.Math.Linear(E.size[0], E.size[1], this.rng())), this.massFor(E.share));
      if (o) {
        o.vx = o.driftX = (this.rng() - 0.5) * o.radius * 0.3;
        o.vy = o.driftY = (this.rng() - 0.5) * o.radius * 0.3;
        a.clumps.push({ o, gen: o.gen });
      }
    }
    s.ui.setPointer('event', { x: p.x, y: p.y, inUse: true }, COLORS.science, 'Dark matter', 6);
    a.update = () => {
      // Only faint rings of bent light show where they are (clear with the Gravitational Lens).
      const lens = s.powers?.has('lens');
      let left = 0;
      for (const c of a.clumps) {
        const o = c.o;
        if (!o.inUse || o.gen !== c.gen) continue;
        left++;
        o.setAlpha(lens ? E.lensAlpha : E.alpha * (0.7 + 0.3 * Math.sin(s.elapsed * 3 + o.phase)));
      }
      if (left === 0) a.clearedAt ??= a.t;
      return (a.clearedAt === undefined || a.t - a.clearedAt < 1.5) && a.t < E.life;
    };
  }

  // ---- Black hole merger chirp (any time you eat a rival) ----

  merger(x, y, radius) {
    const E = EVENTS.merger;
    const s = this.scene;
    audio.chirp?.();
    for (let i = 0; i < E.rings; i++) {
      s.time.delayedCall(i * E.ringEvery * 1000, () => s.effects.shockwave(x, y, radius * (4 + i * 1.6), i % 2 ? COLORS.science : COLORS.rivalRing, 1.1));
    }
    s.zoomPulse(0.85, 0.5);
    s.shake(0.012, E.chirpTime);
    s.ui.showMilestone('GRAVITATIONAL WAVES');
    s.news?.push('merger');
  }
}
