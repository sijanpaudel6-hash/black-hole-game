// Development helper: a simple bot that plays runs on its own, so era lengths can be
// measured and the game smoke-tested without a human. Only active in `npm run dev` with
// `?bot` in the URL (e.g. http://localhost:5173/?bot), or in a `vite build --mode bot` test build.
// Never active in the normal production build.
//
// It steers toward the best nearby meal (mass ÷ distance), away from anything that would
// hurt it, and lets GameScene's choice screens pick for it (see GameScene.autoChoose).

import { EATING, DANGER } from '../config.js';

/** Testing switches, only in dev / bot builds: ?era=3 starts a run at era 3, ?powers=jets,lens grants powers. */
export function devParams() {
  try {
    if (import.meta.env.DEV || import.meta.env.MODE === 'bot') return new URLSearchParams(window.location.search);
  } catch {
    // ignore
  }
  return new URLSearchParams();
}

export function autopilotEnabled() {
  try {
    return (import.meta.env.DEV || import.meta.env.MODE === 'bot') && new URLSearchParams(window.location.search).has('bot');
  } catch {
    return false;
  }
}

export default class Autopilot {
  constructor(scene) {
    this.scene = scene;
    this.think = 0;
    this.goal = null;
  }

  /** World point to steer toward this frame (like a held finger), or null. */
  target(dt) {
    const s = this.scene;
    const bh = s.bh;
    this.think -= dt;
    if (this.think <= 0) {
      this.think = 0.12;
      const edibleLimit = bh.radius * EATING.edibleRatio;
      let best = null;
      let bestScore = -Infinity;
      let fleeX = 0;
      let fleeY = 0;
      for (const o of s.spawner.objects) {
        if (!o.inUse || !o.visible || o.spared) continue;
        const dx = o.x - bh.x;
        const dy = o.y - bh.y;
        const d = Math.hypot(dx, dy) || 1;
        if (o.radius < edibleLimit) {
          const score = (o.mass * (o.civ ? 3 : 1)) / (d + bh.radius * 2) ** 1.5;
          if (score > bestScore) {
            bestScore = score;
            best = o;
          }
        } else if (o.radius > bh.radius || o.behaviour === 'rival') {
          const near = bh.radius + o.radius * DANGER.contactFactor;
          const range = near + bh.radius * (o.behaviour === 'rival' ? 10 : 3.5);
          if (d < range) {
            const k = ((range - d) / (range - near * 0.8)) ** 2;
            fleeX -= (dx / d) * k * 6;
            fleeY -= (dy / d) * k * 6;
          }
        }
      }
      let gx = 0;
      let gy = 0;
      if (best) {
        const dx = best.x - bh.x;
        const dy = best.y - bh.y;
        const d = Math.hypot(dx, dy) || 1;
        gx = dx / d;
        gy = dy / d;
      } else {
        gx = Math.cos(s.elapsed * 0.3);
        gy = Math.sin(s.elapsed * 0.3);
      }
      gx += fleeX;
      gy += fleeY;
      const len = Math.hypot(gx, gy) || 1;
      this.goal = { x: gx / len, y: gy / len };
    }
    if (!this.goal) return null;
    const reach = bh.radius * 8;
    return { x: bh.x + this.goal.x * reach, y: bh.y + this.goal.y * reach };
  }
}
