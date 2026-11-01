// Run mode: "One Life of a Black Hole". One run takes the black hole through five eras
// (see RUN in config.js). GameScene creates a RunController in 'run' mode and calls it
// every frame; everything run-specific lives here.

import Phaser from 'phaser';
import { RUN, QUASAR, FINALE, SPAWNER, LEVEL, COLORS, GROWTH, DEPTH, DISK, EFFECTS } from '../config.js';
import { radiusForMass } from '../objects/BlackHole.js';
import { effects as upgrades, eraStardust, runStardust } from './economy.js';
import { getSave, writeSave } from './save.js';
import { massToKg, todayKey, ageText, formatTime } from './format.js';
import { submitTime, bestTimes } from './leaderboard.js';
import { recordDaily, dailyRecord } from './daily.js';
import { audio } from './audio.js';
import { toast } from '../ui/dom.js';

const lerp = (a, b, t) => a + (b - a) * t;

export default class RunController {
  constructor(scene) {
    this.scene = scene;
    this.eraIndex = scene.startEraIndex ?? 0;
    this.eraTime = 0;
    this.eraEaten = 0;
    this.eraBonus = 0;
    this.stardustSoFar = 0;
    this.runStartMass = scene.startMass;
    this.peakKg = massToKg(scene.startMass);
    this.gains = []; // [eraTime, gain] for the quasar meter
    this.quasarTimer = 0;
    this.quasarCooldown = 0;
    this.quasarMeter = 0;
    this.lossRate = 0;
    this.finished = false;
    this.basePullRange = scene.pullRange;
    this.applyEra(true);
  }

  get era() {
    return RUN.eras[this.eraIndex];
  }

  // ---- Era setup ----

  applyEra(initial) {
    const s = this.scene;
    const era = this.era;
    this.eraStartMass = initial ? s.startMass : era.startMass;
    s.startMass = this.eraStartMass;
    s.startRadius = radiusForMass(this.eraStartMass);
    s.target = era.goal;
    const mod = s.mod ?? {};
    const weights = { ...era.weights };
    if (mod.rivalWeight && weights.rival) weights.rival *= mod.rivalWeight;
    s.spawner.setWeights(weights);
    s.spawner.startMass = this.eraStartMass;
    const count = (era.countScale ?? 1) * (era.id === 1 ? mod.dawnCount ?? 1 : 1);
    s.spawner.rootTarget = Math.min(SPAWNER.count + SPAWNER.reserve - 40, Math.round(SPAWNER.count * count));
    s.spawner.spawnFraction = 1;
    const world = LEVEL.worldRadius * s.startRadius;
    if (world > s.worldRadius) {
      s.worldRadius = world;
      s.spawner.worldRadius = world;
    }
    s.drawWorldEdge();
    this.tweenBackground(era.background, initial ? 0 : 2500);
    s.starfield.setAlpha(era.stars[0]);
    s.hud?.setEra(era);
  }

