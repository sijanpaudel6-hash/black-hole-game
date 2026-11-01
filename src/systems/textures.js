// Every texture in the game is drawn in code here, once, at start-up.
// TEXTURE_INFO[key] says where the body sits in each texture so sprites can be sized
// by their collision radius even when the texture has a glow, tail or rings around it.

import { OBJECTS, DISK } from '../config.js';

export const TEXTURE_INFO = {};

const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

function hex(color, alpha = 1) {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function mix(c1, c2, t) {
  const r = ((c1 >> 16) & 255) * (1 - t) + ((c2 >> 16) & 255) * t;
  const g = ((c1 >> 8) & 255) * (1 - t) + ((c2 >> 8) & 255) * t;
  const b = (c1 & 255) * (1 - t) + (c2 & 255) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
const lighten = (c, t) => mix(c, 0xffffff, t);
const darken = (c, t) => mix(c, 0x000000, t);

function canvasTexture(scene, key, w, h, draw, info) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
  const ctx = tex.getContext();
  draw(ctx);
  tex.refresh();
  TEXTURE_INFO[key] = info;
}

// ---- Shape helpers ----

function lumpy(ctx, cx, cy, r, n, minR) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const d = r * rand(minR, 1);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function sphere(ctx, cx, cy, r, color, light = 0.35, dark = 0.55) {
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
  g.addColorStop(0, hex(lighten(color, light)));
  g.addColorStop(0.6, hex(color));
  g.addColorStop(1, hex(darken(color, dark)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
}

function craters(ctx, cx, cy, r, color, count) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, TAU);
    const d = Math.sqrt(Math.random()) * r * 0.75;
    const cr = r * rand(0.06, 0.18);
    ctx.fillStyle = hex(darken(color, 0.25), 0.8);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, cr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = hex(lighten(color, 0.15), 0.4);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d - cr * 0.25, cy + Math.sin(a) * d - cr * 0.25, cr * 0.5, 0, TAU);
    ctx.fill();
  }
}

function clipCircle(ctx, cx, cy, r, fn) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.clip();
  fn();
  ctx.restore();
}

function shade(ctx, cx, cy, r, strength = 0.55) {
  // Terminator shading over a body.
  const g = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.2, cx, cy, r * 1.05);
  g.addColorStop(0, 'rgba(255,255,255,0.12)');
  g.addColorStop(0.6, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
}

function glow(ctx, cx, cy, r0, r1, color, alpha) {
  const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
  g.addColorStop(0, hex(color, alpha));
  g.addColorStop(0.4, hex(color, alpha * 0.35));
  g.addColorStop(1, hex(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r1, 0, TAU);
  ctx.fill();
}

function starBody(ctx, cx, cy, r, color) {
  glow(ctx, cx, cy, r * 0.8, r * 1.8, color, 0.55);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, hex(lighten(color, 0.85)));
  g.addColorStop(0.55, hex(lighten(color, 0.35)));
  g.addColorStop(1, hex(color));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  // Granulation
  clipCircle(ctx, cx, cy, r, () => {
    for (let i = 0; i < 40; i++) {
      const a = rand(0, TAU);
      const d = Math.sqrt(Math.random()) * r;
      ctx.fillStyle = hex(darken(color, 0.2), rand(0.05, 0.15));
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * rand(0.05, 0.15), 0, TAU);
      ctx.fill();
    }
  });
}

function bands(ctx, cx, cy, r, colors, count) {
  clipCircle(ctx, cx, cy, r, () => {
    const h = (2 * r) / count;
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = hex(colors[i % colors.length]);
      const wobble = rand(-0.2, 0.2) * h;
      ctx.fillRect(cx - r, cy - r + i * h + wobble, 2 * r, h * rand(0.8, 1.3));
    }
  });
}

function ringEllipse(ctx, cx, cy, rx, ry, color, width, half) {
  ctx.save();
  ctx.beginPath();
  if (half === 'back') ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, TAU);
  else if (half === 'front') ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI);
  else ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

// ---- Object textures ----

