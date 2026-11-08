// Sets verified academic rows (a deadline, checklist or step, personal insight question, institution, major, agreement
// link, Explore pathway, requirement or campus, or opportunity) back to unverified, so a corrected file can be imported
// and checked again (docs/date-check.md → Fixing a verified row). Logs who did it and why. A dry run unless --apply.
//   node scripts/import/reopen.mjs --id <row id> --by "<name>" --reason "<text>" [--apply]
//   node scripts/import/reopen.mjs --from-report data/review/<run>.csv --by "<name>" --reason "<text>" [--apply]
// --from-report reopens every row in a review report that is verified now, one logged reopen each, and leaves the rest.
// A reopened deadline, question, Explore row or opportunity is hidden from students until it's verified again; a reopened
// date also hides its checklist and steps, and any reopened Explore row hides that whole major.
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { readReportCsv } from "./report.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_VERIFIED = /isn't verified, so it can be fixed in the file/;

// Schools, majors and agreement links stay readable while unverified; the rest are hidden
const STAYS_READABLE = ["institutions", "majors", "agreement_links"];

function whoAndWhy(by, reason) {
  const problems = [];
  if (!by?.trim()) problems.push("--by must name who is reopening it");
  if (!reason?.trim()) problems.push("--reason must say why");
  return problems;
}

export async function reopenRow({ id, by, reason, apply, db }) {
  const problems = whoAndWhy(by, reason);
  if (!id || !UUID.test(id)) problems.unshift("--id must be the row's id, from the review report's id column");
  if (problems.length) return { ok: false, problems };
  try {
    return { ok: true, ...(await db.reopenRow(id, by.trim(), reason.trim(), !apply)) };
  } catch (e) {
    return { ok: false, problems: [e.message] };
  }
}

// Every row in the report is looked up first. Any problem other than "isn't verified" stops the run before anything is
// reopened. Rows that aren't verified now are skipped and listed.
export async function reopenFromReport({ file, by, reason, apply, db }) {
  const problems = whoAndWhy(by, reason);
  if (!file || !fs.existsSync(file)) problems.unshift("--from-report must be a review report CSV in data/review");
  if (problems.length) return { ok: false, problems };
  const rows = readReportCsv(file);
  const badIds = rows.filter((r) => !UUID.test(r.id ?? ""));
  if (!rows.length) return { ok: false, problems: [`${file} has no rows`] };
  if (badIds.length) return { ok: false, problems: badIds.map((r) => `a row has no valid id (${r.table} ${r.record})`) };

  const found = [];
  const skipped = [];
  for (const r of rows) {
    try {
      found.push(await db.reopenRow(r.id, by.trim(), reason.trim(), true));
    } catch (e) {
      if (NOT_VERIFIED.test(e.message)) skipped.push({ table: r.table, id: r.id, record: r.record });
      else return { ok: false, problems: [e.message] };
    }
  }
  if (!apply) return { ok: true, status: "dry_run", rows: found, skipped };

  const reopened = [];
  for (const r of found) {
    try {
      reopened.push(await db.reopenRow(r.id, by.trim(), reason.trim(), false));
    } catch (e) {
      return { ok: false, problems: [`${e.message}. ${reopened.length} row(s) were reopened before this one and stay reopened`], reopened };
    }
  }
  return { ok: true, status: "reopened", rows: reopened, skipped };
}

const option = (args, name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const describe = (r) => `${r.table} ${r.id} (${r.record}), verified ${r.verified_at}`;

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const { supabaseDatabase } = await import("./db.mjs");
  const report = option(args, "--from-report");
  const common = { by: option(args, "--by"), reason: option(args, "--reason"), apply: args.includes("--apply"), db: supabaseDatabase() };
  const outcome = report ? await reopenFromReport({ file: report, ...common }) : await reopenRow({ id: option(args, "--id"), ...common });
  if (!outcome.ok) {
    console.error(`${outcome.reopened?.length ? "Stopped." : "Nothing was reopened."}\n${outcome.problems.map((p) => `  - ${p}`).join("\n")}`);
    console.error('usage: npm run import:reopen -- (--id <row id> | --from-report <review csv>) --by "<name>" --reason "<text>" [--apply]');
    process.exit(1);
  }
  const rows = report ? outcome.rows : [outcome];
  const verb = outcome.status === "dry_run" ? "would reopen" : "reopened ";
  for (const r of rows) console.log(`${verb}  ${describe(r)}`);
  for (const r of outcome.skipped ?? []) console.log(`skipped       ${r.table} ${r.id} (${r.record}): not verified, left as it is`);
  if (outcome.status === "dry_run") {
    console.log(`\nNothing changed. ${rows.length} row(s) would be reopened. Run again with --apply to reopen ${rows.length === 1 ? "it" : "them"}.`);
  } else {
    const hidden = rows.some((r) => !STAYS_READABLE.includes(r.table));
    console.log(`\n${rows.length} row(s) reopened. ${hidden ? "Hidden from students" : "Unverified"} until imported and verified again.`);
  }
}
