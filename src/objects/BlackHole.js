import Phaser from 'phaser';
import { BLACK_HOLE, DEPTH, DISK, GROWTH, MOVEMENT } from '../config.js';

// Growth formula from SPEC.md: radius = baseRadius × (mass ÷ baseMass)^(1/3).
export function radiusForMass(mass) {
  return GROWTH.baseRadius * Math.pow(Math.max(mass, 1e-6) / GROWTH.baseMass, GROWTH.exponent);
}

const R0 = GROWTH.baseRadius; // everything is drawn at this radius, then the container is scaled

/**
 * A black hole: pure black disc, thin bright photon ring, tilted rotating amber
 * accretion disk and a soft glow. Used for the player, the title screen art and
 * the Sagittarius A* boss.
 *
 * Movement is steering-based: it accelerates toward a desired velocity and drifts
 * to a stop with friction when there is no input.
 *
 * `radius` is the true size used for the rules; `drawnRadius` eases toward it.
 */
export default class BlackHole extends Phaser.GameObjects.Container {
  constructor(scene, x, y, mass = GROWTH.baseMass, opts = {}) {
    super(scene, x, y);
    this.mass = mass;
    this.radius = radiusForMass(mass);
    this.drawnRadius = this.radius;
    this.velocity = new Phaser.Math.Vector2(0, 0);
    this.diskBoost = 0;
    this.opts = opts;

    // Soft amber bloom
    this.glow = scene.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(opts.glowColor ?? BLACK_HOLE.haloColor);
    this.glow.setScale((DISK.glowRadius * R0) / 128).setAlpha(DISK.glowAlpha * (opts.glowScale ?? 1));

    // Back of the tilted disk: the inner image spins, the outer container squashes it.
    this.diskImage = scene.add.image(0, 0, 'disk').setBlendMode(Phaser.BlendModes.ADD).setScale(R0 / 100);
    if (opts.diskTint) this.diskImage.setTint(opts.diskTint);
    this.diskBack = scene.add.container(0, 0, [this.diskImage]);
    this.diskBack.setScale(1, DISK.tilt).setRotation(DISK.angle);

    // Event horizon and photon ring
    this.disc = scene.add.graphics();
    this.drawDisc(opts.ringColor ?? BLACK_HOLE.photonRingColor);

    // Near half of the disk, passing in front of the disc.
    this.diskFront = scene.add.image(0, 0, 'diskFront').setBlendMode(Phaser.BlendModes.ADD);
    if (opts.diskTint) this.diskFront.setTint(opts.diskTint);
    this.diskFront.setScale(R0 / 100, (R0 / 100) * DISK.tilt);
    // Rotate the front half by the same roll as the back container.
    this.diskFrontHolder = scene.add.container(0, 0, [this.diskFront]).setRotation(DISK.angle);

    this.add([this.glow, this.diskBack, this.disc, this.diskFrontHolder]);
    this.setDepth(opts.depth ?? DEPTH.blackHole);
    this.applyScale();
    this.setDiskAlpha();
    scene.add.existing(this);
  }

  drawDisc(ringColor) {
    const g = this.disc;
    g.clear();
    g.lineStyle(BLACK_HOLE.haloWidth, BLACK_HOLE.haloColor, BLACK_HOLE.haloAlpha);
    g.strokeCircle(0, 0, R0 + BLACK_HOLE.photonRingWidth / 2 + BLACK_HOLE.haloWidth / 2);
    g.fillStyle(0x000000, 1);
    g.fillCircle(0, 0, R0);
    g.lineStyle(BLACK_HOLE.photonRingWidth, ringColor, 1);
    g.strokeCircle(0, 0, R0);
  }

  setLowGraphics(low) {
    this.glow.setVisible(!low);
  }

  setMass(mass) {
    this.mass = mass;
    this.radius = radiusForMass(mass);
  }

  addMass(amount) {
    this.setMass(this.mass + amount);
  }

  snapSize() {
    this.drawnRadius = this.radius;
    this.applyScale();
  }

  boostDisk(amount = DISK.eatBoost) {
    this.diskBoost = Math.min(DISK.maxBoost, this.diskBoost + amount);
  }

  applyScale() {
    this.setScale(this.drawnRadius / R0);
  }

  setDiskAlpha() {
    const a = Math.min(1, DISK.alpha + this.diskBoost);
    this.diskImage.setAlpha(a);
    this.diskFront.setAlpha(a);
    if (this.glow.visible) this.glow.setAlpha(DISK.glowAlpha * (this.opts.glowScale ?? 1) * (1 + this.diskBoost));
  }

  /** Visual update: ease size, spin disk, fade eating glow. */
  updateVisual(dt) {
    const diff = this.radius - this.drawnRadius;
    if (Math.abs(diff) > 1e-4 * this.radius) {
      this.drawnRadius += diff * (1 - Math.exp(-GROWTH.radiusEase * dt));
      this.applyScale();
    }
    this.diskImage.rotation += DISK.spin * dt * (this.opts.spinScale ?? 1);
    if (this.diskBoost > 0) this.diskBoost = Math.max(0, this.diskBoost - DISK.boostDecay * dt * this.diskBoost - 0.05 * dt);
    this.setDiskAlpha();
  }

  /**
   * Steer toward the held pointer or keyboard direction.
   * @param {number} dt seconds
   * @param {{x:number,y:number}|null} target world point (pointer held)
   * @param {{x:number,y:number}|null} direction keyboard direction
   * @param {{speedMultiplier?:number, startRadius?:number}} params
   */
  move(dt, target, direction, params = {}) {
    const v = this.velocity;
    const scale = this.radius / GROWTH.baseRadius; // screen px → world px
    const heavy = Math.pow(this.radius / (params.startRadius ?? this.radius), -MOVEMENT.sizeSpeedExponent);
    const maxSpeed = MOVEMENT.maxSpeed * scale * (params.speedMultiplier ?? 1) * Phaser.Math.Clamp(heavy, MOVEMENT.minSpeedFactor, 1);
    const accel = MOVEMENT.acceleration * scale * (params.speedMultiplier ?? 1);
    this.maxSpeed = maxSpeed;

    let desiredX = 0;
    let desiredY = 0;
    let steering = false;

    if (target) {
      steering = true;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      const dead = MOVEMENT.deadZone * scale;
      if (dist > dead) {
        const speed = maxSpeed * Math.min(1, (dist - dead) / (MOVEMENT.arriveRadius * scale));
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
      let ax = desiredX - v.x;
      let ay = desiredY - v.y;
      const change = Math.hypot(ax, ay);
      const maxChange = accel * dt;
      if (change > maxChange) {
        ax = (ax / change) * maxChange;
        ay = (ay / change) * maxChange;
      }
      v.x += ax;
      v.y += ay;
    } else {
      const decay = Math.exp(-MOVEMENT.friction * dt);
      v.x *= decay;
      v.y *= decay;
      if (v.length() < MOVEMENT.stopSpeed * scale) v.set(0, 0);
    }

    this.x += v.x * dt;
    this.y += v.y * dt;
  }

  // Stop at the edge of the circular play area, keeping any sliding motion along it.
  keepInsideWorld(worldRadius) {
    const limit = worldRadius - this.radius;
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
