# Black Hole: Event Horizon

A Phaser 3 + Vite web game. See `SPEC.md` (gameplay) and `design/DESIGN.md` (visuals).

```bash
npm install
npm run dev      # play locally at http://localhost:5173 (add `-- --host` to test on a phone on the same Wi-Fi)
npm run build    # static build in dist/
```

Every push to `main` builds the game and deploys it to GitHub Pages:
https://sijanpaudel6-hash.github.io/black-hole-game/
(one-time setup: repo **Settings → Pages → Source: GitHub Actions**).

All tunable numbers live in `src/config.js`.
