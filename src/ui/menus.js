// Title, level select, settings, science log and sandbox menus (HTML over the canvas).

import { mount, on, toast } from './dom.js';
import { ICONS } from './icons.js';
import { getSave, writeSave, resetSave } from '../systems/save.js';
import { getLevel, LEVEL_COUNT } from '../data/levels.js';
import { SCIENCE_CARDS } from '../data/scienceCards.js';
import { SCENARIOS } from '../data/scenarios.js';
import { TIERS, RUN, SANDBOX_UNLOCK_LEVEL, SANDBOX_UNLOCK_ERA } from '../config.js';
import { massToKg, kgHtml, formatInt, formatTime } from '../systems/format.js';
import { universeNumber, dailyModifier, dailyRecord } from '../systems/daily.js';
import { bestTimes } from '../systems/leaderboard.js';
import { effects } from '../systems/economy.js';
import { showScienceCard } from './scienceCard.js';
import { audio } from '../systems/audio.js';
import * as flow from '../flow.js';

const pad2 = (n) => String(n).padStart(2, '0');

function stardustHtml() {
  return `<span class="stardust">✦ ${formatInt(getSave().stardust)}<small>SD</small></span>`;
}

export function sandboxUnlocked() {
  const save = getSave();
  return save.levelsCleared >= SANDBOX_UNLOCK_LEVEL || save.bestEra >= SANDBOX_UNLOCK_ERA;
}

