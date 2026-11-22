// Browser tests for the screens' Test sections, in Chromium at 393 × 852 and 320 × 568: the Plan (24), Home (15, 18, 23),
// Explore (21, 22) and Deadlines (14, 15, 18). Schools, pathways, deadlines, opportunities and courses come from the real
// project as anon; the test student's own rows are a stand-in (standin.mjs), so nothing is written to the project.
//   npm run test:e2e                                  every screen; starts next dev with plan on, port 3107
//   npm run test:e2e -- --only home,explore           some of them
//   npm run test:e2e -- --base http://localhost:3000 --shots <folder>
// Needs .env.local (the project's URL and anon key) and Chromium for Playwright (npx playwright install chromium).
import fs from "node:fs";
import { chromium } from "playwright";
import { deadlinesSuite } from "./deadlines.mjs";
import { exploreSuite } from "./explore.mjs";
import { homeSuite } from "./home.mjs";
import { createRun } from "./lib.mjs";
import { planSuite } from "./plan.mjs";
import { startDevServer } from "./server.mjs";

const SUITES = { plan: planSuite, home: homeSuite, explore: exploreSuite, deadlines: deadlinesSuite };

const arg = (name) => {
  const at = process.argv.indexOf(`--${name}`);
  return at > 0 ? process.argv[at + 1] : undefined;
};
const only = arg("only")?.split(",") ?? Object.keys(SUITES);
const unknown = only.filter((s) => !SUITES[s]);
if (unknown.length) {
  console.error(`No suite named ${unknown.join(", ")}. Suites: ${Object.keys(SUITES).join(", ")}`);
  process.exit(2);
}
const shots = arg("shots");
if (shots) fs.mkdirSync(shots, { recursive: true });

const server = arg("base") ? { base: arg("base"), stop: () => {} } : await startDevServer();
const browser = await chromium.launch();
const run = createRun({ browser, base: server.base, shots });
try {
  for (const name of only) {
    console.log(`\n${name}`);
    await SUITES[name](run);
  }
} finally {
  await browser.close();
  server.stop();
}
console.log(run.failed() ? `\n${run.failed()} check(s) failed` : "\nAll checks passed");
process.exit(run.failed() ? 1 : 0);
