// End-to-end test of the import pipeline on an in-memory database (PGlite). Uses made-up schools only
// (Example College, Example University); nothing touches the real project. `npm run test:import`
import fs from "node:fs";
import path from "node:path";
import { asRole, createTestDatabase } from "../test-db.mjs";
import { CONTACT_EMAIL } from "./config.mjs";
import { fetchSource } from "./fetch.mjs";
import { readReportCsv } from "./report.mjs";
import { runImport } from "./run.mjs";
import { verifyFromCsv } from "./verify.mjs";

const db = await createTestDatabase({ quiet: true });
const RAW = "data/raw/.test-import";
const REVIEW = "data/review/.test-import";
fs.mkdirSync(RAW, { recursive: true });

// The pipeline's database calls, made as the service role, the way the Supabase client makes them
const testDatabase = {
  async importBatch(payload, sourceFile, dryRun) {
    const r = await asRole(db, "service_role", null, "select import_planning_batch($1::jsonb, $2, $3) as r", [JSON.stringify(payload), sourceFile, dryRun]);
    return r.rows[0].r;
  },
  async verifyRows(rows) {
    const r = await asRole(db, "service_role", null, "select verify_planning_rows($1::jsonb) as r", [JSON.stringify(rows)]);
    return r.rows[0].r;
  },
  async rowsFor() {
    const q = async (t) => (await asRole(db, "service_role", null, `select * from ${t}`)).rows;
    return { institutions: await q("institutions"), majors: await q("majors"), agreement_links: await q("agreement_links") };
  },
  async logFailure(sourceFile, dryRun, error) {
    await asRole(db, "service_role", null, "insert into import_runs (source_file, dry_run, status, error) values ($1, $2, 'failed', $3)", [sourceFile, dryRun, error]);
  },
};

const prov = { source_name: "Test source", academic_year: "2026-27", retrieved_at: "2026-10-05" };
const base = () => ({
  written_by: "test",
  institutions: [
    { slug: "example-college", name: "Example College", institution_type: "community_college", system: "CCC", city: "Testville", ...prov, source_url: "https://example.org/college" },
    { slug: "example-university", name: "Example University", institution_type: "university", system: "UC", ...prov, source_url: "https://example.org/university" },
  ],
  majors: [{ institution: "example-university", slug: "test-major-bs", name: "Test major", degree_type: "BS", ...prov, source_url: "https://example.org/major" }],
  agreement_links: [
    { sending: "example-college", receiving: "example-university", major: "test-major-bs", academic_year: "2026-27", source_name: "ASSIST", source_url: "https://assist.org/transfer/results?test=1", retrieved_at: "2026-10-05" },
  ],
});
function writeFixture(name, data) {
  const file = path.join(RAW, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}
const count = async (t, where = "true") => Number((await db.query(`select count(*)::int as n from ${t} where ${where}`)).rows[0].n);

let failed = 0;
function check(name, ok, detail = "") {
  if (!ok) failed++;
  console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : detail);
}

// 1. Dry run: everything checked and counted, nothing kept
let out = await runImport({ file: writeFixture("base", base()), dryRun: true, db: testDatabase, reportDir: REVIEW });
check("a dry run reports what it would insert", out.ok && out.status === "dry_run" && out.counts.institutions.inserted === 2, JSON.stringify(out));
check("a dry run keeps nothing", (await count("institutions")) === 0 && (await count("agreement_links")) === 0);
check("a dry run is logged", (await count("import_runs", "status = 'dry_run'")) === 1);