/** Highest size tier the player has reached, in Classic or in a run (eras use the same scales). */
export function highestTierUnlocked() {
  const save = getSave();
  const next = Math.min(LEVEL_COUNT, save.levelsCleared + 1);
  return Math.max(getLevel(next).tier.id, save.bestEra);
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

export function renderTitle() {
  const unlocked = sandboxUnlocked();
  const save = getSave();
  const best = save.bestEra ? RUN.eras[save.bestEra - 1] : null;
  const daily = dailyRecord();
  const times = bestTimes();
  const node = mount(
    'screen',
    `<div class="screen title-screen fade-in">
      <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
      <div class="title-top">
        ${stardustHtml()}
        <span class="chip science"><i class="dot"></i>Singularity detected</span>
      </div>
      <svg class="title-art" viewBox="0 0 260 260" aria-hidden="true">
        <circle cx="130" cy="130" r="118" fill="none" stroke="#2A2F3A"/>
        <circle cx="130" cy="130" r="128" fill="none" stroke="#2A2F3A" stroke-dasharray="1 6"/>
        <path d="M130 0v10M130 250v10M0 130h10M250 130h10" stroke="#8A8F98"/>
      </svg>
      <div class="title-kicker">— Deep space survey —</div>
      <div class="title-name">Black Hole<span class="sub">Event Horizon</span></div>
      <div class="title-actions">
        <button class="btn-primary" data-act="play">Play ${ICONS.play}</button>
        <div class="title-modes">
          <button class="btn-secondary mode-btn" data-act="daily">${ICONS.calendar}<span><b>Daily Universe #${universeNumber()}</b><small>${daily.attempts ? `Played · best era ${daily.best?.era ?? '–'}` : dailyModifier().name}</small></span></button>
          <button class="btn-secondary mode-btn" data-act="challenge">${ICONS.timer}<span><b>Milky Way challenge</b><small>${times.length ? `Best ${formatTime(times[0].seconds)}` : 'Beat 10:00'}</small></span></button>
        </div>
        <div class="label best-run">${best ? `Best run · Era ${best.id} ${best.name}${save.runsCompleted ? ` · ${save.runsCompleted}× the last light` : ''}` : 'One life · five eras · from the dawn of time to its end'}</div>
        <div class="title-links">
          <button class="btn-text" data-act="classic">[ Classic ]</button>
          <span class="sep"></span>
          <button class="btn-text" data-act="sandbox" ${unlocked ? '' : 'disabled'}>[ Sandbox${unlocked ? '' : ' · locked'} ]</button>
        </div>
        <div class="title-links" style="margin-top:0">
          <button class="btn-text" data-act="shop">[ Upgrades ]</button>
          <span class="sep"></span>
          <button class="btn-text" data-act="settings">[ Settings ]</button>
        </div>
      </div>
    </div>`,
  );
  on(node, {
    '[data-act=play]': () => flow.startRun(),
    '[data-act=daily]': () => flow.startRun({ daily: true }),
    '[data-act=challenge]': () => flow.startRun({ challenge: true }),
    '[data-act=classic]': () => flow.goMenu('levels'),
    '[data-act=shop]': () => flow.goShop({ from: 'title' }),
    '[data-act=sandbox]': () => (unlocked ? flow.goMenu('sandbox') : toast(`Reach ${RUN.eras[SANDBOX_UNLOCK_ERA - 1].name} in a run to unlock Sandbox`)),
    '[data-act=settings]': () => flow.goMenu('settings', { from: 'title' }),
  });
}

// ---------------------------------------------------------------------------
// Level select (star chart)
// ---------------------------------------------------------------------------

export function renderLevelSelect(data = {}) {
  const save = getSave();
  const cleared = save.levelsCleared;
  const maxOpen = Math.min(LEVEL_COUNT, cleared + 1);
  let selected = data.selected ?? maxOpen;

  const tiersHtml = TIERS.slice()
    .reverse()
    .map((tier) => {
      const levels = [];
      for (let n = 1; n <= LEVEL_COUNT; n++) if (getLevel(n).tier.id === tier.id) levels.push(n);
      const done = levels.filter((n) => n <= cleared).length;
      const open = levels.some((n) => n <= maxOpen);
      const active = levels.includes(maxOpen) && done < 3;
      const status = !open ? '(Locked)' : active ? '<span class="amber">● (Active)</span>' : `(${done}/3 Cleared)`;
      const rows = levels
        .slice()
        .reverse()
        .map((n) => {
          const L = getLevel(n);
          const state = n <= cleared ? 'cleared' : n <= maxOpen ? 'open' : 'locked';
          return `<button class="level-row ${state}" data-level="${n}">
            <div class="left name"><b>Sector ${pad2(n)}</b><br>${L.name}</div>
            <div class="node">${state === 'locked' ? ICONS.lock : pad2(n)}</div>
            <div class="right">${state === 'locked' ? 'LOCKED<br>' : ''}${kgHtml(massToKg(L.target), 1)}${L.boss ? '<br><span class="amber">BOSS</span>' : ''}</div>
          </button>`;
        })
        .join('');
      return `<div class="tier-block ${active ? 'active' : ''}">
        <div class="tier-head"><div><span class="label">Tier ${pad2(tier.id)}</span><span class="name">${tier.name}</span></div><span class="label">${status}</span></div>
        ${rows}
      </div>`;
    })
    .join('');

  const node = mount(
    'screen',
    `<div class="screen levels-screen fade-in">
      <div class="topbar">
        <button class="back" data-act="back">${ICONS.back} Return</button>
        <span class="chip"><i class="dot science"></i>Classic · Star chart</span>
        <div style="text-align:right">${stardustHtml()}</div>
      </div>
      <div class="levels-scroll">${tiersHtml}</div>
      <div class="levels-footer">
        <div class="selected-info">
          <div><div class="label science">Selected target</div><div class="head sel-name"></div></div>
          <div style="text-align:right"><div class="label">Target mass · Time</div><div class="metric sel-target"></div></div>
        </div>
        <button class="btn-primary split" data-act="enter"><span>Enter event horizon</span>${ICONS.arrow}</button>
        <div class="title-links">
          <button class="btn-text" data-act="shop">[ Upgrades ]</button>
          <span class="sep"></span>
          <button class="btn-text" data-act="library">[ Science log ]</button>
        </div>
      </div>
    </div>`,
  );

  const refresh = () => {
    const L = getLevel(selected);
    node.querySelectorAll('.level-row').forEach((r) => r.classList.toggle('selected', +r.dataset.level === selected));
    node.querySelector('.sel-name').textContent = `Sector ${pad2(selected)} · ${L.name}`;
    node.querySelector('.sel-target').innerHTML = `${kgHtml(massToKg(L.target), 1)} · ${formatTime(effects.timeLimit())}`;
  };
  refresh();

  on(node, {
    '[data-act=back]': () => flow.goMenu('title'),
    '[data-act=enter]': () => flow.startLevel(selected),
    '[data-act=shop]': () => flow.goShop({ nextLevel: selected, from: 'levels' }),
    '[data-act=library]': () => flow.goMenu('library', { from: 'levels' }),
    '.level-row': (_e, b) => {
      const n = +b.dataset.level;
      if (n > maxOpen) {
        toast('Clear the previous sector first');
        return;
      }
      if (n === selected) flow.startLevel(n);
      selected = n;
      refresh();
    },
  });

  // Scroll so the selected level is in view.
  requestAnimationFrame(() => {
    const row = node.querySelector(`.level-row[data-level="${selected}"]`);
    row?.scrollIntoView({ block: 'center' });
  });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function settingsRowsHtml() {
  const s = getSave().settings;
  const row = (key, label, desc = '') =>
    `<button class="setting-row" data-setting="${key}"><div><div class="head">${label}</div>${desc ? `<div class="label">${desc}</div>` : ''}</div><span class="toggle ${s[key] ? 'on' : ''}"></span></button>`;
  return [
    row('music', 'Music'),
    row('sfx', 'Sound effects'),
    row('lowGraphics', 'Low graphics', 'Fewer effects, smoother on old phones'),
    row('autoRecord', 'Auto-record scenarios', 'Save a clip when a What if…? ends'),
  ].join('');
}

/** Toggle a setting and apply it right away. */
export function toggleSetting(key, button) {
  const s = getSave().settings;
  s[key] = !s[key];
  writeSave();
  button.querySelector('.toggle').classList.toggle('on', s[key]);
  if (key === 'music') audio.setMusic(s.music);
  if (key === 'sfx') audio.setSfx(s.sfx);
  flow.applySettings();
}

export function renderSettings(data = {}) {
  let confirmReset = false;
  const node = mount(
    'screen',
    `<div class="screen scroll fade-in">
      <div class="topbar"><button class="back" data-act="back">${ICONS.back} Return</button>${stardustHtml()}</div>
      <div class="display" style="margin:12px 0 8px">Settings</div>
      <div class="panel">
        ${settingsRowsHtml()}
        <div class="setting-row"><div class="head">Language</div><span class="label">English</span></div>
      </div>
      <div class="stack" style="margin-top:16px">
        <button class="btn-secondary" data-act="library">${ICONS.book} Science log</button>
        <button class="btn-text" data-act="reset" style="align-self:center">[ Reset progress ]</button>
      </div>
    </div>`,
  );
  on(node, {
    '[data-act=back]': () => flow.goMenu(data.from === 'levels' ? 'levels' : 'title'),
    '[data-setting]': (_e, b) => toggleSetting(b.dataset.setting, b),
    '[data-act=library]': () => flow.goMenu('library', { from: 'settings' }),
    '[data-act=reset]': (_e, b) => {
      if (!confirmReset) {
        confirmReset = true;
        b.textContent = '[ Tap again to erase all progress ]';
        b.classList.add('danger');
        return;
      }
      resetSave();
      toast('Progress reset');
      flow.applySettings();
      flow.goMenu('title');
    },
  });
}

// ---------------------------------------------------------------------------
// Science log
// ---------------------------------------------------------------------------

export function renderLibrary(data = {}) {
  const have = getSave().cards;
  const rows = SCIENCE_CARDS.map((c) => {
    const ok = have.includes(c.id);
    return `<button data-card="${c.id}" ${ok ? '' : 'disabled'}>
      <div><div class="label science">Science log · ${pad2(c.id)}</div><div class="head">${ok ? c.title : '???'}</div>${ok ? '' : `<div class="label">${c.id === 1 ? 'Finish a run' : `Reach ${RUN.eras[c.id - 1].name}`}</div>`}</div>
      ${ok ? ICONS.arrow : ICONS.lock}
    </button>`;
  }).join('');
  const node = mount(
    'screen',
    `<div class="screen scroll fade-in">
      <div class="topbar"><button class="back" data-act="back">${ICONS.back} Return</button>${stardustHtml()}</div>
      <div class="display" style="margin:12px 0 0">Science log</div>
      <div class="label">Real facts, unlocked as you grow</div>
      <div class="card-list">${rows}</div>
    </div>`,
  );
  on(node, {
    '[data-act=back]': () => flow.goMenu(data.from === 'settings' ? 'settings' : data.from === 'levels' ? 'levels' : 'title', { from: 'title' }),
    '[data-card]': (_e, b) => showScienceCard(+b.dataset.card),
  });
}

// ---------------------------------------------------------------------------
// Sandbox menu
// ---------------------------------------------------------------------------

export function renderSandboxMenu() {
  const maxTier = highestTierUnlocked();
  let tier = maxTier;
  const chips = TIERS.filter((t) => t.id <= maxTier)
    .map((t) => `<button data-tier="${t.id}">T${t.id} · ${t.name}</button>`)
    .join('');
  const scenarios = SCENARIOS.map(
    (s) => `<button class="scenario" data-scenario="${s.id}"><div><div class="head">${s.title}</div><div class="desc">${s.blurb}</div></div><span class="go">Play ${ICONS.arrow}</span></button>`,
  ).join('');
  const s = getSave().settings;
  const node = mount(
    'screen',
    `<div class="screen scroll fade-in">
      <div class="topbar"><button class="back" data-act="back">${ICONS.back} Return</button>${stardustHtml()}</div>
      <div class="display" style="margin:12px 0 0">Sandbox</div>
      <div class="label">No timer, no danger. Eat freely.</div>
      <div class="section-label label">Free play · starting size</div>
      <div class="tier-chips">${chips}</div>
      <button class="btn-primary" data-act="free">Free play ${ICONS.play}</button>
      <div class="section-label label">What if…? · clip-sized scenes</div>
      <div class="stack">
        <button class="scenario hometown-card" data-act="hometown"><div><div class="head">${ICONS.globe} Feed your hometown</div><div class="desc">Pick a city or country. Watch it get swallowed.</div></div><span class="go">Play ${ICONS.arrow}</span></button>
        ${scenarios}
      </div>
      <div class="panel" style="margin-top:16px">
        <button class="setting-row" data-setting="autoRecord"><div><div class="head">Auto-record scenarios</div><div class="label">Saves a 9:16 clip when the scene ends</div></div><span class="toggle ${s.autoRecord ? 'on' : ''}"></span></button>
      </div>
    </div>`,
  );
  const refresh = () => node.querySelectorAll('[data-tier]').forEach((b) => b.classList.toggle('on', +b.dataset.tier === tier));
  refresh();
  on(node, {
    '[data-act=back]': () => flow.goMenu('title'),
    '[data-tier]': (_e, b) => {
      tier = +b.dataset.tier;
      refresh();
    },
    '[data-act=free]': () => flow.startSandbox(tier),
    '[data-act=hometown]': () => flow.goMenu('hometown'),
    '[data-scenario]': (_e, b) => flow.startScenario(b.dataset.scenario),
    '[data-setting]': (_e, b) => toggleSetting(b.dataset.setting, b),
  });
}
