// Scripts for the "What if…?" scenarios. Each sets up a scene in GameScene and drives it.
// update() returns { controlled: true } when the script moves the black hole itself, or
// { target } to auto-steer when the player isn't touching the screen.

import Phaser from 'phaser';
import { COLORS, DEPTH, EFFECTS, FEEDING, GROWTH, HOMETOWN, CAMERA } from '../config.js';
import { drawGlobeTexture } from './globe.js';
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

// ---- Cosmic events as What if…? scenes (Session E) ----

/** Steer toward the nearest thing you can eat when the player isn't touching the screen. */
function autoEatTarget(scene) {
  const bh = scene.bh;
  let best = null;
  let bestD = Infinity;
  for (const o of scene.spawner.objects) {
    if (!o.inUse || !o.visible || o.behaviour === 'rival' || o.radius >= bh.radius * 0.9) continue;
    const d = Math.hypot(o.x - bh.x, o.y - bh.y);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best ? { x: best.x, y: best.y } : undefined;
}

function eventScene(type, { mass = 2000, kg = 10 * SUN_KG, delay = 1.2, at = null, autoEat = true, after = 1.6, seekAfter = 0 } = {}) {
  return (scene) => {
    setPlayer(scene, mass, kg);
    // The kg counter follows the black hole's growth (10 Suns at the start).
    scene.realKg = null;
    scene.realKgScale = kg / mass;
    scene.zoomBase = 0.8;
    let t = 0;
    let started = false;
    let done = false;
    return {
      update(dt, _realDt, hasInput) {
        t += dt;
        if (!started && t > delay && scene.cosmic) {
          started = true;
          const bh = scene.bh;
          scene.cosmic.start(type, { scenario: true, at: at ? { x: bh.x + at[0] * bh.radius, y: bh.y + at[1] * bh.radius } : null });
          if (scene.cosmic.active) {
            scene.cosmic.active.onEnd = () => {
              if (!done) {
                done = true;
                scene.finishScenario(after);
              }
            };
          }
        }
        if (hasInput || !started) return {};
        // Wormhole: drift over, then dive in.
        const ev = scene.cosmic?.active;
        if (seekAfter && ev && !ev.used && t > delay + seekAfter && ev.x !== undefined) return { target: { x: ev.x, y: ev.y } };
        if (autoEat || ev?.used) return { target: autoEatTarget(scene) };
        return {};
      },
    };
  };
}

SCRIPTS.supernova = eventScene('supernova', { at: [0, -6], after: 0.5 });
SCRIPTS.tidal = eventScene('tidal', { at: [7, -6] });
SCRIPTS.wanderer = eventScene('wanderer', { autoEat: true });
SCRIPTS.wormhole = eventScene('wormhole', { at: [0, -10], autoEat: false, seekAfter: 2.5, after: 2.4 });
SCRIPTS.whitehole = eventScene('whiteHole', { at: [0, -6], autoEat: false });
SCRIPTS.darkmatter = eventScene('darkMatter', { at: [0, -3] });

SCRIPTS.hometown = (scene) => {
  // Feed Your Hometown: Earth turned so the chosen place faces you; the black hole flies
  // in, swallows it and leaves a hole. Cities and countries only (see src/ui/hometown.js).
  const H = HOMETOWN;
  const place = scene.scenarioData?.place ?? { kind: 'city', name: 'Kathmandu', country: 'Nepal', lat: 27.72, lon: 85.31 };
  const land = scene.scenarioData?.land ?? [];
  setPlayer(scene, 120, 7.35e22);
  const bh = scene.bh;
  const cam = scene.cameras.main;
  scene.camTarget = null;
  const R = H.earthRadius;
  const globe = drawGlobeTexture(scene, 'hometown-globe', land, place.lon, place.lat, H.globeTexture);
  scene.add.image(0, 0, globe.key).setDepth(DEPTH.edibleObjects - 3).setScale(R / globe.radius);
  const bite = scene.add.graphics().setDepth(DEPTH.edibleObjects - 2);
  const marker = scene.add.image(0, 0, 'ring').setTint(COLORS.amber).setDepth(DEPTH.edibleObjects - 1).setScale((R * 0.07) / 124);
  const dot = scene.add.image(0, 0, 'spark').setTint(COLORS.amber).setDepth(DEPTH.edibleObjects - 1).setScale((R * 0.035) / 16);
  scene.tweens.add({ targets: marker, scale: (R * 0.1) / 124, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
  const wide = (GAME_W * 0.78) / (2 * R);
  const close = (CAMERA.screenRadius / bh.radius) * H.zoomIn;
  const start = { x: -R * 1.9, y: -R * 1.7 };
  const ctrl = { x: -R * 1.5, y: R * 0.3 };
  bh.setPosition(start.x, start.y);
  scene.fixedZoom = wide;
  cam.setZoom(wide);
  cam.centerOn(0, 0);
  let t = 0;
  let phase = 'approach';
  let biteT = 0;
  let labelled = false;
  const lerp = (a, b, k) => a + (b - a) * k;
  return {
    update(dt) {
      t += dt;
      if (!labelled && scene.ui?.ready) {
        labelled = true; // (the UI scene starts after this script is created)
        scene.ui.setPointer('city', { x: 0, y: 0, inUse: true }, COLORS.amber, place.name, 0, true);
      }
      if (phase === 'approach') {
        const k = Math.min(1, Math.max(0, (t - 0.6) / H.approachTime));
        const e = k * k * (3 - 2 * k);
        const m = 1 - e;
        bh.setPosition(m * m * start.x + 2 * m * e * ctrl.x, m * m * start.y + 2 * m * e * ctrl.y);
        bh.velocity.set(1, 1);
        const cz = Math.max(0, (k - 0.35) / 0.65);
        scene.fixedZoom = lerp(wide, close, cz * cz);
        cam.centerOn(lerp(0, bh.x, cz), lerp(0, bh.y, cz));
        if (k >= 1) {
          phase = 'bite';
          scene.ui.clearPointer('city');
          scene.slowMo(0.5, 1.2);
          scene.shake(EFFECTS.bigShake, 0.6);
          audio.bassDrop(1);
          scene.effects.flash(0, 0, bh.radius * 3, COLORS.amber, 0.6);
          scene.tweens.add({ targets: [marker, dot], scale: 0, alpha: 0, duration: 600 });
        }
      } else if (phase === 'bite') {
        biteT += dt;
        const k = Math.min(1, biteT / H.biteTime);
        const r = R * H.biteRadius * Math.sqrt(k);
        bite.clear();
        bite.fillStyle(0xff9a4d, 0.35).fillCircle(0, 0, r * 1.25);
        bite.fillStyle(0x000000, 1).fillCircle(0, 0, r);
        bh.addMass(dt * 20);
        bh.boostDisk(0.1);
        cam.centerOn(0, 0);
        if (Math.random() < 0.9) {
          const a = Math.random() * Math.PI * 2;
          const d = r * 1.3 + Math.random() * R * 0.15;
          scene.effects.debris(Math.cos(a) * d, Math.sin(a) * d, [0x5d9b4a, 0x2a5fb0, 0xffe0b0, COLORS.amber], 2, bh, bh.radius * 4);
        }
        if (Math.random() < 0.15) scene.shake(0.004, 0.1);
        if (k >= 1) {
          phase = 'reveal';
          t = 0;
          scene.ui.showBanner(place.name, 'Swallowed', 2.6);
          scene.ui.showLabel(place.kind === 'city' ? place.country : 'Country', `${place.name} · swallowed`, true);
          audio.chime();
        }
      } else if (phase === 'reveal') {
        // Pull back to show Earth with a hole where the place used to be.
        const k = Math.min(1, t / 1.6);
        scene.fixedZoom = lerp(close, wide * 1.15, k * k);
        cam.centerOn(0, 0);
        if (k >= 1 && phase !== 'done') {
          phase = 'done';
          scene.ui.showCaption(scene.scenarioDef.cta, 3.2);
          scene.finishScenario(3.4);
        }
      } else cam.centerOn(0, 0);
      return { controlled: true };
    },
  };
};

const GAME_W = 720;

export function createScenario(id, scene) {
  return (SCRIPTS[id] ?? SCRIPTS.earth)(scene);
}
