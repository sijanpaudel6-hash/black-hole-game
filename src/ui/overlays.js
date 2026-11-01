// Pause menu, level complete / failed, scenario end (HTML modals over the game).

import { mount, on, clear } from './dom.js';
import { ICONS } from './icons.js';
import { kgHtml, formatInt, formatTimePrecise, ageText } from '../systems/format.js';
import { RUN } from '../config.js';
import { nextUpgradeGoal } from '../systems/economy.js';
import { settingsRowsHtml, toggleSetting } from './menus.js';

export function closeModal() {
  clear('modal');
}

export function renderPause({ title = 'Paused', onResume, onRestart, onQuit, quitLabel = 'Star chart' }) {
  const node = mount(
    'modal',
    `<div class="modal-backdrop fade-in">
      <div class="modal-card">
        <div class="display modal-title">${title}</div>
        <div class="stack">
          <button class="btn-primary" data-act="resume">Resume ${ICONS.play}</button>
          <button class="btn-secondary" data-act="restart">Restart</button>
          <button class="btn-secondary" data-act="quit">${quitLabel}</button>
        </div>
        <div class="divider"></div>
        ${settingsRowsHtml()}
      </div>
    </div>`,
  );
  on(node, {
    '[data-act=resume]': onResume,
    '[data-act=restart]': onRestart,
    '[data-act=quit]': onQuit,
    '[data-setting]': (_e, b) => toggleSetting(b.dataset.setting, b),
  });
}

function goalHtml() {
  const goal = nextUpgradeGoal();
  if (!goal) return '<div class="goal"><div class="row"><span class="label">All upgrades maxed</span></div></div>';
  const pct = Math.min(1, goal.have / goal.cost);
  const segs = Array.from({ length: 10 }, (_, i) => `<i class="${i < Math.floor(pct * 10) ? 'on' : ''}"></i>`).join('');
  return `<div class="goal">
    <div class="row"><span class="label">Next upgrade · ${goal.name}</span><span class="label science">${formatInt(Math.min(goal.have, goal.cost))} / ${formatInt(goal.cost)} SD</span></div>
    <div class="meter">${segs}</div>
  </div>`;
}

/**
 * @param {object} p
 * @param {object} p.level getLevel() info
 * @param {object} p.stats { gainedKg, objects, time, biggest }
 * @param {object} p.reward { total, daily }
 * @param {boolean} p.canDouble
 */
export function renderLevelComplete(p) {
  const finale = p.level.boss;
  const node = mount(
    'modal',
    `<div class="modal-backdrop solid fade-in">
      <div class="screen end-screen" style="position:relative;min-height:100%">
        <span class="chip end-chip"><i class="dot"></i>${finale ? 'Game complete' : 'Level complete'}</span>
        <div class="end-rule"><i></i><b></b><i></i></div>
        <div class="display end-title">${finale ? 'Merged with Sgr A*' : p.level.winTitle}</div>
        <div class="label end-sub">${finale ? 'From dust to galaxy-eater' : `Sector ${String(p.level.number).padStart(2, '0')} · ${p.level.name}`}</div>
        <div class="stats">
          <div class="row"><span class="label">Mass gained</span><span class="val amber">${kgHtml(p.stats.gainedKg, 3, { sign: '+' })}</span></div>
          <div class="row"><span class="label">Objects consumed</span><span class="val">${formatInt(p.stats.objects)} bodies</span></div>
          <div class="row"><span class="label">Time elapsed</span><span class="val">${formatTimePrecise(p.stats.time)}</span></div>
          <div class="row"><span class="label">Biggest meal</span><span class="val science">${p.stats.biggest || '—'}</span></div>
        </div>
        <div class="reward">
          <span>Stardust earned</span>
          <span class="big"><span class="spark">✦</span><span class="sd-amount">+${formatInt(p.reward.total)}</span></span>
        </div>
        ${p.reward.daily ? '<div class="label amber reward-note">First win today · ×2</div>' : ''}
        ${goalHtml()}
        <div class="end-actions">
          <button class="btn-primary split" data-act="next"><span>${finale ? 'Star chart' : 'Next level'}</span>${ICONS.arrow}</button>
          ${p.canDouble ? `<button class="btn-secondary" data-act="double">${ICONS.play} ×2 Stardust · Watch ad</button>` : ''}
          ${finale ? '' : '<button class="btn-text" data-act="levels" style="align-self:center">[ Star chart ]</button>'}
        </div>
      </div>
    </div>`,
  );
  on(node, {
    '[data-act=next]': p.onNext,
    '[data-act=levels]': p.onLevels,
    '[data-act=double]': (_e, b) => {
      b.disabled = true;
      p.onDouble((total) => {
        node.querySelector('.sd-amount').textContent = `+${formatInt(total)}`;
        b.remove();
      });
    },
  });
}