// 2. Apply: rows arrive unverified, with a review report
out = await runImport({ file: writeFixture("base", base()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("an import applies", out.ok && out.status === "applied", JSON.stringify(out));
check("imported rows start unverified", (await count("institutions", "verification_status = 'unverified'")) === 2 && (await count("agreement_links", "verification_status = 'unverified'")) === 1);
const report = `${out.report}.csv`;
const reportRows = readReportCsv(report);
check("the review report lists every record", reportRows.length === 4, `${reportRows.length} rows`);
check("the review report carries the source link and year", reportRows.every((r) => r.source_url.startsWith("https://") && r.academic_year === "2026-27"));

// 3. Same file again: nothing changes
out = await runImport({ file: writeFixture("base", base()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("re-importing the same file changes nothing", out.ok && out.counts.institutions.unchanged === 2 && out.counts.agreement_links.unchanged === 1, JSON.stringify(out.counts));

// 4. Verify checked rows from the CSV
const csv = fs.readFileSync(report, "utf8").split("\n");
fs.writeFileSync(report, [csv[0], ...csv.slice(1).filter(Boolean).map((l) => l.replace(/,,$/, ",tester,2026-10-05"))].join("\n") + "\n");
let v = await verifyFromCsv({ file: report, db: testDatabase });
check("checked rows become verified", v.ok && v.verified === 4, JSON.stringify(v));
check("verified rows carry verified_at", (await count("institutions", "verification_status = 'verified' and verified_at is not null")) === 2);

// 5. A file that would change a verified row stops, and nothing in it applies
const changed = base();
changed.institutions[0].name = "Example College (renamed)";
changed.majors.push({ institution: "example-university", slug: "new-major-ba", name: "New major", ...prov, source_url: "https://example.org/new" });
out = await runImport({ file: writeFixture("changes-verified", changed), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("changing a verified row stops the import", !out.ok && out.stage === "upsert" && /verified and the file would change it/.test(out.problems[0]), JSON.stringify(out));
check("nothing from that file applied", (await count("majors", "slug = 'new-major-ba'")) === 0 && (await count("institutions", "name like '%renamed%'")) === 0);
check("the failed run is logged", (await count("import_runs", "status = 'failed'")) === 1);

// 6. A row changed after its review can't be verified from the old report
const second = base();
second.agreement_links.push({ ...second.agreement_links[0], academic_year: "2025-26", source_url: "https://assist.org/transfer/results?test=2" });
out = await runImport({ file: writeFixture("second", second), dryRun: false, db: testDatabase, reportDir: REVIEW });
const oldReport = `${out.report}.csv`;
second.agreement_links[1].source_url = "https://assist.org/transfer/results?test=3";
await runImport({ file: writeFixture("second", second), dryRun: false, db: testDatabase, reportDir: REVIEW });
const old = fs.readFileSync(oldReport, "utf8").split("\n");
fs.writeFileSync(oldReport, [old[0], ...old.slice(1).filter(Boolean).map((l) => (l.includes("2025-26") ? l.replace(/,,$/, ",tester,2026-10-05") : l))].join("\n") + "\n");
v = await verifyFromCsv({ file: oldReport, db: testDatabase });
check("a row changed since its review isn't verified", !v.ok && /changed since the review report/.test(v.problems[0]), JSON.stringify(v));
check("so it stays unverified", (await count("agreement_links", "academic_year = '2025-26' and verification_status = 'unverified'")) === 1);

// 7. Validation stops bad files before the database
const before = await count("import_runs");
const bad = (name, mutate, pattern) => {
  const data = base();
  mutate(data);
  return runImport({ file: writeFixture(name, data), dryRun: false, db: testDatabase, reportDir: REVIEW }).then((o) =>
    check(`refused: ${name}`, !o.ok && o.stage === "validate" && o.problems.some((p) => pattern.test(p)), JSON.stringify(o.problems)),
  );
};
await bad("course matches", (d) => (d.articulations = [{}]), /course matches can't be imported/);
await bad("a link that isn't ASSIST", (d) => (d.agreement_links[0].source_url = "https://example.org/agreement"), /ASSIST agreement link/);
await bad("an http link", (d) => (d.institutions[0].source_url = "http://example.org"), /https/);
await bad("a placeholder", (d) => (d.agreement_links[0].source_url = "PASTE_ASSIST_LINK"), /placeholder/);
await bad("a bad academic year", (d) => (d.majors[0].academic_year = "2026-28"), /two years in a row/);
await bad("setting verified", (d) => (d.institutions[0].verification_status = "verified"), /can't be set by an import/);
await bad("an out-of-state school", (d) => (d.institutions[1].state = "NV"), /only California/);
await bad("a duplicate", (d) => d.institutions.push({ ...d.institutions[0] }), /appears twice/);
await bad("agreement text", (d) => (d.agreement_links[0].notes = "CS 1 → CSE 11"), /isn't a field/);
await bad("a missing source", (d) => delete d.majors[0].source_url, /source_url is missing/);
check("validation failures never reach the database", (await count("import_runs")) === before);

// 8. The app's roles can't run imports
try {
  await asRole(db, "authenticated", "00000000-0000-0000-0000-00000000000a", "select import_planning_batch('{}'::jsonb, 'x', false)");
  check("a signed-in student can't run an import", false);
} catch (e) {
  check("a signed-in student can't run an import", /permission denied/.test(e.message), e.message);
}

// 9. Fetching stays off
try {
  await fetchSource({ sourceId: "assist", url: "https://assist.org/" });
  check("fetching is refused", false);
} catch (e) {
  check(`fetching is refused (${CONTACT_EMAIL === "TODO" ? "contact email not set" : "no permitted source"})`, /CONTACT_EMAIL|sources\.json|permission/.test(e.message), e.message);
}

fs.rmSync(RAW, { recursive: true, force: true });
fs.rmSync(REVIEW, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
