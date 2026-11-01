import Phaser from 'phaser';
import {
  GAME, COLORS, DEPTH, CAMERA, LEVEL, TIERS, DANGER, EFFECTS, HUD, BOSS, GROWTH, WORLD_EDGE, MILESTONES,
  LOW_GRAPHICS, RECORDING, ADS, EATING,
} from '../config.js';
import BlackHole, { radiusForMass } from '../objects/BlackHole.js';
import Spawner from '../systems/spawner.js';
import Effects from '../systems/effects.js';
import Starfield from '../systems/starfield.js';
import { createTextures } from '../systems/textures.js';
import { getSave, writeSave } from '../systems/save.js';
import { effects as upgrades, levelStardust } from '../systems/economy.js';
import { massToKg, kgText, todayKey } from '../systems/format.js';
import { audio } from '../systems/audio.js';
import { ClipRecorder, downloadClip, recordingSupported } from '../systems/recorder.js';
import { showRewardedAd } from '../systems/ads.js';
import { createScenario } from '../systems/scenarios.js';
import { getLevel, LEVEL_COUNT } from '../data/levels.js';
import { getScenario } from '../data/scenarios.js';
import Hud from '../ui/hud.js';
import { toast, clear } from '../ui/dom.js';
import { renderPause, renderLevelComplete, renderLevelFailed, renderScenarioEnd, closeModal } from '../ui/overlays.js';
import { showScienceCard } from '../ui/scienceCard.js';
import { highestTierUnlocked } from '../ui/menus.js';
import * as flow from '../flow.js';

