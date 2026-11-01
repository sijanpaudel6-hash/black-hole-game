// Cosmic Craft screen (HTML over CraftScene): item tray, the two picks, and the result card.

import { mount, on, escapeHtml } from './dom.js';
import { ICONS } from './icons.js';
import { ITEMS } from '../data/recipes.js';
import { foundItems, craftProgress } from '../systems/craft.js';

/**
 * @param {object} o
 * @param {(id:string) => string} o.preview data URL of an item's icon
 * @param {(id:string) => void} o.onPick
 * @param {() => void} o.onClear
 * @param {() => void} o.onBack
 */
export function renderCraft(o) {
  const node = mount(
    'screen',
    `<div class="screen craft-screen fade-in">
      <div class="topbar">
        <button class="back" data-act="back">${ICONS.back} Sandbox</button>
        <span class="chip science"><i class="dot"></i>Cosmic Craft</span>
        <span class="label craft-count"></span>
      </div>
      <div class="craft-picks"><span class="pick-a label">Pick something</span><span class="pick-b label">…and something else</span></div>
      <div class="craft-result" style="display:none"></div>
      <div class="craft-tray-wrap">
        <div class="row craft-tray-head"><span class="label">Tap two to collide</span><button class="btn-text" data-act="clear">[ Clear ]</button></div>
        <div class="craft-tray"></div>
      </div>
    </div>`,
  );
  const tray = node.querySelector('.craft-tray');
  const result = node.querySelector('.craft-result');
  const previews = {};
  const icon = (id) => (previews[id] ??= o.preview(id));

  const refreshTray = () => {
    const p = craftProgress();
    node.querySelector('.craft-count').textContent = `Found ${p.found} / ${p.total}`;
    tray.innerHTML = foundItems()
      .map((id) => `<button class="craft-item" data-item="${id}"><img src="${icon(id)}" alt=""><span>${escapeHtml(ITEMS[id].name)}</span></button>`)
      .join('');
  };
  refreshTray();

  tray.addEventListener('click', (e) => {
    const b = e.target.closest('[data-item]');
    if (b) o.onPick(b.dataset.item);
  });
  on(node, {
    '[data-act=back]': o.onBack,
    '[data-act=clear]': () => {
      result.style.display = 'none';
      o.onClear();
    },
  });

  return {
    refreshTray,
    setSlots(slots) {
      node.querySelector('.pick-a').textContent = slots[0] ? ITEMS[slots[0]].name : 'Pick something';
      node.querySelector('.pick-b').textContent = slots[1] ? ITEMS[slots[1]].name : slots[0] ? '…and something else' : '';
      if (slots[0] && !slots[1]) result.style.display = 'none';
    },
    showResult(r, a, b) {
      result.style.display = '';
      if (!r) {
        result.className = 'craft-result none';
        result.innerHTML = `<div class="head">No reaction</div><p>${escapeHtml(ITEMS[a].name)} + ${escapeHtml(ITEMS[b].name)} doesn't make anything in real physics. Try another pair.</p>`;
        return;
      }
      result.className = `craft-result ${r.isNew ? 'new' : ''}`;
      result.innerHTML = `
        <div class="row"><span class="chip science"><i class="dot"></i>Real</span>${r.isNew ? '<span class="label amber">● New discovery</span>' : '<span class="label">Already found</span>'}</div>
        <div class="headline">${escapeHtml(ITEMS[r.result].name)}</div>
        <div class="label">${escapeHtml(ITEMS[a].name)} + ${escapeHtml(ITEMS[b].name)}</div>
        <p>${escapeHtml(r.why)}</p>`;
    },
  };
}
