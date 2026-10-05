// Runs before `next dev` and `next build`, so the app needs no server at runtime (Capacitor, static export):
// 1. lib/generated/art-manifest.json: every file in public/art with its size, so <Art> needs no file system
// 2. public/_art/*.webp: each raster image at the widths next/image asks for, so no image optimizer is needed
// 3. lib/generated/seed.json: the demo files in data/seed, bundled; a missing file is simply absent, a broken one is marked
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { IMAGE_WIDTHS } from "../lib/image-widths.mjs";

const root = process.cwd();
const ART = path.join(root, "public/art");
const OUT_IMAGES = path.join(root, "public/_art");
const GENERATED = path.join(root, "lib/generated");
const SEED = path.join(root, "data/seed");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

const toUrl = (file) => "/" + path.relative(path.join(root, "public"), file).split(path.sep).join("/");

function svgSize(file) {
  const head = fs.readFileSync(file, "utf8").slice(0, 2000);
  const box = head.match(/viewBox="[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/);
  return box ? { w: Number(box[1]), h: Number(box[2]) } : null;
}

async function art() {
  const manifest = {};
  let made = 0;
  for (const file of walk(ART)) {
    const ext = path.extname(file).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".svg"].includes(ext)) continue;
    const src = toUrl(file);
    const base = src.slice(0, -ext.length);
    // .svg wins over .png for the same name, as in components/art.tsx
    if (manifest[base]?.src.endsWith(".svg")) continue;
    if (ext === ".svg") {
      const size = svgSize(file);
      if (size) manifest[base] = { src, ...size };
      continue;
    }
    const { width, height } = await sharp(file).metadata();
    manifest[base] = { src, w: width, h: height };

    const sourceTime = fs.statSync(file).mtimeMs;
    for (const w of IMAGE_WIDTHS) {
      const out = path.join(OUT_IMAGES, `${base.slice("/art/".length)}-${w}.webp`);
      if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= sourceTime) continue;
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await sharp(file).resize({ width: w, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
      made++;
    }
  }
  return { manifest, made };
}

function seed() {
  const bundle = {};
  for (const file of walk(SEED)) {
    if (!file.endsWith(".json")) continue;
    const key = path.relative(SEED, file).split(path.sep).join("/");
    try {
      bundle[key] = { status: "ok", data: JSON.parse(fs.readFileSync(file, "utf8")) };
    } catch {
      bundle[key] = { status: "broken" };
    }
  }
  return bundle;
}

const { manifest, made } = await art();
const bundle = seed();
fs.mkdirSync(GENERATED, { recursive: true });
fs.writeFileSync(path.join(GENERATED, "art-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
fs.writeFileSync(path.join(GENERATED, "seed.json"), JSON.stringify(bundle, null, 2) + "\n");
console.log(`prepare-assets: ${Object.keys(manifest).length} art files, ${made} image sizes made, ${Object.keys(bundle).length} seed files`);
