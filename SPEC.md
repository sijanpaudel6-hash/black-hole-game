# Black Hole: Event Horizon — Game Spec

Nov 1, 2026 · Sijan Paudel

## Overview

**You are a newborn black hole. Drag to move, swallow anything smaller than you, and grow from eating dust to eating galaxies.** Sessions are short (2–5 minutes per level), satisfying to watch, and lightly educational.

| Item | Decision |
| --- | --- |
| Platforms | Web browser first (desktop + mobile), then Android via Capacitor |
| Orientation | Portrait 9:16 on phones; letterboxed on desktop |
| Engine | Phaser 3 (JavaScript), WebGL renderer, 2D with glow effects |
| Build tool | Vite |
| Language | JavaScript (ES modules); no TypeScript for the prototype |
| Art style | Dark space, glowing orange-purple accretion disk, simple shapes and free assets |
| Target device | Runs at 60 fps on a low-end Android phone and loads in under 5 s |

**Rules for every Claude Code session** (paste this doc at the start):

1. Do only the task named for this session; do not add features from later sessions.
2. Keep all tunable numbers in `src/config.js` so balance changes need no code edits.
3. Commit working code to GitHub at the end of the session with a clear message.
4. Keep it playable after every session; never leave the game broken.
5. If something in this spec is unclear, ask before guessing. For anything visual, follow `design/DESIGN.md` and the images in `design/screens/`.

## Controls and camera

**One input for everything: the black hole moves toward your finger or mouse.**

- **Touch / mouse held down**: the black hole accelerates toward the pointer position; releasing lets it drift and slow down.
- **Keyboard (desktop, optional)**: WASD or arrow keys move it in that direction.
- **Movement feel**: smooth acceleration and friction, never instant snapping. Max speed shrinks slightly as the black hole grows, so big feels heavy.
- **Camera**: always centred on the black hole, with slight lag for smoothness.
- **Zoom**: the camera zooms out smoothly as the black hole grows, so its on-screen size stays roughly constant (about 8% of screen width). Each new tier triggers a short, dramatic zoom-out.
- **Pause**: button in the top-right corner; the browser tab losing focus also pauses.

## Core loop

**Eat → grow → reach the level goal → spend mass on upgrades → start the next level stronger.**

1. A level starts with the black hole at the size its tier begins with, surrounded by objects in a large circular play area.
2. The player swallows smaller objects; each adds mass. Mass sets the black hole's radius.
3. Objects bigger than the player are dangerous: touching one bounces the black hole away and costs 10% of current mass.
4. The level ends when the player reaches the target mass (win) or the timer runs out (fail). Timer: 3 minutes in the prototype.
5. On win, mass eaten this level converts into **Stardust**, the upgrade currency. On fail, the player keeps half the Stardust.
6. Between levels, the player buys upgrades, then starts the next level.
7. Clearing the last level of a tier unlocks the next tier: a bigger starting size, bigger objects, and a new science card.

Growth formula (keep in `config.js`): radius = baseRadius × (mass ÷ baseMass)^(1/3). Cube root means doubling mass grows the radius by about 26%, which keeps growth steady rather than explosive.

## Size tiers

**Five tiers, three levels each (15 levels).** The prototype only needs Tier 1 and Tier 2; the rest come in the core-game phase.

| Tier | You start as | Can swallow | Dangerous (bigger than you) | Levels | Science card unlocked |
| --- | --- | --- | --- | --- | --- |
| 1. Dust Eater | Microscopic black hole | Dust, ice crystals, pebbles, small rocks | Asteroids | 1–3 | What is a black hole? |
| 2. Rock Crusher | Small asteroid-sized | Rocks, asteroids, comets, satellites | Moons | 4–6 | The event horizon |
| 3. World Devourer | Moon-sized | Moons, dwarf planets, rocky planets | Gas giants | 7–9 | Spaghettification |
| 4. Star Swallower | Gas-giant-sized | Gas giants, red dwarfs, Sun-like stars | Giant stars | 10–12 | Hawking radiation |
| 5. Galaxy Eater | Stellar-mass black hole | Giant stars, star clusters, nebulae, other black holes | Supermassive black hole (final boss) | 13–15 | Sagittarius A* |

Spawning rule: in each level, about 70% of objects are edible at the start, 25% become edible as you grow mid-level, and 5% stay dangerous all level. Objects respawn off-screen so the play area never empties.

The tiers are a game simplification, not real astrophysics: real black holes do not grow this way. The science cards say so.

