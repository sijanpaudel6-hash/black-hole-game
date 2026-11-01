// End-of-run share card: a Wordle-style text version (WhatsApp, X) and a 9:16 image version
// (Instagram, TikTok). Uses the phone's share menu when it can; otherwise copy / download.

import { RUN, SHARE, COLORS } from '../config.js';
import { ageText, kgText, formatTime } from './format.js';

const ROMAN = ['', 'I', 'II', 'III'];

/** The URL players are sent to (the page they're on, without any ?query). */
export function shareUrl() {
  if (SHARE.url) return SHARE.url;
  try {
    return `${window.location.origin}${window.location.pathname}`;
  } catch {
    return '';
  }
}

/** One emoji per era: reached ones show the era, the one you died in is a skull. */
export function eraStrip(r) {
  return RUN.eras
    .map((e, i) => {
      if (e.id < r.eraId) return SHARE.eraEmoji[i];
      if (e.id === r.eraId) return r.completed || r.challengeDone ? SHARE.eraEmoji[i] : SHARE.deathEmoji;
      return SHARE.emptyEmoji;
    })
    .join('');
}

function deedsLine(r) {
  const bits = [];
  if (r.civsEaten || r.civsSpared) {
    bits.push(`ate ${r.civsEaten} civilisation${r.civsEaten === 1 ? '' : 's'}, spared ${r.civsSpared}`);
  }
  if (r.quasars) bits.push(`became a quasar${r.quasars > 1 ? ` ×${r.quasars}` : ''}`);
  bits.push(`lived ${ageText(r.age)}`);
  const s = bits.join(', ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function title(r) {
  if (r.challenge) return r.challengeDone ? (r.milkyWayTime <= SHARE.challengeSeconds ? 'Milky Way eaten' : 'Milky Way eaten (slowly)') : 'Challenge failed';
  if (r.completed) return 'The last light';
  return r.reason === 'evaporated' ? 'Evaporated' : 'Swallowed';
}

/** Wordle-style text for messaging apps. */
export function shareText(r) {
  const lines = [];
  const head = r.universe ? `Daily Universe #${r.universe}` : r.challenge ? 'Milky Way Challenge' : 'One life of a black hole';
  lines.push(`🕳️ Black Hole: Event Horizon · ${head}`);
  if (r.modifier) lines.push(`Today: ${r.modifier}`);
  lines.push(eraStrip(r));
  lines.push(deedsLine(r));
  if (r.milkyWayTime) lines.push(`⏱ Ate the Milky Way in ${formatTime(r.milkyWayTime)}${r.milkyWayTime <= SHARE.challengeSeconds ? ' (under 10 min!)' : ''}`);
  if (r.powers?.length) lines.push(`Powers: ${r.powers.map((p) => `${p.name}${p.level > 1 ? ` ${ROMAN[p.level]}` : ''}`).join(', ')}`);
  const url = shareUrl();
  if (url) lines.push(url);
  return lines.join('\n');
}

// ---- Image ----

function rand(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawBlackHole(ctx, x, y, r) {
  // Glow, back of the disk, the shadow, the photon ring, front of the disk.
  const glow = ctx.createRadialGradient(x, y, r, x, y, r * 4);
  glow.addColorStop(0, 'rgba(255,154,77,0.35)');
  glow.addColorStop(1, 'rgba(255,154,77,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  const disk = (front) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.18);
    ctx.scale(1, 0.24);
    ctx.beginPath();
    if (front) ctx.rect(-r * 3, 0, r * 6, r * 3);
    else ctx.rect(-r * 3, -r * 3, r * 6, r * 3);
    ctx.clip();
    const g = ctx.createRadialGradient(0, 0, r * 1.08, 0, 0, r * 2.5);
    g.addColorStop(0, 'rgba(255,240,214,0.95)');
    g.addColorStop(0.3, 'rgba(255,154,77,0.7)');
    g.addColorStop(1, 'rgba(160,60,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
    ctx.arc(0, 0, r * 1.08, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();
  };
  disk(false);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.textCss;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  disk(true);
}

/** Draw the 1080×1920 card. @returns {HTMLCanvasElement} */
export function drawShareImage(r) {
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = COLORS.voidCss;
  ctx.fillRect(0, 0, W, H);
  const rng = rand(r.universe ?? Math.round(r.peakKg % 1e6));
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = rng() < 0.08 ? 'rgba(255,154,77,0.7)' : `rgba(237,234,228,${0.2 + rng() * 0.6})`;
    ctx.beginPath();
    ctx.arc(rng() * W, rng() * H, 0.6 + rng() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  const head = '"Barlow Condensed", "Arial Narrow", sans-serif';
  const mono = '"Space Mono", ui-monospace, monospace';
  const body = '"IBM Plex Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // Corner brackets
  ctx.strokeStyle = COLORS.hairlineCss;
  ctx.lineWidth = 3;
  for (const [x, y, dx, dy] of [[50, 50, 1, 1], [W - 50, 50, -1, 1], [50, H - 50, 1, -1], [W - 50, H - 50, -1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * 60);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * 60, y);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.amberCss;
  ctx.font = `600 46px ${head}`;
  ctx.fillText('BLACK HOLE: EVENT HORIZON', W / 2, 190);
  ctx.fillStyle = COLORS.scienceCss;
  ctx.font = `700 34px ${mono}`;
  const kicker = r.universe ? `DAILY UNIVERSE #${r.universe}` : r.challenge ? 'MILKY WAY CHALLENGE' : 'ONE LIFE OF A BLACK HOLE';
  ctx.fillText(kicker, W / 2, 250);
  if (r.modifier) {
    ctx.fillStyle = COLORS.textMutedCss;
    ctx.font = `400 28px ${mono}`;
    ctx.fillText(r.modifier.toUpperCase(), W / 2, 296);
  }
  ctx.fillStyle = COLORS.textCss;
  ctx.font = `600 132px ${head}`;
  ctx.fillText(title(r).toUpperCase(), W / 2, 450, W - 120);

  drawBlackHole(ctx, W / 2, 720, 120);

  // Era strip: five nodes on a line.
  const y = 1010;
  const x0 = 170;
  const step = (W - 340) / 4;
  ctx.strokeStyle = COLORS.hairlineCss;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + step * 4, y);
  ctx.stroke();
  RUN.eras.forEach((e, i) => {
    const x = x0 + step * i;
    const reached = e.id < r.eraId || (e.id === r.eraId && (r.completed || r.challengeDone));
    const died = e.id === r.eraId && !reached;
    ctx.fillStyle = reached ? COLORS.amberCss : died ? COLORS.dangerCss : COLORS.panelCss;
    ctx.strokeStyle = reached ? COLORS.amberCss : died ? COLORS.dangerCss : COLORS.hairlineCss;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (died) {
      ctx.strokeStyle = COLORS.voidCss;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x - 11, y - 11);
      ctx.lineTo(x + 11, y + 11);
      ctx.moveTo(x + 11, y - 11);
      ctx.lineTo(x - 11, y + 11);
      ctx.stroke();
      ctx.lineWidth = 4;
    }
    ctx.fillStyle = reached || died ? COLORS.textCss : COLORS.textMutedCss;
    ctx.font = `600 30px ${head}`;
    const words = e.name.toUpperCase().split(' ');
    words.forEach((w, k) => ctx.fillText(w, x, y + 72 + k * 32));
  });

  // Stats
  const rows = [
    ['LIVED UNTIL', ageText(r.age)],
    ['PEAK MASS', kgText(r.peakKg, 2)],
  ];
  if (r.civsEaten || r.civsSpared) rows.push(['CIVILISATIONS', `${r.civsEaten} eaten · ${r.civsSpared} spared`]);
  if (r.quasars) rows.push(['QUASAR', r.quasars > 1 ? `ignited ×${r.quasars}` : 'ignited']);
  if (r.milkyWayTime) rows.push(['MILKY WAY EATEN IN', formatTime(r.milkyWayTime)]);
  if (r.powers?.length) rows.push(['POWERS', r.powers.map((p) => `${p.name}${p.level > 1 ? ` ${ROMAN[p.level]}` : ''}`).join(' · ')]);
  let ry = 1230;
  ctx.textAlign = 'left';
  for (const [k, v] of rows) {
    ctx.fillStyle = COLORS.textMutedCss;
    ctx.font = `400 28px ${mono}`;
    ctx.fillText(k, 110, ry);
    ctx.fillStyle = k === 'PEAK MASS' ? COLORS.amberCss : COLORS.textCss;
    ctx.font = `500 38px ${body}`;
    ctx.fillText(v, 110, ry + 48, W - 220);
    ry += 112;
  }
  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.panelCss;
  ctx.strokeStyle = COLORS.hairlineCss;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect?.(110, H - 230, W - 220, 100, 50);
  if (!ctx.roundRect) ctx.rect(110, H - 230, W - 220, 100);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.amberCss;
  ctx.font = `600 44px ${head}`;
  ctx.fillText('PLAY FREE · ONE LIFE, FIVE ERAS', W / 2, H - 165);
  return c;
}

function canvasBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

function fileName(r) {
  return r.universe ? `black-hole-universe-${r.universe}.png` : 'black-hole-run.png';
}

/** Copy text to the clipboard (with an old-browser fallback). */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const t = document.createElement('textarea');
      t.value = text;
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand('copy');
      t.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Download the share image. */
export async function saveImage(r) {
  const blob = await canvasBlob(drawShareImage(r));
  if (!blob) return false;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName(r);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}

/**
 * Open the phone's share menu with the image and text. Falls back to text-only sharing,
 * then to copying the text. @returns {Promise<'shared'|'copied'|'cancelled'|'failed'>}
 */
export async function shareResult(r) {
  const text = shareText(r);
  try {
    if (navigator.share) {
      const blob = await canvasBlob(drawShareImage(r));
      const file = blob ? new File([blob], fileName(r), { type: 'image/png' }) : null;
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'Black Hole: Event Horizon' });
      } else {
        await navigator.share({ text, title: 'Black Hole: Event Horizon' });
      }
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }
  return (await copyText(text)) ? 'copied' : 'failed';
}
