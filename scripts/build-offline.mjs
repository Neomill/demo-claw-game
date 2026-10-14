import { build } from "esbuild";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");
const art = {};
for (const filename of await readdir(path.join(dist, "assets"))) {
  if (filename.endsWith(".png"))
    art[filename.slice(0, -4)] =
      `data:image/png;base64,${(await readFile(path.join(dist, "assets", filename))).toString("base64")}`;
}
const result = await build({
  entryPoints: [path.join(dist, "src/main.js")],
  bundle: true,
  format: "iife",
  write: false,
  target: "es2022",
  minify: false,
});
const safeScript = (content) => content.replace(/<\/script/gi, "<\\/script");
const inline = (text) => `<script>${safeScript(text)}</script>`;
let html = await readFile(path.join(dist, "index.html"), "utf8");
html = html.replace(
  /<link\s+rel="stylesheet"\s+href="styles.css"\s*\/?\s*>/,
  `<style>${await readFile(path.join(dist, "styles.css"), "utf8")}</style>`,
);
// Callback replacements preserve literal dollar signs in third-party JavaScript.
const pixi = await readFile(path.join(dist, "vendor/pixi.min.js"), "utf8");
const gsap = await readFile(path.join(dist, "vendor/gsap.min.js"), "utf8");
html = html.replace(
  /<script[^>]+src="vendor\/pixi.min.js"[^>]*><\/script>/,
  () => inline(pixi),
);
html = html.replace(
  /<script[^>]+src="vendor\/gsap.min.js"[^>]*><\/script>/,
  () => inline(gsap),
);
html = html.replace(
  /<script[^>]+src="src\/main.js"[^>]*><\/script>/,
  () =>
    inline(`window.__LITTLE_LIFT_ART__=${JSON.stringify(art)};`) +
    inline(result.outputFiles[0].text),
);
const output = path.join(root, "little-lift.html");
await writeFile(output, html);
console.log(
  `Offline HTML ready: ${output} (${(Buffer.byteLength(html) / 1048576).toFixed(1)} MiB)`,
);