## Objects

**Every object has a size, a mass value and a movement behaviour; the player can eat it only if its radius is below 90% of the black hole's radius.** Masses roughly triple per step so each tier feels like a jump.

| Object | Tier | Mass value | Behaviour |
| --- | --- | --- | --- |
| Dust | 1 | 1 | Drifts slowly |
| Ice crystal | 1 | 2 | Drifts, sparkles |
| Pebble | 1 | 4 | Drifts |
| Small rock | 1 | 10 | Drifts, slowly spins |
| Asteroid | 2 | 30 | Moves in a straight line |
| Comet | 2 | 60 | Fast, leaves a tail |
| Satellite | 2 | 90 | Orbits a point; bonus Stardust |
| Moon | 3 | 300 | Orbits a planet |
| Dwarf planet | 3 | 600 | Slow orbit |
| Rocky planet | 3 | 1,000 | Has moons orbiting it |
| Gas giant | 4 | 3,000 | Has rings and moons |
| Red dwarf | 4 | 6,000 | Glows; planets orbit it |
| Sun-like star | 4 | 10,000 | Bright; pushes small objects outward |
| Giant star | 5 | 30,000 | Huge, slow |
| Star cluster | 5 | 60,000 | Group of stars that scatter when you approach |
| Rival black hole | 5 | 100,000 | Also eats objects; can eat you if bigger |
| Supermassive black hole | 5 | Boss | Final level: pulls you in; grow big enough to merge |

All mass values live in `config.js`. Tune them by playtesting, not by guessing.

## Upgrades and economy

**One currency, Stardust, earned from mass eaten and spent on six upgrades.** Each upgrade has 10 levels; cost rises 1.5× per level.

| Upgrade | Effect per level | Starting cost (Stardust) |
| --- | --- | --- |
| Gravity Pull | Pulls nearby edible objects toward you from 10% farther | 50 |
| Thrusters | +8% max speed | 50 |
| Head Start | Begin each level with +10% mass | 100 |
| Time Dilation | +10 seconds on the level timer | 75 |
| Hawking Shield | Lose 1% less mass when hitting a bigger object (10% → 0% at max) | 100 |
| Dark Matter Drip (idle) | Earn Stardust while away: +5 per hour, capped at 8 hours | 150 |

Earning rule: Stardust earned = mass eaten in the level ÷ 10, rounded down. Satellites and comets give a 2× bonus. Daily first win gives a 2× bonus.

Balance targets for playtesting: a new player should afford their first upgrade after level 1, and clear Tier 1 in about 10 minutes.

## Physics and visual effects

**Fake the physics so it looks real and stays fast; do not run a true gravity simulation.**

Physics rules:

- **Pull zone**: edible objects within 3× the black hole's radius (more with Gravity Pull) accelerate toward it, faster the closer they are.
- **Swallow**: when an edible object's centre enters the black hole's radius, it plays the swallow animation and its mass is added.
- **Bigger objects**: not pulled; collision pushes the black hole back and costs mass.
- **Orbits**: moons and planets follow simple circular paths around their parent; no N-body physics.
- **Performance cap**: at most 300 active objects; objects far off-screen are paused.

Visual effects, in build order:

1. **Black hole**: a pure black circle with a thin bright ring (photon ring).
2. **Accretion disk**: a rotating orange-purple glowing ring around it, brighter right after eating.
3. **Swallow animation (spaghettification)**: the object stretches toward the centre, shrinks and fades over about 0.4 s, with a small flash.
4. **Particles**: debris trails from eaten objects, sparkles for Stardust.
5. **Screen shake** when eating something big; **slow-motion moment** when entering a new tier.
6. **Starfield background** with parallax layers.
7. Later only: a gravitational lensing shader that bends the background around the black hole.

Every effect must have a "Low graphics" off switch.

## Modes, screens, save data and ads

**Two modes:** *Levels* (the main game above) and *Sandbox* (no timer, no danger, spawn any unlocked object by tapping a menu, eat freely). Sandbox unlocks after level 3.

**Screens** (designs are in `design/screens/`; rules in `design/DESIGN.md`):

| Screen | Contents |
| --- | --- |
| Title | Logo, Play, Sandbox, Settings |
| Level select | Tiers as a vertical path; locked levels greyed out |
| HUD | Top: mass counter + bar to target mass, timer. Bottom: pause. Keep the middle clear |
| Level complete | Mass eaten, Stardust earned, "Double it" ad button, Next |
| Level failed | Stardust kept, "Revive +30 s" ad button, Retry |
| Upgrade shop | Six upgrade cards with level, effect, cost |
| Science card | Title, 2–3 sentence fact, illustration, Close |
| Settings | Music, sound effects, Low graphics, language (English first) |

