import Phaser from 'phaser';
import { OBJECTS, SPAWNER, WORLD } from '../config.js';
import SpaceObject from '../objects/SpaceObject.js';

/**
 * Keeps the play area full of objects. Fills the whole circular world at the
 * start, then every eaten object is reused and placed just outside the view,
 * so the area around the player never empties. Objects far off-screen are
 * paused and hidden to keep the frame rate up on low-end phones.
 */
export default class Spawner {
  constructor(scene, tier) {
    this.scene = scene;
    this.setTier(tier);
    SpaceObject.createTextures(scene);

    this.objects = [];
    for (let i = 0; i < SPAWNER.count; i++) {
      const obj = new SpaceObject(scene);
      const type = this.pickType();
      const p = this.randomWorldPoint(OBJECTS[type].radius, SPAWNER.startClearRadius);
      obj.reset(type, p.x, p.y);
      this.objects.push(obj);
    }
  }

  setTier(tier) {
    const weights = SPAWNER.weights[tier];
    this.types = Object.keys(weights);
    this.weights = this.types.map((t) => weights[t]);
    this.totalWeight = this.weights.reduce((a, b) => a + b, 0);
  }

  pickType() {
    let roll = Math.random() * this.totalWeight;
    for (let i = 0; i < this.types.length; i++) {
      roll -= this.weights[i];
      if (roll < 0) return this.types[i];
    }
    return this.types[this.types.length - 1];
  }

  // Uniform random point inside the world disc, at least `minDist` from the centre.
  randomWorldPoint(objRadius, minDist = 0) {
    const max = WORLD.radius - objRadius;
    const r = Math.sqrt(Phaser.Math.FloatBetween((minDist / max) ** 2, 1)) * max;
    const a = Math.random() * Math.PI * 2;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }

  // A point just outside the camera view (but inside the world).
  offscreenPoint(objRadius, view) {
    const cx = view.centerX;
    const cy = view.centerY;
    const halfDiag = Math.hypot(view.width, view.height) / 2;
    const limit = WORLD.radius - objRadius;
    for (let tries = 0; tries < 8; tries++) {
      const d = halfDiag + SPAWNER.respawnMargin + objRadius + Math.random() * SPAWNER.respawnRingWidth;
      const a = Math.random() * Math.PI * 2;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      if (Math.hypot(x, y) <= limit) return { x, y };
    }
    // Near the world edge most of the ring is outside: fall back to anywhere not in view.
    for (let tries = 0; tries < 20; tries++) {
      const p = this.randomWorldPoint(objRadius);
      if (!Phaser.Geom.Rectangle.Contains(view, p.x, p.y)) return p;
    }
    return this.randomWorldPoint(objRadius);
  }

  /**
   * Move every nearby object one frame, pulling and swallowing edible ones.
   * @returns {number} total mass swallowed this frame
   */
  update(dt, time, blackHole) {
    const view = this.scene.cameras.main.worldView;
    const m = SPAWNER.activeMargin;
    const left = view.x - m;
    const right = view.right + m;
    const top = view.y - m;
    const bottom = view.bottom + m;

    let eaten = 0;
    for (const obj of this.objects) {
      const active = obj.x > left && obj.x < right && obj.y > top && obj.y < bottom;
      if (obj.visible !== active) obj.setVisible(active);
      if (!active) continue; // far off-screen: paused

      if (obj.step(dt, time, blackHole)) {
        eaten += obj.mass;
        const type = this.pickType();
        const p = this.offscreenPoint(OBJECTS[type].radius, view);
        obj.reset(type, p.x, p.y);
      }
    }
    return eaten;
  }
}
