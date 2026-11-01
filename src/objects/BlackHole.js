import Phaser from 'phaser';
import { BLACK_HOLE, DEPTH, GROWTH, MOVEMENT, WORLD } from '../config.js';

// Growth formula from SPEC.md: radius = baseRadius × (mass ÷ baseMass)^(1/3).
export function radiusForMass(mass) {
  return GROWTH.baseRadius * Math.pow(mass / GROWTH.baseMass, GROWTH.exponent);
}

/**
 * The player's black hole: a pure black disc with a thin bright photon ring.
 * Movement is steering-based: it accelerates toward a desired velocity and
 * drifts to a stop with friction when there is no input.
 *
 * `radius` is the true size used for eating rules; `drawnRadius` eases toward
 * it so growth looks smooth instead of popping.
 */
export default class BlackHole extends Phaser.GameObjects.Container {
  constructor(scene, x, y, mass = GROWTH.baseMass) {
    super(scene, x, y);
    this.mass = mass;
    this.radius = radiusForMass(mass);
    this.drawnRadius = this.radius;
    this.velocity = new Phaser.Math.Vector2(0, 0);

    this.gfx = scene.add.graphics();
    this.add(this.gfx);
    this.redraw();

    this.setDepth(DEPTH.blackHole);
    scene.add.existing(this);
  }

  addMass(amount) {
    this.mass += amount;
    this.radius = radiusForMass(this.mass);
  }

  // Max speed shrinks slightly as the black hole grows, so big feels heavy.
  get maxSpeed() {
    const factor = Math.pow(this.radius / GROWTH.baseRadius, -MOVEMENT.sizeSpeedExponent);
    return MOVEMENT.maxSpeed * Math.max(MOVEMENT.minSpeedFactor, Math.min(1, factor));
  }

  // Ease the drawn size toward the true size; only redraw when it visibly changes.
  updateSize(dt) {
    const diff = this.radius - this.drawnRadius;
    if (Math.abs(diff) < 0.01) return;
    this.drawnRadius += diff * (1 - Math.exp(-GROWTH.radiusEase * dt));
    if (Math.abs(this.radius - this.drawnRadius) < 0.05) this.drawnRadius = this.radius;
    this.redraw();
  }

  redraw() {
    const r = this.drawnRadius;
    const g = this.gfx;
    g.clear();
    // Faint glow just outside the ring.
    g.lineStyle(BLACK_HOLE.haloWidth, BLACK_HOLE.haloColor, BLACK_HOLE.haloAlpha);
    g.strokeCircle(0, 0, r + BLACK_HOLE.photonRingWidth / 2 + BLACK_HOLE.haloWidth / 2);
    // Event horizon: pure black, hides the stars behind it.
    g.fillStyle(0x000000, 1);
    g.fillCircle(0, 0, r);
    // Photon ring.
    g.lineStyle(BLACK_HOLE.photonRingWidth, BLACK_HOLE.photonRingColor, 1);
    g.strokeCircle(0, 0, r);
  }

  /**
   * @param {number} dt seconds since last frame
   * @param {{x:number,y:number}|null} target world point to move toward (pointer held)
   * @param {{x:number,y:number}|null} direction direction to move in (keyboard)
   */
  move(dt, target, direction) {
    const v = this.velocity;
    const maxSpeed = this.maxSpeed;
    let desiredX = 0;
    let desiredY = 0;
    let steering = false;

    if (target) {
      steering = true;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > MOVEMENT.deadZone) {
        // Full speed when far away, easing off as it arrives so it never overshoots.
        const speed = maxSpeed * Math.min(1, (dist - MOVEMENT.deadZone) / MOVEMENT.arriveRadius);
        desiredX = (dx / dist) * speed;
        desiredY = (dy / dist) * speed;
      }
    } else if (direction && (direction.x !== 0 || direction.y !== 0)) {
      steering = true;
      const len = Math.hypot(direction.x, direction.y);
      desiredX = (direction.x / len) * maxSpeed;
      desiredY = (direction.y / len) * maxSpeed;
    }

    if (steering) {
      // Turn the velocity toward the desired velocity, limited by acceleration.
      let ax = desiredX - v.x;
      let ay = desiredY - v.y;
      const change = Math.hypot(ax, ay);
      const maxChange = MOVEMENT.acceleration * dt;
      if (change > maxChange) {
        ax = (ax / change) * maxChange;
        ay = (ay / change) * maxChange;
      }
      v.x += ax;
      v.y += ay;
    } else {
      // No input: drift and slow down.
      const decay = Math.exp(-MOVEMENT.friction * dt);
      v.x *= decay;
      v.y *= decay;
      if (v.length() < MOVEMENT.stopSpeed) v.set(0, 0);
    }

    this.x += v.x * dt;
    this.y += v.y * dt;
    this.keepInsideWorld();
    this.updateSize(dt);
  }

  // Stop at the edge of the circular play area, keeping any sliding motion along it.
  keepInsideWorld() {
    const limit = WORLD.radius - this.radius;
    const dist = Math.hypot(this.x, this.y);
    if (dist <= limit) return;
    const nx = this.x / dist;
    const ny = this.y / dist;
    this.x = nx * limit;
    this.y = ny * limit;
    const outward = this.velocity.x * nx + this.velocity.y * ny;
    if (outward > 0) {
      this.velocity.x -= outward * nx;
      this.velocity.y -= outward * ny;
    }
  }
}
