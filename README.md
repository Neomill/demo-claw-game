# Claw Machine Demo

A small browser claw machine game built with PixiJS and GSAP. Move the claw, drop it, and it closes on a toy and lifts it to the prize chute.

**Play:** https://neomill.github.io/demo-claw-game/

## Controls

- Left / right arrows or the on-screen arrow buttons to move
- Space or **DROP CLAW** to drop
- P to pause

Works with mouse, touch and keyboard. No install, no login, no backend.

## Run locally

Install Node.js 22, then run:

```sh
npm start
```

Open `http://127.0.0.1:4173/`.

## Edit and verify

- `dist/index.html` / `dist/styles.css`: game layout.
- `dist/src/rigs/`: character and claw parts.
- `dist/src/game/config.js`: placement, speed, gravity and grip tuning.
- `dist/src/game/physics.js`: fixed-step physics.
- `dist/src/game/game.js`: game state and grab sequence.
- `dist/assets/`: PNG art layers and expressions.

```sh
npm run check
npm test
```

To build a single offline HTML file, run `npm ci`, then `npm run build:offline`. This writes `little-lift.html`, which opens by double-click with no server.

Every push to `main` deploys to GitHub Pages through `.github/workflows/pages.yml`.

- [Architecture](docs/ARCHITECTURE.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
