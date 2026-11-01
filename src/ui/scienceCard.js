// Science card: title, a short real fact, a diagram, close. Uses science blue (DESIGN.md).

import { layer, el, on } from './dom.js';
import { getCard } from '../data/scienceCards.js';
import { audio } from '../systems/audio.js';

const B = '#9FC7FF';
const M = '#8A8F98';
const A = '#E8B996';
const text = (x, y, s, c = B, anchor = 'start') =>
  `<text x="${x}" y="${y}" fill="${c}" font-family="Space Mono, monospace" font-size="10" font-weight="700" letter-spacing="0.8" text-anchor="${anchor}">${s}</text>`;

// Diagrams in a 320×160 box.
const ART = {
  collapse: `
    <circle cx="70" cy="80" r="44" fill="none" stroke="${A}" stroke-dasharray="3 4"/>
    <circle cx="70" cy="80" r="20" fill="none" stroke="${A}"/>
    ${text(70, 140, 'DYING STAR', A, 'middle')}
    <path d="M128 80h56M176 74l8 6-8 6" stroke="${M}" fill="none"/>
    ${text(156, 70, 'COLLAPSE', M, 'middle')}
    <circle cx="250" cy="80" r="22" fill="#000" stroke="${B}" stroke-width="1.5"/>
    <circle cx="250" cy="80" r="38" fill="none" stroke="${B}" stroke-dasharray="1 4"/>
    ${text(250, 140, 'BLACK HOLE', B, 'middle')}
    <path d="M226 40l12 14M280 36l-10 16M296 100l-16-6" stroke="${B}" stroke-width="1" opacity="0.6"/>`,
  horizon: `
    <circle cx="160" cy="80" r="30" fill="#000" stroke="${B}" stroke-width="1.5"/>
    <circle cx="160" cy="80" r="58" fill="none" stroke="${B}" stroke-dasharray="3 4"/>
    ${text(160, 22, 'EVENT HORIZON', B, 'middle')}
    <path d="M30 120c40-10 70-20 100-34" stroke="${A}" fill="none"/>
    <path d="M30 50c40 5 60 10 76 18" stroke="${A}" fill="none"/>
    <path d="M100 66l8 3-6 6" stroke="${A}" fill="none"/>
    ${text(20, 140, 'LIGHT: TRAPPED', A)}
    <path d="M290 40c-30 10-50 20-70 30" stroke="${M}" fill="none" stroke-dasharray="2 3"/>
    ${text(300, 140, 'NO RETURN', M, 'end')}`,
  spaghetti: `
    <circle cx="60" cy="80" r="18" fill="none" stroke="${M}" stroke-dasharray="2 3"/>
    ${text(36, 120, 'STAR', A)}
    <path d="M78 80c40-8 120-4 170 0c-50 4-130 8-170 0z" fill="none" stroke="${B}" stroke-width="1.2"/>
    ${text(130, 64, 'TIDAL STRETCH', B, 'middle')}
    <path d="M190 30v100" stroke="${M}" stroke-dasharray="2 3"/>
    ${text(196, 40, 'TIDAL LIMIT', M)}
    <circle cx="270" cy="80" r="24" fill="#000" stroke="${B}" stroke-width="1.5"/>
    <circle cx="270" cy="80" r="32" fill="none" stroke="${B}" stroke-dasharray="1 3"/>`,
  hawking: `
    <circle cx="160" cy="80" r="34" fill="#000" stroke="${B}" stroke-width="1.5"/>
    <g stroke="${A}" stroke-width="1" fill="none" opacity="0.9">
      <path d="M160 36v-14M160 124v14M116 80h-14M204 80h14M128 48l-10-10M192 112l10 10M192 48l10-10M128 112l-10 10"/>
    </g>
    ${text(160, 154, 'FAINT GLOW · SLOW MASS LOSS', A, 'middle')}
    ${text(160, 16, 'QUANTUM EFFECTS AT THE HORIZON', B, 'middle')}`,
  sgra: `
    <ellipse cx="160" cy="80" rx="120" ry="36" fill="none" stroke="${M}" stroke-dasharray="2 4"/>
    <ellipse cx="160" cy="80" rx="80" ry="22" fill="none" stroke="${M}" stroke-dasharray="2 4"/>
    <circle cx="160" cy="80" r="16" fill="#000" stroke="${A}" stroke-width="2"/>
    <circle cx="160" cy="80" r="22" fill="none" stroke="${A}" opacity="0.5"/>
    ${text(160, 30, 'SAGITTARIUS A*', B, 'middle')}
    <circle cx="262" cy="94" r="3" fill="${B}"/>
    ${text(262, 116, 'SUN · 27,000 LY', B, 'middle')}
    ${text(160, 146, '≈ 4 MILLION SOLAR MASSES', A, 'middle')}`,
};

/** Show a science card over everything. */
export function showScienceCard(id, onClose) {
  const c = getCard(id);
  if (!c) {
    onClose?.();
    return;
  }
  audio.chime();
  const node = el(`<div class="modal-backdrop solid fade-in" style="z-index:5;justify-content:center">
    <div class="science-card">
      <div class="top"><span class="kicker"><i class="dot"></i>Science log · ${String(c.id).padStart(2, '0')}</span><button class="label science" data-act="close">[ × ]</button></div>
      <h2>${c.title}</h2>
      <div class="subtitle">${c.subtitle}</div>
      <div class="art"><svg viewBox="0 0 320 160">${ART[c.art] ?? ''}</svg></div>
      <p>${c.body}</p>
      <div class="tags">${c.tags.map((t) => `<span>${t}</span>`).join('')}</div>
      <button class="close" data-act="close">[ Close log ]</button>
    </div>
  </div>`);
  layer('modal').appendChild(node);
  on(node, {
    '[data-act=close]': () => {
      node.remove();
      onClose?.();
    },
  });
}