const DRAW = {
  dust(ctx, c, R, color) {
    glow(ctx, c, c, 0, R, color, 0.5);
    ctx.fillStyle = hex(color);
    ctx.beginPath();
    ctx.arc(c, c, R * 0.55, 0, TAU);
    ctx.fill();
  },
  iceCrystal(ctx, c, R, color) {
    const d = (s, fill) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(c, c - R * s);
      ctx.lineTo(c + R * s * 0.55, c);
      ctx.lineTo(c, c + R * s);
      ctx.lineTo(c - R * s * 0.55, c);
      ctx.closePath();
      ctx.fill();
    };
    d(1, hex(color, 0.9));
    d(0.45, '#ffffff');
  },
  pebble(ctx, c, R, color) {
    ctx.fillStyle = hex(color);
    lumpy(ctx, c, c, R, 10, 0.86);
    ctx.fill();
    ctx.save();
    ctx.clip();
    shade(ctx, c, c, R, 0.5);
    ctx.restore();
  },
  smallRock(ctx, c, R, color) {
    ctx.fillStyle = hex(color);
    lumpy(ctx, c, c, R, 11, 0.74);
    ctx.fill();
    ctx.save();
    ctx.clip();
    craters(ctx, c, c, R, color, 4);
    shade(ctx, c, c, R, 0.5);
    ctx.restore();
  },
  asteroid(ctx, c, R, color) {
    ctx.fillStyle = hex(color);
    lumpy(ctx, c, c, R, 13, 0.7);
    ctx.fill();
    ctx.save();
    ctx.clip();
    craters(ctx, c, c, R, color, 7);
    shade(ctx, c, c, R, 0.6);
    ctx.restore();
  },
  moon(ctx, c, R, color) {
    sphere(ctx, c, c, R, color, 0.25, 0.5);
    clipCircle(ctx, c, c, R, () => craters(ctx, c, c, R, color, 12));
    shade(ctx, c, c, R, 0.5);
  },
  dwarfPlanet(ctx, c, R, color) {
    sphere(ctx, c, c, R, color, 0.2, 0.5);
    clipCircle(ctx, c, c, R, () => {
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = hex(darken(color, rand(0.1, 0.3)), 0.5);
        ctx.beginPath();
        ctx.ellipse(c + rand(-R, R) * 0.6, c + rand(-R, R) * 0.6, R * rand(0.2, 0.45), R * rand(0.1, 0.3), rand(0, 3), 0, TAU);
        ctx.fill();
      }
      craters(ctx, c, c, R, color, 5);
    });
    shade(ctx, c, c, R, 0.5);
  },
  rockyPlanet(ctx, c, R, color) {
    sphere(ctx, c, c, R, color, 0.2, 0.4);
    clipCircle(ctx, c, c, R, () => {
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = hex(darken(color, rand(0.2, 0.45)), 0.6);
        ctx.beginPath();
        ctx.ellipse(c + rand(-R, R) * 0.7, c + rand(-R, R) * 0.7, R * rand(0.15, 0.4), R * rand(0.1, 0.3), rand(0, 3), 0, TAU);
        ctx.fill();
      }
    });
    shade(ctx, c, c, R, 0.55);
    ctx.strokeStyle = hex(lighten(color, 0.5), 0.35);
    ctx.lineWidth = R * 0.05;
    ctx.beginPath();
    ctx.arc(c, c, R * 0.98, 0, TAU);
    ctx.stroke();
  },
  gasGiant(ctx, cx, cy, R, color) {
    const ringColor = hex(lighten(color, 0.3), 0.55);
    ringEllipse(ctx, cx, cy, R * 1.75, R * 0.42, ringColor, R * 0.12, 'back');
    bands(ctx, cx, cy, R, [color, lighten(color, 0.25), darken(color, 0.15), lighten(color, 0.4), darken(color, 0.25)], 11);
    shade(ctx, cx, cy, R, 0.55);
    ringEllipse(ctx, cx, cy, R * 1.75, R * 0.42, ringColor, R * 0.12, 'front');
    ringEllipse(ctx, cx, cy, R * 1.5, R * 0.36, hex(lighten(color, 0.1), 0.35), R * 0.05, 'front');
  },
  comet(ctx, cx, cy, R, color) {
    // Tail points to the left (−x); the sprite is rotated to face its velocity.
    const len = R * 5;
    const g = ctx.createLinearGradient(cx, cy, cx - len, cy);
    g.addColorStop(0, hex(color, 0.6));
    g.addColorStop(1, hex(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx, cy - R * 0.7);
    ctx.quadraticCurveTo(cx - len * 0.5, cy - R * 0.9, cx - len, cy);
    ctx.quadraticCurveTo(cx - len * 0.5, cy + R * 0.9, cx, cy + R * 0.7);
    ctx.closePath();
    ctx.fill();
    glow(ctx, cx, cy, 0, R, color, 0.8);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.35, 0, TAU);
    ctx.fill();
  },
  satellite(ctx, cx, cy, R, color) {
    const panel = (x) => {
      ctx.fillStyle = '#2f4a6e';
      ctx.fillRect(x, cy - R * 0.28, R * 0.62, R * 0.56);
      ctx.strokeStyle = 'rgba(159,199,255,0.6)';
      ctx.lineWidth = Math.max(1, R * 0.03);
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + (R * 0.62 * i) / 4, cy - R * 0.28);
        ctx.lineTo(x + (R * 0.62 * i) / 4, cy + R * 0.28);
        ctx.stroke();
      }
      ctx.strokeRect(x, cy - R * 0.28, R * 0.62, R * 0.56);
    };
    ctx.fillStyle = hex(color);
    ctx.fillRect(cx - R * 0.4, cy - R * 0.05, R * 0.8, R * 0.1);
    panel(cx - R);
    panel(cx + R * 0.38);
    ctx.fillStyle = hex(color);
    ctx.fillRect(cx - R * 0.26, cy - R * 0.3, R * 0.52, R * 0.6);
    ctx.fillStyle = hex(0xff9a4d, 0.9); // gold foil
    ctx.fillRect(cx - R * 0.2, cy - R * 0.22, R * 0.4, R * 0.44);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy - R * 0.42, R * 0.1, 0, TAU);
    ctx.fill();
  },
  star(ctx, c, R, color) {
    starBody(ctx, c, c, R, color);
  },
  starCluster(ctx, c, R, color) {
    glow(ctx, c, c, 0, R, color, 0.25);
    for (let i = 0; i < 18; i++) {
      const a = rand(0, TAU);
      const d = Math.abs(rand(-1, 1) * rand(0, 1)) * R * 0.8;
      const x = c + Math.cos(a) * d;
      const y = c + Math.sin(a) * d;
      const sr = R * rand(0.04, 0.1);
      glow(ctx, x, y, 0, sr * 3, lighten(color, 0.3), 0.6);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, sr, 0, TAU);
      ctx.fill();
    }
  },
  rival(ctx, cx, cy, R, color) {
    // Violet tilted disk behind, black disc, bright ring, front of disk.
    const disk = (half) => {
      for (let i = 0; i < 6; i++) {
        const f = 1.2 + i * 0.2;
        ringEllipse(ctx, cx, cy, R * f, R * f * 0.34, hex(color, 0.5 - i * 0.07), R * 0.22, half);
      }
    };
    glow(ctx, cx, cy, R, R * 2.4, color, 0.25);
    disk('back');
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hex(lighten(color, 0.5));
    ctx.lineWidth = R * 0.07;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.stroke();
    disk('front');
  },
  earth(ctx, c, R) {
    sphere(ctx, c, c, R, 0x2f6fc4, 0.2, 0.35);
    clipCircle(ctx, c, c, R, () => {
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = hex(Math.random() < 0.6 ? 0x4f8a3e : 0x9b7a55, 0.95);
        lumpy(ctx, c + rand(-R, R) * 0.75, c + rand(-R, R) * 0.75, R * rand(0.18, 0.38), 9, 0.6);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(c, c - R * 0.95, R * 0.6, R * 0.15, 0, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 10; i++) {
        ctx.strokeStyle = `rgba(255,255,255,${rand(0.15, 0.35)})`;
        ctx.lineWidth = R * rand(0.015, 0.035);
        ctx.beginPath();
        const x = c + rand(-R, R) * 0.8;
        const y = c + rand(-R, R) * 0.8;
        ctx.arc(x, y, R * rand(0.15, 0.4), rand(0, TAU), rand(0, TAU) + 1);
        ctx.stroke();
      }
    });
    shade(ctx, c, c, R, 0.6);
    glow(ctx, c, c, R * 0.95, R * 1.12, 0x7fb4ff, 0.5);
  },
  venus(ctx, c, R, color) {
    sphere(ctx, c, c, R, color, 0.25, 0.4);
    bands(ctx, c, c, R, [color, lighten(color, 0.15), darken(color, 0.08)], 7);
    shade(ctx, c, c, R, 0.5);
  },
  mars(ctx, c, R, color) {
    DRAW.rockyPlanet(ctx, c, R, color);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(c, c - R * 0.9, R * 0.35, R * 0.12, 0, 0, TAU);
    ctx.fill();
  },
  saturn(ctx, cx, cy, R, color) {
    const ringColor = hex(lighten(color, 0.15), 0.75);
    ringEllipse(ctx, cx, cy, R * 2.0, R * 0.5, ringColor, R * 0.22, 'back');
    bands(ctx, cx, cy, R, [color, lighten(color, 0.2), darken(color, 0.1)], 9);
    shade(ctx, cx, cy, R, 0.5);
    ringEllipse(ctx, cx, cy, R * 2.0, R * 0.5, ringColor, R * 0.22, 'front');
    ringEllipse(ctx, cx, cy, R * 1.62, R * 0.4, hex(darken(color, 0.1), 0.6), R * 0.08, 'front');
  },
  uranus(ctx, c, R, color) {
    sphere(ctx, c, c, R, color, 0.25, 0.4);
    shade(ctx, c, c, R, 0.45);
  },
  neptune(ctx, c, R, color) {
    sphere(ctx, c, c, R, color, 0.25, 0.45);
    bands(ctx, c, c, R, [color, lighten(color, 0.1), darken(color, 0.1)], 6);
    ctx.fillStyle = hex(darken(color, 0.45), 0.8);
    ctx.beginPath();
    ctx.ellipse(c - R * 0.2, c + R * 0.15, R * 0.22, R * 0.12, 0, 0, TAU);
    ctx.fill();
    shade(ctx, c, c, R, 0.5);
  },
};