  tweenBackground(color, duration) {
    const cam = this.scene.cameras.main;
    if (!duration) {
      cam.setBackgroundColor(color);
      this.bg = color;
      return;
    }
    const from = Phaser.Display.Color.IntegerToColor(this.bg ?? COLORS.void);
    const to = Phaser.Display.Color.IntegerToColor(color);
    this.bg = color;
    this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration,
      onUpdate: (t) => {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, t.getValue());
        cam.setBackgroundColor(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
      },
    });
  }

  // ---- Per frame ----

  /** 0–1 through the current era (mass toward the goal, or time in the Far Future). */
  progress() {
    const era = this.era;
    if (era.goal) return Phaser.Math.Clamp((this.scene.bh.mass - this.eraStartMass) / (era.goal - this.eraStartMass), 0, 1);
    return Phaser.Math.Clamp(this.eraTime / this.eraDuration(), 0, 1);
  }

  /** Far Future length (a Daily Universe modifier can stretch it). */
  eraDuration() {
    return (this.era.duration ?? 0) * (this.scene.mod?.farFuture ?? 1);
  }

  /** Cosmic age in years for the HUD. */
  age() {
    const [a, b] = this.era.age;
    return 10 ** lerp(Math.log10(a), Math.log10(b), this.progress());
  }

  get evaporating() {
    return !!this.era.evaporation && !this.finished;
  }

  update(dt) {
    if (this.finished) return;
    const s = this.scene;
    const bh = s.bh;
    const era = this.era;
    this.eraTime += dt;

    // Hawking evaporation: small black holes lose mass faster.
    if (era.evaporation) {
      const ev = era.evaporation;
      const loss = ev.rate * this.eraStartMass * (this.eraStartMass / bh.mass) ** ev.exponent * upgrades.evaporationMultiplier() * dt;
      this.lossRate = loss / dt;
      const floor = ev.canKill ? 1e-6 : this.eraStartMass * GROWTH.minMassFactor;
      bh.setMass(Math.max(floor, bh.mass - loss));
      if (ev.canKill && bh.mass < this.runStartMass * RUN.deathFactor) {
        this.die('evaporated');
        return;
      }
    }

    if (era.quasar) this.updateQuasar(dt);
    s.starfield.setAlpha(lerp(era.stars[0], era.stars[1], this.progress()));
    this.peakKg = Math.max(this.peakKg, massToKg(bh.mass));

    if (era.goal && bh.mass >= era.goal) {
      this.advance();
    } else if (era.duration) {
      // Far Future: eaten things stop coming back, so food slowly runs out.
      s.spawner.spawnFraction = Math.max(0, 1 - this.eraTime / this.eraDuration());
      if (this.eraTime >= this.eraDuration()) this.finale();
    }
  }

  onGain(gain, bonus) {
    this.eraEaten += gain;
    this.eraBonus += bonus;
    if (this.era.quasar) this.gains.push([this.eraTime, gain]);
  }

  closeEraStardust() {
    this.stardustSoFar += eraStardust(this.eraEaten, this.eraBonus, this.eraStartMass);
    this.eraEaten = 0;
    this.eraBonus = 0;
  }

  advance() {
    const s = this.scene;
    this.closeEraStardust();
    if (this.quasarTimer > 0) this.endQuasar();
    // Clearing the Quasar Era = eating the Milky Way (the challenge clock stops here).
    if (this.era.id === RUN.eras.length - 1 && this.milkyWayTime == null) {
      this.milkyWayTime = s.elapsed;
      if (s.challenge) {
        this.finishChallenge();
        return;
      }
      s.time.delayedCall(2600, () => s.ui.showMilestone(`MILKY WAY EATEN · ${formatTime(this.milkyWayTime)}`));
    }
    this.eraIndex++;
    this.eraTime = 0;
    const era = this.era;
    s.tierUpMoment(`Era ${era.id}`, era.name);
    s.civs?.onEraChange();
    s.cosmic?.onEraChange();
    s.news?.push('era', { era: era.id });
    s.time.delayedCall(RUN.eraEndDelay * 1000, () => s.offerPowers(() => toast(era.blurb, 3500)));
    this.applyEra(false);
    const save = getSave();
    if (era.id > save.bestEra) {
      save.bestEra = era.id;
      writeSave();
    }
  }

  // ---- Quasar Era ----

  updateQuasar(dt) {
    const s = this.scene;
    while (this.gains.length && this.gains[0][0] < this.eraTime - QUASAR.window) this.gains.shift();
    const sum = this.gains.reduce((a, g) => a + g[1], 0);
    const needed = QUASAR.igniteGain * (s.mod?.quasarIgnite ?? 1) * s.bh.mass;
    if (this.quasarTimer > 0) {
      this.quasarTimer -= dt;
      this.quasarMeter = this.quasarTimer / QUASAR.duration;
      this.updateJets();
      if (this.quasarTimer <= 0) this.endQuasar();
      return;
    }
    this.quasarCooldown -= dt;
    this.quasarMeter = Math.min(1, sum / needed);
    if (this.quasarCooldown <= 0 && sum >= needed) this.ignite();
  }

  ignite() {
    const s = this.scene;
    const bh = s.bh;
    this.quasarTimer = QUASAR.duration;
    this.gains.length = 0;
    s.pullRange = this.basePullRange * QUASAR.pullBoost;
    bh.boostDisk(DISK.maxBoost);
    if (!this.jets) {
      this.jets = [0, 1].map(() => s.add.image(0, 0, 'glow').setOrigin(0.5, 1).setBlendMode(Phaser.BlendModes.ADD).setTint(0xcfe4ff).setDepth(DEPTH.blackHole - 1));
    }
    this.jets.forEach((j) => j.setVisible(true).setAlpha(0));
    s.tweens.add({ targets: this.jets, alpha: 0.9, duration: 300 });
    s.ui.showBanner('Quasar ignited', 'You outshine the whole galaxy', 2.2);
    s.news?.push('quasar');
    this.quasarCount = (this.quasarCount ?? 0) + 1;
    s.shake(EFFECTS.bigShake, EFFECTS.bigShakeTime);
    s.effects.shockwave(bh.x, bh.y, bh.radius * 10, COLORS.science, 1.2);
    audio.bassDrop(1);
  }

  updateJets() {
    if (!this.jets) return;
    const bh = this.scene.bh;
    const r = bh.drawnRadius;
    const flicker = 0.75 + Math.random() * 0.25;
    this.jets.forEach((j, i) => {
      j.setPosition(bh.x, bh.y);
      j.setRotation(DISK.angle + (i ? Math.PI : 0));
      j.setDisplaySize(r * QUASAR.jetWidth * 2, r * QUASAR.jetLength);
      j.setAlpha(Math.min(j.alpha + 0.05, 0.9) * flicker);
    });
    bh.boostDisk(0.05);
  }

  endQuasar() {
    const s = this.scene;
    this.quasarTimer = 0;
    this.quasarCooldown = QUASAR.cooldown;
    s.pullRange = this.basePullRange;
    if (this.jets) s.tweens.add({ targets: this.jets, alpha: 0, duration: 500, onComplete: () => this.jets.forEach((j) => j.setVisible(false)) });
  }

  // ---- Endings ----

  /** Milky Way challenge: the run ends as soon as the Quasar Era is cleared. */
  finishChallenge() {
    const s = this.scene;
    this.finished = true;
    this.challengeDone = true;
    s.ended = true;
    audio.setRumble(0);
    s.tierUpMoment('Milky Way eaten', formatTime(this.milkyWayTime));
    audio.win();
    const board = submitTime(this.milkyWayTime, { powers: s.powers?.owned().map((p) => p.id) ?? [] });
    this.challengeRank = board;
    s.time.delayedCall(2800, () => this.finishRun(true));
  }

  die(reason) {
    if (this.finished) return;
    const s = this.scene;
    this.finished = true;
    this.deathReason = reason;
    s.ended = true;
    audio.setRumble(0);
    audio.fail();
    s.slowMo(0.35, 1);
    if (reason === 'evaporated') {
      s.effects.flash(s.bh.x, s.bh.y, s.bh.radius * 4, COLORS.science, 0.6);
      s.bh.setVisible(false);
      s.ui.showBanner('Evaporated', 'Hawking radiation won', 1.8);
    } else {
      s.ui.showBanner('Swallowed', s.killer?.rivalName ? `by ${s.killer.rivalName}` : '', 1.8);
    }
    s.time.delayedCall(1500, () => this.finishRun(false));
  }

  revive() {
    const s = this.scene;
    this.finished = false;
    s.ended = false;
    s.revived = true;
    s.invulnerable = 3;
    if (this.deathReason === 'evaporated') {
      s.bh.setMass(Math.max(s.bh.mass, this.eraStartMass));
    } else if (s.killer) {
      const k = s.killer;
      const dx = s.bh.x - k.x;
      const dy = s.bh.y - k.y;
      const d = Math.hypot(dx, dy) || 1;
      const dist = k.radius * 3 + s.bh.radius * 2;
      s.bh.setPosition(k.x + (dx / d) * dist, k.y + (dy / d) * dist);
      s.bh.velocity.set(0, 0);
      s.cameras.main.centerOn(s.bh.x, s.bh.y);
      s.starfield.resetTracking();
    }
    s.bh.setVisible(true);
    s.hud.setVisible(true);
    toast('Revived');
  }

  /** The end of the Far Future: everything fades, and you evaporate as the last light. */
  finale() {
    if (this.finished) return;
    const s = this.scene;
    const bh = s.bh;
    this.finished = true;
    this.completed = true;
    s.ended = true;
    audio.setRumble(0);
    if (!s.recorder?.recording) s.hud.setVisible(false); // a clean, quiet ending
    s.spawner.spawnFraction = 0;
    s.fixedZoom = s.cameras.main.zoom * FINALE.zoomOut;
    s.spawner.objects.filter((o) => o.inUse).forEach((o) => s.tweens.add({ targets: o, alpha: 0, duration: FINALE.fadeObjects * 1000 }));
    s.time.delayedCall(FINALE.fadeObjects * 1000, () => s.spawner.releaseAll());
    s.ui.showBanner('The last light', ageText(1e100) + ' after the Big Bang', 3.2);

    const startMass = bh.mass;
    const sparks = s.time.addEvent({
      delay: FINALE.sparkEvery * 1000,
      loop: true,
      callback: () => {
        const a = Math.random() * Math.PI * 2;
        const d = bh.drawnRadius * Phaser.Math.FloatBetween(1.2, 2.5);
        s.effects.flash(bh.x + Math.cos(a) * d, bh.y + Math.sin(a) * d, bh.drawnRadius * 0.7, COLORS.science, 0.5);
      },
    });
    s.tweens.addCounter({
      from: 1,
      to: 0.0005,
      delay: FINALE.fadeObjects * 1000,
      duration: FINALE.evaporateTime * 1000,
      ease: 'Quad.In',
      onUpdate: (t) => {
        bh.setMass(startMass * t.getValue());
        bh.boostDisk(0.08);
      },
      onComplete: () => {
        sparks.remove();
        s.effects.flash(bh.x, bh.y, bh.drawnRadius * 12, 0xffffff, 1.2);
        bh.setVisible(false);
        audio.chime();
        s.time.delayedCall(1200, () => {
          s.ui.fade(1, 1.2);
          s.time.delayedCall(1300, () => {
            s.ui.showFact(FINALE.fact, FINALE.factTime);
            s.time.delayedCall(FINALE.factTime * 1000 + 700, () => this.finishRun(true));
          });
        });
      },
    });
  }

  finishRun(completed) {
    const s = this.scene;
    if (s.recorder?.recording) s.stopRecording();
    audio.setRumble(0);
    s.hud.setVisible(false);
    this.closeEraStardust();
    this.stardustSoFar += s.civs?.extraStardust ?? 0;
    if (s.civs) s.civs.extraStardust = 0;
    if (this.challengeDone) completed = true;
    const reward = runStardust(this.stardustSoFar, completed, RUN.completeBonus);
    this.stardustSoFar = 0; // a revive keeps earning from here
    const save = getSave();
    save.stardust += reward.total;
    if (reward.daily) save.lastDailyWin = todayKey();
    if (!this.counted) save.runsPlayed += 1; // a revived run still counts once
    this.counted = true;
    if (completed && !this.challengeDone) save.runsCompleted += 1;
    save.bestEra = Math.max(save.bestEra, this.era.id);
    save.bestRunKg = Math.max(save.bestRunKg, this.peakKg);
    // Science cards: card 1 after your first run, card N for reaching era N.
    const newCards = [];
    for (let id = 1; id <= this.era.id; id++) {
      if (!save.cards.includes(id)) {
        save.cards.push(id);
        newCards.push(id);
      }
    }
    // Everything the share card and end screen need.
    const share = {
      universe: s.daily?.universe ?? null,
      modifier: s.daily ? s.mod.name : null,
      challenge: !!s.challenge,
      challengeDone: !!this.challengeDone,
      completed: completed && !this.challengeDone,
      reason: this.deathReason,
      eraId: this.era.id,
      age: this.age(),
      peakKg: this.peakKg,
      civsEaten: s.civs?.eaten ?? 0,
      civsSpared: s.civs?.spared ?? 0,
      quasars: this.quasarCount ?? 0,
      milkyWayTime: this.milkyWayTime ?? null,
      powers: s.powers?.summary().powers ?? [],
    };
    const dailyResult = s.daily ? recordDaily({ era: this.era.id, peakKg: this.peakKg, completed, share }) : null;
    writeSave();
    s.showRunEnd({
      share,
      daily: s.daily ? { ...s.daily, modifier: s.mod, attempt: dailyRecord().attempts, best: dailyRecord().best, newBest: dailyResult?.best } : null,
      challenge: s.challenge ? { done: !!this.challengeDone, time: this.milkyWayTime, rank: this.challengeRank?.rank ?? null, best: bestTimes() } : null,
      completed,
      reason: this.deathReason,
      killer: s.killer?.rivalName,
      era: this.era,
      age: this.age(),
      peakKg: this.peakKg,
      reward,
      newCards,
      powers: s.powers?.summary(),
      civs: s.civs?.summary(),
    });
  }
}
