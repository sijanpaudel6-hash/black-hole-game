// Icons for Cosmic Craft items that aren't game objects (elements, forces, explosions,
// galaxies…). Drawn once in code like every other texture. Each is 128×128 with the body
// filling a radius of 48 px (TEXTURE_INFO-style info in CRAFT_TEX_INFO).

import { ITEMS } from '../data/recipes.js';
import { OBJECTS } from '../config.js';
import { TEXTURE_INFO, objectTextureKey } from './textures.js';

const S = 128;
const C = 64;
const R = 48;
const TAU = Math.PI * 2;

const css = (color, a = 1) => `rgba(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255},${a})`;

function glow(ctx, r0, r1, color, a) {
  const g = ctx.createRadialGradient(C, C, r0, C, C, r1);
  g.addColorStop(0, css(color, a));
  g.addColorStop(1, css(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
}

const DRAW = {
  atom(ctx, it) {
    glow(ctx, R * 0.6, R * 1.3, it.color, 0.45);
    const g = ctx.createRadialGradient(C - 14, C - 14, 4, C, C, R);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, css(it.color));
    g.addColorStop(1, css(it.color, 0.55));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(C, C, R * 0.82, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#07080c';
    ctx.font = `700 ${it.symbol.length > 2 ? 26 : 38}px "Space Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(it.symbol, C, C + 2);
  },
  gravity(ctx, it) {
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = css(it.color, 0.85 - i * 0.18);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(C, C, R * (0.35 + i * 0.22), R * (0.35 + i * 0.22) * 0.55, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(C, C, 7, 0, TAU);
    ctx.fill();
  },
  time(ctx, it) {
    glow(ctx, 0, R * 1.2, it.color, 0.2);
    ctx.strokeStyle = css(it.color);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(C - 26, C - 38);
    ctx.lineTo(C + 26, C - 38);
    ctx.lineTo(C - 26, C + 38);
    ctx.lineTo(C + 26, C + 38);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = css(0xff9a4d);
    ctx.beginPath();
    ctx.moveTo(C - 14, C + 30);
    ctx.lineTo(C + 14, C + 30);
    ctx.lineTo(C, C + 12);
    ctx.fill();
  },
  spin(ctx, it) {
    glow(ctx, 0, R * 1.2, it.color, 0.25);
    ctx.strokeStyle = css(it.color);
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let a = 0; a < TAU * 2.2; a += 0.1) {
      const r = 4 + a * 6;
      const x = C + Math.cos(a) * r;
      const y = C + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  },
  light(ctx, it) {
    glow(ctx, 0, R * 1.3, it.color, 0.6);
    ctx.strokeStyle = css(0xffffff, 0.9);
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const r0 = i % 2 ? 18 : 12;
      const r1 = i % 2 ? 36 : 50;
      ctx.beginPath();
      ctx.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0);
      ctx.lineTo(C + Math.cos(a) * r1, C + Math.sin(a) * r1);
      ctx.stroke();
    }
  },
  burst(ctx, it) {
    glow(ctx, 0, R * 1.3, it.color, 0.75);
    ctx.fillStyle = css(0xffffff, 0.95);
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU;
      const r = i % 2 ? R * 0.3 : R * (0.7 + ((i * 7) % 5) * 0.08);
      const x = C + Math.cos(a) * r;
      const y = C + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = css(it.color);
    ctx.beginPath();
    ctx.arc(C, C, R * 0.22, 0, TAU);
    ctx.fill();
  },
  pulsar(ctx, it) {
    glow(ctx, 0, R, it.color, 0.6);
    for (const s of [-1, 1]) {
      const g = ctx.createLinearGradient(C, C, C + s * 40, C - s * 56);
      g.addColorStop(0, css(it.color, 0.9));
      g.addColorStop(1, css(it.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(C, C);
      ctx.lineTo(C + s * 30, C - s * 60);
      ctx.lineTo(C + s * 50, C - s * 48);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(C, C, 10, 0, TAU);
    ctx.fill();
  },
  bubble(ctx, it) {
    glow(ctx, R * 0.7, R * 1.1, it.color, 0.6);
    ctx.strokeStyle = css(it.color, 0.9);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(C, C, R * 0.85, 0, TAU);
    ctx.stroke();
  },
  blackHole(ctx, it) {
    glow(ctx, R * 0.6, R * 1.3, it.color, 0.35);
    ctx.save();
    ctx.translate(C, C);
    ctx.rotate(-0.2);
    ctx.scale(1, 0.3);
    const g = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 1.25);
    g.addColorStop(0, css(0xffffff, 0.9));
    g.addColorStop(0.4, css(it.color, 0.7));
    g.addColorStop(1, css(it.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.25, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(C, C, R * 0.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#edeae4';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  },
  quasar(ctx, it) {
    for (const s of [-1, 1]) {
      const g = ctx.createLinearGradient(C, C, C, C + s * 64);
      g.addColorStop(0, css(it.color, 0.95));
      g.addColorStop(1, css(it.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(C - 5, s < 0 ? 0 : C, 10, 64);
    }
    DRAW.blackHole(ctx, { color: 0xffe0b0 });
  },
  stream(ctx, it) {
    DRAW.blackHole(ctx, { color: 0xff9a4d });
    for (let i = 0; i < 16; i++) {
      const a = -0.4 + i * 0.16;
      const r = R * (1.15 - i * 0.03);
      ctx.fillStyle = css(it.color, 0.9 - i * 0.04);
      ctx.beginPath();
      ctx.arc(C + Math.cos(a) * r, C + Math.sin(a) * r * 0.8 - 6, 4.5 - i * 0.2, 0, TAU);
      ctx.fill();
    }
  },
  waves(ctx, it) {
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(C, C, 9, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = css(it.color, 0.9 - i * 0.2);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(C, C, 18 + i * 11, 0, TAU);
      ctx.stroke();
    }
  },
  ring(ctx, it) {
    glow(ctx, R * 0.45, R * 1.1, it.color, 0.7);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(C, C, R * 0.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = css(0xffe0b0);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(C, C, R * 0.62, -2.4, 0.9);
    ctx.stroke();
  },
  lens(ctx, it) {
    ctx.fillStyle = css(0xffe08a);
    ctx.beginPath();
    ctx.arc(C, C, 10, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = css(it.color);
    ctx.lineWidth = 5;
    for (const [a0, a1] of [[-2.6, -0.6], [0.5, 2.6]]) {
      ctx.beginPath();
      ctx.arc(C, C, R * 0.8, a0, a1);
      ctx.stroke();
    }
  },
  galaxy(ctx, it) {
    glow(ctx, 0, R * 0.5, 0xfff0c8, 0.9);
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 70; i++) {
        const t = i / 70;
        const a = arm * Math.PI + t * 4.2;
        const r = 6 + t * R * 1.05;
        ctx.fillStyle = css(it.color, 0.75 * (1 - t) + 0.15);
        ctx.beginPath();
        ctx.arc(C + Math.cos(a) * r, C + Math.sin(a) * r * 0.75, 3.2 * (1 - t) + 1, 0, TAU);
        ctx.fill();
      }
    }
  },
  elliptical(ctx, it) {
    ctx.save();
    ctx.translate(C, C);
    ctx.scale(1, 0.7);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.2);
    g.addColorStop(0, css(0xffffff, 1));
    g.addColorStop(0.25, css(it.color, 0.85));
    g.addColorStop(1, css(it.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  },
};

export function createCraftTextures(scene) {
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.tex) continue;
    const key = `craft-${id}`;
    if (scene.textures.exists(key)) continue;
    const tex = scene.textures.createCanvas(key, S, S);
    DRAW[it.draw](tex.getContext(), it);
    tex.refresh();
  }
}

/** { key, bodyRadius, originX, originY } for an item's sprite. */
export function craftTexture(id) {
  const it = ITEMS[id];
  if (it.tex && OBJECTS[it.tex]) {
    const key = objectTextureKey(it.tex);
    const info = TEXTURE_INFO[key];
    return { key, bodyRadius: info.bodyRadius, originX: info.originX, originY: info.originY };
  }
  return { key: `craft-${id}`, bodyRadius: R, originX: 0.5, originY: 0.5 };
}

/** A small data-URL preview for the HTML item chips (drawn from the Phaser texture). */
export function craftPreview(scene, id, size = 40) {
  const t = craftTexture(id);
  const src = scene.textures.get(t.key).getSourceImage();
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  // Fit the body (not the glow/tail) into the square.
  const scale = (size * 0.46) / t.bodyRadius;
  const w = src.width * scale;
  const h = src.height * scale;
  ctx.drawImage(src, size / 2 - w * t.originX, size / 2 - h * t.originY, w, h);
  return c.toDataURL();
}
