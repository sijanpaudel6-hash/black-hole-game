// All sound is synthesised with the Web Audio API: no sound files to download.
// The master output also feeds a MediaStream so recorded clips include the sound.

import { AUDIO } from '../config.js';

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.musicOn = true;
    this.sfxOn = true;
    this.lastSwallow = 0;
  }

  /** Create/resume the audio context. Must be called from a user gesture. */
  unlock() {
    try {
      if (!this.ctx) this.build();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (this.musicOn) this.startMusic();
    } catch (e) {
      console.warn('Audio unavailable', e);
    }
  }

  build() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = AUDIO.master;
    // Gentle limiter so stacked swallows don't clip.
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -10;
    this.limiter.ratio.value = 8;
    this.master.connect(this.limiter);
    this.limiter.connect(ctx.destination);
    if (ctx.createMediaStreamDestination) {
      this.recordDest = ctx.createMediaStreamDestination();
      this.limiter.connect(this.recordDest);
    }

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxOn ? AUDIO.sfx : 0;
    this.sfxBus.connect(this.master);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(this.master);

    // White noise buffer reused by every noisy sound.
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this.buildRumble();
  }

  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  getRecordStream() {
    return this.recordDest ? this.recordDest.stream : null;
  }

  setSfx(on) {
    this.sfxOn = on;
    if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(on ? AUDIO.sfx : 0, this.now, 0.05);
  }

  setMusic(on) {
    this.musicOn = on;
    if (!this.ctx) return;
    if (on) this.startMusic();
    this.musicBus.gain.setTargetAtTime(on ? AUDIO.music : 0, this.now, 0.6);
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // ---- Building blocks ----

  env(gainNode, t, attack, peak, decay) {
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(peak, t + attack);
    g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  tone(type, f0, f1, dur, peak, dest = this.sfxBus, attack = 0.005) {
    const ctx = this.ctx;
    const t = this.now;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = ctx.createGain();
    this.env(g, t, attack, peak, dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + attack + dur + 0.05);
  }

  noiseBurst(filterType, f0, f1, dur, peak, q = 1, dest = this.sfxBus) {
    const ctx = this.ctx;
    const t = this.now;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain();
    this.env(g, t, 0.005, peak, dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random());
    src.stop(t + dur + 0.1);
  }

  // ---- Sound effects ----

  /** Crunch/whoomp on each swallow. size: 0 (dust) … 1 (as big as you). */
  swallow(size = 0.3) {
    if (!this.ready || !this.sfxOn) return;
    if (this.now - this.lastSwallow < AUDIO.swallowCooldown) return;
    this.lastSwallow = this.now;
    const s = Math.min(1, Math.max(0, size));
    const pitch = 1 + (Math.random() - 0.5) * 0.15;
    this.tone('sine', (210 - s * 120) * pitch, 45, 0.18 + s * 0.25, 0.25 + s * 0.35);
    this.noiseBurst('lowpass', 1800 - s * 900, 120, 0.08 + s * 0.15, 0.1 + s * 0.25, 0.7);
  }

  /** Big swallow / tier-up: deep bass drop with a boom. */
  bassDrop(strength = 1) {
    if (!this.ready || !this.sfxOn) return;
    this.tone('sine', 110, 28, 1.4, 0.9 * strength, this.sfxBus, 0.01);
    this.tone('triangle', 55, 30, 1.0, 0.35 * strength, this.sfxBus, 0.01);
    this.noiseBurst('lowpass', 900, 60, 0.9, 0.5 * strength, 0.8);
  }

  collide() {
    if (!this.ready || !this.sfxOn) return;
    this.tone('sine', 90, 40, 0.25, 0.6);
    this.noiseBurst('lowpass', 600, 80, 0.2, 0.5, 1.2);
    this.tone('square', 160, 80, 0.12, 0.08);
  }

  click() {
    if (!this.ready || !this.sfxOn) return;
    this.tone('triangle', 1400, 900, 0.04, 0.12);
  }

  chime() {
    if (!this.ready || !this.sfxOn) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.tone('sine', f, f, 0.9, 0.18, this.sfxBus, 0.01), i * 90);
    });
  }

  win() {
    if (!this.ready || !this.sfxOn) return;
    this.chime();
    this.tone('sine', 65, 65, 1.6, 0.3, this.sfxBus, 0.05);
  }

  fail() {
    if (!this.ready || !this.sfxOn) return;
    [392, 311.13, 261.63].forEach((f, i) => {
      setTimeout(() => this.tone('triangle', f, f * 0.98, 0.6, 0.16, this.sfxBus, 0.01), i * 180);
    });
  }

  warning() {
    if (!this.ready || !this.sfxOn) return;
    this.tone('square', 880, 880, 0.06, 0.05);
  }

  /** Short pitched blip (gravitational-wave chirp in the merger scenario). */
  blip(freq, peak = 0.08) {
    if (!this.ready || !this.sfxOn) return;
    this.tone('sine', freq, freq * 1.08, 0.08, peak);
  }

  sparkle() {
    if (!this.ready || !this.sfxOn) return;
    this.tone('sine', 1800 + Math.random() * 600, 2600, 0.15, 0.06);
  }

  // ---- Rumble: rises as objects get pulled in ----

  buildRumble() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 110;
    f.Q.value = 2;
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 38;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.4;
    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0;
    src.connect(f).connect(this.rumbleGain);
    sub.connect(subGain).connect(this.rumbleGain);
    this.rumbleGain.connect(this.sfxBus);
    src.start();
    sub.start();
  }

  /** level: 0 … 1 */
  setRumble(level) {
    if (!this.ctx) return;
    const v = Math.min(1, Math.max(0, level)) * AUDIO.rumbleMax;
    this.rumbleGain.gain.setTargetAtTime(v, this.now, 0.15);
  }

  // ---- Music: a quiet generative ambient pad ----

  startMusic() {
    if (!this.ctx || this.musicStarted) {
      if (this.musicBus && this.musicOn) this.musicBus.gain.setTargetAtTime(AUDIO.music, this.now, 0.8);
      return;
    }
    this.musicStarted = true;
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    filter.connect(this.musicBus);

    // A–F–C–G in a low register, slow changes.
    const chords = [
      [110.0, 130.81, 164.81],
      [87.31, 110.0, 130.81],
      [130.81, 164.81, 196.0],
      [98.0, 123.47, 146.83],
    ];
    this.voices = chords[0].map((freq) => {
      const pair = [-6, 6].map((detune) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = freq;
        o.detune.value = detune;
        o.start();
        return o;
      });
      const g = ctx.createGain();
      g.gain.value = 0.07;
      pair.forEach((o) => o.connect(g));
      g.connect(filter);
      return pair;
    });
    let i = 0;
    const step = () => {
      i = (i + 1) % chords.length;
      const t = this.now;
      this.voices.forEach((pair, v) => pair.forEach((o) => o.frequency.setTargetAtTime(chords[i][v], t, 1.5)));
    };
    this.musicTimer = setInterval(step, 9000);
    if (this.musicOn) this.musicBus.gain.setTargetAtTime(AUDIO.music, this.now, 2);
  }
}

export const audio = new AudioEngine();
