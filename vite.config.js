import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the same dist/ works on GitHub Pages (served from
  // /black-hole-game/), on game portals, and inside the Capacitor Android app.
  base: './',
  build: {
    // Phaser alone is ~1.2 MB minified; don't warn about it.
    chunkSizeWarningLimit: 1600,
  },
});
