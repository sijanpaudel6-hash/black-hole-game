// In-game HUD (HTML): mass + target bar and timer at the top, tier and buttons at the
// bottom, middle kept clear. While recording a clip everything is hidden except a small
// REC indicator (HTML, so it is NOT in the clip); the canvas draws the clip overlay.

import { mount, on } from './dom.js';
import { ICONS } from './icons.js';
import { kgHtml, formatTime, formatTimePrecise, ageHtml } from '../systems/format.js';
import { LEVEL, OBJECTS, TIERS, RUN, POWERS } from '../config.js';
import { POWERS_BY_ID, SYNERGIES } from '../data/powers.js';
import { recordingSupported } from '../systems/recorder.js';

export default class Hud {
  /**
   * @param {object} o
   * @param {'run'|'level'|'sandbox'|'scenario'} o.mode
   * @param {object} [o.level] getLevel() info (levels mode)
   * @param {object} o.handlers onPause, onRecord, onStopRecord, onSpawn(type), onTier(id)
   * @param {string[]} [o.spawnTypes] sandbox spawn menu
   * @param {number} [o.maxTier] sandbox
   * @param {number} [o.tier] sandbox current tier
   */
  constructor(o) {
    this.o = o;
    const { mode, level } = o;
    const canRecord = recordingSupported();
    const hasTarget = mode === 'level' || mode === 'run';
    this.targetWord = mode === 'run' ? 'Next era' : 'Target';
    const tierPanel =
      mode === 'level'
        ? `<div class="panel chamfer hud-tier">
            <div class="head"><span class="amber">[ ■ ]</span> Tier ${level.tier.id} · ${level.tier.name}</div>
            <div class="segs">${[0, 1, 2].map((i) => `<i class="${i < level.indexInTier ? 'on' : i === level.indexInTier ? 'on cur' : ''}"></i>`).join('')}
              <span class="label" style="margin-left:6px">${level.boss ? 'Final: merge with Sgr A*' : level.tier.id < 5 ? `Next: ${TIERS[level.tier.id].name}` : 'Next: the core'}</span></div>
          </div>`
        : mode === 'run'
          ? `<div class="panel chamfer hud-tier hud-era">
              <div class="head"><span class="amber">[ ■ ]</span> <span class="era-name"></span></div>
              <div class="segs">${RUN.eras.map(() => '<i></i>').join('')}<span class="label era-next" style="margin-left:6px"></span></div>
              <div class="label danger era-warn" style="display:none;margin-top:6px">● Evaporating</div>
              <div class="era-quasar" style="display:none;margin-top:8px"><div class="label science" style="margin-bottom:4px">Quasar</div><div class="progress"><b style="background:var(--science)"></b></div></div>
            </div>`
          : '<div></div>';
    const tray =
      mode === 'sandbox'
        ? `<div class="tray">${TIERS.filter((t) => t.id <= o.maxTier)
            .map((t) => `<button class="tier ${t.id === o.tier ? 'on' : ''}" data-tier="${t.id}">T${t.id}</button>`)
            .join('')}${o.spawnTypes.map((t) => `<button data-spawn="${t}">+ ${OBJECTS[t].name}</button>`).join('')}</div>`
        : '';

    this.node = mount(
      'hud',
      `<div class="hud">
        <div class="hud-normal">
          <div class="hud-top">
            <div class="panel hud-mass">
              <div class="row"><span class="label">Mass</span>${hasTarget ? '<span class="label amber target-pct"></span>' : ''}</div>
              <div class="value"></div>
              ${hasTarget ? '<div class="progress"><b></b></div><div class="ticks">' + '<i></i>'.repeat(11) + '</div>' : ''}
            </div>
            <div class="hud-right">
              ${mode === 'level' ? '<div class="panel hud-time"><div class="label">Time left</div><div class="value"></div></div>' : ''}
              ${mode === 'run' ? '<div class="panel hud-time hud-age"><div class="label">Cosmic age</div><div class="value"></div></div>' : ''}
              ${canRecord ? `<button class="hud-btn chamfer rec" data-act="record" aria-label="Record clip">${ICONS.record}</button>` : ''}
            </div>
          </div>
          ${tray}
          <div class="hud-bottom">
            <div class="hud-left">
              ${mode === 'run' ? '<div class="hud-powers"></div>' : ''}
              ${tierPanel}
            </div>
            <div class="hud-buttons">
              ${mode === 'run' ? `<button class="hud-btn chamfer jets-btn" data-act="jets" aria-label="Fire jets" style="display:none">${ICONS.jets}<span class="jets-label">Jets</span><b class="cd"></b></button>` : ''}
              <button class="hud-btn chamfer" data-act="pause" aria-label="Pause">${ICONS.pause}</button>
            </div>
          </div>
        </div>
        <div class="civ-choice" style="display:none">
          <button class="civ-btn eat" data-civ="eat"><b>Eat</b><span class="civ-sub eat-sub"></span></button>
          <button class="civ-btn spare" data-civ="spare"><b>Spare</b><span class="civ-sub spare-sub"></span></button>
          <div class="civ-timer"><i></i></div>
        </div>
        <div class="rec-indicator" style="display:none"><i class="dot"></i><b>REC</b><span class="rec-time">00:00.00</span><button class="stop" data-act="stop">Save clip</button></div>
      </div>`,
    );
    this.normal = this.node.querySelector('.hud-normal');
    this.rec = this.node.querySelector('.rec-indicator');
    this.recTime = this.node.querySelector('.rec-time');
    this.massEl = this.node.querySelector('.hud-mass .value');
    this.pctEl = this.node.querySelector('.target-pct');
    this.barEl = this.node.querySelector('.progress b');
    this.timePanel = this.node.querySelector('.hud-time');
    this.timeEl = mode === 'level' ? this.node.querySelector('.hud-time .value') : null;
    this.ageEl = this.node.querySelector('.hud-age .value');
    this.eraWarn = this.node.querySelector('.era-warn');
    this.eraQuasar = this.node.querySelector('.era-quasar');
    this.powersEl = this.node.querySelector('.hud-powers');
    this.jetsBtn = this.node.querySelector('.jets-btn');
    this.jetsCd = this.node.querySelector('.jets-btn .cd');
    this.last = {};

    const h = o.handlers;
    on(this.node, {
      '[data-act=pause]': () => h.onPause(),
      '[data-act=jets]': () => h.onJets?.(),
      '[data-civ]': (_e, b) => h.onCiv?.(b.dataset.civ === 'eat'),
      '[data-act=record]': () => h.onRecord(),
      '[data-act=stop]': () => h.onStopRecord(),
      '[data-spawn]': (_e, b) => h.onSpawn(b.dataset.spawn),
      '[data-tier]': (_e, b) => h.onTier(+b.dataset.tier),
    });
  }