**Save data** (browser localStorage; Android uses the same via Capacitor): highest level reached, Stardust balance, upgrade levels, unlocked science cards, settings, last-played timestamp (for idle earnings). Save after every level and when the tab is hidden. Wrap all storage reads and writes in try/catch so the game still runs if storage is blocked.

**Ad hooks** (prototype: buttons only, no real ads): write one function, `showRewardedAd(onReward)`, that for now just calls `onReward()` after a 1-second fake delay. Later sessions swap in the CrazyGames, Poki or AdMob SDK behind that one function. Rewarded ads are always optional: double Stardust, revive, one free upgrade per day. No forced ads in the prototype.

## Built for YouTube Shorts

**Every play session should be able to produce a clip that hooks a stranger in the first 3 seconds and makes them rewatch.** Shorts viewers decide within about 3 seconds whether to stay, 15–30 second clips tend to get higher completion, loops push rewatches, and text must sit in the central ~75% of a 9:16 frame so YouTube's buttons don't cover it ([JoinBrands](https://joinbrands.com/blog/youtube-shorts-best-practices/)). The game is designed around those facts.

### 1. Hook moments the game creates on purpose

- **Instant action**: every level and scenario starts mid-feast, with something edible already being pulled in. No intro, no menu in shot.
- **A "big swallow" within 3 seconds**: in Shorts scenarios a large object (Earth, the Moon, Jupiter) is placed right beside the black hole at the start.
- **Spaghettification close-up**: on big swallows the camera pushes in, time slows to 30% for ~1 second, the object stretches into a thread, then a bass-heavy flash and screen shake.
- **Real names on screen**: when you eat a named object, a bold label pops up ("EARTH – 5.97 × 10²⁴ kg"). Viewers recognise Earth; a grey circle hooks no one.
- **Numbers going up**: a large mass counter that ticks up fast and flashes on milestones ("1 EARTH MASS", "1 SUN MASS").
- **Tier-up zoom-out**: the camera pulls back to show how tiny the last thing you ate was. Size comparison is the most shareable moment in the game.

### 2. "What if…?" scenarios (Sandbox presets)

One tap loads a ready-made, clip-sized scene, each built to be a 15–30 second Short with a title already written:

| Scenario | What happens | Suggested Short title |
| --- | --- | --- |
| Black hole vs Earth | A small black hole falls into Earth and eats it from the inside | What if a black hole hit Earth? |
| Black hole vs the Sun | The black hole tears the Sun into a glowing spiral | A black hole eats the Sun |
| Eat the whole Solar System | Mercury to Neptune, in order, at speed | Eating the Solar System in 20 seconds |
| Two black holes collide | A merger with a shockwave flash | When two black holes collide |
| Tiny vs supermassive | Your black hole vs Sagittarius A* | The biggest black hole in our galaxy |

Scientific note on each scenario card: it is dramatised for fun, with one real fact shown at the end. That fact is the payoff that earns comments.

### 3. Clip mode (in-game recorder)

- **Clip button** (top corner, hidden while recording): saves the **last 20 seconds** of gameplay as a vertical 9:16 video file, using the browser's canvas capture (`canvas.captureStream` + `MediaRecorder`, WebM). On Android, save to the gallery.
- **Clean HUD while recording**: hides pause, timer and buttons; keeps only the big mass counter and object labels, all inside the central 75% safe area.
- **Watermark**: small game name + "Play free – link in bio" in the lower-middle, inside the safe area.
- **Loop-friendly ending**: clips end on a dark frame right after a swallow flash, which cuts cleanly back to the starting frame.
- **Optional caption**: the scenario's title text appears in the first 2 seconds as large bold text.

### 4. Sound built for clips

- A deep rumble that rises as objects get pulled in, a crunch or "whoomp" on each swallow, and a bass drop on big swallows and tier-ups. Satisfying sound on its own keeps people watching.
- Keep music quiet under the effects so you can still lay trending audio over the clip in YouTube's editor.

### 5. Posting checklist for each Short

- [ ] Biggest moment in the first 3 seconds (use a "What if…?" scenario)
- [ ] 15–30 seconds long, ending on a loopable frame
- [ ] Title asks a question ("What if…?") or promises a payoff
- [ ] One real space fact in the description or on screen at the end
- [ ] Link to the free web game in the description and channel bio
- [ ] Post on a schedule you can keep, e.g. three times a week; reuse the same clip on TikTok and Instagram Reels

## Technical requirements and file structure

**Small, plain and easy to hand between sessions.**

- Phaser 3 + Vite; `npm run dev` to play locally, `npm run build` to produce a static `dist/` folder for web portals.
- Total download under 10 MB for the web build; no external server or login.
- Shapes and glows drawn in code where possible; any image or sound files go in `public/assets/` with their licence noted in `CREDITS.md`.
- Resolution: design at 720×1280, scale to fit any screen.
- Test in Chrome on desktop and on a real low-end Android phone after every session.

File structure:

```
black-hole-game/
├── index.html
├── package.json
├── SPEC.md              ← this document
├── CREDITS.md
├── design/              ← DESIGN.md, screens/, html/ (from Stitch)
├── public/assets/
└── src/
    ├── main.js          ← Phaser game setup
    ├── config.js        ← every tunable number (masses, speeds, costs, tiers)
    ├── scenes/
    │   ├── TitleScene.js
    │   ├── GameScene.js
    │   ├── ShopScene.js
    │   └── UIScene.js   ← HUD drawn over GameScene
    ├── objects/
    │   ├── BlackHole.js
    │   └── SpaceObject.js
    ├── systems/
    │   ├── spawner.js
    │   ├── save.js
    │   └── ads.js       ← showRewardedAd()
    └── data/
        └── scienceCards.js
```

## Build order

**One task per Claude Code session; play the game after each one before starting the next.** Sessions 1–5 are the prototype (Weeks 1–2); 6–11 are the core game (Weeks 3–6). Session 5 comes early on purpose, so you can post Shorts while you build.

- [ ] **Session 1 – Project + movement.** Set up Phaser + Vite and the file structure. Black hole moves toward pointer with smooth acceleration; starfield background; camera follows.
- [ ] **Session 2 – Eating and growing.** Spawner for Tier 1 objects, pull zone, swallow rule, mass → radius formula, objects respawn off-screen, mass counter on screen.
- [ ] **Session 3 – Tiers, danger and zoom.** Tier 2 objects, bigger-object collision penalty, camera zoom as you grow, tier-up moment, level timer and win/fail.
- [ ] **Session 4 – Look and feel.** Accretion disk glow, spaghettification animation, particles, screen shake, Low graphics toggle. **→ Playtest gate: fun in 30 seconds?**
- [ ] **Session 5 – Shorts toolkit.** Clip button (saves the last 20 s as 9:16 video), clean recording HUD inside the safe area, watermark, named-object labels, big-swallow slow-motion close-up, swallow sounds, and the first scenario: "Black hole vs Earth".
- [ ] **Session 6 – Stitch screens.** Build the title, level select, HUD, level complete/failed, upgrade shop and science card screens to match `design/DESIGN.md` and `design/screens/`.
- [ ] **Session 7 – Economy.** Stardust, upgrade shop, all six upgrades, save/load.
- [ ] **Session 8 – Levels 1–9.** Level select, Tiers 1–3 content, science cards 1–3.
- [ ] **Session 9 – Levels 10–15.** Tiers 4–5, rival black holes, final boss, science cards 4–5.
- [ ] **Session 10 – Sandbox, scenarios, idle earnings, ad hooks.** Sandbox mode, the remaining "What if…?" scenarios, Dark Matter Drip, `showRewardedAd()` placeholders.
- [ ] **Session 11 – Polish and performance.** Music, settings, test on a low-end phone, fix lag, check clip recording on Android. **→ Gate: smooth on a cheap phone, no major bugs.**

How to start each session, ready to paste:

> Here is the game spec (SPEC.md in the repo). We are on **Session N – [name]**. Only do that session's task. Keep tunable numbers in config.js. When done, make sure the game runs with `npm run dev`, then commit with a clear message.

## Out of scope for now

**Not in the first release; add only after players ask for it.** Saying no to these is what keeps the build inside your $100.

- Full 3D graphics or a real gravity simulation
- Multiplayer, online leaderboards, accounts or login
- Real ads SDK and in-app purchases (come in the platform-build phase)
- Gravitational lensing shader
- Prestige / new-universe reset
- Skins and cosmetics shop
- iOS build, Steam build
- Languages other than English
- Story, characters or dialogue
