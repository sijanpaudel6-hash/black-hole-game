import Phaser from 'phaser';
import { DANGER, DEPTH, EATING, FEEDING, GROWTH, OBJECTS, RIVAL, SPAWNER, COLORS, BOSS, POWERS } from '../config.js';
import SpaceObject from '../objects/SpaceObject.js';
import { RIVAL_NAMES } from '../data/rivals.js';

const TAU = Math.PI * 2;

/**
 * Keeps the space around the player full of objects and runs every interaction:
 * pull zone, swallowing, collisions with bigger objects, eating big things from the
 * inside (sandbox/scenarios), rival black holes, stars pushing small objects away and
 * star clusters scattering.
 *
 * Objects live within a circle a few screens wide around the camera; eaten objects and
 * objects left far behind reappear just off-screen, so the area never empties no matter
 * how far the camera zooms out. Objects far off-screen are paused.
 */
export default class Spawner {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} opts
   * @param {object|null} opts.weights spawn weights by type (null = no free-floating objects)
   * @param {number} opts.worldRadius
   * @param {number} opts.startMass the level's starting mass (for rival size caps)
   * @param {object} opts.callbacks onSwallow(obj), onHit(obj, nx, ny), onPlayerEaten(obj), onFeed(obj, dm), onOtherEat(obj, eater)
   */
  constructor(scene, opts) {
    this.scene = scene;
    this.worldRadius = opts.worldRadius;
    this.startMass = opts.startMass;
    this.cb = opts.callbacks;
    this.rng = opts.rng ?? Math.random; // which types spawn (seeded in a Daily Universe)
    this.objects = [];
    for (let i = 0; i < SPAWNER.count + SPAWNER.reserve; i++) this.objects.push(new SpaceObject(scene));
    this.rings = [];
    for (let i = 0; i < SPAWNER.maxDangerRings; i++) {
      this.rings.push(scene.add.image(0, 0, 'ring').setVisible(false).setDepth(DEPTH.dangerRings).setTint(COLORS.danger).setAlpha(SPAWNER.dangerRingAlpha));
    }
    // Blue rings around Gravitational Lens treasures.
    this.treasureRings = [];
    for (let i = 0; i < SPAWNER.maxTreasureRings; i++) {
      this.treasureRings.push(scene.add.image(0, 0, 'ring').setVisible(false).setDepth(DEPTH.dangerRings).setTint(COLORS.science));
    }
    this.hiddenChance = 0; // share of new objects that are Lens treasures (set by powers)
    this.nearestGap = Infinity; // gap to the nearest dangerous object, in black hole radii
    this.setWeights(opts.weights);
    this.rivalCount = 0;
    this.rootTarget = SPAWNER.count; // how many free-floating objects to keep (eras can change it)
    this.spawnFraction = 1; // < 1: some eaten/left-behind objects don't come back (Far Future)
    this.pushers = [];
  }

  setWeights(weights) {
    this.weights = weights;
    if (!weights) {
      this.types = [];
      return;
    }
    this.types = Object.keys(weights);
    this.weightList = this.types.map((t) => weights[t]);
    this.totalWeight = this.weightList.reduce((a, b) => a + b, 0);
  }

  pickType() {
    for (let attempt = 0; attempt < 6; attempt++) {
      let roll = this.rng() * this.totalWeight;
      let type = this.types[this.types.length - 1];
      for (let i = 0; i < this.types.length; i++) {
        roll -= this.weightList[i];
        if (roll < 0) {
          type = this.types[i];
          break;
        }
      }
      if (type === 'rival' && this.rivalCount >= SPAWNER.maxRivals) continue;
      return type;
    }
    return this.types.find((t) => t !== 'rival') ?? this.types[0];
  }

  take() {
    return this.objects.find((o) => !o.inUse) ?? null;
  }

  // The camera's visible area in world space. Computed from scroll and zoom directly:
  // camera.worldView is only refreshed at render time and is empty on the first frame.
  view() {
    const cam = this.scene.cameras.main;
    const w = cam.width / cam.zoom;
    const h = cam.height / cam.zoom;
    const cx = cam.scrollX + cam.width / 2;
    const cy = cam.scrollY + cam.height / 2;
    if (!this.rect) this.rect = new Phaser.Geom.Rectangle();
    this.rect.setTo(cx - w / 2, cy - h / 2, w, h);
    return { rect: this.rect, cx, cy, halfDiag: Math.hypot(w, h) / 2, zoom: cam.zoom };
  }

  // ---- Spawning ----

  /** Fill the area around (x, y) at level start. */
  populate(bh, view = this.view()) {
    if (!this.weights) return;
    const v = view;
    const maxR = v.halfDiag * SPAWNER.spawnRadius;
    const minR = bh.radius * SPAWNER.startClear;
    let roots = 0;
    for (const obj of this.objects) {
      if (roots >= SPAWNER.count) break;
      if (obj.inUse) continue;
      const type = this.pickType();
      for (let tries = 0; tries < 10; tries++) {
        const r = Math.sqrt(Phaser.Math.FloatBetween((minR / maxR) ** 2, 1)) * maxR;
        const a = Math.random() * TAU;
        const x = bh.x + Math.cos(a) * r;
        const y = bh.y + Math.sin(a) * r;
        if (Math.hypot(x, y) < this.worldRadius - OBJECTS[type].radius) {
          this.spawnRoot(obj, type, x, y, bh);
          break;
        }
      }
      if (obj.inUse) roots++;
    }
  }

  spawnRoot(obj, type, x, y, bh) {
    const opts = { role: 'root' };
    if (type === 'rival') {
      const m = bh.mass * Phaser.Math.FloatBetween(RIVAL.massRange[0], RIVAL.massRange[1]);
      opts.mass = Math.min(m, this.startMass * RIVAL.maxMassFactor);
    }
    if (obj.type === 'rival' && obj.inUse) this.rivalCount--;
    obj.reset(type, x, y, opts);
    if (type === 'rival') {
      this.rivalCount++;
      obj.rivalName = Phaser.Utils.Array.GetRandom(RIVAL_NAMES);
    } else if (this.hiddenChance > 0 && Math.random() < this.hiddenChance) {
      obj.hidden = true;
    }
    for (const spec of OBJECTS[type].children ?? []) {
      const n = Phaser.Math.Between(spec.count[0], spec.count[1]);
      for (let i = 0; i < n; i++) {
        const child = this.take();
        if (!child) return;
        child.reset(spec.type, x, y, { role: 'extra', parent: obj, orbitRadius: spec.orbitRadius, orbitPeriod: spec.orbitPeriod });
      }
    }
  }

  /** A point just outside the view, inside the world. */
  ringPoint(objRadius, v) {
    const limit = this.worldRadius - objRadius;
    const inner = v.halfDiag + SPAWNER.respawnMargin / v.zoom + objRadius;
    const outer = Math.max(inner * 1.05, v.halfDiag * SPAWNER.spawnRadius);
    for (let tries = 0; tries < 10; tries++) {
      const d = Phaser.Math.FloatBetween(inner, outer);
      const a = Math.random() * TAU;
      const x = v.cx + Math.cos(a) * d;
      const y = v.cy + Math.sin(a) * d;
      if (Math.hypot(x, y) <= limit) return { x, y };
    }
    for (let tries = 0; tries < 20; tries++) {
      const r = Math.sqrt(Math.random()) * limit;
      const a = Math.random() * TAU;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (!Phaser.Geom.Rectangle.Contains(v.rect, x, y)) return { x, y };
    }
    return { x: 0, y: 0 };
  }

  /** Eaten or left behind: roots come back off-screen, extras go back to the pool. */
  recycle(obj, bh, v) {
    const shrink = obj.role === 'root' && (this.roots > this.rootTarget || Math.random() > this.spawnFraction);
    if (obj.role !== 'root' || !this.weights || shrink) {
      if (obj.role === 'root') this.roots--;
      if (obj.type === 'rival') this.rivalCount--;
      obj.release();
      return;
    }
    const type = this.pickType();
    const p = this.ringPoint(OBJECTS[type].radius || bh.radius, v);
    this.spawnRoot(obj, type, p.x, p.y, bh);
  }

  /** Busier eras: add a few objects per frame just off-screen until there are rootTarget. */
  topUp(bh, v) {
    if (!this.weights || this.spawnFraction < 1) return;
    for (let i = 0; i < 3 && this.roots < this.rootTarget; i++) {
      const obj = this.objects.find((o) => !o.inUse);
      if (!obj) return;
      const type = this.pickType();
      const p = this.ringPoint(OBJECTS[type].radius || bh.radius, v);
      this.spawnRoot(obj, type, p.x, p.y, bh);
      this.roots++;
    }
  }

  /** Remove everything (end of a run). */
  releaseAll() {
    for (const o of this.objects) if (o.inUse) o.release();
    this.rivalCount = 0;
    this.rings.forEach((r) => r.setVisible(false));
    this.treasureRings.forEach((r) => r.setVisible(false));
  }

  /** Sandbox: spawn an object near the black hole. */
  spawnNear(type, bh) {
    let obj = this.take();
    if (!obj) {
      // Pool full: reuse the farthest root.
      let best = null;
      let bestD = -1;
      for (const o of this.objects) {
        if (o.role !== 'root') continue;
        const d = Math.hypot(o.x - bh.x, o.y - bh.y);
        if (d > bestD) {
          bestD = d;
          best = o;
        }
      }
      obj = best;
      if (!obj) return null;
      if (obj.type === 'rival') this.rivalCount--;
    }
    const def = OBJECTS[type];
    const opts = { role: 'extra' };
    if (type === 'rival') opts.mass = bh.mass * Phaser.Math.FloatBetween(0.5, 1.5);
    const r = type === 'rival' ? bh.radius : def.radius;
    const a = Math.random() * TAU;
    const d = bh.radius * 4 + r * 1.5;
    obj.reset(type, bh.x + Math.cos(a) * d, bh.y + Math.sin(a) * d, opts);
    if (type === 'rival') this.rivalCount++;
    return obj;
  }

  /** Scenarios: place a specific object that never recycles. */
  addPersistent(type, x, y, opts = {}) {
    const obj = this.take();
    if (!obj) return null;
    obj.reset(type, x, y, { ...opts, role: 'persistent' });
    if (opts.still) {
      obj.vx = obj.vy = obj.driftX = obj.driftY = 0;
    }
    if (type === 'rival') this.rivalCount++;
    return obj;
  }

  scatter(cluster, bh) {
    const s = cluster.def.scatter;
    const cx = cluster.x;
    const cy = cluster.y;
    const baseSpeed = s.speed * OBJECTS[s.piece].radius;
    const wasRoot = cluster.role === 'root';
    for (let i = 0; i < s.pieces; i++) {
      const piece = i === 0 ? cluster : this.take();
      if (!piece) break;
      const a = (i / s.pieces) * TAU + Math.random() * 0.5;
      const off = cluster.radius * 0.35;
      piece.reset(s.piece, cx + Math.cos(a) * off, cy + Math.sin(a) * off, { role: i === 0 && wasRoot ? 'root' : 'extra' });
      piece.vx = Math.cos(a) * baseSpeed * Phaser.Math.FloatBetween(0.8, 1.3) + (cx - bh.x) * 0.2;
      piece.vy = Math.sin(a) * baseSpeed * Phaser.Math.FloatBetween(0.8, 1.3) + (cy - bh.y) * 0.2;
      piece.driftX = piece.vx * 0.15;
      piece.driftY = piece.vy * 0.15;
    }
  }

  /**
   * Break an object into edible chunks (jets, Tidal Shredder, cosmic events).
   * The object itself becomes the first chunk; the rest come from the pool.
   * @param {object} obj
   * @param {{x:number,y:number,radius:number}} bh the player (chunks are sized to be edible)
   * @param {{inward?:number, pieces?:number, speed?:number}} [opts] inward: fling toward the player instead of outward
   */
  shatter(obj, bh, opts = {}) {
    if (!obj.inUse || obj.role === 'persistent' || obj.type === 'rival') return;
    const F = POWERS.fragments;
    const n = opts.pieces ?? Phaser.Math.Between(F.pieces[0], F.pieces[1]);
    const x = obj.x;
    const y = obj.y;
    const R = obj.radius;
    const mass = (obj.mass * F.keep) / n;
    const radius = Math.min(R * 0.5, bh.radius * F.maxRadius);
    const tint = obj.isTinted ? obj.tintTopLeft : obj.def.color;
    const name = `${obj.displayName ?? obj.def.name} chunk`;
    const debris = obj.def.debris ?? [obj.def.color, COLORS.amber];
    const role = obj.role;
    const wasHidden = obj.hidden;
    this.cb.onShatter?.({ x, y, radius: R, color: obj.def.color, debris, name: obj.displayName ?? obj.def.name });
    const speed = (opts.speed ?? F.speed) * radius;
    for (let i = 0; i < n; i++) {
      const piece = i === 0 ? obj : this.take();
      if (!piece) break;
      const a = (i / n) * TAU + Math.random() * 0.6;
      const off = R * 0.4;
      if (i === 0 && obj.type === 'rival') this.rivalCount--;
      piece.reset('fragment', x + Math.cos(a) * off, y + Math.sin(a) * off, {
        role: i === 0 ? role : 'extra',
        mass,
        radius: radius * Phaser.Math.FloatBetween(0.8, 1.1),
        displayName: name,
      });
      piece.setTint(tint);
      piece.hidden = i === 0 && wasHidden;
      if (opts.inward) {
        // Swirl toward the player (Accretion Buzzsaw).
        const dx = bh.x - piece.x;
        const dy = bh.y - piece.y;
        const d = Math.hypot(dx, dy) || 1;
        const v = opts.inward * radius;
        piece.vx = (dx / d) * v - (dy / d) * v * 0.6;
        piece.vy = (dy / d) * v + (dx / d) * v * 0.6;
      } else {
        piece.vx = Math.cos(a) * speed * Phaser.Math.FloatBetween(0.7, 1.3);
        piece.vy = Math.sin(a) * speed * Phaser.Math.FloatBetween(0.7, 1.3);
      }
      piece.driftX = piece.vx * 0.1;
      piece.driftY = piece.vy * 0.1;
    }
  }

  // ---- Per-frame update ----

  /**
   * @param {object} ctx
   * @param {import('../objects/BlackHole.js').default} ctx.bh
   * @param {boolean} ctx.danger bigger objects hurt and rivals can eat you
   * @param {boolean} ctx.feeding sitting inside bigger objects eats them
   * @param {number} ctx.pullRange × black hole radius
   * @param {object|null} ctx.boss boss black hole (pulls and eats objects)
   * @param {number} [ctx.swirl] Kerr Spin: tangential pull, × the normal pull
   * @param {number} [ctx.pullStrength] × pull acceleration
   * @param {{ratio:number, range:number, inward:number}|null} [ctx.shred] Tidal Shredder rule
   * @param {boolean} [ctx.rivalsFlee] rivals keep away (a spared civilisation's honour guard)
   */
  update(dt, time, ctx) {
    const { bh } = ctx;
    const v = this.view();
    const margin = SPAWNER.activeMargin / v.zoom;
    const left = v.rect.x - margin;
    const right = v.rect.right + margin;
    const top = v.rect.y - margin;
    const bottom = v.rect.bottom + margin;
    const recycleDist = v.halfDiag * SPAWNER.recycleRadius;
    const scale = bh.radius / GROWTH.baseRadius;
    const pullRange = bh.radius * ctx.pullRange;
    const pullAccel = EATING.pullAcceleration * scale * (ctx.pullStrength ?? 1);
    const swirl = ctx.swirl ?? 0;
    const shred = ctx.shred ?? null;
    let nearestGap = Infinity;
    let treasureIndex = 0;
    const kPull = 1 - Math.exp(-EATING.pullDrag * dt);
    const kSettle = 1 - Math.exp(-EATING.releaseDrag * dt);
    const edibleLimit = bh.radius * EATING.edibleRatio;
    let pulledCount = 0;
    let ringIndex = 0;
    this.pushers.length = 0;
    const boss = ctx.boss;
    this.roots = 0;
    for (const o of this.objects) if (o.inUse && o.role === 'root') this.roots++;
    this.topUp(bh, v);

    for (const obj of this.objects) {
      if (!obj.inUse) continue;

      // Left far behind (or zoomed far out of range): bring it back near the player.
      if (obj.role !== 'persistent') {
        const dc = Math.hypot(obj.x - v.cx, obj.y - v.cy);
        if (dc > recycleDist) {
          if (obj.role === 'root' || !obj.parent) this.recycle(obj, bh, v);
          continue;
        }
      }

      const active = obj.role === 'persistent' || (obj.x > left && obj.x < right && obj.y > top && obj.y < bottom);
      if (obj.visible !== active) obj.setVisible(active);
      if (!active) continue;

      const edible = obj.radius < edibleLimit;
      obj.edible = edible;
      // Edible things (and big things being eaten from the inside) draw under the black hole.
      const under = edible || obj.feeding;
      if (under !== obj.under) {
        obj.under = under;
        obj.setDepth(under ? DEPTH.edibleObjects : DEPTH.inedibleObjects);
      }

      const dx = bh.x - obj.x;
      const dy = bh.y - obj.y;
      const dist = Math.hypot(dx, dy) || 0.0001;

      if (obj.behaviour === 'rival') this.updateRival(obj, dt, ctx, scale);

      // Pull zone
      obj.pulled = false;
      if (edible && dist < pullRange && !obj.spared) {
        obj.pulled = true;
        pulledCount++;
        if (obj.orbiting) obj.freeFromOrbit();
        const closeness = 1 - dist / pullRange;
        const a = pullAccel * closeness;
        obj.vx += (dx / dist) * a * dt;
        obj.vy += (dy / dist) * a * dt;
        if (swirl) {
          // Kerr Spin: a sideways pull, so things orbit in instead of falling straight.
          obj.vx += (-dy / dist) * a * swirl * dt;
          obj.vy += (dx / dist) * a * swirl * dt;
        }
        const k = kPull * closeness * (swirl ? 0.5 : 1);
        obj.vx += (bh.velocity.x - obj.vx) * k;
        obj.vy += (bh.velocity.y - obj.vy) * k;
      } else if (obj.behaviour !== 'rival') {
        obj.settle(kSettle);
      }

      // Boss pull on objects
      if (boss && obj.behaviour !== 'static') {
        const bx = boss.x - obj.x;
        const by = boss.y - obj.y;
        const bd = Math.hypot(bx, by) || 1;
        if (bd < boss.radius * BOSS.pullRange) {
          const a = BOSS.objectPull * scale * Math.min(4, (boss.radius / bd) ** 1.2);
          if (obj.orbiting) obj.freeFromOrbit();
          obj.vx += (bx / bd) * a * dt;
          obj.vy += (by / bd) * a * dt;
        }
        if (bd < boss.radius) {
          this.cb.onOtherEat?.(obj, boss);
          this.recycle(obj, bh, v);
          continue;
        }
      }

      if (obj.def.push) this.pushers.push(obj);

      obj.integrate(dt, time);
      obj.bounceOffWorldEdge(this.worldRadius);

      // Swallowed?
      const ndx = bh.x - obj.x;
      const ndy = bh.y - obj.y;
      const nd = Math.hypot(ndx, ndy) || 0.0001;
      if (obj.hidden && treasureIndex < this.treasureRings.length) {
        const ring = this.treasureRings[treasureIndex++];
        ring.setPosition(obj.x, obj.y).setScale((obj.radius * 1.3) / 124).setAlpha(0.45 + 0.35 * Math.sin(time * 5 + obj.phase)).setVisible(true);
      }
      if (edible && obj.spared) continue; // spared civilisations can't be eaten
      if (edible) {
        if (nd < bh.radius) {
          this.cb.onSwallow(obj);
          this.recycle(obj, bh, v);
        }
        continue;
      }

      // Too big to eat.
      if (obj.behaviour === 'cluster' && nd < obj.radius * obj.def.scatter.range) {
        this.scatter(obj, bh);
        continue;
      }

      // Tidal Shredder: things a bit bigger than you crumble as you pass close.
      if (shred && obj.behaviour !== 'rival' && obj.behaviour !== 'static' && obj.role !== 'persistent' && !obj.spared
        && obj.radius < bh.radius * shred.ratio && nd < (bh.radius + obj.radius) * shred.range) {
        this.shatter(obj, bh, { inward: shred.inward });
        continue;
      }

      const canEatPlayer = obj.behaviour === 'rival' && obj.radius * EATING.edibleRatio > bh.radius;
      if ((obj.radius > bh.radius || canEatPlayer) && !obj.spared) {
        const gap = (nd - bh.radius - obj.radius) / bh.radius;
        if (gap < nearestGap) nearestGap = gap;
      }
      if (ctx.feeding) {
        obj.feeding = nd < obj.radius;
        if (obj.feeding) {
          const dm = Math.min(obj.mass * 0.999, (ctx.feedRate ?? FEEDING.rate) * bh.radius * bh.radius * dt);
          obj.setMass(obj.mass - dm);
          this.cb.onFeed?.(obj, dm);
        }
      } else if (ctx.danger) {
        if (canEatPlayer) {
          if (nd < obj.radius - bh.radius * RIVAL.eatInset) this.cb.onPlayerEaten(obj);
        } else if (nd < bh.radius + obj.radius * DANGER.contactFactor) {
          this.cb.onHit(obj, -ndx / nd, -ndy / nd);
        }
        // Red ring around anything that would hurt you.
        if ((obj.radius > bh.radius || canEatPlayer) && ringIndex < this.rings.length) {
          const ring = this.rings[ringIndex++];
          ring.setPosition(obj.x, obj.y).setScale((obj.radius * SPAWNER.dangerRingWidth) / 124).setVisible(true);
        }
      }
    }

    for (let i = ringIndex; i < this.rings.length; i++) {
      if (this.rings[i].visible) this.rings[i].setVisible(false);
    }
    for (let i = treasureIndex; i < this.treasureRings.length; i++) {
      if (this.treasureRings[i].visible) this.treasureRings[i].setVisible(false);
    }
    this.nearestGap = nearestGap;
    if (this.pushers.length) this.applyStarPush(dt, scale);
    return pulledCount;
  }

  // Sun-like stars push small objects outward.
  applyStarPush(dt, scale) {
    for (const star of this.pushers) {
      const p = star.def.push;
      if (!p || !star.inUse) continue; // eaten and reused earlier this frame
      const range = star.radius * p.range;
      const maxR = star.radius * p.maxSizeRatio;
      for (const o of this.objects) {
        if (!o.inUse || !o.visible || o === star || o.radius > maxR || o.pulled || o.role === 'persistent') continue;
        const dx = o.x - star.x;
        const dy = o.y - star.y;
        const d = Math.hypot(dx, dy);
        if (d > range || d < 1) continue;
        if (o.orbiting && o.parent !== star) continue;
        const a = p.accel * scale * (1 - d / range);
        o.vx += (dx / d) * a * dt;
        o.vy += (dy / d) * a * dt;
      }
    }
  }

  // ---- Rival black holes ----

  updateRival(r, dt, ctx, scale) {
    const { bh } = ctx;
    r.think -= dt;
    if (r.think <= 0) {
      r.think = RIVAL.thinkInterval * Phaser.Math.FloatBetween(0.8, 1.2);
      const dx = bh.x - r.x;
      const dy = bh.y - r.y;
      const d = Math.hypot(dx, dy) || 1;
      const canEatPlayer = r.radius * EATING.edibleRatio > bh.radius;
      const playerCanEat = r.radius < bh.radius * EATING.edibleRatio;
      if (canEatPlayer && ctx.danger && !ctx.rivalsFlee && d < r.radius * RIVAL.chaseRange) {
        r.targetX = bh.x;
        r.targetY = bh.y;
      } else if ((playerCanEat || ctx.rivalsFlee) && d < r.radius * RIVAL.fleeRange * (ctx.rivalsFlee ? 2 : 1)) {
        r.targetX = r.x - (dx / d) * r.radius * 10;
        r.targetY = r.y - (dy / d) * r.radius * 10;
      } else {
        let best = null;
        let bestD = r.radius * RIVAL.seekRange;
        for (const o of this.objects) {
          if (!o.inUse || !o.visible || o === r || o.behaviour === 'rival' || o.role === 'persistent') continue;
          if (o.radius >= r.radius * EATING.edibleRatio) continue;
          const od = Math.hypot(o.x - r.x, o.y - r.y);
          if (od < bestD) {
            bestD = od;
            best = o;
          }
        }
        if (best) {
          r.targetX = best.x;
          r.targetY = best.y;
        } else if (Math.hypot(r.targetX - r.x, r.targetY - r.y) < r.radius * 2) {
          const a = Math.random() * TAU;
          r.targetX = r.x + Math.cos(a) * r.radius * 8;
          r.targetY = r.y + Math.sin(a) * r.radius * 8;
        }
      }
    }

    // Steer
    const maxSpeed = RIVAL.maxSpeed * scale;
    const tx = r.targetX - r.x;
    const ty = r.targetY - r.y;
    const td = Math.hypot(tx, ty) || 1;
    const dvx = (tx / td) * maxSpeed - r.vx;
    const dvy = (ty / td) * maxSpeed - r.vy;
    const dv = Math.hypot(dvx, dvy) || 1;
    const maxChange = RIVAL.acceleration * scale * dt;
    const k = Math.min(1, maxChange / dv);
    if (!r.pulled) {
      r.vx += dvx * k;
      r.vy += dvy * k;
    }

    // Eat anything small it touches.
    const cap = this.startMass * RIVAL.maxMassFactor;
    for (const o of this.objects) {
      if (!o.inUse || !o.visible || o === r || o.behaviour === 'rival' || o.role === 'persistent') continue;
      if (o.radius >= r.radius * EATING.edibleRatio) continue;
      const od = Math.hypot(o.x - r.x, o.y - r.y);
      if (od < r.radius) {
        this.cb.onOtherEat?.(o, r);
        if (r.mass < cap) r.setMass(Math.min(cap, r.mass + o.mass * EATING.massGain));
        this.recycle(o, bh, this.view());
      }
    }
  }
}
