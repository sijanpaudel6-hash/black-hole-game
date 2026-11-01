// "Choose a power" screen shown at every era change in a run (pick 1 of 3).

import { mount, on } from './dom.js';
import { ICONS } from './icons.js';
import { POWERS_BY_ID, SYNERGIES } from '../data/powers.js';
import { POWERS } from '../config.js';

/**
 * @param {object} p
 * @param {object} p.era the era just entered
 * @param {{id:string, level:number, synergy:object|null}[]} p.choices
 * @param {{id:string, level:number}[]} p.owned
 * @param {string[]} p.synergies active synergy ids
 * @param {(id:string) => void} p.onPick
 */
export function renderPowerPick(p) {
  const cards = p.choices
    .map((c) => {
      const def = POWERS_BY_ID[c.id];
      const isNew = c.level === 1;
      const pips = Array.from({ length: POWERS.maxLevel }, (_, i) => `<i class="${i < c.level ? 'on' : ''}"></i>`).join('');
      // Synergy hint: completes one now, or names what it pairs with.
      let syn = '';
      if (c.synergy) syn = `<div class="pc-syn now">${ICONS[c.synergy.id]} Completes ${c.synergy.name}</div>`;
      else if (isNew) {
        const pairs = SYNERGIES.filter((s) => s.needs.includes(c.id) && !p.synergies.includes(s.id));
        if (pairs.length) {
          syn = `<div class="pc-syn">${pairs.map((s) => `+ ${POWERS_BY_ID[s.needs.find((n) => n !== c.id)].name} → ${s.name}`).join('<br>')}</div>`;
        }
      }
      return `<button class="power-card ${c.synergy ? 'syn' : ''}" data-pick="${c.id}">
        <div class="pc-icon">${ICONS[c.id]}</div>
        <div class="pc-body">
          <div class="pc-top"><span class="pc-name">${def.name}</span><span class="label ${isNew ? 'amber' : 'science'}">${isNew ? 'New' : `Level ${c.level}`}</span></div>
          <div class="pc-desc">${def.blurb}</div>
          <div class="pc-level"><span class="pips">${pips}</span><span class="label">${def.levels[c.level - 1]}</span></div>
          ${syn}
        </div>
      </button>`;
    })
    .join('');
  const owned = p.owned.length
    ? `<div class="pc-owned"><span class="label">Your powers</span>${p.owned.map((o) => `<span class="pc-chip">${ICONS[o.id]}<b>${o.level}</b></span>`).join('')}</div>`
    : '<div class="pc-owned"><span class="label">Powers combine: own two that pair up for a synergy</span></div>';
  const node = mount(
    'modal',
    `<div class="modal-backdrop fade-in power-pick">
      <div class="label science pp-kicker">Era ${p.era.id} · ${p.era.name}</div>
      <div class="display pp-title">Choose a power</div>
      <div class="power-cards">${cards}</div>
      ${owned}
    </div>`,
  );
  let picked = false;
  on(node, {
    '[data-pick]': (_e, b) => {
      if (picked) return;
      picked = true;
      b.classList.add('chosen');
      setTimeout(() => p.onPick(b.dataset.pick), 160);
    },
  });
}
