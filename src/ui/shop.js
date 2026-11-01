// Upgrade shop ("Singularity calibration"): six upgrade cards with level, effect, cost.

import { mount, on, toast } from './dom.js';
import { ICONS } from './icons.js';
import { UPGRADES } from '../config.js';
import { getSave } from '../systems/save.js';
import { upgradeLevel, upgradeCost, isMaxed, buyUpgrade, freeUpgradeAvailable } from '../systems/economy.js';
import { formatInt } from '../systems/format.js';
import { showRewardedAd } from '../systems/ads.js';
import { audio } from '../systems/audio.js';

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * @param {object} p
 * @param {number} [p.nextLevel] level to launch from here
 * @param {() => void} p.onBack
 * @param {(n:number) => void} p.onLaunch
 */
export function renderShop(p) {
  let freeMode = false;

  const render = () => {
    const save = getSave();
    const cards = Object.entries(UPGRADES)
      .map(([id, u]) => {
        const lvl = upgradeLevel(id);
        const maxed = isMaxed(id);
        const cost = upgradeCost(id);
        const affordable = freeMode || save.stardust >= cost;
        const segs = Array.from({ length: u.maxLevel }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
        return `<div class="upgrade ${maxed ? 'maxed' : ''}">
          <div class="top">
            <div class="ico">${ICONS[id]}</div>
            <div>
              <div class="name"><span class="head">${u.name}</span><span class="lvl">LVL ${pad2(lvl)} / ${u.maxLevel}</span></div>
              <div class="desc">${u.effect}</div>
            </div>
            <div class="buy">
              ${
                maxed
                  ? '<span class="label science">Complete</span><button class="tune" disabled>Max</button>'
                  : `<span class="cost">${freeMode ? '<span class="science">FREE</span>' : `✦ ${formatInt(cost)} <small>SD</small>`}</span><button class="tune ${freeMode ? 'free' : ''}" data-buy="${id}" ${affordable ? '' : 'disabled'}>Tune</button>`
              }
            </div>
          </div>
          <div class="meter ${maxed ? 'max' : ''}">${segs}</div>
        </div>`;
      })
      .join('');
    const freeAvail = freeUpgradeAvailable();
    const node = mount(
      'screen',
      `<div class="screen scroll fade-in">
        <div class="topbar">
          <button class="back" data-act="back">${ICONS.back} Return</button>
          <span class="chip stardust">✦ ${formatInt(save.stardust)} <small>SD</small></span>
        </div>
        <div class="shop-title"><span class="display">Singularity calibration</span></div>
        ${cards}
        <div class="shop-footer">
          ${freeAvail ? `<button class="btn-secondary" data-act="free" ${freeMode ? 'disabled' : ''}>${ICONS.play} ${freeMode ? 'Pick a free upgrade' : 'Free upgrade · Watch ad'}</button>` : ''}
          ${p.nextLevel ? `<button class="btn-primary split" data-act="launch"><span>Launch sector ${pad2(p.nextLevel)}</span>${ICONS.arrow}</button>` : ''}
        </div>
      </div>`,
    );
    on(node, {
      '[data-act=back]': p.onBack,
      '[data-act=launch]': () => p.onLaunch(p.nextLevel),
      '[data-act=free]': () =>
        showRewardedAd(() => {
          freeMode = true;
          toast('Choose any upgrade: this one is free');
          render();
        }),
      '[data-buy]': (_e, b) => {
        const id = b.dataset.buy;
        if (buyUpgrade(id, freeMode)) {
          freeMode = false;
          audio.chime();
          render();
        }
      },
    });
  };
  render();
}
