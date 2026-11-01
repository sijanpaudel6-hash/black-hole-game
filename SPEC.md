# Black Hole: Event Horizon — Game Spec

Nov 1, 2026 · Sijan Paudel · **Updated after Session F to match the game as built**

## Overview

**You are a newborn black hole. Drag to move, swallow anything smaller than you, and grow from eating gas in the dawn of time to outliving every star.** The main mode is a run: one black hole's life through five eras of cosmic history, about 6–10 minutes long, with a cosmic power to pick at every era change. Satisfying to watch, and lightly educational.

| Item | Decision |
| --- | --- |
| Platforms | Web browser first (desktop + mobile), then Android via Capacitor |
| Orientation | Portrait 9:16 on phones; letterboxed on desktop |
| Engine | Phaser 3 (JavaScript), WebGL renderer, 2D with glow effects |
| Build tool | Vite |
| Language | JavaScript (ES modules); no TypeScript for the prototype |
| Art style | Dark space, glowing amber accretion disk, shapes drawn in code |
| Target device | Runs at 60 fps on a low-end Android phone and loads in under 5 s |

**Modes:**

| Mode | What it is |
| --- | --- |
| **Run** (main, the PLAY button) | "One Life of a Black Hole": one continuous run through five eras, Cosmic Dawn → Far Future. No timer. Pick 1 of 3 cosmic powers at each era change. |
| **Daily Universe** | A run with the same seed for everyone on the same UTC day, a daily modifier and a share card ("Universe #N"). |
| **Milky Way challenge** | A run against the clock: clear Cosmic Dawn → Quasar Era in under 10 minutes. |
| **Classic** | The original 15 fixed levels in 5 tiers, each with a 3-minute timer and a target mass, ending with the Sagittarius A* boss. |
| **Sandbox** | No timer, no danger, spawn any unlocked object, eat big things from the inside. Includes the "What if…?" scenarios, Feed Your Hometown and Cosmic Craft. |

**Rules for every Claude Code session** (paste this doc at the start):

1. Do only the task named for this session; do not add features from later sessions.
2. Keep all tunable numbers in `src/config.js` so balance changes need no code edits.
3. Commit working code to GitHub at the end of the session with a clear message.
4. Keep it playable after every session; never leave the game broken.
5. If something in this spec is unclear, ask before guessing. For anything visual, follow `design/DESIGN.md` and the images in `design/screens/`.
6. **This spec describes the game as built.** Numbers marked *(tuned)* were changed on purpose after playtesting; don't revert them to older values. If you change how the game works, update this file in the same commit.

## Controls and camera

**One input for everything: the black hole moves toward your finger or mouse.**

- **Touch / mouse held down**: the black hole accelerates toward the pointer; releasing lets it drift and slow down.
- **Keyboard (desktop)**: WASD or arrow keys move it; Esc or P pauses.
- **Movement feel**: smooth acceleration and friction, never instant snapping. Max speed shrinks slightly as the black hole grows within a level or era (doubling the radius ≈ 10% slower), so big feels heavy.
- **Camera**: centred on the black hole with a slight, frame-rate-independent lag.
- **Zoom**: the camera zooms out smoothly as the black hole grows, so its on-screen size stays constant (about 8% of screen width). Each tier-up / era change triggers a short, dramatic zoom-out with slow motion.
- **Pause**: button in the bottom-right corner (as in the HUD mockup); the browser tab losing focus also pauses. The clip-record button sits in the top-right corner.

## Growth and eating (all modes)

