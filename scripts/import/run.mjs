// Imports one hand-written planning file: institutions, majors and official agreement links.
//   node scripts/import/run.mjs data/raw/planning/<file>.json [--dry-run]
// Stages (docs/12): raw (the file, kept untouched, with its hash) → parse → validate → upsert → review report.
// Validation problems stop the run before the database is touched. The upsert is one transaction: all or nothing.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parsePlanningFile, validatePlanningFile } from "./planning.mjs";
import { reportRows, writeReport } from "./report.mjs";

export async function runImport({ file, dryRun, db, reportDir }) {
  const rel = path.relative(process.cwd(), path.resolve(file)).split(path.sep).join("/");
  if (!rel.startsWith("data/raw/")) throw new Error(`import files live in data/raw/ (got ${rel})`);

  const text = fs.readFileSync(file, "utf8");
  const sourceFile = `${rel} sha256:${crypto.createHash("sha256").update(text).digest("hex").slice(0, 16)}`;
  console.log(`raw       ${sourceFile}`);

  let parsed;
  try {
    parsed = parsePlanningFile(text);
  } catch (e) {
    return { ok: false, stage: "parse", problems: [`not valid JSON: ${e.message}`] };
  }
  console.log("parse     ok");

  const { payload, problems } = validatePlanningFile(parsed);
  if (problems.length) return { ok: false, stage: "validate", problems };
  console.log(`validate  ok: ${payload.institutions.length} institutions, ${payload.majors.length} majors, ${payload.agreement_links.length} agreement links`);

  let result;
  try {
    result = await db.importBatch(payload, sourceFile, dryRun);
  } catch (e) {
    await db.logFailure?.(sourceFile, dryRun, e.message).catch(() => {});
    return { ok: false, stage: "upsert", problems: [e.message] };
  }
  console.log(`upsert    ${result.status}: ${JSON.stringify(result.counts)}`);

  if (result.status === "dry_run") return { ok: true, ...result };
  const rows = reportRows(payload, await db.rowsFor(payload));
  const report = writeReport(rows, { name: path.basename(file, ".json"), status: result.status, counts: result.counts, dir: reportDir });
  console.log(`report    ${report}.md and .csv`);
  return { ok: true, ...result, report };
}

// Command line
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: node scripts/import/run.mjs data/raw/planning/<file>.json [--dry-run]");
    process.exit(2);
  }
  const { supabaseDatabase } = await import("./db.mjs");
  const outcome = await runImport({ file, dryRun: args.includes("--dry-run"), db: supabaseDatabase() });
  if (!outcome.ok) {
    console.error(`\nStopped at ${outcome.stage}. Nothing was applied.\n${outcome.problems.map((p) => `  - ${p}`).join("\n")}`);
    process.exit(1);
  }
}
