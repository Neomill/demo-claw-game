# DEMO GAME

A browser-only claw machine demo using PixiJS and GSAP. Includes the latest character composition, independent animated feet, six facial expressions, and a center claw that passes behind the balls.

## Publish on GitHub Pages

1. Create a GitHub repository with a `main` branch.
2. Extract this package and put **its contents at the repository root**. You should see `dist/`, `.github/`, and `package.json` directly in the repository, not inside an extra folder. Include the hidden `.github` folder; uploading the ZIP itself will not deploy the game.
3. In the repository, open **Settings → Pages → Build and deployment → Source**, and choose **GitHub Actions**.
4. Push/commit the files to `main`. If you enabled Pages after the initial push, open **Actions → Deploy demo to GitHub Pages → Run workflow**.
5. After the workflow succeeds, use the URL shown in **Settings → Pages** or in the workflow's deployment.

The usual project URL is `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`. The tools page is at `tools.html` under that same URL. These are placeholders; the repository has not been created or deployed by this handoff.

Future pushes to `main` deploy automatically. For another default branch, change `branches: [main]` in `.github/workflows/pages.yml`. No personal access token, API key, backend, or npm install is required by the publishing workflow. It validates and uploads the committed `dist/` folder. GitHub supplies the workflow token.

See [GitHub's custom Pages workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). On GitHub Free, use a public repository for Pages.

## Show the tools during your demo

Click **TOOLS ↗** in the machine controls to open the presentation page. It explains the runtime stack, custom physics and cutout animation, AI development assistance, and testing tools. It includes a short presentation script.

- [Tools and credits](TOOLS.md)
- [Architecture and maintenance](docs/ARCHITECTURE.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

## Run locally

Install Node.js 22, then run:

```sh
npm start
```

Open `http://127.0.0.1:4173/`. Use left/right arrows to move, Space to drop, and P to pause. The buttons also work with touch.

## Edit and verify

- `dist/index.html` / `dist/styles.css`: game layout.
- `dist/src/rigs/`: articulated character and claw.
- `dist/src/game/config.js`: placement, pivots, speed, gravity and grip tuning.
- `dist/src/game/physics.js`: fixed-step physics.
- `dist/src/game/game.js`: game state and grab sequence.
- `dist/assets/`: PNG layers and expression art.
- `dist/tools.html`: tools presentation page.

```sh
npm run check
npm test
```

To rebuild a single offline HTML file, first run `npm ci`, then `npm run build:offline`. This generates `little-lift.html`; GitHub Pages serves `dist/` instead. Runtime libraries are already included in `dist/vendor/`.

All game paths are relative, so it works under a GitHub project repository path. This package contains no Sites account configuration or source-repository history.