// Texture layout per object type: how much room around the body (glows, rings, tails).
function layoutFor(type, def) {
  const R = def.texRadius;
  const pad = 2;
  if (type === 'comet') {
    const w = R * 6 + pad * 2;
    const h = R * 2 + pad * 2;
    return { w, h, cx: w - R - pad, cy: h / 2 };
  }
  if (type === 'satellite') {
    const s = R * 2 + pad * 2;
    return { w: s, h: s, cx: s / 2, cy: s / 2 };
  }
  if (type === 'gasGiant' || type === 'saturn') {
    const k = type === 'saturn' ? 2.15 : 1.9;
    const w = R * 2 * k + pad * 2;
    const h = R * 2 + pad * 2;
    return { w, h, cx: w / 2, cy: h / 2 };
  }
  if (type === 'rival') {
    const s = R * 2 * 2.45 + pad * 2;
    return { w: s, h: s, cx: s / 2, cy: s / 2 };
  }
  if (def.glow || type === 'earth') {
    const k = def.glow ? 1.85 : 1.15;
    const s = R * 2 * k + pad * 2;
    return { w: s, h: s, cx: s / 2, cy: s / 2 };
  }
  const s = R * 2 + pad * 2;
  return { w: s, h: s, cx: s / 2, cy: s / 2 };
}

