// Imports one hand-written file from data/raw. Its folder says what it holds:
//   data/raw/planning/<file>.json   institutions, majors and official agreement links
//   data/raw/deadlines/<file>.json  deadlines and application checklists (14)
//   node scripts/import/run.mjs data/raw/<folder>/<file>.json [--dry-run]
// Stages (docs/12): raw (the file, kept untouched, with its hash) → parse → validate → upsert → review report.
// Validation problems stop the run before the database is touched. The upsert is one transaction: all or nothing.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validateDeadlinesFile } from "./deadlines.mjs";
import { validatePlanningFile } from "./planning.mjs";
import { deadlineReportRows, reportRows, writeReport } from "./report.mjs";

const KINDS = {
  planning: {
    validate: validatePlanningFile,
    counted: (p) => `${p.institutions.length} institutions, ${p.majors.length} majors, ${p.agreement_links.length} agreement links`,
    importBatch: (db, ...args) => db.importBatch(...args),
    report: async (db, payload) => reportRows(payload, await db.rowsFor(payload)),
  },
  deadlines: {
    validate: validateDeadlinesFile,
    counted: (p) => `${p.deadlines.length} deadlines, ${p.checklists.length} checklists, ${p.checklist_steps.length} checklist steps`,
    importBatch: (db, ...args) => db.importDeadlines(...args),
    report: async (db, payload, confirmOn) => deadlineReportRows(payload, confirmOn, await db.deadlineRowsFor(payload)),
  },
};

export const kindOf = (rel) => (rel.startsWith("data/raw/deadlines/") ? "deadlines" : "planning");

export async function runImport({ file, dryRun, db, reportDir }) {
  const rel = path.relative(process.cwd(), path.resolve(file)).split(path.sep).join("/");
  if (!rel.startsWith("data/raw/")) throw new Error(`import files live in data/raw/ (got ${rel})`);
  const kind = KINDS[kindOf(rel)];

  const text = fs.readFileSync(file, "utf8");
  const sourceFile = `${rel} sha256:${crypto.createHash("sha256").update(text).digest("hex").slice(0, 16)}`;
  console.log(`raw       ${sourceFile}`);

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, stage: "parse", problems: [`not valid JSON: ${e.message}`] };
  }
  console.log("parse     ok");

  const { payload, confirmOn, problems } = kind.validate(parsed);
  if (problems.length) return { ok: false, stage: "validate", problems };
  console.log(`validate  ok: ${kind.counted(payload)}`);

  let result;
  try {
    result = await kind.importBatch(db, payload, sourceFile, dryRun);
  } catch (e) {
    await db.logFailure?.(sourceFile, dryRun, e.message).catch(() => {});
    return { ok: false, stage: "upsert", problems: [e.message] };
  }
  console.log(`upsert    ${result.status}: ${JSON.stringify(result.counts)}`);

  if (result.status === "dry_run") return { ok: true, ...result };
  const rows = await kind.report(db, payload, confirmOn);
  const report = writeReport(rows, { name: path.basename(file, ".json"), status: result.status, counts: result.counts, dir: reportDir });
  console.log(`report    ${report}.md and .csv`);
  return { ok: true, ...result, report };
}

// Command line
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: node scripts/import/run.mjs data/raw/<planning|deadlines>/<file>.json [--dry-run]");
    process.exit(2);
  }
  const { supabaseDatabase } = await import("./db.mjs");
  const outcome = await runImport({ file, dryRun: args.includes("--dry-run"), db: supabaseDatabase() });
  if (!outcome.ok) {
    console.error(`\nStopped at ${outcome.stage}. Nothing was applied.\n${outcome.problems.map((p) => `  - ${p}`).join("\n")}`);
    process.exit(1);
  }
}
