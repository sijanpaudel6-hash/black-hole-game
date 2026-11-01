// Scripts for the "What if…?" scenarios. Each sets up a scene in GameScene and drives it.
// update() returns { controlled: true } when the script moves the black hole itself, or
// { target } to auto-steer when the player isn't touching the screen.

import Phaser from 'phaser';
import { COLORS, DEPTH, EFFECTS, FEEDING, GROWTH } from '../config.js';
import BlackHole from '../objects/BlackHole.js';
import { audio } from './audio.js';
import { kgText } from './format.js';

const SUN_KG = 1.989e30;
const massForRadius = (r) => GROWTH.baseMass * (r / GROWTH.baseRadius) ** 3;

function setPlayer(scene, mass, realKg) {
  scene.bh.setMass(mass);
  scene.bh.snapSize();
  scene.startMass = mass;
  scene.startRadius = scene.bh.radius;
  scene.realKg = realKg;
  scene.worldRadius = 1e7;
  scene.spawner.worldRadius = 1e7;
  scene.edge.clear();
}

function bigFinish(scene, x, y, radius, color = COLORS.amber) {
  scene.slowMo(EFFECTS.slowMoScale, 1.2);
  scene.shake(EFFECTS.bigShake, 0.6);
  audio.bassDrop(1.1);
  scene.effects.flash(x, y, radius * 6, 0xffffff, 0.8);
  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(i * 150, () => scene.effects.shockwave(x, y, radius * (5 + i * 3), i === 1 ? COLORS.science : color, 1.4));
  }
}