function drawerFor(type, def) {
  if (DRAW[type]) return DRAW[type];
  if (def.glow) return DRAW.star;
  if (type === 'theMoon' || type === 'mercury') return DRAW.moon;
  return DRAW.rockyPlanet;
}

export function objectTextureKey(type) {
  const def = OBJECTS[type];
  return `obj-${def.textureOf || type}`;
}

function createObjectTextures(scene) {
  for (const [type, def] of Object.entries(OBJECTS)) {
    if (def.textureOf) continue;
    const key = `obj-${type}`;
    const L = layoutFor(type, def);
    const draw = drawerFor(type, def);
    const wide = type === 'comet' || type === 'gasGiant' || type === 'saturn' || type === 'satellite' || type === 'rival';
    canvasTexture(
      scene,
      key,
      L.w,
      L.h,
      (ctx) => {
        if (wide) draw(ctx, L.cx, L.cy, def.texRadius, def.color);
        else draw(ctx, L.cx, def.texRadius, def.color);
      },
      { bodyRadius: def.texRadius, originX: L.cx / L.w, originY: L.cy / L.h },
    );
  }
}

// ---- Shared effect textures ----

function createEffectTextures(scene) {
  canvasTexture(scene, 'spark', 32, 32, (ctx) => glow(ctx, 16, 16, 0, 16, 0xffffff, 1), { bodyRadius: 16, originX: 0.5, originY: 0.5 });

  canvasTexture(scene, 'glow', 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }, { bodyRadius: 128, originX: 0.5, originY: 0.5 });

  canvasTexture(scene, 'ring', 256, 256, (ctx) => {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(128, 128, 124, 0, TAU);
    ctx.stroke();
  }, { bodyRadius: 124, originX: 0.5, originY: 0.5 });

  canvasTexture(scene, 'shockwave', 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 90, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }, { bodyRadius: 128, originX: 0.5, originY: 0.5 });

  // Accretion disk seen from above (squashed by the sprite for the tilted look).
  // Drawn so 1 black hole radius = 100 px.
  const S = 100;
  const outer = DISK.outerRadius * S;
  const inner = DISK.innerRadius * S;
  const size = Math.ceil(outer * 2 + 4);
  const c = size / 2;
  const diskGradient = (ctx) => {
    const g = ctx.createRadialGradient(c, c, inner, c, c, outer);
    g.addColorStop(0, 'rgba(255,240,214,0.95)');
    g.addColorStop(0.12, 'rgba(255,190,120,0.9)');
    g.addColorStop(0.35, 'rgba(255,154,77,0.6)');
    g.addColorStop(0.7, 'rgba(214,90,40,0.22)');
    g.addColorStop(1, 'rgba(160,60,90,0)');
    return g;
  };
  const ringPath = (ctx) => {
    ctx.beginPath();
    ctx.arc(c, c, outer, 0, TAU);
    ctx.arc(c, c, inner, 0, TAU, true);
  };
  canvasTexture(scene, 'disk', size, size, (ctx) => {
    ctx.fillStyle = diskGradient(ctx);
    ringPath(ctx);
    ctx.fill('evenodd');
    // Streaks so the rotation is visible.
    for (let i = 0; i < 160; i++) {
      const r = rand(inner, outer * 0.92);
      const a = rand(0, TAU);
      const len = rand(0.2, 0.9);
      const heat = 1 - (r - inner) / (outer - inner);
      ctx.strokeStyle = `rgba(255,${Math.round(150 + heat * 90)},${Math.round(80 + heat * 120)},${rand(0.05, 0.3) * (0.4 + heat)})`;
      ctx.lineWidth = rand(1, 4);
      ctx.beginPath();
      ctx.arc(c, c, r, a, a + len);
      ctx.stroke();
    }
  }, { bodyRadius: S, originX: 0.5, originY: 0.5 });

  // The near half of the disk, drawn over the black disc.
  canvasTexture(scene, 'diskFront', size, size, (ctx) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, c, size, c);
    ctx.clip();
    ctx.fillStyle = diskGradient(ctx);
    ringPath(ctx);
    ctx.fill('evenodd');
    ctx.restore();
  }, { bodyRadius: S, originX: 0.5, originY: 0.5 });
}

export function createTextures(scene) {
  createObjectTextures(scene);
  createEffectTextures(scene);
}