- **Growth formula**: radius = baseRadius × (mass ÷ baseMass)^(1/3), baseRadius 28 px at baseMass 20. Doubling mass grows the radius by about 26%.
- **Swallow rule**: an object is edible if its radius is below 90% of the black hole's radius. It is swallowed when its centre crosses the black hole's edge.
- **Mass gain** *(tuned)*: swallowing adds **30% of the object's mass value** (`EATING.massGain = 0.3`). At 100% every level was over in 5–20 seconds; 0.3 makes levels and eras last minutes. Scenarios add the full mass of named objects.
- **Pull zone**: edible objects within 3× the black hole's radius (more with Gravity Pull) accelerate toward it, faster the closer they are, and get dragged along so they fall in instead of slingshotting.
- **Bigger objects** (radius larger than yours) have a thin red ring. Touching one bounces you off and costs 10% of current mass (less with Hawking Shield; in runs × the era's gain when below 1), then 0.9 s of protection. Collisions can't push you below 50% of the level/era starting mass.
- Objects too big to eat but not bigger than you just bounce you, with no mass loss.
- **Mass display**: the counter shows kilograms. Game mass maps to kg by log-interpolating between anchors (`MASS_SCALE`): 300 ≈ the Moon, 1,000 ≈ Earth, 3,000 ≈ Jupiter, 10,000 ≈ the Sun. Milestones flash at 1 Moon, Earth, Jupiter and Sun mass, then 10, 1,000 and 1 million Suns. It's a game scale, not physics.

## Run mode: One Life of a Black Hole

**One run is one black hole's life, from the early universe to the far future.** Each era has a mass goal: the next era's starting mass. Reaching it triggers the tier-up moment (slow motion, zoom-out, shockwave, bass drop, banner) and the next era's objects take over. The HUD shows mass with a "Next era" bar, the cosmic age, and the current era with a five-step meter.

| Era | Start mass → goal | Gain *(tuned)* | Situation | Cosmic age shown |
| --- | --- | --- | --- | --- |
| 1. Cosmic Dawn | 20 → 100 | ×2.5 | A primordial black hole in a fog of gas. **Hawking evaporation**: you lose mass unless you keep eating. Stars are faint. | 50 → 200 million years |
| 2. First Stars | 100 → 1,000 | ×0.45 | Protostars and young stars light up the dark; blue giants are dangerous. | 200 million → 1 billion |
| 3. Galaxy Era | 1,000 → 10,000 | ×0.3 | Named rival black holes compete for the same food: outgrow them or flee. | 1 → 3 billion |
| 4. Quasar Era | 10,000 → 100,000 | ×0.22 | Food is everywhere (1.4× objects). Feed fast enough to **ignite as a quasar**. | 3 → 13.8 billion |
| 5. Far Future | 100,000 → (40 s) *(tuned)* | — | The stars are dying: eaten objects stop coming back, the stars fade out, gentle evaporation. Ends with **the last light**. | 10¹⁴ → 10¹⁰⁰ years |

- **Era length** *(tuned)*: each era multiplies mass gained per swallow by its **gain** (`RUN.eras[].gain`, on top of `EATING.massGain`). Measured with the test bot (a greedy player, no powers): Cosmic Dawn ≈ 40 s, First Stars ≈ 55 s, Galaxy Era ≈ 80 s, Quasar Era ≈ 95 s, Far Future 40 s: about 5½ minutes of play for a good player, more like 7–9 for a new one once reading power cards and messages is added. Targets: Cosmic Dawn under 1 minute for a new player, Far Future 30–45 s, a full run 6–10 minutes.
- **Hits scale with the era's gain** *(tuned)*: in runs, the mass lost to a collision is 10% × min(1, gain), so a hit costs about the same number of meals in every era. Without this the low-gain eras became a death spiral (one hit undid five meals).

- **Hawking evaporation** (Cosmic Dawn, gently in the Far Future): mass lost per second = rate × eraStartMass × (eraStartMass ÷ mass)^exponent. Small black holes evaporate faster, like real Hawking radiation. Cosmic Dawn: rate 0.008, exponent 2; at the start you need to swallow roughly one small object every 2–3 seconds to break even. The HUD shows a blinking "Evaporating" warning.
- **Death**: the run ends if you **evaporate** (mass below 50% of the run's starting mass, Cosmic Dawn only) or are **swallowed** by a bigger rival. Far Future evaporation can't kill you; that era always ends in the finale.
- **Quasar ignition** *(tuned)*: gain 10% of your mass within 4 seconds to ignite for 8 seconds: twin jets, a maxed-out disk, 1.8× pull range, then a 6 s cooldown. A "Quasar" meter on the HUD shows how close you are.
- **The last light** (end of the Far Future): everything fades away, the camera pulls back, and the black hole evaporates in little flashes of Hawking radiation until it's gone. Then a real fact: "When the last black holes evaporate, around 10¹⁰⁰ years from now, the universe goes dark."
- **Run end screen**: how far you got (era meter), how long you lived (cosmic age), peak mass, objects eaten, run time, Stardust. Buttons: New run, Revive (rewarded ad, once per run, only after dying), ×2 Stardust (ad), Upgrades, Menu.
- **Revive**: if you evaporated, your mass resets to the era's starting mass; if swallowed, you're moved away from the rival. 3 s of protection.
- **Science cards** in runs: card 1 after your first run, card N on reaching era N. They pop up on the run end screen.
- **Cosmic powers**: see below.

### Cosmic powers (pick 1 of 3 at every era change)

**At each of the four era changes the game pauses after the tier-up moment and offers 3 power cards; tap one.** Picking a power you own levels it up (max level 3). Owning two powers that pair up unlocks a **synergy**. Owned powers show as icons with level pips above the era panel; synergies show in science blue. Numbers live in `POWERS` in `config.js`, words in `src/data/powers.js`.

| Power | Effect (level 1 → 3) |
| --- | --- |
| **Kerr Spin** | Your pull becomes a swirl: objects orbit before falling in. Pull range +20/35/50%; the disk spins faster. |
| **Relativistic Jets** | A JETS button (or Space) fires twin jets along your motion for 0.9 s. They shatter objects up to 2.2/3/4× your size into edible chunks, knock bigger ones back and shrink rivals by 25%. Cooldown 7/5.5/4 s; length 7/9/11× your radius. |
| **Tidal Shredder** | Objects up to 1.35/1.7/2.1× your size crumble into chunks when you pass close (instead of hurting you). |
| **Dark Matter Halo** | Pull range +40/75/110% and pull strength +25/50/75%; a faint ring marks the halo's edge. |
| **Gravitational Lens** | The world slows (to 65/55/45% speed) when you get near something dangerous; you don't. Hidden treasures appear: 8/12/16% of new objects glow blue and give 2.5× mass and 3× Stardust. |
| **Hawking Bloom** | Getting hit releases a burst that blasts hazards away and protects you for 1.4–2.2 s; you lose 30/50/70% less mass. Level 3 adds **Last Gasp**: once per run, a rival about to eat you is blasted away instead. |

| Synergy | Needs | Effect |
| --- | --- | --- |
| **Pulsar Lighthouse** | Kerr Spin + Jets | Jets fire on their own (15% faster cooldown) and sweep a full circle. |
| **Accretion Buzzsaw** | Kerr Spin + Shredder | A spinning saw of debris: shred objects 0.6× bigger, from farther away, and the chunks swirl straight in. |
| **Lensed Jets** | Jets + Lens | Jets are 50% longer and bend toward the nearest big object in front of them. |

- **Offers**: 3 different powers that aren't maxed. 60% of the time one is a power you already own (to level it); 50% of the time, if possible, one completes a synergy. A card that completes a synergy has a blue border and says so; new cards list what they pair with.
- Shattered objects become 4–6 **fragments** (80% of the mass, sized to be edible) that fly outward and get pulled in.
- The run end screen lists the powers you took.

### The Universe Talks Back (civilisations and Galactic News)

**From the Galaxy Era on, inhabited planets hail you as you approach; you choose EAT or SPARE, and the rest of the galaxy remembers.** Numbers in `CIVS` (`config.js`), words in `src/data/civilisations.js` (313 approach messages across 5 tech levels and 11 moods, 48 species, plus 28 last words, 20 thank-yous and fleeing lines, all hand-written and family-friendly).

- **When**: Galaxy Era, Quasar Era and Far Future (life needs the heavy elements earlier stars made). The first one comes 10 s into the era, then one every 20–30 s after the last is dealt with. Only one at a time.
- **The planet**: a rocky planet, moon or gas giant at 50–68% of your size (always edible), drifting toward you, with a pulsing amber beacon ring. A scanner arrow at the screen edge points to it ("SIGNAL") while it's off-screen.
- **The hail**: when your edge is within 6× your radius of theirs, the world slows to 35% and a message card appears (drawn in the canvas so it's in clips): "INCOMING TRANSMISSION", species and planet name, tech level · what they are · mood, the message, and what they offer if spared. Two buttons sit under it: **EAT** (+8% mass · +40 Stardust) and **SPARE** (the boon). A bar counts down 9 s; if you don't choose, the card closes and the planet is just food (eating it still counts as eating a civilisation).
- **Tech levels** (weights per era in `CIVS.techWeights`): Stone age, Industrial, Space age (Galaxy Era on); Star empire, Ancient (Quasar Era on; Ancients are common in the Far Future).
- **Eat**: the planet is hauled straight in (big-swallow close-up), they say their last words, and you get +8% of your mass and +40 Stardust. **Consequences**: every civilisation you eat makes the next ones more likely to be *terrified* or *hostile* (hostile worlds fire up to 4 homing missiles, each a shove and −2.5% mass) and adds a 10% chance (max 40%) that the next one just flees at speed without talking.
- **Spare**: they thank you, drift away under a blue ring (they can't be eaten or hurt you), and give a **boon**: the one they offered, or a random one. Sparing makes later civilisations *hopeful* ("we heard you spare worlds"). Sparing a *hostile* world gives no gift but calls a truce: it forgets one of your past meals.

| Boon | Effect |
| --- | --- |
| Star map | A feast of 14 meals appears 1.4 screens away; a blue arrow points to it for 30 s |
| Hidden neutron star | A small, blazing neutron star appears nearby (arrow); eating it adds 14% of your mass |
| Deflector gift | Your next 2 hits (objects or missiles) cost no mass; a blue ring shows it |
| Fuel offering | +6% mass at once |
| Stardust tribute | +60 Stardust at the end of the run |
| Gravity tuning | +15% pull range for the rest of the run (stacks) |
| Honour guard | Rival black holes keep away for 40 s |

- **Galactic News**: a ticker under the top HUD (in the canvas, so it's in clips; it moves below the mass panel while recording). Pre-written funny headlines (`src/data/news.js`) report what you do: eating or sparing civilisations, big swallows, eating rivals, quasar ignition, synergies, new powers, milestones, era changes. When nothing has happened for 28–40 s an era-flavoured filler runs ("Galactic News will begin as soon as someone invents news"). Each shows 6.5 s; long ones scroll.
- **Hook for later**: `Civs.messageFor()` is the one place a message is chosen, so a live AI message (from a small server, never with a key in the game) can replace it, with this bank as the offline fallback. Choice percentages ("only 14% spared them") need a server too and stay in "Later"; the decision screen is built so a percentage line can be added under the buttons.

## Cosmic events (Session E)

**Short situations from real astrophysics that break up a run, one at a time.** The first comes 22 s into an era, then one every 38–55 s (halved by the "Restless cosmos" daily modifier), never while a civilisation is talking. Each opens with a banner, a scanner arrow and a Galactic News headline. Numbers in `EVENTS` (`config.js`), code in `src/systems/events.js`.

| Event | Eras | What happens |
| --- | --- | --- |
| **Supernova** | 2, 3, 4 | A blue giant (1.6× your size) pulses faster and faster for 3 s, collapses, and explodes: a flash, shockwaves that shove you and everything nearby, a ring of 22 edible debris chunks flying outward, and a neutron star left behind (a hefty meal). |
| **Tidal disruption** | 3, 4, 5 | A star bigger than you is aimed to pass just beside you. It stretches toward you as it nears; inside 2.2× your radius it is shredded into a stream of 16 chunks that swirl into you ("SPAGHETTIFIED!"). |
| **Runaway black hole** | 3, 4, 5 | A black hole 3× your mass races across your path at 7 radii/s for 11 s, tugging on everything (you too). It can eat you. Behind it, a wake of newborn stars you can eat, as seen behind the real runaway black hole RBH-1. |
| **Wormhole** *(theoretical)* | 2, 3, 4 | A swirling portal for 16 s. Get close and it pulls you in; you come out 3.5 screens away next to a feast of 22 meals. Labelled THEORETICAL. |
| **White hole** *(hypothetical)* | 4, 5 | A blinding white disc for 15 s that pushes you away and spits out matter: mostly edible chunks, a quarter of them too big to touch. Labelled HYPOTHETICAL. |
| **Dark matter** | all | 9 invisible clumps, shown only as faint rings of bent starlight (fully visible with the Gravitational Lens power). Each adds 1.5% mass. |
| **Merger chirp** | any | Every time you eat a rival black hole: gravitational-wave rings, a zoom pulse, a shake and a rising "chirp" sound like LIGO's. |

- **As What if…? scenarios** (Sandbox): A star goes supernova, Spaghettify a star, Runaway black hole, Through a wormhole, Meet a white hole, Eat dark matter (plus the existing Two black holes collide for the merger). Each starts at 10 Suns, auto-steers toward food if you don't touch the screen, ends on a real fact (wormholes and white holes say THEORETICAL / HYPOTHETICAL), and can auto-record like the others.
- When the object pool is full (busy eras), events and civilisations reuse the farthest off-screen object instead of failing.

## Cosmic Craft (Session F)

**Collide two things and see what real physics makes.** Sandbox → **Cosmic Craft**. Recipes and words in `src/data/recipes.js`, rules in `src/systems/craft.js`, the lab in `src/scenes/CraftScene.js` + `src/ui/craft.js`.

- **Start with 9 things**: Hydrogen, Dust, Ice, Gas cloud, Gravity, Time, Spin, Light, Dark matter. **44 hand-written recipes**, every one marked **REAL** with a one-line explanation, make **41 more things** (50 in all, every one reachable): elements (helium → beryllium-8 → carbon → oxygen → silicon → iron, water, gold), planets (dust → pebble → planetesimal → rocky planet; comets, gas giants, the Moon, ocean worlds), stars (protostar, star, blue giant, red giant, white dwarf, blue straggler, clusters), deaths (supernova, Type Ia, nova, kilonova, neutron star, pulsar, superbubble), black holes (black hole, spinning black hole, supermassive, quasar, tidal disruption, gravitational waves, photon ring, gravitational lens) and galaxies (spiral, elliptical).
- **How it plays**: tap two items in the tray. They appear on either side of the screen, fly together, spin and collide in the canvas (flash, shockwaves, shake). A match pops the result in the middle with a card: REAL badge, **New discovery** (or "Already found"), the pair, and the real-science line (e.g. "Two neutron stars merging make a kilonova. In 2017 one (GW170817) was seen in both gravitational waves and light."). New things join the tray. An unknown pair bounces apart: "No reaction".
- **Progress**: "Found N / 41" (every thing a recipe can make), saved with the date of each discovery. The Sandbox menu shows your count.
- **Icons**: game objects reuse their textures (stars, planets, comets, neutron stars…); elements are orbs with their symbol; forces, explosions, black holes and galaxies have their own drawn icons.
- **Hook for later**: `imagine()` in `src/systems/craft.js` is where an AI-made result for an unknown pair (marked IMAGINED, saved for every player, "First Discovery" credit) would come from a server. Offline it returns nothing.

## Built to go viral (Session D)

### Daily Universe

**Every UTC day, everyone gets the same universe.** The seed comes from the date (`src/systems/daily.js`), so no server is needed. Universe #1 is 1 Nov 2026 (`DAILY.epoch`).

- The seed drives separate random streams for the power offers, civilisations (species, messages, boons), Galactic News, which object types spawn, and (Session E) cosmic events. Your moves still differ, but the choices you're offered and the worlds you meet come in the same order for everyone, so results are comparable.
- **One modifier per day** (`DAILY.modifiers`): Thick fog (Cosmic Dawn 40% fuller), Crowded galaxy (2× rivals), Chatty galaxy (civilisations call twice as often), Quasar season (ignition 30% easier), Gifted start (a random power at the start), Heavy seed (start 30% heavier), Restless cosmos (events twice as often), Long night (Far Future 50% longer).
- The title screen has a **Daily Universe #N** button showing today's modifier, or your best era once you've played. Replays are allowed; the save keeps today's attempts and best result (furthest era, then biggest mass) and resets the next UTC day.

### Share card

**Every run end screen has "Share your universe", plus [ Copy text ] and [ Save image ].**

- **Text** (WhatsApp, X), Wordle-style: game name and Universe #N (or "Milky Way Challenge"), today's modifier, an emoji strip with one emoji per era (🌑 ⭐ 🌌 💥 🕯️ reached, 💀 where you died, ⬛ not reached), a line like "Ate 3 civilisations, spared 1, became a quasar, lived 13.8 billion years", the Milky Way time if you got there, your powers, and the game's link (`SHARE.url`, or the page it's on).
- **Image** (Instagram, TikTok): a 1080×1920 PNG drawn in code: title, Universe #, result, a black hole, the five-era strip with your death marked, lived until / peak mass / civilisations / quasar / Milky Way time / powers, and "PLAY FREE".
- **Share** opens the phone's share menu with the image and text (Web Share API with files); if files can't be shared it shares the text; if there's no share menu it copies the text. Save image downloads the PNG.

### Milky Way challenge: "Eat the Milky Way in under 10 minutes"

- Started from the title (**Milky Way challenge** button, showing your best time). A normal run, but the HUD's cosmic-age panel becomes a **Milky Way stopwatch** (turns red past 10:00), and the run ends the moment you clear the Quasar Era: "MILKY WAY EATEN · 07:42".
- The clock is game time (it stops while you pick a power or pause; slow-motion moments slow it for everyone).
- The end screen shows your time, whether it's under 10 minutes, and your 3 best times on this device (top 10 kept, `CHALLENGE.boardSize`). In normal runs, clearing the Quasar Era also flashes "MILKY WAY EATEN · mm:ss" and the time goes on the share card.
- **Hook for later**: `submitTime()` in `src/systems/leaderboard.js` is the one place a time is recorded, ready for a global leaderboard behind a small server.

### Feed Your Hometown

- Sandbox → **Feed your hometown** (top of the What if…? list). Type a city or country; matches come from a bundled list of **7,270 cities and 177 countries** from Natural Earth (public domain, credited in `CREDITS.md`), biggest cities first. Cities and countries only, never addresses; what you type is only matched against the list on the device.
- The data (about 100 KB gzipped for places, 19 KB for land outlines) loads only when this screen opens, so it doesn't slow the game's start.
- **The scene**: Earth drawn from Natural Earth's land outlines, turned so your place faces the camera, with an amber marker and its name. A small black hole flies in, the camera zooms onto the place, the black hole sits on it and eats a hole into the globe (debris spiralling in, shake, bass drop), banner "KATHMANDU · SWALLOWED", then the camera pulls back to show Earth with a hole in it and the caption **"Comment your city · I'll feed it next"** (in the canvas, so it's in the clip). It ends on the real fact: "The nearest known black hole, Gaia BH1, is about 1,560 light-years from Kathmandu. Kathmandu is safe." Auto-record works like the other scenarios.

## Classic mode (the original 15 levels)

**Eat → grow → reach the target mass before the 3-minute timer runs out → spend Stardust → next level.** Each level starts at its tier's starting mass (plus Head Start). Time running out fails the level; on fail you keep half the Stardust and can Revive +30 s once (ad).

| Tier | Start mass | Level targets | Can swallow at the start | Dangerous |
| --- | --- | --- | --- | --- |
| 1. Dust Eater | 20 | 50 · 75 · 100 | Dust, ice crystals, pebbles | Small rocks (until ~58), asteroids |
| 2. Rock Crusher | 100 | 200 · 450 · 1,000 | Dust, pebbles, rocks, asteroids | Comets/satellites (until grown), moons |
| 3. World Devourer | 1,000 | 2,000 · 4,500 · 10,000 | Rocks, asteroids, comets, satellites, moons | Dwarf/rocky planets (until grown), gas giants |
| 4. Star Swallower | 10,000 | 20,000 · 45,000 · 100,000 | Satellites, moons, planets, gas giants | Red dwarfs, Sun-like stars (until grown), giant stars |
| 5. Galaxy Eater | 100,000 | 180,000 · 300,000 · **500,000 (boss)** *(tuned)* | Gas giants, red dwarfs, Sun-like and giant stars, cluster stars | Star clusters (scatter when you approach), bigger rivals |

- The last level of each tier ends at the next tier's starting mass, so winning it is the tier-up moment and unlocks a science card.
- Tier 5 targets were lowered *(tuned)* from 250k/500k/1M because Tier 5 meals don't grow as you do, so a 10× target took about 5 minutes.
- **Level 15 boss**: Sagittarius A* sits in the middle and pulls you in. Touch it before reaching 500,000 and you're swallowed; reach the target, then dive in to merge and win the game.
- Spawn rule per tier: about 70% of objects edible at the start, 25% edible after some growth, 5% dangerous all level. The weights live in `TIERS` in `config.js`.

## Objects

**Every object has a size, a mass value and a movement behaviour.** Sizes are chosen so each object becomes edible at a planned black-hole mass. Masses roughly triple per step.

| Object | Mass | Radius (px) | Behaviour |
| --- | --- | --- | --- |
| Dust | 1 | 8 | Drifts slowly |
| Ice crystal | 2 | 10 | Drifts, sparkles |
| Gas wisp *(run)* | 2 | 12 | Drifts (glowing gas) |
| Pebble | 4 | 15 | Drifts |
| Small rock | 10 | 36 | Drifts, slowly spins |
| Gas cloud *(run)* | 10 | 36 | Drifts |
| Asteroid | 30 | 41 | Straight line |
| Protostar *(run)* | 30 | 41 | Drifts, glows |
| Comet | 60 | 52 | Fast, leaves a tail; 2× Stardust |
| Young star *(run)* | 60 | 52 | Drifts, glows |
| Satellite | 90 | 59 | Orbits a point; 2× Stardust |
| Blue star *(run)* | 90 | 59 | Drifts, glows |
| Moon | 300 | 89 | Orbits a point, or orbits a planet |
| Blue giant *(run)* | 300 | 89 | Drifts, glows |
| Dwarf planet | 600 | 112 | Slow orbit |
| Rocky planet | 1,000 | 133 | Sometimes has a moon |
| Gas giant | 3,000 | 192 | Rings and 1–2 moons |
| Red dwarf | 6,000 | 242 | Glows; 0–2 planets orbit it |
| White dwarf *(run)* | 6,000 | 240 | Dim glow (Far Future) |
| Sun-like star | 10,000 | 288 | Bright; pushes small objects outward |
| Cluster star | 10,000 | 200 | Glows |
| Giant star | 30,000 | 415 | Huge, slow |
| Star cluster | 60,000 | 524 | Scatters into 6 cluster stars when you get close |
| Rival black hole | 0.45–1.9× your mass | from its mass | See below |

**Rival black holes** (Classic Tier 5, Galaxy Era, Far Future; at most 4 at once): each has a name (Hungry Hugo, Vera the Void…), shown when you eat it or it eats you. They wander, hunt and eat smaller objects (growing up to 3× the starting mass), chase you if they're big enough to eat you, and flee if you can eat them. A rival eats you if its radius × 0.9 is bigger than yours and your centre gets well inside it. You eat a rival like any other object. They have a violet ring; dangerous ones also get the red ring.

All values live in `config.js` (`OBJECTS`, `RIVAL`, `BOSS`).

## Upgrades and economy

**One currency, Stardust, spent on six upgrades.** Each upgrade has 10 levels; cost rises 1.5× per level.

| Upgrade | Effect per level | Starting cost |
| --- | --- | --- |
| Gravity Pull | +10% pull range | 50 |
| Thrusters | +8% max speed | 50 |
| Head Start | +10% starting mass (levels and runs) | 100 |
| Time Dilation | +10 s on the Classic timer; −8% Hawking evaporation in runs | 75 |
| Hawking Shield | −1% mass lost per hit (10% → 0% at max) | 100 |
| Dark Matter Drip (idle) | +5 Stardust per hour away, capped at 8 hours | 150 |

**Earning rule** *(tuned)*: Stardust = floor(50 × (mass gained + bonus mass) ÷ starting mass), where "starting mass" is the level's or era's starting mass. The original "mass ÷ 10" gave 2 Stardust for level 1 and hundreds of thousands in Tier 5, because game mass spans 20 → 1,000,000. This version is worth about the same in every tier, and a first clear of level 1 (~60) affords the first upgrade (50).

- Satellites and comets count their mass twice (2× bonus).
- Classic: on fail you keep half.
- Runs: each era is scored on its own and summed; nothing is halved (runs always end); reaching the last light gives ×1.5.
- First win/run of the day: ×2. Rewarded ads: ×2 Stardust, Revive, one free upgrade per day.

## Physics and visual effects

**Fake the physics so it looks real and stays fast; no true gravity simulation.**

- Pull zone, swallow, bounce and orbits as above; moons and planets follow simple circles around their parent.
- **Performance**: at most 300 pooled objects (160 free-floating + reserve for moons, scattered stars and busy eras). Objects live within a few screens of the camera; eaten objects and objects left far behind reappear just off-screen. Objects far off-screen are paused.
- **Black hole**: pure black disc, thin bright photon ring, a tilted rotating amber accretion disk (near half passing in front of the disc) that brightens after eating, and a soft glow.
- **Swallow (spaghettification)**: the object stretches toward the centre, shrinks and fades over 0.4 s, with a small flash and debris particles that spiral in.
- **Big swallows** (object ≥ 70% of your size, or any named object): camera close-up, 30% slow motion for 1 s, long stretch, bass drop, flash, shockwave, screen shake. 7 s cooldown.
- **Tier-up / era change**: 25% slow motion, zoom out to 42%, shockwave, banner.
- **Starfield** with three parallax layers; its brightness follows the era (faint in Cosmic Dawn, gone at the end of the Far Future). Each era has its own background tint.
- **Low graphics** (Settings): one star layer, no particles, no glow, simple swallow fade, less shake.
- Later only: a gravitational lensing shader.

## Modes, screens, save data and ads

| Screen | Contents |
| --- | --- |
| Title | Logo, black hole art, **PLAY** (starts a run), Daily Universe #N and Milky Way challenge buttons, best run, [Classic] [Sandbox] [Upgrades] [Settings] |
| HUD (run) | Mass + "Next era" bar, cosmic age, Galactic News ticker, era panel (meter, next era, Evaporating warning, Quasar meter), power icons, JETS button (with cooldown), record, pause; civilisation message card with EAT / SPARE and a countdown; scanner arrows |
| Power pick | Era kicker, "Choose a power", 3 cards (icon, name, NEW / Level N, effect, level pips, synergy hint), your powers |
| HUD (Classic) | Mass + target bar, time left, tier panel, record, pause |
| Run end | Run complete / Run over / Daily Universe #N / Milky Way challenge, (daily: modifier, attempt; challenge: time and best times), Share your universe + [Copy text] [Save image], era reached, cosmic age, peak mass, objects, time, civilisations, Milky Way time, powers, Stardust, New run / Revive / ×2 / Upgrades / Menu |
| Cosmic Craft | Found N / 41, the two picks, result card (REAL, New discovery, why), tray of discovered things, [Clear] |
| Feed your hometown | Search box, up to 8 matching cities/countries, note that only cities and countries are listed |
| Classic level select | Star chart: tiers bottom to top, locked levels greyed, selected level bar, "Enter event horizon" |
| Level complete / failed | Stats, Stardust, next-upgrade progress, Next / Retry, ad buttons |
| Upgrade shop | Six upgrade cards with level, effect, cost; free upgrade via ad; launch run or level |
| Science card / log | Title, short real fact, diagram, tags, close; the log lists all five cards |
| Settings | Music, sound effects, Low graphics, auto-record scenarios, language (English), reset progress |
| Sandbox menu | Free play (choose starting tier), Feed your hometown, 11 "What if…?" scenarios, auto-record toggle |

- **Sandbox** unlocks after clearing Classic level 3 **or** reaching First Stars in a run.
- **Save data** (localStorage, wrapped in try/catch): Cosmic Craft discoveries, Classic levels cleared, Stardust, upgrade levels, science cards, settings, last-played time (idle earnings), daily-bonus dates, runs played/completed, best era, best run mass, today's Daily Universe (attempts, best), Milky Way challenge best times. Saved after every level/run and when the tab is hidden.
- **Ad hooks**: `showRewardedAd(onReward)` in `src/systems/ads.js` shows a placeholder and rewards after 1 s. Swap a real SDK in later behind that one function. Ads are always optional.
- **Testing shortcuts**: `?unlockall` (every level, sandbox and card, not saved) and `?reset` (wipe the save). In `npm run dev` only (or a `vite build --mode bot` test build): `?bot` lets a simple autopilot play (`src/systems/autopilot.js`, used to measure era lengths), `?era=3` starts a run at era 3, `?powers=jets,kerrSpin` grants powers.

## Built for YouTube Shorts

**Every session should be able to produce a clip that hooks a stranger in the first 3 seconds.** Built:

- **Clip recorder**: the record button captures the canvas plus sound and saves the last ~20–30 s as a 9:16 WebM. WebM can't be trimmed in the browser, so overlapping recorders restart every 10 s and the newest one that is at least 20 s old is saved. While recording, the HTML HUD is replaced by an in-canvas overlay: big mass counter starting 14% from the top, watermark ending 86% down. Only the REC indicator and its Save button are HTML, so they aren't in the clip. Clips end on a dark frame so they loop.
- **Named-object labels** with real masses ("EARTH · 5.97 × 10²⁴ kg") and swallow labels next to the black hole.
- **Big-swallow close-up**, milestones, the tier-up / era zoom-out, quasar ignition and the last-light finale are all clip moments.
- **Sound** is synthesised with Web Audio: rumble rising with pull, swallow whoomps, bass drops, collision thuds, a quiet ambient music pad. Sound is included in clips.
- **"What if…?" scenarios** (Sandbox): Black hole vs Earth, vs the Sun, Eat the Solar System, Two black holes collide, Tiny vs Sagittarius A*, plus the cosmic events (supernova, spaghettify a star, runaway black hole, wormhole, white hole, dark matter) and Feed Your Hometown. Each opens with a caption, tracks real kilograms, ends with a real fact on a dark frame, and can auto-record.

## Technical requirements and file structure

- Phaser 3 + Vite; `npm run dev` to play locally, `npm run build` for a static `dist/` (about 1.5 MB). Every push to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
- No external server or login. Fonts are bundled with `@fontsource` (Barlow Condensed, IBM Plex Sans, Space Mono). Everything visual is drawn in code; any asset file goes in `public/assets/` with its licence in `CREDITS.md`.
- Resolution: designed at 720×1280, scaled to fit. Menus and the normal HUD are HTML laid out at 390 px wide and scaled over the canvas; anything that must appear in clips is drawn in the canvas.

```
black-hole-game/
├── index.html
├── SPEC.md · CREDITS.md · README.md
├── design/                 DESIGN.md, screens/, html/
├── public/assets/
└── src/
    ├── main.js             Phaser setup, fonts, start-up
    ├── config.js           every tunable number (eras, tiers, objects, economy, effects…)
    ├── flow.js             moving between screens and scenes
    ├── scenes/             TitleScene (menus), GameScene (run/classic/sandbox/scenario), ShopScene, UIScene (in-canvas overlay), CraftScene
    ├── objects/            BlackHole, SpaceObject
    ├── systems/            run (eras), powers, civs, news, events, craft, craftTextures, daily, rng, share, leaderboard, globe, spawner, effects, textures, audio, recorder, scenarios, save, economy, ads, format, starfield, autopilot (dev bot)
    ├── data/               levels, scienceCards, scenarios, rivals, powers, civilisations, news, recipes, places + land (Natural Earth)
    └── ui/                 HTML menus and HUD: dom, menus, hud, overlays, powerPick, hometown, craft, shop, scienceCard, icons, styles.css
```

## Build order

**Original prototype and core game (done):**

- [x] Session 1 – Project + movement
- [x] Session 2 – Eating and growing
- [x] Session 3 – Tiers, danger and zoom
- [x] Session 4 – Look and feel
- [x] Session 5 – Shorts toolkit
- [x] Session 6 – Stitch screens
- [x] Session 7 – Economy
- [x] Session 8 – Levels 1–9
- [x] Session 9 – Levels 10–15 (rivals, boss)
- [x] Session 10 – Sandbox, scenarios, idle earnings, ad hooks
- [x] Session 11 – Polish and performance

**Making it fun** (from *Making Black Hole Event Horizon Fun — Researched Ideas*):

- [x] **Session A – Runs and eras.** One run through five eras with Hawking evaporation in Cosmic Dawn, era changes using the tier-up moment, quasar ignition, the last-light finale. Fixed levels kept as Classic.
- [x] **Session B – Cosmic powers.** Pick 1 of 3 at each era change; six powers with 3 levels, three synergies, HUD icons, JETS button. Run length retuned to 6–10 minutes. **→ Playtest gate: do runs feel different from each other?**
- [x] **Session C – The Universe Talks Back.** Civilisation planets with eat/spare choices, boons and consequences (fear, hostility, fleeing, hope), 365 hand-written lines, Galactic News ticker.
- [x] **Session D – Go viral.** Daily Universe (UTC-date seed, daily modifier), share card (text + 9:16 image, share menu with copy/download fallback), Feed Your Hometown (Natural Earth cities and countries), Milky Way challenge with local best times.
- [x] **Session E – Cosmic events.** Supernova, tidal disruption, runaway black hole, wormhole (theoretical), white hole (hypothetical), dark matter, merger chirp; as random run events and six new What if…? scenarios.
- [x] **Session F – Cosmic Craft (real recipes).** A collision lab in Sandbox: 9 starting things, 44 REAL recipes, 41 things to discover (50 in all), discoveries saved.

- [ ] **Later – Live features** (need a small server and an AI account with a key you set up yourself; nothing in the game holds a key). Hooks are ready: choice percentages under the EAT / SPARE buttons (`Civs.choose`), a global Milky Way leaderboard (`submitTime` in `leaderboard.js`), AI-imagined Cosmic Craft results with shared First Discovery credit (`imagine` in `craft.js`), live AI civilisation messages (`Civs.messageFor`), Mission Control's rare lines. Each must keep working offline with today's behaviour as the fallback.

How to start each session, ready to paste:

> Here is the game spec (SPEC.md in the repo). We are on **Session X – [name]**. Only do that session's task. Keep tunable numbers in config.js. When done, make sure the game runs with `npm run dev`, update SPEC.md if the game changed, then commit with a clear message.

## Out of scope for now

**Not in the first release; add only after players ask for it.**

- Full 3D graphics or a real gravity simulation
- Multiplayer, online leaderboards, accounts or login (until the "Later – Live features" step)
- Real ads SDK and in-app purchases (come in the platform-build phase)
- Gravitational lensing shader
- Prestige / new-universe reset
- Skins and cosmetics shop
- iOS build, Steam build
- Languages other than English

## Decisions log

**Choices made while building Sessions B–F without stopping to ask, and why.** Change any of them freely; most are a number in `config.js`.

### Session B – Cosmic powers

- **Picks happen at the 4 era changes only, not at the start of a run.** Cosmic Dawn is under a minute and teaches the basics (move, eat, don't evaporate); the first choice arrives right when the game opens up. Four picks with 3 levels each means a run can max one power, or spread across four, so runs differ.
- **The game pauses for the pick** (instead of slow motion) so new players can read the cards on a small phone. The pick comes 1.6 s after the tier-up moment so the era-change spectacle isn't cut short.
- **Jets use a dedicated JETS button** (bottom right, above pause; Space on desktop), not a tap on the play area: on a phone the whole screen is already "hold and drag to move", so a tap gesture would fight steering. Jets fire along your direction of motion, so aiming is just steering.
- **Pulsar Lighthouse makes jets automatic** as well as sweeping, which is what makes it feel like a lighthouse and gives the synergy a clear "wow, it changed how I play" moment.
- **Gravitational Lens slows the world, not you.** Slowing everything (you included) wouldn't help you dodge; slowing only the world is a real bullet-time advantage and shows "time slows near mass" on screen. "Hidden objects appear" became **treasures**: with the Lens, some new objects glow blue and are worth extra.
- **Hawking Bloom triggers on hits** (the moment you lose mass), not on evaporation, which is continuous and would fire constantly. Level 3's Last Gasp gives one survivable mistake per run, which suits the "one life" structure.
- **Era length is tuned with a per-era `gain`** rather than new goals, so era masses (and every object size that depends on them) stay the same. Cosmic Dawn gets ×2.5 (it was ~3 minutes, now ~40 s), later eras get less than ×1 (they were over in 20–40 s once big objects became edible). Collision losses scale down with the gain so low-gain eras don't turn into a death spiral. Far Future went from 75 s to 40 s. A dev-only autopilot (`?bot`) measured the times; real players will be a bit slower, so the bot's ~6 minutes should land around 7–9 minutes for people.
- **Quasar ignition threshold lowered** from 12% to 10% of your mass in 4 s, because the lower Quasar Era gain made ignition rarer.

### Session C – The Universe Talks Back

- **Civilisations start in the Galaxy Era.** Life needs heavy elements made by earlier generations of stars, so planets with people in Cosmic Dawn or First Stars would teach the wrong thing. It also means the first half of a run is about learning to eat and the second half adds moral choices.
- **The world slows instead of pausing** while a message is up: you can keep steering (and dodge missiles), and the moment stays part of the action in a recorded clip. 9 s is enough to read ~25 words on a phone.
- **The message card is drawn in the canvas; the EAT / SPARE buttons are HTML.** That way the clip shows exactly what the aliens said (the shareable moment) without buttons, and the buttons stay crisp and tappable.
- **Ignoring them isn't a third option with its own reward**: the card closes and the planet becomes ordinary food. Eating it still counts as eating a civilisation, so you can't dodge the consequences by not choosing.
- **Eating is always worth it in the moment (+8% mass, +40 Stardust) and sparing is worth it later (a boon)**, so neither choice is "correct". Consequences are about the rest of the run: eaters face fear, missiles and fleeing planets; sparers get hopeful worlds. Sparing a hostile world calls a truce (forgets one meal) instead of a gift, so there's a way back from a bad reputation.
- **Missiles are a nuisance, not a killer** (−2.5% mass, a shove), in keeping with a family-friendly tone and short runs.
- **Galactic News runs in every era**, with jokes in the early eras about there being no one to report yet, so the ticker teaches players to look at it before civilisations appear.
- **Headlines are about your deeds, never about real people or places.**

### Session D – Go viral

- **The daily seed uses the UTC date**, so everyone in the world shares a universe at the same moment (like Wordle's global puzzle), and **Universe #1 is 1 Nov 2026**, the date of the ideas doc.
- **Separate seeded streams per system** (powers, civilisations, news, spawns, events). With one shared stream, the order of random calls would depend on how fast you play and everyone's universe would drift apart within seconds.
- **Daily replays are allowed** (it's a free web game and replays are fun), but the run end screen says which attempt it is and the share card is the same format either way. Honest comparison relies on players, as with Wordle.
- **One modifier per day** makes days feel different and gives the share card a talking point ("Crowded galaxy was brutal today").
- **"Eat the Milky Way" means clearing the Quasar Era.** The game's mass scale tops out far below a real galaxy (the Milky Way is ~10⁴² kg), so the challenge is framed as eating your way through the galaxy's eras, not as a mass target. The clock is game time so pauses and the power pick don't count against you.
- **Challenge best times are local** and the leaderboard is a clean hook (`submitTime`), because a global leaderboard needs a server (stays in "Later").
- **Share uses the Web Share API with an image file when the phone supports it**, falls back to text sharing, then to copying the text; Save image always works. The image is drawn with the 2D canvas API (not a screenshot of the game) so it looks the same on every device and stays small.
- **Feed Your Hometown uses Natural Earth** (public domain, no attribution required, though it's credited) instead of GeoNames (CC BY): simpler licence, and it includes country label points and land outlines, so the globe shows the real coastline around your city. 7,270 places covers capitals, big cities and many towns; the search also matches countries for smaller places.
- **The hometown ends on a reassuring real fact** (Gaia BH1 is 1,560 light-years away, so your city is safe), which keeps it family-friendly and educational after a dramatic clip.
- **The "Comment your city" call to action is drawn in the canvas** at the end of the scene so it's in the saved clip, which is the whole point of the comment-driven loop.

### Session E – Cosmic events

- **One event at a time, never during a civilisation's message**, so each is readable on a phone and gets its own moment in a clip. 38–55 s apart means 1–2 per era: enough surprise without turning runs into chaos.
- **Each era gets the events that fit it**: no planets or runaway supermassive black holes in First Stars, no supernovae in the Far Future (no big young stars left); dark matter is everywhere, as in reality.
- **Every event is a feast with a twist** (debris, a stream, a wake of stars, a portal to food, spat-out chunks), so events help as often as they threaten, which keeps the 6–10 minute run length.
- **The runaway black hole can eat you** and keeps flying straight after its 11 s, so it never turns into a rival that hunts you down.
- **Wormholes and white holes are always labelled** THEORETICAL / HYPOTHETICAL on screen, in the banner and in their scenario's fact, so the game never presents them as real.
- **Dark matter is drawn as Einstein rings**, which is how astronomers actually find it (by the light it bends), and the Gravitational Lens power reveals it fully: a nice link between Sessions B and E.
- **Real-science anchors**: RBH-1 (JWST, 2026) for the runaway, AT2019qiz for the tidal disruption, LIGO's chirp for mergers.

### Session F – Cosmic Craft

- **A lab, not physics-flinging in free play.** Infinite Craft's appeal is picking two things and seeing what happens; aiming collisions with a black hole that eats everything would hide that. The collision still plays out in the game canvas (fly together, flash, shockwave), so it looks like the game and can be recorded.
- **Forces are items** (Gravity, Time, Spin, Light), as in Infinite Craft, because many real processes aren't two objects bumping: a gas cloud + gravity makes a protostar, a star + time makes a red giant, a neutron star + spin makes a pulsar.
- **Every recipe is REAL and explained in one line**, with real events where possible (GW170817, GW200105, LIGO 2015, the EHT image of M87*, ZTF SLRN-2020, Theia). The Moon's giant impact is described as "most likely", because it is the leading explanation, not certain.
- **Unknown pairs just don't react** instead of getting a made-up answer. IMAGINED results need an AI on a server (no keys in the game), so `imagine()` is the hook for "Later".
- **"New discovery" is per player for now**; a shared "First Discovery" credit across all players needs a server too.
- **Everything is reachable from the starting 9** (checked by a script that walks the recipes), so no dead ends.

