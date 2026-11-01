# Black Hole: Event Horizon

You are a newborn black hole. Drag to move, swallow anything smaller than you, and grow
from eating dust to eating galaxies. A Phaser 3 + Vite web game.
See `SPEC.md` (gameplay) and `design/DESIGN.md` (visuals).

**Play:** https://sijanpaudel6-hash.github.io/black-hole-game/
(every push to `main` rebuilds and redeploys it; one-time setup: repo
**Settings → Pages → Source: GitHub Actions**).

```bash
npm install
npm run dev      # play locally at http://localhost:5173 (add `-- --host` to test on a phone on the same Wi-Fi)
npm run build    # static build in dist/
```

## What's in the game

- **Levels:** 15 levels in 5 tiers (Dust Eater → Rock Crusher → World Devourer →
  Star Swallower → Galaxy Eater), a 3-minute timer, and a target mass. Things bigger
  than you have a red ring: touching one bounces you off and costs 10% of your mass.
  Level 15 is the boss: grow to the target, then dive into Sagittarius A* to merge.
- **Tier-up moment:** the last level of each tier ends with slow motion and a dramatic
  zoom-out, and unlocks a science card.
- **Stardust and upgrades:** six upgrades (Gravity Pull, Thrusters, Head Start, Time
  Dilation, Hawking Shield, Dark Matter Drip idle income), 10 levels each.
- **Sandbox** (after level 3): no timer, no danger, spawn any unlocked object, and sit
  inside big things to eat them from the inside.
- **"What if…?" scenarios:** Black hole vs Earth, vs the Sun, Eat the Solar System, Two
  black holes collide, Tiny vs supermassive. Each is a ready-made 15–30 s clip that ends
  with a real fact.
- **Clip recorder:** the red ● button records the canvas (with sound) and saves about
  the last 20 s as a 9:16 WebM. While recording, the HUD switches to a clean overlay
  (big mass counter + watermark inside YouTube's safe area). Scenarios can auto-record.
- **Ads:** `showRewardedAd()` in `src/systems/ads.js` is a placeholder (1 s fake delay)
  used for ×2 Stardust, Revive +30 s and one free upgrade per day.
- **Settings:** music, sound effects, Low graphics, auto-record. Progress saves to
  localStorage (the game still runs if storage is blocked).

## Controls

Hold and drag (touch or mouse) to pull the black hole toward your finger. WASD / arrow
keys also work. Esc or P pauses; the game also pauses when the tab is hidden.

## Tuning

Every number lives in `src/config.js`: masses, sizes, speeds, spawn weights per tier,
level targets, upgrade costs, effects and recording settings. The main knob for level
length is `EATING.massGain`.

## Testing shortcuts

- `?unlockall`: open every level, sandbox and science card (not saved).
- `?reset`: wipe the save.

## Project layout

```
src/
├── main.js            Phaser setup, fonts, start-up
├── config.js          every tunable number
├── flow.js            moving between screens and scenes
├── scenes/            TitleScene (menus), GameScene, ShopScene, UIScene (in-canvas overlay)
├── objects/           BlackHole, SpaceObject
├── systems/           spawner, effects, textures, audio, recorder, scenarios, save, economy, ads, format, starfield
├── data/              levels, scienceCards, scenarios
└── ui/                HTML menus and HUD (dom, menus, hud, overlays, shop, scienceCard, icons, styles.css)
```
