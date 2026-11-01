// HTML UI layered over the Phaser canvas. The overlay is laid out at a 390 px phone
// width (like the design mockups) and scaled to exactly cover the canvas, so menus look
// the same on a phone and letterboxed on desktop.

import { audio } from '../systems/audio.js';

export const UI_WIDTH = 390;
let game = null;
let root = null;
let inner = null;
const layers = {};

export function initUI(phaserGame) {
  game = phaserGame;
  root = document.getElementById('ui');
  inner = document.createElement('div');
  inner.className = 'ui-inner';
  root.appendChild(inner);
  for (const name of ['screen', 'hud', 'modal', 'toast']) {
    const el = document.createElement('div');
    el.className = `ui-layer ui-${name}`;
    inner.appendChild(el);
    layers[name] = el;
  }
  const sync = () => {
    if (!game.canvas) return;
    const r = game.canvas.getBoundingClientRect();
    if (!r.width) return;
    const s = r.width / UI_WIDTH;
    root.style.left = `${r.left}px`;
    root.style.top = `${r.top}px`;
    root.style.width = `${r.width}px`;
    root.style.height = `${r.height}px`;
    inner.style.width = `${UI_WIDTH}px`;
    inner.style.height = `${r.height / s}px`;
    inner.style.transform = `scale(${s})`;
  };
  game.scale.on('resize', () => requestAnimationFrame(sync));
  window.addEventListener('resize', () => requestAnimationFrame(sync));
  window.addEventListener('orientationchange', () => setTimeout(sync, 300));
  sync();
  setTimeout(sync, 100);
  setTimeout(sync, 500);

  // Every tap on a button plays a click (and unlocks audio on the first tap).
  root.addEventListener('pointerdown', (e) => {
    audio.unlock();
    if (e.target.closest('button')) audio.click();
  });
}

export function layer(name) {
  return layers[name];
}

export function clear(name) {
  if (name) layers[name].replaceChildren();
  else Object.values(layers).forEach((l) => l.replaceChildren());
}

/** Create an element from an HTML string. */
export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** Replace a layer's contents with `html`; returns the new element. */
export function mount(name, html) {
  const node = typeof html === 'string' ? el(html) : html;
  layers[name].replaceChildren(node);
  return node;
}

/** Bind click handlers: { selector: fn } */
export function on(node, handlers) {
  for (const [sel, fn] of Object.entries(handlers)) {
    node.querySelectorAll(sel).forEach((b) =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        fn(e, b);
      }),
    );
  }
}

let toastTimer = null;
export function toast(text, ms = 2600) {
  const t = mount('toast', `<div class="toast">${text}</div>`);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => {
    if (t.isConnected && t.classList.contains('out')) t.remove();
  }, ms + 400);
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
