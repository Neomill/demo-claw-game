# Tools used

## Runtime: what powers the game

| Tool | Role |
| --- | --- |
| PixiJS 8.22.0 | WebGL rendering, PNG textures, containers, masks, sprite transforms and scene layering. |
| GSAP 3.15.0 | Claw travel and closure, expression crossfades, squash and recovery animation. |
| JavaScript ES modules | Separate game state, input, physics, rigs and interface modules. |
| HTML + CSS | Responsive machine frame, controls, score and overlays. |
| Web Audio API | Optional synthesized effects, without downloaded audio files. |
| Custom JavaScript physics | A 120 Hz solver for gravity, bounce, circle collisions and a damped spring grip. |

The animation uses independently pivoted PNG parts with rotation, scale, skew and hierarchy. It has a cutout-skeleton feel, but does **not** use Spine, the Spine runtime, or frame-by-frame sprite sheets. There is no third-party physics engine. The grip is deliberately assisted for a forgiving demo.

## Development and verification

| Tool | Role |
| --- | --- |
| OpenAI Codex | AI-assisted implementation, organization, iteration, debugging and verification under the user's direction. |
| Node.js + npm | Local server, scripts, dependency management and built-in physics tests. |
| esbuild 0.28.2 | Bundles the optional standalone offline HTML. |
| Prettier 3.9.10 | Source formatting. |
| Playwright + Google Chrome | Automated browser play checks and screenshots for visual review. |
| Git | Source versioning used during development. |
| GitHub Actions + GitHub Pages | Deployment workflow included in this package; runs after the owner uploads it and enables Pages. |

Artwork uses the reference-based PNG exports and facial-expression layers prepared earlier in this conversation. Existing PNGs are used as layered game art; the running game does not generate art or call an AI service. The initial preview was hosted with Sites; this handoff is independent of that service.

## Short presentation script

“This is a client-side claw machine demo made with PixiJS and GSAP, with AI-assisted development using OpenAI Codex. Each character is assembled from separate PNG layers. The feet rotate independently, expressions change with the action, and the center claw passes behind the ball. A custom fixed-step physics solver provides gravity, bounce and a spring-based grip, tuned to make catches easier. The project is organized into small modules and ready to host as a static site on GitHub Pages.”

## Verification scope

Development checks covered a complete four-ball round, pause/resume, reset, keyboard and pointer input, offline play, and the updated feet/claw layering. The package includes six physics tests and syntax validation. GitHub deployment itself must be verified after uploading to the owner's repository.
