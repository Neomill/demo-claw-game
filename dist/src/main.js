import { ClawGame } from "./game/game.js";
import { EXPRESSIONS } from "./game/config.js";

async function start() {
  // Classic local vendor scripts load before DOMContentLoaded, independent of any CDN.
  if (document.readyState === "loading")
    await new Promise((resolve) =>
      document.addEventListener("DOMContentLoaded", resolve, { once: true }),
    );
  if (!window.PIXI || !window.gsap)
    throw new Error("The local PixiJS or GSAP library could not be loaded.");
  const app = new PIXI.Application();
  await app.init({
    backgroundAlpha: 0,
    antialias: true,
    resolution: Math.min(devicePixelRatio || 1, 2),
    autoDensity: true,
    preference: "webgl",
    powerPreference: "high-performance",
  });
  document.querySelector("#game").appendChild(app.canvas);
  const names = [
    "ball",
    "foot",
    "claw-left",
    "claw-center",
    "claw-right",
    "metal-holder",
    "cable-tile",
    ...EXPRESSIONS.map((x) => `face-${x}`),
  ];
  const textures = {};
  let loaded = 0;
  await Promise.all(
    names.map(async (name) => {
      textures[name] = await PIXI.Assets.load(
        window.__LITTLE_LIFT_ART__?.[name] || `assets/${name}.png`,
      );
      document.querySelector("#loading-detail").textContent =
        `${++loaded} of ${names.length} pieces ready`;
    }),
  );
  const game = new ClawGame(app, textures);
  document.querySelector("#loading").hidden = true;
  // Useful for integration tests and host applications; no renderer internals required.
  window.clawDemo = Object.freeze({
    snapshot: () => game.snapshot(),
    reset: () => game.reset(),
    pause: () => game.setPaused(true),
    resume: () => game.setPaused(false),
    destroy: () => {
      game.destroy();
      app.destroy(true, { children: true });
    },
  });
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) game.destroy();
  });
}
start().catch((error) => {
  console.error(error);
  document.querySelector("#loading-detail").textContent =
    "Please open the demo through the included local server, then reload.";
  document.querySelector("#loading strong").textContent =
    "We couldn’t start the arcade.";
  document.querySelector("#loading").dataset.error = error.message;
});
