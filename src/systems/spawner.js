import Phaser from 'phaser';
import { DANGER, DEPTH, EATING, FEEDING, GROWTH, OBJECTS, RIVAL, SPAWNER, COLORS, BOSS } from '../config.js';
import SpaceObject from '../objects/SpaceObject.js';

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
    this.objects = [];
    for (let i = 0; i < SPAWNER.count + SPAWNER.reserve; i++) this.objects.push(new SpaceObject(scene));
    this.rings = [];
    for (let i = 0; i < SPAWNER.maxDangerRings; i++) {
      this.rings.push(scene.add.image(0, 0, 'ring').setVisible(false).setDepth(DEPTH.dangerRings).setTint(COLORS.danger).setAlpha(SPAWNER.dangerRingAlpha));
    }
    this.setWeights(opts.weights);
    this.rivalCount = 0;
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
      let roll = Math.random() * this.totalWeight;
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
    if (type === 'rival') this.rivalCount++;
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
    if (obj.role !== 'root' || !this.weights) {
      if (obj.type === 'rival') this.rivalCount--;
      obj.release();
      return;
    }
    const type = this.pickType();
    const p = this.ringPoint(OBJECTS[type].radius || bh.radius, v);
    this.spawnRoot(obj, type, p.x, p.y, bh);
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

  // ---- Per-frame update ----

  /**
   * @param {object} ctx
   * @param {import('../objects/BlackHole.js').default} ctx.bh
   * @param {boolean} ctx.danger bigger objects hurt and rivals can eat you
   * @param {boolean} ctx.feeding sitting inside bigger objects eats them
   * @param {number} ctx.pullRange × black hole radius
   * @param {object|null} ctx.boss boss black hole (pulls and eats objects)
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
    const pullAccel = EATING.pullAcceleration * scale;
    const kPull = 1 - Math.exp(-EATING.pullDrag * dt);
    const kSettle = 1 - Math.exp(-EATING.releaseDrag * dt);
    const edibleLimit = bh.radius * EATING.edibleRatio;
    let pulledCount = 0;
    let ringIndex = 0;
    this.pushers.length = 0;
    const boss = ctx.boss;

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
      if (edible !== obj.edible || obj.feeding) {
        obj.edible = edible;
        obj.setDepth(edible || obj.feeding ? DEPTH.edibleObjects : DEPTH.inedibleObjects);
      }

      const dx = bh.x - obj.x;
      const dy = bh.y - obj.y;
      const dist = Math.hypot(dx, dy) || 0.0001;

      if (obj.behaviour === 'rival') this.updateRival(obj, dt, ctx, scale);

      // Pull zone
      obj.pulled = false;
      if (edible && dist < pullRange) {
        obj.pulled = true;
        pulledCount++;
        if (obj.orbiting) obj.freeFromOrbit();
        const closeness = 1 - dist / pullRange;
        const a = pullAccel * closeness;
        obj.vx += (dx / dist) * a * dt;
        obj.vy += (dy / dist) * a * dt;
        const k = kPull * closeness;
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

      const canEatPlayer = obj.behaviour === 'rival' && obj.radius * EATING.edibleRatio > bh.radius;
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
      if (canEatPlayer && ctx.danger && d < r.radius * RIVAL.chaseRange) {
        r.targetX = bh.x;
        r.targetY = bh.y;
      } else if (playerCanEat && d < r.radius * RIVAL.fleeRange) {
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
