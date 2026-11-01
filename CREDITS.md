# Credits

## Code libraries

- [Phaser 3](https://phaser.io) — MIT License
- [Vite](https://vite.dev) — MIT License

## Fonts (bundled with `@fontsource`, no CDN)

- [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) by Jeremy Tribby — SIL Open Font License 1.1
- [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) by IBM — SIL Open Font License 1.1
- [Space Mono](https://fonts.google.com/specimen/Space+Mono) by Colophon Foundry — SIL Open Font License 1.1

## Map data (Feed Your Hometown)

- City and country names and positions (`src/data/places.js`) and land outlines
  (`src/data/land.js`) come from [Natural Earth](https://www.naturalearthdata.com/):
  *1:10m Populated Places* (simple), *1:110m Admin 0 – Countries* (label points) and
  *1:110m Land*. **Public domain** ("All versions of Natural Earth raster + vector map data
  … are in the public domain"; see naturalearthdata.com/about/terms-of-use). Converted to
  compact arrays (names, country, latitude, longitude rounded to 0.01°; outlines to 0.1°).
  Made with Natural Earth.
- Only cities and countries are included, never streets or addresses.

## Assets

No image or sound files. Every object, star and effect is drawn in code
(`src/systems/textures.js`) and every sound is synthesised with the Web Audio API
(`src/systems/audio.js`).
Any file added to `public/assets/` must be listed here with its source and licence.

## Science

Facts on the science cards and scenario endings come from public sources (NASA, ESA,
the Event Horizon Telescope collaboration and LIGO). The distance to Gaia BH1 (about 1,560
light-years, the nearest known black hole) is from ESA's Gaia mission (El-Badry et al. 2023). The game's growth from dust to
galaxies is a game simplification, not real astrophysics.
