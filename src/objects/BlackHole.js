import Phaser from 'phaser';
import { BLACK_HOLE, MOVEMENT, WORLD } from '../config.js';

/**
 * The player's black hole: a pure black disc with a thin bright photon ring.
 * Movement is steering-based: it accelerates toward a desired velocity and
 * drifts to a stop with friction when there is no input.
 */
export default class BlackHole extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.radius = BLACK_HOLE.startRadius;
    this.velocity = new Phaser.Math.Vector2(0, 0);

    this.gfx = scene.add.graphics();
    this.add(this.gfx);
    this.redraw();

    scene.add.existing(this);
  }

  redraw() {
    const r = this.radius;
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
        const speed = MOVEMENT.maxSpeed * Math.min(1, (dist - MOVEMENT.deadZone) / MOVEMENT.arriveRadius);
        desiredX = (dx / dist) * speed;
        desiredY = (dy / dist) * speed;
      }
    } else if (direction && (direction.x !== 0 || direction.y !== 0)) {
      steering = true;
      const len = Math.hypot(direction.x, direction.y);
      desiredX = (direction.x / len) * MOVEMENT.maxSpeed;
      desiredY = (direction.y / len) * MOVEMENT.maxSpeed;
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
