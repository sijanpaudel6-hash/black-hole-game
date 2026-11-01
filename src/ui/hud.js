// In-game HUD (HTML): mass + target bar and timer at the top, tier and buttons at the
// bottom, middle kept clear. While recording a clip everything is hidden except a small
// REC indicator (HTML, so it is NOT in the clip); the canvas draws the clip overlay.

import { mount, on } from './dom.js';
import { ICONS } from './icons.js';
import { kgHtml, formatTime, formatTimePrecise } from '../systems/format.js';
import { LEVEL, OBJECTS, TIERS } from '../config.js';
import { recordingSupported } from '../systems/recorder.js';

export default class Hud {
  /**
   * @param {object} o
   * @param {'level'|'sandbox'|'scenario'} o.mode
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
    const tierPanel =
      mode === 'level'
        ? `<div class="panel chamfer hud-tier">
            <div class="head"><span class="amber">[ ■ ]</span> Tier ${level.tier.id} · ${level.tier.name}</div>
            <div class="segs">${[0, 1, 2].map((i) => `<i class="${i < level.indexInTier ? 'on' : i === level.indexInTier ? 'on cur' : ''}"></i>`).join('')}
              <span class="label" style="margin-left:6px">${level.boss ? 'Final: merge with Sgr A*' : level.tier.id < 5 ? `Next: ${TIERS[level.tier.id].name}` : 'Next: the core'}</span></div>
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
              <div class="row"><span class="label">Mass</span>${mode === 'level' ? '<span class="label amber target-pct"></span>' : ''}</div>
              <div class="value"></div>
              ${mode === 'level' ? '<div class="progress"><b></b></div><div class="ticks">' + '<i></i>'.repeat(11) + '</div>' : ''}
            </div>
            <div class="hud-right">
              ${mode === 'level' ? '<div class="panel hud-time"><div class="label">Time left</div><div class="value"></div></div>' : ''}
              ${canRecord ? `<button class="hud-btn chamfer rec" data-act="record" aria-label="Record clip">${ICONS.record}</button>` : ''}
            </div>
          </div>
          ${tray}
          <div class="hud-bottom">
            ${tierPanel}
            <div class="hud-buttons">
              <button class="hud-btn chamfer" data-act="pause" aria-label="Pause">${ICONS.pause}</button>
            </div>
          </div>
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
    this.timeEl = this.node.querySelector('.hud-time .value');
    this.last = {};

    const h = o.handlers;
    on(this.node, {
      '[data-act=pause]': () => h.onPause(),
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
        this.pctEl.textContent = `Target [${v}%]`;
        this.barEl.style.width = `${v}%`;
      });
    }
    if (this.timeEl) {
      this.set('time', formatTime(timeLeft), (v) => (this.timeEl.textContent = v));
      this.set('warn', timeLeft < LEVEL.timeWarning, (v) => this.timePanel.classList.toggle('warn', v));
    }
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
