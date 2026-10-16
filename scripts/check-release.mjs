// Runs after `next build` (13 → Production cleanup). Fails the build when the release could show something v1 hides:
// 1. a /dev/ page in out/;
// 2. a link to a screen that isn't built, written anywhere but lib/features.ts (links must come from its table, which
//    gives none while the screen's flag is off);
// 3. the placeholder screen used anywhere but behind that table (components/unbuilt-route.tsx).
// The service role key check (scripts/check-service-key.mjs) runs after this one.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const problems = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}
const rel = (file) => path.relative(root, file).split(path.sep).join("/");

// 1. No dev pages in the build
const devPages = walk(path.join(root, "out/dev"));
if (devPages.length) problems.push(`out/dev/ is in the build (${devPages.length} files). /dev/ pages must only exist under next dev`);

// 2 and 3. The app's own code: dev-only pages are excluded, since they never reach a build
const UNBUILT = ["explore", "essays", "mentors", "events", "notifications", "upcoming", "requirement", "track-application"];
const linkPattern = new RegExp(`["'\`]/(${UNBUILT.join("|")})(?=[/?"'\`])`, "g");
const PLACEHOLDER_ALLOWED = new Set(["components/placeholder-screen.tsx", "components/unbuilt-route.tsx"]);

const source = ["app", "components", "lib"]
  .flatMap((dir) => walk(path.join(root, dir)))
  .filter((f) => /\.(tsx?|mjs|js)$/.test(f) && !f.endsWith(".dev.tsx") && !rel(f).startsWith("lib/generated/"));

for (const file of source) {
  const name = rel(file);
  const text = fs.readFileSync(file, "utf8");
  if (name !== "lib/features.ts") {
    for (const match of text.matchAll(linkPattern)) {
      const line = text.slice(0, match.index).split("\n").length;
      problems.push(`${name}:${line} links to /${match[1]}/ directly. Use unbuiltHref() from lib/features.ts`);
    }
  }
  if (!PLACEHOLDER_ALLOWED.has(name) && /\bPlaceholderScreen\b/.test(text)) {
    problems.push(`${name} uses PlaceholderScreen. Unbuilt screens go through <UnbuiltRoute> (components/unbuilt-route.tsx)`);
  }
}

if (problems.length) {
  console.error(`check-release: ${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`check-release: no /dev/ pages, and no link to an unbuilt screen outside lib/features.ts (${source.length} files checked)`);
