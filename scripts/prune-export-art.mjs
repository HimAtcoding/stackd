// Runs after `next build`. The app shows art through next/image's loader, which serves the WebP copies in /_art
// (scripts/prepare-assets.mjs), so the source PNGs that next build copies from public/art into out/art are never
// loaded. They're about 24 MB, which would ship inside the iOS app. This removes them from out/ only; public/art
// stays the source. A raster file the code names directly (like the loading screen's run frames) is kept.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_ART = path.join(root, "out/art");
const RASTER = /\.(png|jpe?g)$/i;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

// "/art/....png" written out in app code is loaded as is
const source = ["app", "components", "lib"]
  .flatMap((dir) => walk(path.join(root, dir)))
  .filter((f) => /\.(tsx?|css)$/.test(f) && !f.includes(`${path.sep}generated${path.sep}`))
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");
const kept = new Set([...source.matchAll(/["'`(](\/art\/[^"'`)\s]+\.(?:png|jpe?g))/gi)].map((m) => m[1]));

let removed = 0;
let bytes = 0;
for (const file of walk(OUT_ART)) {
  if (!RASTER.test(file)) continue;
  const url = "/" + path.relative(path.join(root, "out"), file).split(path.sep).join("/");
  if (kept.has(url)) continue;
  bytes += fs.statSync(file).size;
  fs.rmSync(file);
  removed++;
}
console.log(`prune-export-art: removed ${removed} unused source images (${(bytes / 1e6).toFixed(1)} MB), kept ${kept.size} used directly`);
