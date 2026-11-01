import Phaser from 'phaser';
import { DEPTH, EATING, GROWTH, OBJECTS, SPAWNER, WORLD } from '../config.js';

/**
 * An edible or dangerous object: a size, a mass value and a movement behaviour.
 * Objects are pooled: when one is eaten the spawner calls reset() to turn it
 * into a fresh object somewhere off-screen instead of creating a new one.
 */
export default class SpaceObject extends Phaser.GameObjects.Image {
  constructor(scene) {
    super(scene, 0, 0, SpaceObject.textureKey('dust'));
    this.vx = 0; // current velocity (drift + pull)
    this.vy = 0;
    this.driftX = 0; // the object's own lazy drift, which it settles back to
    this.driftY = 0;
    this.spin = 0;
    this.phase = 0;
    this.edible = null;
    scene.add.existing(this);
  }

  static textureKey(type) {
    return `obj-${type}`;
  }

  /** Become a new object of `type` at (x, y) with a random drift and spin. */
  reset(type, x, y) {
    const def = OBJECTS[type];
    this.type = type;
    this.def = def;
    this.radius = def.radius;
    this.mass = def.mass;

    this.setTexture(SpaceObject.textureKey(type));
    this.setScale(1 / SPAWNER.textureScale);
    this.setPosition(x, y);
    this.setRotation(Math.random() * Math.PI * 2);
    this.setAlpha(1);

    const angle = Math.random() * Math.PI * 2;
    const speed = Phaser.Math.FloatBetween(def.drift[0], def.drift[1]);
    this.driftX = Math.cos(angle) * speed;
    this.driftY = Math.sin(angle) * speed;
    this.vx = this.driftX;
    this.vy = this.driftY;
    this.spin = Phaser.Math.FloatBetween(def.spin[0], def.spin[1]) * (Math.random() < 0.5 ? -1 : 1);
    this.phase = Math.random() * Math.PI * 2;
    this.edible = null; // forces a depth update next frame
  }

  /**
   * Move one frame. Edible objects inside the pull zone accelerate toward the
   * black hole, faster the closer they are.
   * @returns {boolean} true if the object's centre is inside the black hole (swallowed)
   */
  step(dt, time, blackHole) {
    const edible = this.radius < blackHole.radius * EATING.edibleRatio;
    if (edible !== this.edible) {
      this.edible = edible;
      this.setDepth(edible ? DEPTH.edibleObjects : DEPTH.inedibleObjects);
    }

    let pulled = false;
    if (edible) {
      const dx = blackHole.x - this.x;
      const dy = blackHole.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < blackHole.radius) return true;

      const range = blackHole.radius * EATING.pullRangeMultiplier;
      if (dist < range) {
        pulled = true;
        const closeness = 1 - dist / range; // 0 at the zone edge, 1 at the centre
        const accel = EATING.pullAcceleration * (blackHole.radius / GROWTH.baseRadius) * closeness;
        this.vx += (dx / dist) * accel * dt;
        this.vy += (dy / dist) * accel * dt;
        // Match the black hole's motion so pulled objects get captured and fall in.
        const k = (1 - Math.exp(-EATING.pullDrag * dt)) * closeness;
        this.vx += (blackHole.velocity.x - this.vx) * k;
        this.vy += (blackHole.velocity.y - this.vy) * k;
      }
    }

    if (!pulled) {
      // Outside the pull zone: settle back to a lazy drift.
      const k = 1 - Math.exp(-EATING.releaseDrag * dt);
      this.vx += (this.driftX - this.vx) * k;
      this.vy += (this.driftY - this.vy) * k;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.spin * dt;
    if (this.def.sparkle > 0) {
      this.alpha = 1 - this.def.sparkle * (0.5 + 0.5 * Math.sin(time * this.def.sparkleSpeed + this.phase));
    }
    this.bounceOffWorldEdge();
    return false;
  }

  bounceOffWorldEdge() {
    const limit = WORLD.radius - this.radius;
    const dist = Math.hypot(this.x, this.y);
    if (dist <= limit) return;
    const nx = this.x / dist;
    const ny = this.y / dist;
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

  // ---- Textures (drawn in code once per type) ----------------------------

  static createTextures(scene) {
    for (const [type, def] of Object.entries(OBJECTS)) {
      const key = SpaceObject.textureKey(type);
      if (scene.textures.exists(key)) continue;
      const r = def.radius * SPAWNER.textureScale;
      const pad = 2;
      const size = Math.ceil(r * 2 + pad * 2);
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.translateCanvas(size / 2, size / 2);
      DRAW[type](g, r, def.color);
      g.generateTexture(key, size, size);
      g.destroy();
    }
  }
}

const shade = (color, amount) => {
  const c = Phaser.Display.Color.IntegerToColor(color);
  return (amount > 0 ? c.lighten(amount) : c.darken(-amount)).color;
};

// Irregular polygon: n vertices at radius r × [minR, 1].
const lumpyPolygon = (g, r, n, minR) => {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const d = r * Phaser.Math.FloatBetween(minR, 1);
    pts.push(new Phaser.Math.Vector2(Math.cos(a) * d, Math.sin(a) * d));
  }
  g.fillPoints(pts, true);
};

const DRAW = {
  dust(g, r, color) {
    g.fillStyle(color, 0.2).fillCircle(0, 0, r);
    g.fillStyle(color, 0.5).fillCircle(0, 0, r * 0.8);
    g.fillStyle(color, 1).fillCircle(0, 0, r * 0.58);
  },
  iceCrystal(g, r, color) {
    const diamond = (s) => [
      new Phaser.Math.Vector2(0, -r * s),
      new Phaser.Math.Vector2(r * s * 0.55, 0),
      new Phaser.Math.Vector2(0, r * s),
      new Phaser.Math.Vector2(-r * s * 0.55, 0),
    ];
    g.fillStyle(color, 0.9).fillPoints(diamond(1), true);
    g.fillStyle(0xffffff, 1).fillPoints(diamond(0.45), true);
  },
  pebble(g, r, color) {
    g.fillStyle(color, 1);
    lumpyPolygon(g, r, 10, 0.86);
    g.fillStyle(shade(color, 18), 1).fillCircle(-r * 0.3, -r * 0.3, r * 0.28);
  },
  smallRock(g, r, color) {
    g.fillStyle(color, 1);
    lumpyPolygon(g, r, 11, 0.74);
    g.fillStyle(shade(color, -14), 1);
    g.fillCircle(r * 0.25, r * 0.2, r * 0.2);
    g.fillCircle(-r * 0.3, r * 0.35, r * 0.12);
    g.fillCircle(-r * 0.15, -r * 0.35, r * 0.14);
    g.fillStyle(shade(color, 14), 1).fillCircle(-r * 0.4, -r * 0.1, r * 0.08);
  },
};
