// Runs after `next build`. On Windows, Next 16's static export writes the router's prefetch files as nested folders
// (out/university/__next.!KGFwcCk/university/__PAGE__.txt) because it splits paths on "/" only. The browser asks for
// the dotted name (__next.!KGFwcCk.university.__PAGE__.txt), so this flattens them. On macOS there's nothing to do.
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? [full, ...walk(full)] : [];
  });
}

let moved = 0;
for (const dir of walk(OUT).filter((d) => path.basename(d).startsWith("__next."))) {
  if (!fs.existsSync(dir)) continue;
  const parent = path.dirname(dir);
  const files = (function list(d) {
    return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(d, e.name);
      return e.isDirectory() ? list(full) : [full];
    });
  })(dir);
  for (const file of files) {
    const rest = path.relative(dir, file).split(path.sep).join(".");
    fs.renameSync(file, path.join(parent, `${path.basename(dir)}.${rest}`));
    moved++;
  }
  fs.rmSync(dir, { recursive: true });
}
console.log(`fix-export-segments: ${moved} prefetch files renamed`);
