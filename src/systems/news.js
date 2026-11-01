// Galactic News: a ticker of pre-written headlines about what you just did.
// Systems call news.push(trigger, slots); quiet stretches get an era-flavoured filler.
// Drawn in the canvas (UIScene.showHeadline) so headlines appear in recorded clips.

import { NEWS as TIMING } from '../config.js';
import { NEWS, FILLER } from '../data/news.js';

const fill = (t, slots) => t.replace(/\{(\w+)\}/g, (_, k) => slots[k] ?? '');

export default class News {
  /**
   * @param {object} ui UIScene
   * @param {() => number} rng
   */
  constructor(ui, rng = Math.random) {
    this.ui = ui;
    this.rng = rng;
    this.queue = [];
    this.showing = 0;
    this.quiet = this.nextFiller();
    this.used = new Set();
    this.log = []; // every headline this run (for the share card)
  }

  nextFiller() {
    const [a, b] = TIMING.fillerEvery;
    return a + this.rng() * (b - a);
  }

  pickFrom(list) {
    let i = Math.floor(this.rng() * list.length);
    for (let n = 0; n < list.length && this.used.has(list[i]); n++) i = (i + 1) % list.length;
    this.used.add(list[i]);
    return list[i];
  }

  /**
   * @param {string} trigger key in NEWS (data/news.js), or 'era' with slots.era = id
   * @param {object} slots values for {species} {planet} {object} …
   */
  push(trigger, slots = {}) {
    let list = NEWS[trigger];
    if (trigger === 'era') list = NEWS.era[slots.era];
    if (!list?.length) return;
    let text = fill(this.pickFrom(list), slots);
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (this.queue.length >= TIMING.maxQueue) this.queue.shift();
    this.queue.push(text);
  }

  /** @param {number} eraId for filler headlines */
  update(dt, eraId) {
    if (this.showing > 0) {
      this.showing -= dt;
      return;
    }
    let text = this.queue.shift();
    if (!text) {
      this.quiet -= dt;
      if (this.quiet > 0) return;
      const list = FILLER[eraId];
      if (!list) return;
      text = this.pickFrom(list);
    }
    this.quiet = this.nextFiller();
    this.log.push(text);
    this.showing = this.ui.showHeadline(text, TIMING.showTime) ?? TIMING.showTime;
  }
}
