# Little Lift

A complete client-side claw arcade built with **PixiJS 8.22.0** and **GSAP 3.15.0**. It uses the exported game art, independent cutout limbs, a small fixed-step physics solver, and a forgiving grab model. No Spine runtime, sprite sheets, physics library, backend, or runtime CDN is required.

## Play

- **Offline:** open `little-lift.html` in a modern browser. Everything is embedded in that file.
- **Editable development version:** run `npm start` and open `http://127.0.0.1:4173`.
- **Controls:** left/right arrows to move; Space to lower the claw; P to pause. On-screen buttons also support touch and pointer capture.
- Catch four friends to complete a round. Reset and replay are always available. Sound is opt-in.

The local server uses Node's standard library. No dependency installation is needed merely to run the editable demo. `npm ci` is only needed for formatting or rebuilding the offline HTML.

## Project structure

```text
dist/
  index.html                 Accessible controls, score, status and instructions
  styles.css                 Responsive arcade shell
  assets/                    Original exported PNG parts and expression layers
  vendor/                    Pinned local PixiJS and GSAP distributions
  src/
    main.js                  Renderer initialization, asset loading, error handling
    core/
      input.js               Keyboard and pointer input; cancellation and cleanup
      audio.js               Optional synthesized sound effects
      math.js                Frame-rate-independent smoothing and seeded randomness
    game/
      config.js              Physics, grip, camera and asset registration settings
      physics.js             Pure circle solver; no renderer dependency
      game.js                Round lifecycle and explicit grab state machine
      scene.js               Cabinet drawing, targeting guide, particles
      ui.js                  DOM state, accessibility status and collection display
    rigs/
      ball-rig.js            Body, six faces and two independently pivoted feet
      claw-rig.js            Three claw joints, front holder and tiled cable
tests/physics.test.mjs        Numerical regression checks
scripts/build-offline.mjs     Reproducible single-file HTML bundling
scripts/check.mjs             Module syntax checks
serve.mjs                    Small local static server
```

## Asset mapping

The user's numbered mapping refers to the final exported PNG parts:

| Number | Export | Role |
| --- | --- | --- |
| 2 | `claw-center.png` | Independent center joint |
| 4 | `metal-holder.png` | Front plate covering the rounded joint caps |
| 5 | `cable-tile.png` | Vertically repeated extension cable |
| 6 | `claw-left.png` | Left joint |
| 8 | `claw-right.png` | Right joint |

Registration coordinates and joint pivots are in `CONFIG.art`. The ball body and face overlays share the same cropped texture frame, preserving their alignment. The extracted foot is reused at its original relative scale for two separate joints, both pointing right. `CONFIG.art.feet` preserves the reference's seated composition: rear foot higher behind the body, front foot over the lower edge. Both inherit body sway and rotate independently at their ankle pivots. All six expressions are used: neutral/happy at rest, surprised on approach, worried during the squeeze or slip, excited while carried, and dizzy after a landing.

## How the animation works

The rigs use a hierarchy of Pixi containers and sprites, like a small cutout skeleton. Local pivots provide rotation, and scale/skew provide squash, sway, and secondary motion. GSAP drives the claw's closure and travel, crossfades expression layers, and handles landing squash. The feet swing separately and react to the physical body's velocity. The center claw finger renders behind the balls; the side fingers and holder render in front. Both claw render roots share position and sway so the rig stays aligned. These are transformations of individual parts, not frame-by-frame sprite-sheet animations.

Physics runs at 120 fixed steps per second with a bounded accumulator. Rendering interpolates physical positions. Gravity, restitution, contact resolution, floor friction, and a damped spring grip are separate from visual effects. A held ball remains a physical body; it is not reparented or teleported to the claw. The downward cable repeats the exported seamless tile rather than stretching its texture.

The state flow is:

```text
aim → descending → closing → lifting → carrying → releasing → returning → aim
                                ↘ empty/missed grab → aim
                                                        four rescues → complete
```

This demo deliberately uses circle collision and an assisted grip, rather than simulating metal-finger friction. Well-centered catches hold reliably. Only very marginal catches have a 16% chance to slip; missed catches can be retried without penalty. During delivery, the pickup chute becomes a physical floor opening for that ball. All other balls remain contained.

## Change the feel

Edit `dist/src/game/config.js`:

- `ball.gravity`, `restitution`: falling weight and bounce.
- `grip.spring`, `damping`: carried-ball lag and swing.
- `grip.reach`: horizontal forgiveness.
- `grip.edgeSlipChance`: chance of a marginal catch slipping; use `0` for guaranteed valid catches.
- `claw.speed`, `homeY`, `scale`, `gripOffsetY`: travel and registration.
- `spawnX`: initial toy positions. Update `ball.count` and the score display together when changing the number of prizes.

Rendering, input, and the solver are intentionally separate. To add another prize type, create a new rig following `BallRig`'s `update`, `impact`, `setExpression`, and `destroy` interface while keeping the solver's circle body contract. For substantially different shapes, extend the collision model instead of baking geometry into animation code.

## Validation and builds

```sh
npm test
npm run check
npm run format
npm run build:offline
```

Automated checks cover settling, grip stability, release and recapture, chute delivery, collision separation, and empty-drop rejection. Browser verification covers a four-catch round, pause/resume, arrow movement, resetting during descent, phone pointer controls, and layout overflow.

The browser exposes a small read-only snapshot/lifecycle API at `window.clawDemo` for integration checks: `snapshot()`, `reset()`, `pause()`, `resume()`, `destroy()`. It does not expose arbitrary score manipulation.

## Dependencies and references

Runtime libraries are vendored under `dist/vendor/`; their versions are pinned in `vendor-versions.json`. Development tooling is pinned in `package-lock.json`. There are no external font or asset requests during play.

- [PixiJS Application documentation](https://pixijs.com/8.x/guides/components/application)
- [GSAP Timeline documentation](https://gsap.com/docs/v3/GSAP/Timeline/)

Third-party notices are retained in the vendor directory. GitHub Pages deployment is configured in `.github/workflows/pages.yml`; see the root README for setup.

