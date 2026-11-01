import Phaser from 'phaser';
import { DEPTH, OBJECTS } from '../config.js';
import { TEXTURE_INFO, objectTextureKey } from '../systems/textures.js';
import { radiusForMass } from './BlackHole.js';

const TAU = Math.PI * 2;
const rand = (r) => (Array.isArray(r) ? Phaser.Math.FloatBetween(r[0], r[1]) : r);

/**
 * An edible or dangerous object: a size, a mass value and a movement behaviour.
 * Objects are pooled and reused: reset() turns one into a fresh object.
 *
 * role:
 *  - 'root'       free-floating; respawns off-screen when eaten or left behind
 *  - 'extra'      moons, orbiting planets, scattered stars; returned to the pool instead
 *  - 'persistent' scenario objects; never recycled
 */
export default class SpaceObject extends Phaser.GameObjects.Image {
  constructor(scene) {
    super(scene, 0, 0, 'spark');
    this.inUse = false;
    this.gen = 0;
    this.setVisible(false).setActive(false);
    scene.add.existing(this);
  }

  reset(type, x, y, opts = {}) {
    const def = OBJECTS[type];
    this.type = type;
    this.def = def;
    this.behaviour = def.behaviour;
    this.role = opts.role ?? 'root';
    this.gen += 1;
    this.inUse = true;
    this.mass = opts.mass ?? def.mass;
    this.startMass = this.mass;
    this.radius = opts.radius ?? (type === 'rival' ? radiusForMass(this.mass) : def.radius);
    this.startRadius = this.radius;
    this.realKg = opts.realKg ?? def.realKg ?? null;
    this.named = !!def.named;
    this.bonus = def.bonus ?? 1;
    this.edible = null;
    this.under = null;
    this.feeding = false;
    this.pulled = false;
    this.think = 0;
    this.targetX = x;
    this.targetY = y;

    const key = objectTextureKey(type);
    const info = TEXTURE_INFO[key];
    this.setTexture(key);
    this.setOrigin(info.originX, info.originY);
    this.texBody = info.bodyRadius;
    this.applySize();
    if (def.tints) this.setTint(Phaser.Utils.Array.GetRandom(def.tints));
    else this.clearTint();
    this.setAlpha(1).setVisible(true).setActive(true);
    this.setPosition(x, y);
    this.setRotation(type === 'rival' || def.named ? 0 : Math.random() * TAU);

    const angle = Math.random() * TAU;
    const speed = def.drift ? rand(def.drift) * this.radius : 0;
    this.driftX = Math.cos(angle) * speed;
    this.driftY = Math.sin(angle) * speed;
    this.vx = this.driftX;
    this.vy = this.driftY;
    this.spin = rand(def.spin ?? 0) * (Math.random() < 0.5 ? -1 : 1);
    this.phase = Math.random() * TAU;

    // Orbits: around a parent object, or around an invisible point.
    this.parent = opts.parent ?? null;
    this.parentGen = this.parent ? this.parent.gen : 0;
    this.orbiting = !!this.parent || this.behaviour === 'orbitPoint';
    if (this.orbiting) {
      const around = this.parent ? this.parent.radius : this.radius;
      this.orbitRadius = rand(opts.orbitRadius ?? def.orbitRadius) * around;
      const period = rand(opts.orbitPeriod ?? def.orbitPeriod);
      this.orbitSpeed = (TAU / period) * (Math.random() < 0.5 ? -1 : 1);
      this.orbitAngle = Math.random() * TAU;
      if (this.parent) {
        this.x = this.parent.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = this.parent.y + Math.sin(this.orbitAngle) * this.orbitRadius;
      } else {
        this.orbitCx = x - Math.cos(this.orbitAngle) * this.orbitRadius;
        this.orbitCy = y - Math.sin(this.orbitAngle) * this.orbitRadius;
      }
    }
    if (this.behaviour === 'comet') this.rotation = Math.atan2(this.vy, this.vx);
    this.setDepth(DEPTH.inedibleObjects);
    return this;
  }

  applySize() {
    this.setScale(this.radius / this.texBody);
  }

  /** Change mass; rivals grow by the black hole formula, everything else by cube root of its own size. */
  setMass(m) {
    this.mass = m;
    this.radius = this.type === 'rival' ? radiusForMass(m) : this.startRadius * Math.cbrt(m / this.startMass);
    this.applySize();
  }

  release() {
    this.inUse = false;
    this.parent = null;
    this.gen += 1;
    this.setVisible(false).setActive(false);
  }

  /** Stop orbiting and fly free with the current velocity. */
  freeFromOrbit() {
    if (!this.orbiting) return;
    this.orbiting = false;
    this.parent = null;
    this.driftX = this.vx * 0.3;
    this.driftY = this.vy * 0.3;
  }

  /** Move one frame (forces were already applied to vx/vy). */
  integrate(dt, time) {
    if (this.orbiting) {
      if (this.parent && (!this.parent.inUse || this.parent.gen !== this.parentGen)) {
        this.freeFromOrbit();
      } else {
        this.orbitAngle += this.orbitSpeed * dt;
        const cx = this.parent ? this.parent.x : this.orbitCx;
        const cy = this.parent ? this.parent.y : this.orbitCy;
        const nx = cx + Math.cos(this.orbitAngle) * this.orbitRadius;
        const ny = cy + Math.sin(this.orbitAngle) * this.orbitRadius;
        if (dt > 0) {
          this.vx = (nx - this.x) / dt;
          this.vy = (ny - this.y) / dt;
        }
        this.x = nx;
        this.y = ny;
      }
    }
    if (!this.orbiting) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    if (this.behaviour === 'comet') {
      if (this.vx * this.vx + this.vy * this.vy > 1) this.rotation = Math.atan2(this.vy, this.vx);
    } else {
      this.rotation += this.spin * dt;
    }
    if (this.def.sparkle) {
      this.alpha = 1 - this.def.sparkle * (0.5 + 0.5 * Math.sin(time * this.def.sparkleSpeed + this.phase));
    }
  }

  /** Settle back toward its own lazy drift (when nothing is pulling on it). */
  settle(k) {
    if (this.orbiting) return;
    this.vx += (this.driftX - this.vx) * k;
    this.vy += (this.driftY - this.vy) * k;
  }

  bounceOffWorldEdge(worldRadius) {
    const limit = worldRadius - this.radius;
    const dist = Math.hypot(this.x, this.y);
    if (dist <= limit || dist === 0) return;
    const nx = this.x / dist;
    const ny = this.y / dist;
    if (this.orbiting && !this.parent) {
      // Shift the whole orbit inward.
      this.orbitCx -= nx * (dist - limit);
      this.orbitCy -= ny * (dist - limit);
    }
    this.x = nx * limit;
    this.y = ny * limit;
    const outV = this.vx * nx + this.vy * ny;
    if (outV > 0) {
      this.vx -= 2 * outV * nx;
      this.vy -= 2 * outV * ny;
    }
    const outD = this.driftX * nx + this.driftY * ny;
    if (outD > 0) {
      this.driftX -= 2 * outD * nx;
      this.driftY -= 2 * outD * ny;
    }
  }
}