export function renderLevelFailed(p) {
  const node = mount(
    'modal',
    `<div class="modal-backdrop solid fade-in">
      <div class="screen end-screen" style="position:relative;min-height:100%">
        <span class="chip end-chip fail"><i class="dot"></i>Level failed</span>
        <div class="end-rule"><i></i><b></b><i></i></div>
        <div class="display end-title">${p.reason === 'eaten' ? 'Swallowed' : "Time's up"}</div>
        <div class="label end-sub">${p.reason === 'eaten' ? 'A bigger black hole ate you' : 'The target mass slipped away'}</div>
        <div class="stats">
          <div class="row"><span class="label">Reached</span><span class="val">${Math.floor(p.progress * 100)}% of target</span></div>
          <div class="row"><span class="label">Objects consumed</span><span class="val">${formatInt(p.objects)} bodies</span></div>
        </div>
        <div class="reward"><span>Stardust kept</span><span class="big"><span class="spark">✦</span>+${formatInt(p.kept)}</span></div>
        ${goalHtml()}
        <div class="end-actions">
          <button class="btn-primary split" data-act="retry"><span>Retry</span>${ICONS.arrow}</button>
          ${p.canRevive ? `<button class="btn-secondary" data-act="revive">${ICONS.play} Revive +30 s · Watch ad</button>` : ''}
          <div class="title-links">
            <button class="btn-text" data-act="shop">[ Upgrades ]</button>
            <span class="sep"></span>
            <button class="btn-text" data-act="levels">[ Star chart ]</button>
          </div>
        </div>
      </div>
    </div>`,
  );
  on(node, {
    '[data-act=retry]': p.onRetry,
    '[data-act=revive]': (_e, b) => {
      b.disabled = true;
      p.onRevive();
    },
    '[data-act=shop]': p.onShop,
    '[data-act=levels]': p.onLevels,
  });
}

export function renderScenarioEnd({ scenario, clipSaved, onReplay, onBack }) {
  const node = mount(
    'modal',
    `<div class="modal-backdrop fade-in">
      <div class="modal-card">
        <span class="chip science" style="margin-bottom:12px"><i class="dot"></i>What if…?</span>
        <div class="headline" style="margin:10px 0 4px">${scenario.title}</div>
        <div class="label amber" style="margin-bottom:12px">Suggested title: “${scenario.caption}”</div>
        <p style="margin:0 0 14px">${scenario.fact}</p>
        ${clipSaved ? '<div class="label science" style="margin-bottom:14px">Clip saved to your downloads</div>' : ''}
        <div class="stack">
          <button class="btn-primary" data-act="replay">Replay ${ICONS.play}</button>
          <button class="btn-secondary" data-act="back">Sandbox</button>
        </div>
      </div>
    </div>`,
  );
  on(node, { '[data-act=replay]': onReplay, '[data-act=back]': onBack });
}

/**
 * End of a run: completed (the last light) or died (evaporated / swallowed).
 * @param {object} p see RunController.finishRun / GameScene.showRunEnd
 */
export function renderRunEnd(p) {
  const title = p.completed ? 'The last light' : p.reason === 'evaporated' ? 'Evaporated' : 'Swallowed';
  const sub = p.completed
    ? 'You outlived every star in the universe'
    : p.reason === 'evaporated'
      ? 'Hawking radiation took the last of you'
      : p.killer
        ? `Eaten by ${p.killer}`
        : 'A bigger black hole ate you';
  const segs = RUN.eras.map((e) => `<i class="${e.id <= p.era.id ? 'on' : ''}"></i>`).join('');
  const node = mount(
    'modal',
    `<div class="modal-backdrop solid fade-in">
      <div class="screen end-screen" style="position:relative;min-height:100%">
        <span class="chip end-chip ${p.completed ? '' : 'fail'}"><i class="dot"></i>${p.completed ? 'Run complete' : 'Run over'}</span>
        <div class="end-rule"><i></i><b></b><i></i></div>
        <div class="display end-title">${title}</div>
        <div class="label end-sub">${sub}</div>
        <div class="stats">
          <div class="row"><span class="label">Reached</span><span class="val">Era ${p.era.id} · ${p.era.name}</span></div>
          <div class="row" style="display:block"><div class="meter" style="grid-template-columns:repeat(5,1fr)">${segs}</div></div>
          <div class="row"><span class="label">Lived until</span><span class="val science">${ageText(p.age)}</span></div>
          <div class="row"><span class="label">Peak mass</span><span class="val amber">${kgHtml(p.peakKg, 3)}</span></div>
          <div class="row"><span class="label">Objects consumed</span><span class="val">${formatInt(p.objects)} bodies</span></div>
          <div class="row"><span class="label">Run time</span><span class="val">${formatTimePrecise(p.time)}</span></div>
        </div>
        <div class="reward">
          <span>Stardust earned</span>
          <span class="big"><span class="spark">✦</span><span class="sd-amount">+${formatInt(p.reward.total)}</span></span>
        </div>
        ${p.reward.daily ? '<div class="label amber reward-note">First run today · ×2</div>' : ''}
        ${p.completed ? `<div class="label amber reward-note">Full life bonus · ×${RUN.completeBonus}</div>` : ''}
        ${goalHtml()}
        <div class="end-actions">
          <button class="btn-primary split" data-act="again"><span>New run</span>${ICONS.arrow}</button>
          ${p.canRevive ? `<button class="btn-secondary" data-act="revive">${ICONS.play} Revive · Watch ad</button>` : ''}
          ${p.canDouble ? `<button class="btn-secondary" data-act="double">${ICONS.play} ×2 Stardust · Watch ad</button>` : ''}
          <div class="title-links">
            <button class="btn-text" data-act="shop">[ Upgrades ]</button>
            <span class="sep"></span>
            <button class="btn-text" data-act="menu">[ Menu ]</button>
          </div>
        </div>
      </div>
    </div>`,
  );
  on(node, {
    '[data-act=again]': p.onAgain,
    '[data-act=shop]': p.onShop,
    '[data-act=menu]': p.onMenu,
    '[data-act=revive]': (_e, b) => {
      b.disabled = true;
      p.onRevive();
    },
    '[data-act=double]': (_e, b) => {
      b.disabled = true;
      p.onDouble((total) => {
        node.querySelector('.sd-amount').textContent = `+${formatInt(total)}`;
        b.remove();
      });
    },
  });
}
