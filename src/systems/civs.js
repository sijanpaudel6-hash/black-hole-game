// The Universe Talks Back: civilisation planets appear in later eras, hail you as you get
// close, and you choose EAT or SPARE. Eating gives mass and Stardust but makes the rest of
// the galaxy scared, hostile (they shoot back) or quick to flee; sparing gives a boon and
// makes them hopeful. Numbers in CIVS (config.js), words in src/data/civilisations.js.
//
// Hook for later live features: messageFor() is the one place a message is chosen, so an
// AI-written message (fetched from a server, never with a key in the game) can replace it,
// falling back to the bank below when offline.

import Phaser from 'phaser';
import { CIVS, EATING, GROWTH, COLORS, DEPTH, OBJECTS, GAME } from '../config.js';
import { UI_WIDTH } from '../ui/dom.js';
import { TECH_LEVELS, SPECIES, PLANET_SYLLABLES, BOONS, MESSAGES, MOODS, LAST_WORDS, THANKS, FLEEING } from '../data/civilisations.js';
import { audio } from './audio.js';
import { kgText } from './format.js';

const TAU = Math.PI * 2;

function weighted(rng, weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let roll = rng() * total;
  for (const [k, w] of entries) {
    roll -= w;
    if (roll < 0) return k;
  }
  return entries[entries.length - 1]?.[0];
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

function fill(text, slots) {
  return text.replace(/\{(\w+)\}/g, (_, k) => slots[k] ?? '');
}

export default class Civs {
  /**
   * @param {Phaser.Scene} scene GameScene (run mode)
   * @param {() => number} rng seeded for the Daily Universe
   */
  constructor(scene, rng = Math.random) {
    this.scene = scene;
    this.rng = rng;
    this.eaten = 0;
    this.spared = 0;
    this.eatenNames = []; // for the share card and messages ("you ate the Glorpians")
    this.lastEatenSpecies = null;
    this.timer = CIVS.firstDelay;
    this.active = null; // { obj, civ }
    this.choice = null; // open message card
    this.missiles = [];
    this.shieldHits = 0;
    this.pullBonus = 0;
    this.escortUntil = 0;
    this.extraStardust = 0;
    this.usedMessages = new Set();
    this.beacon = scene.add.image(0, 0, 'ring').setTint(COLORS.amber).setVisible(false).setDepth(DEPTH.dangerRings);
    this.shieldRing = scene.add.image(0, 0, 'ring').setTint(COLORS.science).setVisible(false).setDepth(DEPTH.blackHole + 1);
    this.lastAte = null;
  }

  get era() {
    return this.scene.run.era;
  }

  enabled() {
    return CIVS.eras.includes(this.era.id);
  }

  onEraChange() {
    this.timer = CIVS.firstDelay;
    this.closeChoice('era');
    if (this.active && !this.active.obj.inUse) this.active = null;
  }

  // ---- Making a civilisation ----

  makeCiv() {
    const rng = this.rng;
    const era = this.era.id;
    const techs = Object.fromEntries(Object.entries(CIVS.techWeights[era] ?? {}).filter(([t]) => TECH_LEVELS.find((x) => x.id === t)));
    const tech = weighted(rng, techs);
    const species = pick(rng, SPECIES);
    const planet = pick(rng, PLANET_SYLLABLES[0]) + pick(rng, PLANET_SYLLABLES[1]) + pick(rng, PLANET_SYLLABLES[2]);
    const fleeChance = Math.min(CIVS.fleeChanceMax, this.eaten * CIVS.fleeChancePerEat);
    if (this.eaten > 0 && rng() < fleeChance) {
      return { tech, species, planet, mood: 'fleeing', text: fill(pick(rng, FLEEING), { species: species.name, planet }), offer: null };
    }
    return { tech, species, planet, ...this.messageFor(tech, species, planet) };
  }

  /** Choose a mood and a message (the hook for live AI messages later). */
  messageFor(tech, species, planet) {
    const rng = this.rng;
    const bank = MESSAGES[tech];
    const weights = {};
    for (const mood of Object.keys(bank)) {
      if (mood === 'terrified') weights[mood] = this.eaten * CIVS.terrifiedPerEat;
      else if (mood === 'hostile') weights[mood] = this.eaten * CIVS.hostilePerEat;
      else if (mood === 'hopeful') weights[mood] = this.spared * CIVS.hopefulPerSpare;
      else weights[mood] = mood === 'pleading' || mood === 'bargaining' ? 1.5 : 1;
    }
    const mood = weighted(rng, weights);
    const list = bank[mood];
    // Prefer messages not seen this run.
    let idx = Math.floor(rng() * list.length);
    for (let i = 0; i < list.length && this.usedMessages.has(`${tech}.${mood}.${idx}`); i++) idx = (idx + 1) % list.length;
    this.usedMessages.add(`${tech}.${mood}.${idx}`);
    let text = list[idx];
    let offer = null;
    const m = /^(\w+)\|/.exec(text);
    if (m && BOONS[m[1]]) {
      offer = m[1];
      text = text.slice(m[0].length);
    }
    text = fill(text, {
      species: this.lastEatenSpecies ?? 'Glorpians',
      planet,
      ate: this.lastAte ?? 'a whole moon',
    });
    return { mood, text, offer };
  }

  spawn() {
    const s = this.scene;
    const bh = s.bh;
    const civ = this.makeCiv();
    const types = CIVS.types[this.era.id] ?? ['rockyPlanet'];
    const type = pick(this.rng, types);
    const radius = bh.radius * Phaser.Math.FloatBetween(CIVS.sizeRatio[0], CIVS.sizeRatio[1]);
    // Mass chosen so swallowing it adds CIVS.eatMass of your current mass.
    const gainMul = EATING.massGain * (this.era.gain ?? 1);
    const mass = (CIVS.eatMass * bh.mass) / gainMul;
    const v = s.spawner.view();
    // Ahead of you if you're moving, otherwise anywhere just off-screen.
    let x;
    let y;
    const sp = bh.velocity.length();
    if (sp > 1) {
      const a = Math.atan2(bh.velocity.y, bh.velocity.x) + Phaser.Math.FloatBetween(-0.6, 0.6);
      const d = v.halfDiag * 1.1;
      x = bh.x + Math.cos(a) * d;
      y = bh.y + Math.sin(a) * d;
      if (Math.hypot(x, y) > s.worldRadius * 0.85) ({ x, y } = s.spawner.ringPoint(radius, v));
    } else ({ x, y } = s.spawner.ringPoint(radius, v));
    const obj = s.spawner.take();
    if (!obj) return;
    obj.reset(type, x, y, { role: 'extra', radius, mass, displayName: civ.planet });
    obj.civ = civ;
    civ.state = 'approach';
    civ.obj = obj;
    civ.gen = obj.gen;
    // Drift gently toward you so they're easy to meet.
    const dx = bh.x - x;
    const dy = bh.y - y;
    const d = Math.hypot(dx, dy) || 1;
    obj.driftX = obj.vx = (dx / d) * radius * 0.25;
    obj.driftY = obj.vy = (dy / d) * radius * 0.25;
    this.active = civ;
    s.ui.setPointer('civ', obj, COLORS.amber, 'Signal');
    audio.blip(880, 0.05);
  }

  // ---- Per frame ----

  update(dt, realDt) {
    const s = this.scene;
    const bh = s.bh;
    if (s.ended) {
      this.closeChoice('end');
      for (const m of this.missiles) {
        m.alive = false;
        m.img.setVisible(false);
      }
      return;
    }
    const civ = this.active;
    if (civ && (!civ.obj.inUse || civ.obj.gen !== civ.gen)) {
      // Left behind (recycled) or eaten (handled in onSwallow).
      if (civ.state !== 'eaten' && civ.state !== 'spared') this.closeChoice('gone');
      s.ui.clearPointer('civ');
      this.active = null;
      this.timer = Phaser.Math.FloatBetween(CIVS.interval[0], CIVS.interval[1]);
    }

    if (!this.active && this.enabled() && !s.run.finished) {
      this.timer -= dt;
      if (this.timer <= 0) this.spawn();
    }

    const a = this.active;
    if (a) {
      const o = a.obj;
      // Beacon: an amber ring pulsing around inhabited worlds.
      if (a.state !== 'spared' && o.visible) {
        const t = s.elapsed * 3;
        this.beacon.setVisible(true).setPosition(o.x, o.y).setScale((o.radius * (1.25 + 0.12 * Math.sin(t))) / 124).setAlpha(0.55 + 0.3 * Math.sin(t));
      } else this.beacon.setVisible(false);
      const gap = Math.hypot(o.x - bh.x, o.y - bh.y) - o.radius - bh.radius;
      if (a.state === 'approach' && gap < bh.radius * CIVS.hailRange && o.visible) this.hail(a);
      if (a.state === 'doomed') {
        // EAT: haul the planet in.
        const dx = bh.x - o.x;
        const dy = bh.y - o.y;
        const d = Math.hypot(dx, dy) || 1;
        const v = CIVS.eatPull * bh.radius;
        o.vx = (dx / d) * v + bh.velocity.x;
        o.vy = (dy / d) * v + bh.velocity.y;
        if (o.orbiting) o.freeFromOrbit();
      }
      if (a.hostile && a.state !== 'spared' && a.state !== 'eaten') this.updateLaunches(a, dt);
    } else this.beacon.setVisible(false);

    if (this.choice) {
      this.choice.time -= realDt;
      if (this.choice.time <= 0) this.closeChoice('timeout');
    }
    this.updateMissiles(dt);

    // Deflector gift: a blue ring while it lasts.
    if (this.shieldHits > 0 && bh.visible) {
      this.shieldRing.setVisible(true).setPosition(bh.x, bh.y).setScale((bh.drawnRadius * 1.5) / 124).setAlpha(0.5 + 0.2 * Math.sin(s.elapsed * 6));
    } else if (this.shieldRing.visible) this.shieldRing.setVisible(false);
  }

  // ---- Hail and choice ----

  hail(a) {
    const s = this.scene;
    s.ui.clearPointer('civ');
    if (a.mood === 'fleeing') {
      a.state = 'fleeing';
      s.ui.showLabel(a.species.name, 'Fleeing!', false, true);
      s.ui.showQuote(a.text);
      s.news?.push('civFled', { species: a.species.name, planet: a.planet });
      this.release(a);
      return;
    }
    a.state = 'hailed';
    a.hostile = a.mood === 'hostile';
    a.launched = 0;
    a.launchTimer = 0.3;
    const tech = TECH_LEVELS.find((t) => t.id === a.tech);
    this.choice = { civ: a, time: CIVS.choiceTime };
    s.slowMo(CIVS.slowMo, CIVS.choiceTime + 0.5);
    s.ui.showCivCard({
      species: a.species.name,
      kind: a.species.kind,
      planet: a.planet,
      tech: tech?.name ?? '',
      mood: MOODS[a.mood]?.label ?? '',
      text: a.text,
      offer: a.offer ? BOONS[a.offer].name : null,
      hostile: a.hostile,
    });
    s.hud.showCivChoice({
      top: s.ui.civCardBottom() * (UI_WIDTH / GAME.width) + 8,
      eat: `+${Math.round(CIVS.eatMass * 100)}% mass · +${CIVS.eatStardust} SD`,
      spare: a.hostile ? 'Truce: calms the galaxy' : a.offer ? BOONS[a.offer].name : 'A mystery gift',
      time: CIVS.choiceTime,
    });
    audio.chime();
    if (a.hostile) s.news?.push('civHostile', { species: a.species.name, planet: a.planet });
  }

  /** Called by the HUD buttons. */
  choose(eat) {
    const ch = this.choice;
    if (!ch) return;
    const a = ch.civ;
    this.closeChoice('chosen');
    if (eat) {
      a.state = 'doomed';
      this.scene.slowMo(1, 0.01);
    } else this.spare(a);
  }

  closeChoice(reason) {
    if (!this.choice) return;
    const a = this.choice.civ;
    this.choice = null;
    this.scene.ui.hideCivCard();
    this.scene.hud.hideCivChoice();
    if (reason === 'timeout' && a.state === 'hailed') a.state = 'ignored';
    if (reason !== 'chosen') this.scene.slowMo(1, 0.01);
  }

  spare(a) {
    const s = this.scene;
    a.state = 'spared';
    a.obj.spared = true;
    this.spared++;
    a.hostile = false;
    // Hostile worlds you let go don't give gifts, but it does calm the galaxy down.
    let boonText = '';
    if (a.mood === 'hostile') {
      this.eaten = Math.max(0, this.eaten - 1);
      boonText = 'Truce · the galaxy calms down';
    } else {
      const boon = a.offer ?? weighted(this.rng, CIVS.boons.weights);
      boonText = this.applyBoon(boon, a);
    }
    s.ui.showLabel(`${a.planet} · spared`, boonText, true);
    s.ui.showQuote(fill(pick(this.rng, THANKS), { species: a.species.name }));
    s.news?.push('civSpared', { species: a.species.name, planet: a.planet });
    s.effects.shockwave(a.obj.x, a.obj.y, a.obj.radius * 4, COLORS.science, 1);
    audio.sparkle();
    if (CIVS.spareStardust) this.extraStardust += CIVS.spareStardust;
    this.release(a);
  }

  /** Stop tracking a civilisation (it keeps drifting away) so the next one can come. */
  release(a) {
    const o = a.obj;
    const dx = o.x - this.scene.bh.x;
    const dy = o.y - this.scene.bh.y;
    const d = Math.hypot(dx, dy) || 1;
    const v = CIVS.fleeSpeed * o.radius * (a.state === 'spared' ? 0.6 : 1);
    o.driftX = (dx / d) * v;
    o.driftY = (dy / d) * v;
    this.beacon.setVisible(false);
    if (this.active === a) this.active = null;
    this.timer = Phaser.Math.FloatBetween(CIVS.interval[0], CIVS.interval[1]);
  }

  /** @returns {string} what you got, for the label */
  applyBoon(id, a) {
    const s = this.scene;
    const bh = s.bh;
    const B = CIVS.boons;
    const name = BOONS[id]?.name ?? 'Gift';
    switch (id) {
      case 'fuel': {
        const gain = bh.mass * B.fuel;
        bh.addMass(gain);
        s.run.onGain(gain, 0);
        s.effects.debris(a.obj.x, a.obj.y, [COLORS.science, 0xcfe4ff], 12, bh);
        return `${name} · +${Math.round(B.fuel * 100)}% mass`;
      }
      case 'shield':
        this.shieldHits += B.shieldHits;
        return `${name} · next ${B.shieldHits} hits free`;
      case 'gravity':
        this.pullBonus += B.gravity;
        return `${name} · +${Math.round(B.gravity * 100)}% pull`;
      case 'escort':
        this.escortUntil = s.elapsed + B.escort;
        return `${name} · rivals keep away`;
      case 'stardust':
        this.extraStardust += B.stardust;
        return `${name} · +${B.stardust} Stardust`;
      case 'map':
        this.spawnFeast();
        return `${name} · follow the arrow`;
      case 'neutron':
        this.spawnNeutronStar();
        return `${name} · follow the arrow`;
      default:
        return name;
    }
  }

  giftPoint() {
    const s = this.scene;
    const bh = s.bh;
    const v = s.spawner.view();
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * TAU;
      const d = v.halfDiag * CIVS.boons.feastDistance;
      const x = bh.x + Math.cos(a) * d;
      const y = bh.y + Math.sin(a) * d;
      if (Math.hypot(x, y) < s.worldRadius * 0.9) return { x, y };
    }
    return { x: bh.x * 0.5, y: bh.y * 0.5 };
  }

  /** Star map: a cluster of good meals, with a scanner arrow. */
  spawnFeast() {
    const s = this.scene;
    const bh = s.bh;
    const p = this.giftPoint();
    const edible = bh.radius * EATING.edibleRatio;
    const types = Object.keys(this.era.weights).filter((t) => t !== 'rival' && OBJECTS[t].radius < edible * 0.95 && OBJECTS[t].radius > edible * 0.2);
    const list = types.length ? types : Object.keys(this.era.weights).filter((t) => t !== 'rival');
    let first = null;
    for (let i = 0; i < CIVS.boons.feastCount; i++) {
      const o = s.spawner.take();
      if (!o) break;
      const type = list[i % list.length];
      const a = Math.random() * TAU;
      const r = Math.sqrt(Math.random()) * bh.radius * 5;
      o.reset(type, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, { role: 'extra' });
      if (o.orbiting) o.freeFromOrbit();
      first ??= o;
    }
    if (first) s.ui.setPointer('gift', { x: p.x, y: p.y, inUse: true }, COLORS.science, 'Feast', CIVS.boons.pointerTime);
  }

  spawnNeutronStar() {
    const s = this.scene;
    const bh = s.bh;
    const p = this.giftPoint();
    const o = s.spawner.take();
    if (!o) return;
    const gainMul = EATING.massGain * (this.era.gain ?? 1);
    o.reset('neutronStar', p.x, p.y, { role: 'extra', radius: bh.radius * 0.35, mass: (CIVS.boons.neutronMass * bh.mass) / gainMul });
    s.ui.setPointer('gift', o, COLORS.science, 'Neutron star', CIVS.boons.pointerTime);
  }

  // ---- Missiles from hostile worlds ----

  updateLaunches(a, dt) {
    const M = CIVS.missiles;
    if (a.launched >= M.count || !a.obj.visible) return;
    a.launchTimer -= dt;
    if (a.launchTimer > 0) return;
    a.launchTimer = M.every;
    a.launched++;
    const s = this.scene;
    const bh = s.bh;
    const o = a.obj;
    const dx = bh.x - o.x;
    const dy = bh.y - o.y;
    const ang = Math.atan2(dy, dx) + Phaser.Math.FloatBetween(-0.9, 0.9);
    const img = this.missiles.find((m) => !m.alive)?.img ?? s.add.image(0, 0, 'spark').setBlendMode(Phaser.BlendModes.ADD).setTint(COLORS.danger).setDepth(DEPTH.effects - 2);
    let m = this.missiles.find((x) => x.img === img);
    if (!m) {
      m = { img };
      this.missiles.push(m);
    }
    const scale = bh.radius / GROWTH.baseRadius;
    m.alive = true;
    m.x = o.x + Math.cos(ang) * o.radius;
    m.y = o.y + Math.sin(ang) * o.radius;
    m.vx = Math.cos(ang) * M.speed * scale;
    m.vy = Math.sin(ang) * M.speed * scale;
    m.life = M.life;
    m.from = a;
    img.setVisible(true);
    audio.blip(300, 0.04);
  }

  updateMissiles(dt) {
    const s = this.scene;
    const bh = s.bh;
    const M = CIVS.missiles;
    const scale = bh.radius / GROWTH.baseRadius;
    for (const m of this.missiles) {
      if (!m.alive) continue;
      m.life -= dt;
      const dx = bh.x - m.x;
      const dy = bh.y - m.y;
      const d = Math.hypot(dx, dy) || 1;
      if (m.life <= 0 || s.ended) {
        m.alive = false;
        m.img.setVisible(false);
        continue;
      }
      // Gentle homing.
      const want = Math.atan2(dy, dx);
      const cur = Math.atan2(m.vy, m.vx);
      const ang = Phaser.Math.Angle.RotateTo(cur, want, M.turn * dt);
      const sp = M.speed * scale;
      m.vx = Math.cos(ang) * sp;
      m.vy = Math.sin(ang) * sp;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.img.setPosition(m.x, m.y).setScale((bh.radius * M.size) / 16).setAlpha(0.6 + 0.4 * Math.sin(m.life * 30));
      if (d < bh.radius) {
        m.alive = false;
        m.img.setVisible(false);
        s.onMissileHit(m.vx / sp, m.vy / sp, m.from);
      }
    }
  }

  /** Mass lost to a missile hit after the Deflector gift. */
  missileLoss(mass) {
    if (this.shieldHits > 0) {
      this.shieldHits--;
      return 0;
    }
    return mass * CIVS.missiles.massLoss;
  }

  /** Hits from bigger objects: the Deflector gift absorbs them. */
  absorbHit() {
    if (this.shieldHits > 0) {
      this.shieldHits--;
      return true;
    }
    return false;
  }

  rivalsFlee() {
    return this.scene.elapsed < this.escortUntil;
  }

  // ---- Swallows ----

  /** Every swallow in a run comes through here; civilisation planets get the full treatment. */
  onSwallow(obj) {
    const s = this.scene;
    if (!obj.civ) {
      if (obj.radius > s.bh.radius * 0.3) this.lastAte = `${/^[aeiou]/i.test(obj.def.name) ? 'an' : 'a'} ${(obj.displayName ?? obj.def.name).toLowerCase()}`;
      if (obj.type === 'neutronStar') s.ui.clearPointer('gift');
      return;
    }
    const a = obj.civ;
    if (this.choice?.civ === a) this.closeChoice('eaten');
    a.state = 'eaten';
    this.eaten++;
    this.lastEatenSpecies = a.species.name;
    this.eatenNames.push(a.species.name);
    this.extraStardust += CIVS.eatStardust;
    const words = fill(pick(this.rng, LAST_WORDS), { species: a.species.name });
    s.ui.showLabel(`${a.planet} · ${a.species.name}`, `+${Math.round(CIVS.eatMass * 100)}% mass · +${CIVS.eatStardust} SD`, true);
    s.ui.showQuote(`“${words}”`);
    s.news?.push('civEaten', { species: a.species.name, planet: a.planet, words });
    s.ui.clearPointer('civ');
    this.beacon.setVisible(false);
    if (this.active === a) this.active = null;
    this.timer = Phaser.Math.FloatBetween(CIVS.interval[0], CIVS.interval[1]);
  }

  /** For the share card and run end. */
  summary() {
    return { eaten: this.eaten, spared: this.spared };
  }

  massText(obj) {
    return kgText(obj.realKg ?? 0, 1);
  }
}