const SCRIPTS = {
  // A tiny black hole falls into Earth and eats it from the inside.
  earth(scene) {
    setPlayer(scene, GROWTH.baseMass, 1e22);
    const bh = scene.bh;
    const earth = scene.spawner.addPersistent('earth', 0, 0, { still: true });
    bh.setPosition(earth.radius * 0.5, -earth.radius * 1.8);
    bh.velocity.set(-earth.radius * 0.15, earth.radius * 0.2);
    let done = false;
    return {
      update(dt) {
        if (!done && earth.inUse && earth.type === 'earth') {
          const dx = earth.x - bh.x;
          const dy = earth.y - bh.y;
          const d = Math.hypot(dx, dy) || 1;
          const a = earth.radius * 2.4 * Math.min(1.5, (earth.radius / d) ** 2);
          bh.velocity.x += (dx / d) * a * dt;
          bh.velocity.y += (dy / d) * a * dt;
          if (d < earth.radius) {
            const k = Math.exp(-2.2 * dt);
            bh.velocity.x *= k;
            bh.velocity.y *= k;
          }
        }
        bh.x += bh.velocity.x * dt;
        bh.y += bh.velocity.y * dt;
        return { controlled: true };
      },
      onSwallow(obj) {
        if (obj.type === 'earth' && !done) {
          done = true;
          bh.velocity.set(0, 0);
          scene.finishScenario(1.8);
        }
      },
    };
  },

  // The black hole tears the Sun into a glowing spiral.
  sun(scene) {
    setPlayer(scene, 300, 5.97e24);
    scene.feedRate = FEEDING.rate * 2;
    scene.zoomBase = 0.8;
    const bh = scene.bh;
    const sun = scene.spawner.addPersistent('sun', 0, 0, { still: true });
    bh.setPosition(-sun.radius * 1.6, -sun.radius * 0.5);
    bh.velocity.set(sun.radius * 0.35, sun.radius * 0.45);
    let done = false;
    return {
      update(dt) {
        if (!done && sun.inUse && sun.type === 'sun') {
          const dx = sun.x - bh.x;
          const dy = sun.y - bh.y;
          const d = Math.hypot(dx, dy) || 1;
          const a = sun.radius * 1.4 * Math.min(1.5, (sun.radius / d) ** 2);
          bh.velocity.x += (dx / d) * a * dt;
          bh.velocity.y += (dy / d) * a * dt;
          // Inside the Sun: drag makes it spiral to the middle.
          if (d < sun.radius) {
            const k = Math.exp(-0.9 * dt);
            bh.velocity.x *= k;
            bh.velocity.y *= k;
          }
          // Extra glowing spiral arms.
          if (d < sun.radius && Math.random() < 0.8) {
            const ang = Math.random() * Math.PI * 2;
            const r = sun.radius * Phaser.Math.FloatBetween(0.5, 1);
            scene.effects.debris(sun.x + Math.cos(ang) * r, sun.y + Math.sin(ang) * r, sun.def.debris, 2, bh, bh.radius * 7);
          }
        }
        bh.x += bh.velocity.x * dt;
        bh.y += bh.velocity.y * dt;
        return { controlled: true };
      },
      onSwallow(obj) {
        if (obj.type === 'sun' && !done) {
          done = true;
          bh.velocity.set(0, 0);
          scene.finishScenario(1.8);
        }
      },
    };
  },

  // Mercury to Neptune, in order, at speed.
  solar(scene) {
    setPlayer(scene, 12000, 1.2e28);
    scene.speedMultiplier = 1.7;
    const bh = scene.bh;
    const order = ['mercury', 'venus', 'earthSmall', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
    const step = bh.radius * 22;
    let angle = -Math.PI / 2;
    let x = 0;
    let y = 0;
    const planets = order.map((type, i) => {
      angle += i % 2 ? 0.55 : -0.55;
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      return scene.spawner.addPersistent(type, x, y, { still: true });
    });
    let eaten = 0;
    let done = false;
    return {
      update(_dt, _realDt, hasInput) {
        if (done || hasInput) return {};
        const next = planets.find((p) => p.inUse && p.role === 'persistent' && order.includes(p.type));
        if (!next) return {};
        // Aim a little past the planet so the black hole doesn't slow down on arrival.
        const dx = next.x - bh.x;
        const dy = next.y - bh.y;
        const d = Math.hypot(dx, dy) || 1;
        return { target: { x: next.x + (dx / d) * bh.radius * 6, y: next.y + (dy / d) * bh.radius * 6 } };
      },
      onSwallow(obj) {
        if (!order.includes(obj.type)) return;
        eaten++;
        if (eaten === order.length && !done) {
          done = true;
          scene.finishScenario(1.8);
        }
      },
    };
  },

  // Two black holes spiral together and merge.
  merger(scene) {
    setPlayer(scene, 2000, 36 * SUN_KG);
    scene.zoomBase = 0.75;
    const bh = scene.bh;
    const cam = scene.cameras.main;
    scene.camTarget = null;
    const m1 = 36;
    const m2 = 29;
    const rival = new BlackHole(scene, 0, 0, 1600, { ringColor: COLORS.rivalRing, diskTint: 0xc9b6ff, glowColor: COLORS.rivalRing });
    rival.setLowGraphics(scene.low);
    const s0 = bh.radius * 11;
    const T = 9;
    let t = 0;
    let angle = 0;
    let ringTimer = 0;
    let done = false;
    const place = (sep) => {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      bh.setPosition(-ux * sep * (m2 / (m1 + m2)), -uy * sep * (m2 / (m1 + m2)));
      rival.setPosition(ux * sep * (m1 / (m1 + m2)), uy * sep * (m1 / (m1 + m2)));
    };
    place(s0);
    cam.centerOn(0, 0);
    return {
      update(dt) {
        cam.centerOn(0, 0);
        if (done) return { controlled: true };
        rival.updateVisual(dt);
        t += dt;
        const frac = Math.min(1, t / T);
        // Inspiral like the real thing: separation ∝ (time left)^(1/4), faster orbits as it
        // shrinks, reaching contact exactly at time T.
        const contact = (bh.radius + rival.radius) * 0.8;
        const sep = contact + (s0 - contact) * (1 - frac) ** 0.25;
        const omega = Math.min(14, 0.7 * (s0 / sep) ** 1.5);
        angle += omega * dt;
        place(sep);
        // Gravitational-wave ripples and a rising chirp.
        ringTimer -= dt;
        if (ringTimer <= 0) {
          ringTimer = Math.max(0.07, 0.7 * (sep / s0) ** 2);
          scene.effects.shockwave(0, 0, sep * 2.4, COLORS.science, 1.6);
          audio.blip(180 + 900 * (1 - sep / s0), 0.05);
        }
        if (frac >= 1) {
          done = true;
          rival.destroy();
          bh.setPosition(0, 0);
          bh.setMass(bh.mass + 1600);
          scene.realKg = 62 * SUN_KG;
          bigFinish(scene, 0, 0, bh.radius, COLORS.science);
          scene.ui.showLabel('Merged black hole', '62 Suns · 3 Suns became gravitational waves', true);
          scene.finishScenario(2.4);
        }
        return { controlled: true };
      },
    };
  },

  // Your black hole vs Sagittarius A*.
  sgra(scene) {
    setPlayer(scene, 2000, 10 * SUN_KG);
    scene.zoomBase = 0.5;
    const bh = scene.bh;
    const R = 1100;
    const sgr = new BlackHole(scene, 0, 0, massForRadius(R), { depth: DEPTH.boss, glowScale: 1.6, spinScale: 0.5 });
    sgr.setLowGraphics(scene.low);
    // A few stars orbiting the giant, like the real S-stars.
    [1.7, 2.3, 3.3].forEach((k, i) => {
      const s = scene.spawner.addPersistent('sunLikeStar', 0, 0, { still: true });
      if (!s) return;
      s.orbiting = true;
      s.parent = null;
      s.orbitCx = 0;
      s.orbitCy = 0;
      s.orbitRadius = R * k;
      s.orbitAngle = i * 2.1;
      s.orbitSpeed = 0.9 / k ** 1.5;
    });
    const d0 = R * 2.8;
    bh.setPosition(0, -d0);
    const K = R * 1.5;
    const vCirc = Math.sqrt((K * R * R) / d0); // circular-orbit speed at d0
    bh.velocity.set(vCirc * 0.75, 0);
    let done = false;
    return {
      update(dt) {
        sgr.updateVisual(dt);
        if (done) return { controlled: true };
        const dx = -bh.x;
        const dy = -bh.y;
        const d = Math.hypot(dx, dy) || 1;
        const a = K * (R / d) ** 2;
        bh.velocity.x += (dx / d) * a * dt;
        bh.velocity.y += (dy / d) * a * dt;
        const k = Math.exp(-0.22 * dt);
        bh.velocity.x *= k;
        bh.velocity.y *= k;
        bh.x += bh.velocity.x * dt;
        bh.y += bh.velocity.y * dt;
        if (Math.random() < 0.5) {
          const ang = Math.random() * Math.PI * 2;
          scene.effects.debris(Math.cos(ang) * R * 2.2, Math.sin(ang) * R * 2.2, [COLORS.amber, 0xffe0b0], 1, sgr, R * 2);
        }
        if (d < R) {
          done = true;
          bh.velocity.set(0, 0);
          scene.tweens.add({ targets: bh, scale: 0, alpha: 0, x: 0, y: 0, duration: 700 });
          bigFinish(scene, 0, 0, R * 0.6);
          scene.ui.showLabel('Sagittarius A*', kgText(8.0e36, 1), true);
          scene.realKg = 8.0e36 + 10 * SUN_KG;
          scene.finishScenario(2.2);
        }
        return { controlled: true };
      },
    };
  },
};

export function createScenario(id, scene) {
  return (SCRIPTS[id] ?? SCRIPTS.earth)(scene);
}