/**
 * Gameplay for all three modes:
 *  - 'level'    timed level with a target mass, danger and upgrades
 *  - 'sandbox'  no timer, no danger, spawn objects from a menu
 *  - 'scenario' a scripted "What if…?" scene (see systems/scenarios.js)
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.mode = data?.mode ?? 'level';
    this.levelNum = data?.level ?? 1;
    this.sandboxTier = data?.tier ?? 1;
    this.scenarioId = data?.scenario ?? 'earth';
  }

  create() {
    createTextures(this);
    const save = getSave();
    this.low = save.settings.lowGraphics;
    this.cameras.main.setBackgroundColor(COLORS.void);
    this.starfield = new Starfield(this, this.low);

    // ---- Mode setup ----
    let weights = null;
    this.danger = false;
    this.feeding = true;
    this.target = null;
    this.timeLeft = Infinity;
    this.speedMultiplier = upgrades.speedMultiplier();
    this.pullRange = upgrades.pullRange();
    if (this.mode === 'level') {
      this.level = getLevel(this.levelNum);
      this.startMass = this.level.tier.startMass * upgrades.startMassMultiplier();
      this.target = this.level.target;
      this.timeLeft = upgrades.timeLimit();
      weights = this.level.tier.weights;
      this.danger = true;
      this.feeding = false;
    } else if (this.mode === 'sandbox') {
      const tier = TIERS[this.sandboxTier - 1];
      this.startMass = tier.startMass;
      weights = tier.weights;
    } else {
      this.scenarioDef = getScenario(this.scenarioId);
      this.startMass = GROWTH.baseMass;
      this.speedMultiplier = 1;
      this.pullRange = EATING.pullRangeMultiplier; // scenarios ignore upgrades
    }
    this.startRadius = radiusForMass(this.startMass);
    this.worldRadius = LEVEL.worldRadius * this.startRadius;

    // ---- State ----
    this.eaten = 0;
    this.bonusMass = 0;
    this.objectsEaten = 0;
    this.biggest = null;
    this.elapsed = 0;
    this.ended = false;
    this.revived = false;
    this.invulnerable = 0;
    this.timeScale = 1;
    this.slowMoTimer = 0;
    this.slowMoScale = 1;
    this.zoomMul = 1;
    this.zoomMulTarget = 1;
    this.zoomHold = 0;
    this.zoomBase = 1; // scenarios can zoom further out
    this.bigCooldown = 0;
    this.tierUpDone = false;
    this.bossReady = false;
    this.lastWarnSecond = -1;
    this.realKg = null; // scenarios track real kilograms instead of the game scale
    this.inputLocked = false;

    // ---- World ----
    this.bh = new BlackHole(this, 0, 0, this.startMass);
    this.bh.setLowGraphics(this.low);

    if (this.level?.boss) {
      this.boss = new BlackHole(this, 0, 0, BOSS.mass, { depth: DEPTH.boss, glowScale: 1.6, spinScale: 0.5 });
      this.boss.setLowGraphics(this.low);
      this.bh.setPosition(0, this.boss.radius * BOSS.startDistance);
      this.worldRadius = Math.max(this.worldRadius, this.boss.radius * BOSS.startDistance * 1.6);
    }

    const cam = this.cameras.main;
    cam.setZoom(CAMERA.screenRadius / this.bh.radius);
    cam.centerOn(this.bh.x, this.bh.y);
    this.camTarget = this.bh; // followed with slight lag in updateCamera (scenarios may change it)

    this.edge = this.add.graphics().setDepth(DEPTH.worldEdge);
    this.drawWorldEdge();

    this.effects = new Effects(this, this.low);
    this.spawner = new Spawner(this, {
      weights,
      worldRadius: this.worldRadius,
      startMass: this.startMass,
      callbacks: {
        onSwallow: (o) => this.onSwallow(o),
        onHit: (o, nx, ny) => this.onHit(o, nx, ny),
        onPlayerEaten: (o) => this.onPlayerEaten(o),
        onFeed: (o, dm) => this.onFeed(o, dm),
        onOtherEat: (o, eater) => this.onOtherEat(o, eater),
      },
    });

    // Scenario scripts may move the black hole and place objects before spawning.
    if (this.mode === 'scenario') this.scenario = createScenario(this.scenarioId, this);
    cam.setZoom((CAMERA.screenRadius / this.bh.radius) * this.zoomBase);
    cam.centerOn(this.bh.x, this.bh.y);
    this.spawner.populate(this.bh, this.viewAt(this.bh.x, this.bh.y, cam.zoom));
    this.lastKg = this.currentKg();

    // ---- HUD and overlays ----
    this.hud = new Hud({
      mode: this.mode,
      level: this.level,
      maxTier: highestTierUnlocked(),
      tier: this.sandboxTier,
      spawnTypes: this.mode === 'sandbox' ? this.sandboxSpawnTypes() : [],
      handlers: {
        onPause: () => this.pauseGame(),
        onRecord: () => this.startRecording(),
        onStopRecord: () => this.stopRecording(),
        onSpawn: (type) => this.spawner.spawnNear(type, this.bh),
        onTier: (t) => flow.startSandbox(t),
      },
    });
    this.scene.launch('UIScene', { mode: this.mode });
    this.ui = this.scene.get('UIScene');

    // ---- Input ----
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', () => audio.unlock());
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys('W,A,S,D');
      this.input.keyboard.on('keydown-ESC', () => this.pauseGame());
      this.input.keyboard.on('keydown-P', () => this.pauseGame());
    }

    this.onVisibility = () => {
      if (document.hidden && !this.ended && !this.scene.isPaused()) this.pauseGame();
    };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    // Start-of-level touches
    this.time.delayedCall(50, () => {
      if (this.mode === 'level') {
        const msg = this.level.boss
          ? 'Reach the target mass, then dive into Sagittarius A*'
          : this.levelNum === 1 && save.levelsCleared === 0
            ? 'Hold and drag to move · eat anything smaller'
            : `Reach ${kgText(massToKg(this.target), 1)}`;
        toast(msg, 3200);
        this.ui.showBanner(`Sector ${String(this.levelNum).padStart(2, '0')}`, this.level.name, 1.8);
      }
      if (this.mode === 'scenario') {
        this.ui.showCaption(this.scenarioDef.caption, RECORDING.captionTime);
        if (save.settings.autoRecord && recordingSupported()) this.startRecording(true);
      }
    });
  }

  cleanup() {
    document.removeEventListener('visibilitychange', this.onVisibility);
    audio.setRumble(0);
    this.hud?.destroy();
    if (this.recorder?.recording) this.recorder.stop();
    clear('modal');
  }

  applySettings(s) {
    this.low = s.lowGraphics;
    this.starfield.setLow(this.low);
    this.bh.setLowGraphics(this.low);
    this.boss?.setLowGraphics(this.low);
    this.effects.setLow(this.low);
  }

  sandboxSpawnTypes() {
    const maxTier = highestTierUnlocked();
    const set = new Set();
    TIERS.filter((t) => t.id <= maxTier).forEach((t) => Object.keys(t.weights).forEach((k) => set.add(k)));
    if (maxTier >= 5) set.add('clusterStar');
    return [...set];
  }

  viewAt(x, y, zoom) {
    const w = GAME.width / zoom;
    const h = GAME.height / zoom;
    return { rect: new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h), cx: x, cy: y, halfDiag: Math.hypot(w, h) / 2, zoom };
  }

  drawWorldEdge() {
    const w = WORLD_EDGE.lineWidth * (this.startRadius / CAMERA.screenRadius);
    this.edge.clear().lineStyle(w, COLORS.hairline, WORLD_EDGE.alpha).strokeCircle(0, 0, this.worldRadius);
  }

  currentKg() {
    return this.realKg ?? massToKg(this.bh.mass);
  }

  // ---------------------------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------------------------

  update(time, delta) {
    const realDt = Math.min(delta / 1000, GAME.maxFrameDelta);
    this.updateTimeScale(realDt);
    const dt = realDt * this.timeScale;
    const bh = this.bh;

    let target = this.inputLocked || this.ended ? null : this.getPointerTarget();
    let dir = this.inputLocked || this.ended ? null : this.getKeyboardDirection();
    let controlled = false;
    if (this.scenario) {
      const r = this.scenario.update(dt, realDt, target || dir);
      if (r?.target !== undefined && !target && !dir) target = r.target;
      controlled = !!r?.controlled;
    }

    if (this.boss && !this.ended) this.applyBossPull(dt);
    if (!controlled) bh.move(dt, target, dir, { speedMultiplier: this.speedMultiplier, startRadius: this.startRadius });
    bh.keepInsideWorld(this.worldRadius);
    bh.updateVisual(dt);
    this.boss?.updateVisual(dt);
    this.invulnerable -= dt;
    this.bigCooldown -= realDt;

    const pulled = this.spawner.update(dt, time / 1000, {
      bh,
      danger: this.danger && !this.ended,
      feeding: this.feeding,
      pullRange: this.pullRange,
      boss: this.boss,
      feedRate: this.feedRate,
    });
    this.effects.update(dt);
    if (!this.ended) audio.setRumble(Math.min(1, pulled / 10 + (this.feedingNow ? 0.7 : 0)));
    this.feedingNow = false;

    this.updateCamera(realDt);
    this.starfield.update(this.cameras.main);

    if (!this.ended) {
      this.elapsed += dt;
      if (this.mode === 'level') this.updateLevel(dt);
      this.checkMilestones();
    }

    this.hud.update({
      kg: this.currentKg(),
      progress: this.target ? Math.max(0, (bh.mass - this.startMass) / (this.target - this.startMass)) : 0,
      timeLeft: this.timeLeft,
    });
    if (this.recorder?.recording) this.hud.setRecTime(this.recorder.elapsed);
  }

  updateTimeScale(realDt) {
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= realDt;
      this.timeScale += (this.slowMoScale - this.timeScale) * (1 - Math.exp(-12 * realDt));
    } else {
      this.timeScale += (1 - this.timeScale) * (1 - Math.exp(-3 * realDt));
      if (Math.abs(1 - this.timeScale) < 0.01) this.timeScale = 1;
    }
  }

  slowMo(scale, duration) {
    this.slowMoScale = scale;
    this.slowMoTimer = Math.max(this.slowMoTimer, duration);
  }

  /** Temporarily push the camera in (>1) or pull it out (<1). */
  zoomPulse(mul, hold) {
    this.zoomMulTarget = mul;
    this.zoomHold = hold;
  }

  updateCamera(realDt) {
    const cam = this.cameras.main;
    if (this.zoomHold > 0) {
      this.zoomHold -= realDt;
      if (this.zoomHold <= 0) this.zoomMulTarget = 1;
    }
    const rate = this.zoomMulTarget < this.zoomMul ? 4 : this.zoomMulTarget > 1 ? 5 : CAMERA.tierUpEase;
    this.zoomMul += (this.zoomMulTarget - this.zoomMul) * (1 - Math.exp(-rate * realDt));
    const want = (CAMERA.screenRadius / this.bh.drawnRadius) * this.zoomMul * this.zoomBase;
    cam.setZoom(cam.zoom + (want - cam.zoom) * (1 - Math.exp(-CAMERA.zoomEase * realDt)));
    // Follow with a slight, frame-rate independent lag.
    if (this.camTarget) {
      const k = 1 - Math.exp(-CAMERA.followRate * realDt);
      const cx = cam.scrollX + cam.width / 2;
      const cy = cam.scrollY + cam.height / 2;
      cam.centerOn(cx + (this.camTarget.x - cx) * k, cy + (this.camTarget.y - cy) * k);
    }
  }

  shake(intensity, duration) {
    const k = this.low ? LOW_GRAPHICS.shakeScale : 1;
    this.cameras.main.shake(duration * 1000, intensity * k, true);
  }

  getPointerTarget() {
    const p = this.input.activePointer;
    if (!p.isDown) return null;
    return this.cameras.main.getWorldPoint(p.x, p.y);
  }

  getKeyboardDirection() {
    if (!this.cursors) return null;
    const c = this.cursors;
    const k = this.wasd;
    const x = (c.right.isDown || k.D.isDown ? 1 : 0) - (c.left.isDown || k.A.isDown ? 1 : 0);
    const y = (c.down.isDown || k.S.isDown ? 1 : 0) - (c.up.isDown || k.W.isDown ? 1 : 0);
    return x === 0 && y === 0 ? null : { x, y };
  }

  // ---------------------------------------------------------------------------
  // Level rules: timer, win/fail, tier-up, boss
  // ---------------------------------------------------------------------------

  updateLevel(dt) {
    this.timeLeft -= dt;
    const sec = Math.ceil(this.timeLeft);
    if (sec <= 10 && sec !== this.lastWarnSecond && sec > 0) {
      this.lastWarnSecond = sec;
      audio.warning();
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.failLevel('time');
      return;
    }
    if (this.bh.mass >= this.target) {
      if (this.level.boss) {
        if (!this.bossReady) {
          this.bossReady = true;
          this.ui.showBanner('Critical mass', 'Dive into Sagittarius A*', 2.4);
          audio.chime();
        }
      } else {
        this.winLevel();
      }
    }
    if (this.boss) {
      const d = Math.hypot(this.bh.x - this.boss.x, this.bh.y - this.boss.y);
      if (d < this.boss.radius + this.bh.radius * 0.2) {
        if (this.bossReady) this.mergeWithBoss();
        else this.failLevel('boss');
      }
    }
  }

  applyBossPull(dt) {
    const b = this.boss;
    const dx = b.x - this.bh.x;
    const dy = b.y - this.bh.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > b.radius * BOSS.pullRange) return;
    const scale = this.bh.radius / GROWTH.baseRadius;
    const a = BOSS.pull * scale * Math.min(1.5, (b.radius / d) ** BOSS.pullFalloff);
    this.bh.velocity.x += (dx / d) * a * dt;
    this.bh.velocity.y += (dy / d) * a * dt;
  }

  tierUpMoment(tier) {
    this.tierUpDone = true;
    this.slowMo(EFFECTS.tierUpSlowMo, EFFECTS.tierUpSlowMoTime);
    this.zoomPulse(CAMERA.tierUpZoom, CAMERA.tierUpHold);
    this.shake(EFFECTS.bigShake, EFFECTS.bigShakeTime);
    audio.bassDrop(1);
    this.effects.shockwave(this.bh.x, this.bh.y, this.bh.radius * 8, COLORS.amber, 1.4);
    this.effects.flash(this.bh.x, this.bh.y, this.bh.radius * 4, COLORS.amber, 0.6);
    this.ui.showBanner(`Tier ${tier.id}`, tier.name, 2.6);
  }

  winLevel() {
    if (this.ended) return;
    this.ended = true;
    audio.setRumble(0);
    if (this.level.isLastInTier && this.level.tier.id < 5) {
      this.tierUpMoment(TIERS[this.level.tier.id]);
    } else {
      this.slowMo(EFFECTS.slowMoScale, LEVEL.winDelay);
      this.zoomPulse(0.75, LEVEL.winDelay);
      this.ui.showBanner('Target reached', this.level.winTitle, LEVEL.winDelay + 0.4);
    }
    audio.win();
    const delay = this.level.isLastInTier ? CAMERA.tierUpHold + 1.2 : LEVEL.winDelay;
    this.time.delayedCall(delay * 1000 + 200, () => this.finishLevel(true));
  }

  mergeWithBoss() {
    if (this.ended) return;
    this.ended = true;
    audio.setRumble(0);
    const b = this.boss;
    this.slowMo(EFFECTS.tierUpSlowMo, 2.2);
    this.shake(EFFECTS.bigShake * 1.5, 1.0);
    audio.bassDrop(1.2);
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 160, () => this.effects.shockwave(b.x, b.y, b.radius * (4 + i * 2), i % 2 ? COLORS.science : COLORS.amber, 1.6));
    }
    this.effects.flash(b.x, b.y, b.radius * 5, 0xffffff, 1.0);
    this.bh.setMass(this.bh.mass + BOSS.mass);
    this.bh.setPosition(b.x, b.y);
    b.setVisible(false);
    this.ui.showLabel('Sagittarius A*', kgText(BOSS.realKg, 1), true);
    this.ui.showBanner('Merged', 'Sagittarius A* is you now', 3);
    this.time.delayedCall(2600, () => this.finishLevel(true));
  }

  failLevel(reason) {
    if (this.ended) return;
    this.ended = true;
    this.failReason = reason;
    audio.setRumble(0);
    audio.fail();
    this.slowMo(0.35, 1);
    this.ui.showBanner(reason === 'time' ? "Time's up" : 'Swallowed', reason === 'boss' ? 'Too small to merge' : '', 1.6);
    this.time.delayedCall(1300, () => this.finishLevel(false, reason));
  }

  finishLevel(won, reason) {
    if (this.recorder?.recording) this.stopRecording();
    audio.setRumble(0);
    this.hud.setVisible(false);
    const save = getSave();
    const reward = levelStardust(this.eaten, this.bonusMass, this.startMass, won);
    save.stardust += reward.total;
    if (reward.daily) save.lastDailyWin = todayKey();

    if (!won) {
      writeSave();
      renderLevelFailed({
        reason: reason === 'time' ? 'time' : 'eaten',
        progress: Math.max(0, (this.bh.mass - this.startMass) / (this.target - this.startMass)),
        objects: this.objectsEaten,
        kept: reward.total,
        canRevive: !this.revived,
        onRetry: () => flow.startLevel(this.levelNum),
        onRevive: () => showRewardedAd(() => this.revive()),
        onShop: () => flow.goShop({ nextLevel: this.levelNum }),
        onLevels: () => flow.goMenu('levels', { selected: this.levelNum }),
      });
      return;
    }

    const firstClear = save.levelsCleared < this.levelNum;
    save.levelsCleared = Math.max(save.levelsCleared, this.levelNum);
    // Science cards: card 1 on the first clear of level 1; card N on reaching tier N.
    let newCard = null;
    if (firstClear) {
      if (this.levelNum === 1) newCard = 1;
      else if (this.level.isLastInTier && this.level.tier.id < 5) newCard = this.level.tier.id + 1;
    }
    if (newCard && !save.cards.includes(newCard)) save.cards.push(newCard);
    else newCard = null;
    if (this.level.boss) save.gameCompleted = true;
    writeSave();

    const next = this.levelNum < LEVEL_COUNT ? this.levelNum + 1 : null;
    renderLevelComplete({
      level: this.level,
      stats: {
        gainedKg: Math.max(0, massToKg(this.bh.mass) - massToKg(this.startMass)),
        objects: this.objectsEaten,
        time: this.elapsed,
        biggest: this.biggest?.name,
      },
      reward,
      canDouble: reward.total > 0,
      onNext: () => (next ? flow.goShop({ nextLevel: next }) : flow.goMenu('levels')),
      onLevels: () => flow.goMenu('levels', { selected: next ?? this.levelNum }),
      onDouble: (update) =>
        showRewardedAd(() => {
          save.stardust += reward.total;
          writeSave();
          update(reward.total * 2);
        }),
    });
    if (firstClear && this.levelNum === 3) toast('Sandbox unlocked!', 3000);
    if (newCard) showScienceCard(newCard);
  }

  revive() {
    closeModal();
    this.revived = true;
    this.ended = false;
    this.timeLeft = Math.max(this.timeLeft, 0) + ADS.reviveSeconds;
    this.invulnerable = 3;
    this.hud.setVisible(true);
    if (this.failReason !== 'time') {
      // Move clear of whatever ate us.
      const away = this.boss ?? this.killer;
      if (away) {
        const dx = this.bh.x - away.x;
        const dy = this.bh.y - away.y;
        const d = Math.hypot(dx, dy) || 1;
        const dist = away.radius * (this.boss ? 4 : 3) + this.bh.radius * 2;
        this.bh.setPosition(away.x + (dx / d) * dist, away.y + (dy / d) * dist);
        this.bh.velocity.set(0, 0);
        this.cameras.main.centerOn(this.bh.x, this.bh.y);
        this.starfield.resetTracking();
      }
      this.bh.setVisible(true);
    }
    toast(`+${ADS.reviveSeconds} s`);
  }

  // ---------------------------------------------------------------------------
  // Eating and collisions
  // ---------------------------------------------------------------------------

  onSwallow(obj) {
    const bh = this.bh;
    const ratio = obj.radius / bh.radius;
    const kgBefore = this.currentKg();
    // Scenarios add the full mass (they're about real objects); levels and sandbox use massGain.
    const gain = obj.role === 'persistent' ? obj.mass : obj.mass * EATING.massGain;
    bh.addMass(gain);
    if (this.realKg !== null && obj.realKg) this.realKg += obj.realKg * (obj.mass / obj.startMass);
    if (!this.ended) {
      this.eaten += gain;
      if (obj.bonus > 1) this.bonusMass += gain * (obj.bonus - 1);
      this.objectsEaten++;
      if (!this.biggest || obj.mass > this.biggest.mass) this.biggest = { name: obj.def.name, mass: obj.mass };
    }

    const big = (obj.named || ratio >= EFFECTS.bigSwallowRatio) && this.bigCooldown <= 0;
    this.effects.spaghetti(obj, bh, big);
    const colors = obj.def.debris ?? [obj.def.color, COLORS.amber];
    this.effects.debris(obj.x, obj.y, colors, Math.round(EFFECTS.debrisCount * Math.min(1, 0.3 + ratio)), bh);
    bh.boostDisk(0.15 + ratio * 0.6);
    audio.swallow(ratio);

    if (big) {
      this.bigCooldown = EFFECTS.bigSwallowCooldown;
      this.slowMo(EFFECTS.slowMoScale, EFFECTS.slowMoTime);
      this.zoomPulse(CAMERA.closeUpZoom, CAMERA.closeUpTime);
      this.time.delayedCall(EFFECTS.bigSpaghettiTime * 1000 * EFFECTS.slowMoScale * 1.6, () => {
        audio.bassDrop(0.9);
        this.shake(EFFECTS.bigShake, EFFECTS.bigShakeTime);
        this.effects.flash(bh.x, bh.y, bh.radius * EFFECTS.flashSize * 2, 0xffffff, 0.35);
        this.effects.shockwave(bh.x, bh.y, bh.radius * 5);
      });
    } else if (ratio >= EFFECTS.shakeRatio) {
      this.shake(EFFECTS.eatShake, EFFECTS.shakeTime);
    }

    if (obj.bonus > 1) {
      audio.sparkle();
      this.effects.debris(obj.x, obj.y, [COLORS.amber, 0xffe0b0], 6, bh);
    }

    // Name label: always for named objects, otherwise for big-enough meals.
    if (obj.named) {
      this.ui.showLabel(obj.def.name, kgText(obj.realKg, 2), true);
    } else if (ratio >= HUD.labelMinRatio || obj.type === 'rival') {
      this.ui.showLabel(obj.def.name, `+${kgText(Math.max(0, this.currentKg() - kgBefore), 1)}`, false);
    }
    this.scenario?.onSwallow?.(obj);
  }

  onFeed(obj, dm) {
    const bh = this.bh;
    bh.addMass(dm);
    if (this.realKg !== null && obj.realKg) this.realKg += (obj.realKg * dm) / obj.startMass;
    this.eaten += dm;
    this.feedingNow = true;
    bh.boostDisk(0.02);
    if (Math.random() < 0.6) {
      const a = Math.random() * Math.PI * 2;
      const r = obj.radius * Phaser.Math.FloatBetween(0.3, 1);
      this.effects.debris(obj.x + Math.cos(a) * r, obj.y + Math.sin(a) * r, obj.def.debris ?? [obj.def.color, COLORS.amber], 2, bh, bh.radius * 5);
    }
    if (Math.random() < 0.1) this.shake(0.003 + Math.min(0.006, bh.radius / obj.radius / 100), 0.1);
  }

  onOtherEat(obj, eater) {
    if (!obj.visible) return;
    this.effects.spaghetti(obj, eater, false);
  }

  onHit(obj, nx, ny) {
    const bh = this.bh;
    // Push out of the object and bounce away.
    const minDist = bh.radius + obj.radius * DANGER.contactFactor;
    bh.x = obj.x + nx * minDist;
    bh.y = obj.y + ny * minDist;
    const scale = bh.radius / GROWTH.baseRadius;
    const v = bh.velocity;
    const vn = v.x * nx + v.y * ny;
    if (vn < 0) {
      v.x -= nx * vn;
      v.y -= ny * vn;
    }
    v.x += nx * DANGER.bounceSpeed * scale;
    v.y += ny * DANGER.bounceSpeed * scale;
    if (this.invulnerable > 0) return;
    this.invulnerable = DANGER.invulnerableTime;
    audio.collide();
    this.shake(DANGER.shake, DANGER.shakeTime);
    if (obj.radius > bh.radius) {
      const loss = bh.mass * upgrades.massLoss();
      const floor = this.startMass * GROWTH.minMassFactor;
      const kgBefore = this.currentKg();
      bh.setMass(Math.max(floor, bh.mass - loss));
      this.effects.flash(bh.x - nx * bh.radius, bh.y - ny * bh.radius, bh.radius * 1.5, COLORS.danger, 0.3);
      if (loss > 0) this.ui.showLabel(`Hit ${obj.def.name}`, `−${kgText(Math.max(0, kgBefore - this.currentKg()), 1)}`, false, true);
    }
  }

  onPlayerEaten(rival) {
    if (this.ended || this.invulnerable > 0) return;
    this.killer = rival;
    this.effects.flash(this.bh.x, this.bh.y, this.bh.radius * 3, COLORS.rivalRing, 0.5);
    this.bh.setVisible(false);
    this.shake(EFFECTS.bigShake, EFFECTS.bigShakeTime);
    audio.bassDrop(0.7);
    this.failLevel('eaten');
  }

  checkMilestones() {
    const kg = this.currentKg();
    for (const m of MILESTONES) {
      if (this.lastKg < m.kg && kg >= m.kg) {
        this.ui.showMilestone(m.label);
        this.hud.flashMass();
        audio.chime();
      }
    }
    this.lastKg = kg;
  }

  // ---------------------------------------------------------------------------
  // Pause
  // ---------------------------------------------------------------------------

  pauseGame() {
    if (this.ended || this.scene.isPaused()) return;
    if (this.recorder?.recording) this.stopRecording();
    audio.setRumble(0);
    this.scene.pause();
    const backTo = this.mode === 'level' ? 'levels' : 'sandbox';
    renderPause({
      onResume: () => {
        closeModal();
        this.scene.resume();
      },
      onRestart: () => {
        if (this.mode === 'level') flow.startLevel(this.levelNum);
        else if (this.mode === 'sandbox') flow.startSandbox(this.sandboxTier);
        else flow.startScenario(this.scenarioId);
      },
      onQuit: () => flow.goMenu(backTo, this.mode === 'level' ? { selected: this.levelNum } : {}),
      quitLabel: this.mode === 'level' ? 'Star chart' : 'Sandbox menu',
    });
  }

  // ---------------------------------------------------------------------------
  // Clip recording
  // ---------------------------------------------------------------------------

  startRecording(auto = false) {
    if (this.recorder?.recording) return;
    this.recorder = new ClipRecorder(this.game.canvas, audio.getRecordStream());
    if (!this.recorder.start()) {
      if (!auto) toast('Recording is not supported in this browser');
      return;
    }
    this.hud.setRecording(true);
    this.ui.setRecording(true);
  }

  /** Fade to a dark frame (so the clip loops cleanly), then save. */
  stopRecording(onDone) {
    if (!this.recorder?.recording || this.stoppingRecording) return;
    this.stoppingRecording = true;
    const finish = () => {
      this.recorder.stop().then((clip) => {
        this.stoppingRecording = false;
        if (clip && clip.blob.size > 0) {
          downloadClip(clip.blob);
          toast(`Clip saved · ${Math.round(clip.seconds)} s`);
        }
        onDone?.(!!clip);
      });
      this.hud.setRecording(false);
      this.ui.setRecording(false);
      this.ui.fade(0, 0.3);
    };
    if (this.ended || !this.sys.isActive()) {
      finish();
      return;
    }
    this.ui.fade(1, RECORDING.fadeOut);
    setTimeout(finish, RECORDING.fadeOut * 1000 + 60);
  }

  // ---------------------------------------------------------------------------
  // Scenario ending (called by scenario scripts)
  // ---------------------------------------------------------------------------

  /** After the big moment: fade to dark, show the fact, end on a dark frame, save the clip. */
  finishScenario(delay = 1.4) {
    if (this.ended) return;
    this.ended = true;
    audio.setRumble(0);
    const def = this.scenarioDef;
    const realDelay = delay * 1000;
    this.time.delayedCall(realDelay, () => {
      this.ui.fade(1, 0.6);
      this.time.delayedCall(700, () => {
        this.ui.showFact(def.fact, RECORDING.factTime);
        this.time.delayedCall(RECORDING.factTime * 1000 + 600, () => {
          const show = (saved) => {
            this.hud.setVisible(false);
            renderScenarioEnd({
              scenario: def,
              clipSaved: saved,
              onReplay: () => flow.startScenario(this.scenarioId),
              onBack: () => flow.goMenu('sandbox'),
            });
          };
          if (this.recorder?.recording) {
            this.recorder.stop().then((clip) => {
              if (clip && clip.blob.size > 0) downloadClip(clip.blob);
              this.hud.setRecording(false);
              this.ui.setRecording(false);
              show(!!clip);
            });
          } else show(false);
        });
      });
    });
  }
}