  set(key, value, fn) {
    if (this.last[key] === value) return;
    this.last[key] = value;
    fn(value);
  }

  update({ kg, progress, timeLeft }) {
    this.set('mass', kgHtml(kg, 2), (v) => (this.massEl.innerHTML = v));
    if (this.pctEl) {
      const pct = Math.min(100, Math.floor(progress * 100));
      this.set('pct', pct, (v) => {
        this.pctEl.textContent = `${this.targetWord} [${v}%]`;
        this.barEl.style.width = `${v}%`;
      });
    }
    if (this.timeEl) {
      this.set('time', formatTime(timeLeft), (v) => (this.timeEl.textContent = v));
      this.set('warn', timeLeft < LEVEL.timeWarning, (v) => this.timePanel.classList.toggle('warn', v));
    }
  }

  /** Run mode: show which era we're in. */
  setEra(era) {
    const n = this.node;
    if (!n.querySelector('.era-name')) return;
    n.querySelector('.era-name').textContent = `Era ${era.id} · ${era.name}`;
    n.querySelectorAll('.hud-era .segs i').forEach((seg, i) => seg.classList.toggle('on', i < era.id));
    const next = RUN.eras[era.id];
    n.querySelector('.era-next').textContent = next ? `Next: ${next.name}` : 'The end of time';
    this.targetWord = era.goal ? 'Next era' : 'The end';
    this.eraQuasar.style.display = era.quasar ? '' : 'none';
    this.last.pct = undefined;
  }

  /** Run mode: owned powers (icon + level pips) and active synergies. */
  setPowers(owned, synergies = []) {
    if (!this.powersEl) return;
    const syn = SYNERGIES.filter((x) => synergies.includes(x.id));
    this.powersEl.innerHTML =
      owned.map((p) => `<span class="pw" title="${POWERS_BY_ID[p.id].name}">${ICONS[p.id]}<span class="pips">${'<i class="on"></i>'.repeat(p.level)}${'<i></i>'.repeat(POWERS.maxLevel - p.level)}</span></span>`).join('') +
      syn.map((x) => `<span class="pw syn" title="${x.name}">${ICONS[x.id]}</span>`).join('');
  }

  /** Run mode per frame: cosmic age, evaporation warning, quasar meter, jets charge. */
  updateRun({ age, evaporating, quasar, jets }) {
    if (this.jetsBtn) {
      this.set('jetsOn', !!jets, (v) => (this.jetsBtn.style.display = v ? '' : 'none'));
      if (jets) {
        this.set('jetsCd', Math.round(jets.charge * 100), (v) => {
          this.jetsCd.style.height = `${v}%`;
          this.jetsBtn.classList.toggle('ready', v === 0);
        });
        this.set('jetsAuto', jets.auto, (v) => this.jetsBtn.classList.toggle('auto', v));
      }
    }
    this.set('age', ageHtml(age), (v) => (this.ageEl.innerHTML = v));
    this.set('evap', evaporating, (v) => (this.eraWarn.style.display = v ? '' : 'none'));
    if (quasar !== undefined) this.set('quasar', Math.round(quasar * 100), (v) => (this.eraQuasar.querySelector('b').style.width = `${v}%`));
  }

  /**
   * EAT / SPARE buttons under the civilisation's message card.
   * @param {{top:number, eat:string, spare:string, time:number}} o top in UI px
   */
  showCivChoice(o) {
    const el = this.node.querySelector('.civ-choice');
    el.style.top = `${o.top}px`;
    el.querySelector('.eat-sub').textContent = o.eat;
    el.querySelector('.spare-sub').textContent = o.spare;
    const bar = el.querySelector('.civ-timer i');
    bar.style.transition = 'none';
    bar.style.width = '100%';
    el.style.display = '';
    requestAnimationFrame(() => {
      bar.style.transition = `width ${o.time}s linear`;
      bar.style.width = '0%';
    });
  }

  hideCivChoice() {
    this.node.querySelector('.civ-choice').style.display = 'none';
  }

  flashMass() {
    this.massEl.classList.add('flash');
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.massEl.classList.remove('flash'), 600);
  }

  setRecording(on) {
    this.normal.style.display = on ? 'none' : '';
    this.rec.style.display = on ? '' : 'none';
  }

  setRecTime(seconds) {
    this.set('rec', formatTimePrecise(seconds), (v) => (this.recTime.textContent = v));
  }

  setVisible(v) {
    this.node.style.display = v ? '' : 'none';
  }

  destroy() {
    this.node.remove();
  }
}
