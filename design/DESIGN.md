# Black Hole: Event Horizon — Design System

This folder is the single source of truth for how the game's UI looks. It goes with `SPEC.md` (what the game does). When this file and the mockups disagree, **this file wins**. When this file and `SPEC.md` disagree about gameplay, **`SPEC.md` wins**.

## How to use this folder (read first, Claude Code)

- `screens/` — what each screen should look like (PNG, 390 px wide phone layout).
- `html/` — Stitch's original HTML/CSS for each screen. Use it as a reference for spacing, sizes and structure. Do **not** load Tailwind or Google Fonts from a CDN in the game: the web build must work offline on game portals and inside the Android app. Bundle fonts with `@fontsource` packages and write plain CSS (or compile Tailwind at build time).
- **All numbers, names and masses in the mockups are placeholders.** Real values come from `src/config.js` and `SPEC.md`. When an object has a real name (Moon, Earth, Sun, Sagittarius A*), show its real mass.
- **Game-world visuals in the mockups are placeholders.** The HUD and recording screens show the black hole as rounded squares. That is wrong. The black hole is always a perfect circle: a pure black disc, a thin bright photon ring and a glowing amber accretion disk, drawn by Phaser as described in `SPEC.md`.
- **Menus and the normal HUD** can be HTML/CSS layered over the Phaser canvas. **The recording-mode overlay (mass counter + watermark) must be drawn inside the Phaser canvas**, because the clip recorder captures the canvas only; HTML on top would not appear in saved clips.

## Visual concept

The UI is the readout of a scientific observatory instrument watching a black hole: precise, calm, premium. Thin hairlines, tick-mark scales, monospace numbers, small uppercase labels and one warm accent. The black hole and space are the hero; the UI hugs the screen edges.

Inspirations: the flat minimalism and empty space of Mini Metro and Alto's Odyssey, orange-on-dark cockpit instrument readouts, and the hand-crafted ship-log feel of Outer Wilds (science cards).

## Colours

Use only these. Ignore Stitch's auto-generated Material colour tokens in the `html/` files (`primary #ffc198`, `surface #121318` and so on).

| Token | Hex | Use |
| --- | --- | --- |
| `void` | `#07080C` | Page and game background |
| `panel` | `#10131A` (85% opacity over gameplay) | Panels, cards, HUD blocks |
| `panel-raised` | `#1A1D24` | Rows inside panels, secondary buttons |
| `hairline` | `#2A2F3A` | 1 px borders, dividers, tick marks |
| `text` | `#EDEAE4` | Primary text and numbers |
| `text-muted` | `#8A8F98` | Labels, secondary text |
| `amber` | `#FF9A4D` | The one accent: primary buttons, key numbers, progress fills, accretion disk |
| `amber-ink` | `#07080C` | Text on amber buttons |
| `science` | `#9FC7FF` | Science cards and maxed-out states only |
| `danger` | `#FF5A5F` | Warnings, collisions, the REC dot |

Rules: amber appears on at most one primary action per screen. No gradients, no glassmorphism, no other hues.

## Typography

| Role | Font | Style |
| --- | --- | --- |
| Titles, headings, buttons | Barlow Condensed | SemiBold 600, UPPERCASE, letter-spacing 0.06em |
| Body text | IBM Plex Sans | Regular 400 / Medium 500 |
| Numbers, labels, data | Space Mono | Regular 400 / Bold 700 |

Space Mono is used for every number so digits stay aligned as counters change (any monospace font does this, and the mockups are built around Space Mono).

| Size token | Size / line height | Used for |
| --- | --- | --- |
| `display` | 36 / 40 px (28 / 32 on small phones) | Screen titles ("STAR DEVOURED") |
| `headline` | 20 / 24 px | Section titles, upgrade names |
| `body` | 14 / 20 px | Descriptions, science text |
| `metric-lg` | 28 / 32 px | Big numbers (mass, timer, Stardust) |
| `metric` | 15 / 18 px | Values in tables |
| `label` | 11 / 14 px, letter-spacing 0.08em, uppercase | Labels |

**Minimum text size is 11 px.** The level select mockup has smaller text in places; scale it up when building. Body text is left-aligned, never justified.

## Shapes, spacing and depth

- Corner radius 4 px, or 45° chamfered (cut) corners on panels' top-left and bottom-right.
- Borders: 1 px `hairline`. Active/selected items: 1 px `amber` border.
- No drop shadows. The only glow is a soft amber bloom on the primary button and the accretion disk: `drop-shadow(0 0 8px rgba(255,154,77,0.45))`.
- Spacing scale: 4, 8, 12, 20, 32 px. Screen side margin 16 px.
- Decoration is limited to tick marks, thin rings and corner brackets. Do not add fake system codes, coordinates or telemetry text.

## Components

- **Primary button**: solid `amber` fill, `amber-ink` text in Barlow Condensed, full width, 56 px tall, 4 px radius, amber bloom. One per screen.
- **Secondary button**: `panel-raised` fill, 1 px `hairline` border, `text` label. Used for "×2 STARDUST · WATCH AD".
- **Text button**: label in brackets, `text-muted`: `[ SANDBOX ]`.
- **Panel**: `panel` fill, 1 px `hairline` border, 12–16 px padding.
- **Segmented meter**: 10 segments with 4 px gaps; filled segments `amber`, empty `hairline`; fully maxed segments `science`.
- **Progress scale**: thin bar with tick marks under it; `amber` fill.
- **Swallow label**: small `panel` with 1 px `amber` border; name in Barlow Condensed amber, mass in Space Mono. Appears near the black hole for about 1.5 s.

## Screens

| File | Screen | Notes when building |
| --- | --- | --- |
| `01-title` | Title | Good as is. Black hole art here is a circle and can be drawn by Phaser in the title scene. |
| `02-level-select` | Level select (star chart) | Levels 1–15 bottom to top, grouped by tier. Raise all text to at least 11 px. Selected-level bar and "ENTER EVENT HORIZON" button stay fixed at the bottom. Sector names are optional flavour. |
| `03-hud` | In-game HUD | Keep the mass panel, TIME LEFT, tier panel and pause. Remove the "PRIMARY" and "CURR" labels. The central black hole art is a placeholder (see above). |
| `04-level-complete` | Level complete | Label the Stardust row "STARDUST EARNED" (replace "Quantum Singularity Yield"). NEXT LEVEL is the primary button; the ad button is secondary. |
| `05-upgrade-shop` | Upgrade shop | Good as is. Six upgrades, effects and costs from `SPEC.md`. Maxed upgrade turns `science` blue with a MAX label. |
| `06-science-card` | Science card | Good as is. Uses `science` blue instead of amber. Text for each card comes from `src/data/scienceCards.js`. |
| `07-recording-mode` | Recording / clip mode | The mass counter and the "BLACK HOLE: EVENT HORIZON · PLAY FREE" watermark are drawn inside the Phaser canvas so they appear in saved clips. The REC dot and timer are for the player only: make them HTML so they are *not* recorded. In the mockup the mass panel and watermark sit too close to the top and bottom edges, where YouTube's buttons cover them: keep both inside the central 75% of the frame (mass counter starting about 14% from the top, watermark ending about 86% down). The "CRITICAL INTAKE 0.00–2.50" scale can be dropped. |
