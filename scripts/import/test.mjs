// End-to-end test of the import pipeline on an in-memory database (PGlite). Uses made-up schools, dates and majors
// (Example College, Example University, "Test application", example-major), plus checked copies of the real Explore and
// school files in section 17; nothing touches the real project. `npm run test:import`
import fs from "node:fs";
import path from "node:path";
import { asRole, createTestDatabase } from "../test-db.mjs";
import { CONTACT_EMAIL } from "./config.mjs";
import { validateDeadlinesFile } from "./deadlines.mjs";
import { validateEssaysFile } from "./essays.mjs";
import { sharedTopics, validateExploreFile } from "./explore.mjs";
import { fetchSource } from "./fetch.mjs";
import { validatePlanningFile } from "./planning.mjs";
import { reopenRow } from "./reopen.mjs";
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
  async importDeadlines(payload, sourceFile, dryRun) {
    const r = await asRole(db, "service_role", null, "select import_deadlines_batch($1::jsonb, $2, $3) as r", [JSON.stringify(payload), sourceFile, dryRun]);
    return r.rows[0].r;
  },
  async deadlineRowsFor() {
    const q = async (t) => (await asRole(db, "service_role", null, `select * from ${t}`)).rows;
    return { deadlines: await q("deadlines"), checklists: await q("checklists"), checklist_steps: await q("checklist_steps") };
  },
  async importEssays(payload, sourceFile, dryRun) {
    const r = await asRole(db, "service_role", null, "select import_essays_batch($1::jsonb, $2, $3) as r", [JSON.stringify(payload), sourceFile, dryRun]);
    return r.rows[0].r;
  },
  async essayRowsFor() {
    return { piq_prompts: (await asRole(db, "service_role", null, "select * from piq_prompts")).rows };
  },
  async importExplore(payload, sourceFile, dryRun) {
    const r = await asRole(db, "service_role", null, "select import_explore_batch($1::jsonb, $2, $3) as r", [JSON.stringify(payload), sourceFile, dryRun]);
    return r.rows[0].r;
  },
  async exploreRowsFor() {
    const q = async (t) => (await asRole(db, "service_role", null, `select * from ${t}`)).rows;
    return { pathways: await q("pathways"), pathway_requirements: await q("pathway_requirements"), pathway_campuses: await q("pathway_campuses"), institutions: await q("institutions") };
  },
  async logFailure(sourceFile, dryRun, error) {
    await asRole(db, "service_role", null, "insert into import_runs (source_file, dry_run, status, error) values ($1, $2, 'failed', $3)", [sourceFile, dryRun, error]);
  },
  async reopenRow(id, by, reason, dryRun) {
    const r = await asRole(db, "service_role", null, "select reopen_verified_row($1, $2, $3, $4) as r", [id, by, reason, dryRun]);
    return r.rows[0].r;
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

// 10. Deadlines and checklists (14), with made-up dates: the same pipeline, the same rules
const RAW_DATES = "data/raw/deadlines/.test-import";
fs.mkdirSync(RAW_DATES, { recursive: true });
const dateProv = { source_name: "Test source", source_url: "https://example.org/dates", confirm_on: "Test source, dates page", retrieved_at: "2026-10-05" };
const dates = () => ({
  written_by: "test",
  deadlines: [
    { slug: "test-application", cycle: "fall-2027", audience: "uc", kind: "application", title: "Test application", summary: "A made-up date.",
      opens_at: "2026-10-01T00:00:00-07:00", due_at: "2026-11-30T23:59:00-08:00", due_has_time: true, varies_by_campus: false, ...dateProv },
    { slug: "test-update", cycle: "fall-2027", audience: "aid", kind: "aid", title: "Test aid form", summary: "A made-up date with no time.",
      opens_at: null, due_at: "2027-03-02T23:59:59-08:00", due_has_time: false, varies_by_campus: false, ...dateProv },
  ],
  checklists: [
    { slug: "test-checklist", cycle: "fall-2027", deadline: "test-application", name: "Test application", apply_label: "Open the test application",
      apply_url: "https://example.org/apply", ...dateProv },
  ],
  checklist_steps: [
    { checklist: "test-checklist", position: 1, title: "First step", summary: "Do the first thing.", ...dateProv },
    { checklist: "test-checklist", position: 2, title: "Second step", summary: "Do the second thing.", ...dateProv },
  ],
});
function writeDates(name, data) {
  const file = path.join(RAW_DATES, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

out = await runImport({ file: writeDates("dates", dates()), dryRun: true, db: testDatabase, reportDir: REVIEW });
check("deadlines: a dry run reports what it would insert", out.ok && out.status === "dry_run" && out.counts.deadlines.inserted === 2 && out.counts.checklist_steps.inserted === 2, JSON.stringify(out));
check("deadlines: a dry run keeps nothing", (await count("deadlines")) === 0 && (await count("checklists")) === 0);
out = await runImport({ file: writeDates("dates", dates()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("deadlines: an import applies", out.ok && out.status === "applied", JSON.stringify(out));
check("deadlines: imported rows start unverified",
  (await count("deadlines", "verification_status = 'unverified'")) === 2 && (await count("checklist_steps", "verification_status = 'unverified'")) === 2);
check("deadlines: the 11:59 p.m. Pacific instant is kept", (await count("deadlines", "due_at = '2026-12-01T07:59:00Z' and due_has_time")) === 1);
const dateReport = `${out.report}.csv`;
const dateRows = readReportCsv(dateReport);
check("deadlines: the review report lists every record", dateRows.length === 5, `${dateRows.length} rows`);
check("deadlines: each report row says where to confirm it", dateRows.every((r) => r.confirm_on === "Test source, dates page"));
check("deadlines: the report spells out the dates to check",
  dateRows.some((r) => r.record.includes("opens 2026-10-01, due 2026-11-30 23:59 Pacific")) && dateRows.some((r) => r.record.includes("due 2027-03-02 (no time stated)")),
  JSON.stringify(dateRows.map((r) => r.record)));
out = await runImport({ file: writeDates("dates", dates()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("deadlines: re-importing the same file changes nothing", out.ok && out.counts.deadlines.unchanged === 2 && out.counts.checklist_steps.unchanged === 2, JSON.stringify(out.counts));

const dateCsv = fs.readFileSync(dateReport, "utf8").split("\n");
fs.writeFileSync(dateReport, [dateCsv[0], ...dateCsv.slice(1).filter(Boolean).map((l) => l.replace(/,,$/, ",tester,2026-10-16"))].join("\n") + "\n");
v = await verifyFromCsv({ file: dateReport, db: testDatabase });
check("deadlines: checked rows become verified", v.ok && v.verified === 5, JSON.stringify(v));
check("deadlines: the app can read them now", (await asRole(db, "anon", null, "select id from checklist_steps")).rows.length === 2);

const movedDate = dates();
movedDate.deadlines[0].due_at = "2026-12-02T23:59:00-08:00";
movedDate.checklist_steps.push({ checklist: "test-checklist", position: 3, title: "Third step", summary: "Do the third thing.", ...dateProv });
out = await runImport({ file: writeDates("moved", movedDate), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("deadlines: moving a verified date stops the import", !out.ok && out.stage === "upsert" && /verified and the file would change it/.test(out.problems[0]), JSON.stringify(out));
check("deadlines: nothing from that file applied", (await count("checklist_steps")) === 2 && (await count("deadlines", "due_at = '2026-12-03T07:59:00Z'")) === 0);

// Reopening a verified row: the one way to correct it. Service role only and logged; then the corrected file is
// imported and verified like a new row.
const movedId = (await db.query("select id from deadlines where slug = 'test-application'")).rows[0].id;
const otherId = (await db.query("select id from deadlines where slug = 'test-update'")).rows[0].id;
for (const role of ["anon", "authenticated"]) {
  try {
    await asRole(db, role, "00000000-0000-0000-0000-00000000000a", "select reopen_verified_row($1, $2, $3, false)", [movedId, "tester", "the date moved"]);
    check(`reopen: refused for ${role}`, false, "it ran");
  } catch (e) {
    check(`reopen: refused for ${role}`, /permission denied/.test(e.message), e.message);
  }
}
const refusesDirectEdit = async (id) => {
  try {
    await asRole(db, "service_role", null, "update deadlines set summary = 'Changed by hand.' where id = $1", [id]);
    return false;
  } catch (e) {
    return /refusing to update verified deadlines row/.test(e.message);
  }
};
check("reopen: a verified row still can't be edited directly, even by the service role", await refusesDirectEdit(movedId));
let reopened = await reopenRow({ id: movedId, by: " ", reason: "", apply: true, db: testDatabase });
check("reopen: refused without who and why", !reopened.ok && reopened.problems.length === 2, JSON.stringify(reopened));
reopened = await reopenRow({ id: movedId, by: "tester", reason: "the date moved", apply: false, db: testDatabase });
check("reopen: a dry run unless --apply", reopened.ok && reopened.status === "dry_run" && reopened.table === "deadlines" && reopened.record === "test-application", JSON.stringify(reopened));
check("reopen: a dry run changes nothing", (await count("deadlines", "verification_status = 'verified'")) === 2 && (await count("reopen_log")) === 0);
reopened = await reopenRow({ id: movedId, by: "tester", reason: "the date moved", apply: true, db: testDatabase });
check("reopen: --apply sets the row back to unverified", reopened.ok && reopened.status === "reopened" && (await count("deadlines", `id = '${movedId}' and verification_status = 'unverified' and verified_at is null`)) === 1, JSON.stringify(reopened));
check("reopen: who, when and why are logged", (await count("reopen_log", `row_id = '${movedId}' and table_name = 'deadlines' and reopened_by = 'tester' and reason = 'the date moved' and was_verified_at is not null and created_at is not null`)) === 1);
for (const role of ["anon", "authenticated"]) {
  try {
    await asRole(db, role, "00000000-0000-0000-0000-00000000000a", "select * from reopen_log");
    check(`reopen: the log is hidden from ${role}`, false, "it was readable");
  } catch (e) {
    check(`reopen: the log is hidden from ${role}`, /permission denied/.test(e.message), e.message);
  }
}
check("reopen: students can't see the row, or its checklist, until it's verified again",
  (await asRole(db, "anon", null, "select id from deadlines where id = $1", [movedId])).rows.length === 0 && (await asRole(db, "anon", null, "select id from checklists")).rows.length === 0);
check("reopen: the guard is back on for every other verified row", await refusesDirectEdit(otherId));
reopened = await reopenRow({ id: movedId, by: "tester", reason: "again", apply: true, db: testDatabase });
check("reopen: a row that isn't verified is refused", !reopened.ok && /isn't verified/.test(reopened.problems[0]), JSON.stringify(reopened));
reopened = await reopenRow({ id: "00000000-0000-4000-8000-000000000000", by: "tester", reason: "no such row", apply: true, db: testDatabase });
check("reopen: an unknown id is refused", !reopened.ok && /no academic row has id/.test(reopened.problems[0]), JSON.stringify(reopened));

out = await runImport({ file: writeDates("moved", movedDate), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("reopen, then import: the corrected file applies", out.ok && out.counts.deadlines.updated === 1 && out.counts.checklist_steps.inserted === 1, JSON.stringify(out));
const reopenReport = `${out.report}.csv`;
const reopenCsv = fs.readFileSync(reopenReport, "utf8").split("\n");
fs.writeFileSync(reopenReport, [reopenCsv[0], ...reopenCsv.slice(1).filter(Boolean).map((l) => l.replace(/,,$/, ",tester,2026-10-17"))].join("\n") + "\n");
v = await verifyFromCsv({ file: reopenReport, db: testDatabase });
check("reopen, then import, then verify: only the changed rows are verified again", v.ok && v.verified === 2, JSON.stringify(v));
check("reopen, then import, then verify: students see the corrected date and its checklist again",
  (await asRole(db, "anon", null, "select id from deadlines where due_at = '2026-12-03T07:59:00Z'")).rows.length === 1 &&
    (await asRole(db, "anon", null, "select id from checklist_steps")).rows.length === 3);

// 11. Bad deadline files never reach the database
const beforeDates = await count("import_runs");
const badDates = (name, mutate, pattern) => {
  const data = dates();
  mutate(data);
  return runImport({ file: writeDates(name, data), dryRun: false, db: testDatabase, reportDir: REVIEW }).then((o) =>
    check(`refused: ${name}`, !o.ok && o.stage === "validate" && o.problems.some((p) => pattern.test(p)), JSON.stringify(o.problems)),
  );
};
await badDates("an empty retrieved_at", (d) => (d.deadlines[0].retrieved_at = ""), /retrieved_at is empty: check this row on the confirm_on page/);
await badDates("a TODO opening date", (d) => (d.deadlines[0].opens_at = "TODO: mid-December"), /opens_at still has a placeholder/);
await badDates("a summer offset in winter", (d) => (d.deadlines[0].due_at = "2026-11-30T23:59:00-07:00"), /wrong offset for Pacific time/);
await badDates("a date with no time at 11:59 p.m.", (d) => (d.deadlines[1].due_at = "2027-03-02T23:59:00-08:00"), /must be 23:59:59 Pacific when due_has_time is false/);
await badDates("a window that opens after it's due", (d) => (d.deadlines[0].opens_at = "2026-12-01T00:00:00-08:00"), /opens_at must be before due_at/);
await badDates("setting verified_at", (d) => (d.deadlines[0].verified_at = "2026-10-16"), /can't be set by an import/);
await badDates("an http source", (d) => (d.checklist_steps[0].source_url = "http://example.org"), /https/);
await badDates("a missing confirm_on", (d) => delete d.checklists[0].confirm_on, /confirm_on is missing/);
await badDates("a campus date with no school", (d) => (d.deadlines[0].audience = "campus"), /needs institution/);
await badDates("an unknown kind", (d) => (d.deadlines[0].kind = "party"), /kind must be one of/);
await badDates("a checklist in another cycle", (d) => (d.checklists[0].cycle = "fall-2028"), /cycle must match its deadline's/);
await badDates("a step twice", (d) => d.checklist_steps.push({ ...d.checklist_steps[0] }), /appears twice/);
await badDates("a flag as text", (d) => (d.deadlines[0].due_has_time = "yes"), /must be true or false/);
check("deadlines: validation failures never reach the database", (await count("import_runs")) === beforeDates);

// 12. The real fall 2027 file, checked on 2026-10-17 (docs/date-check.md)
const real = JSON.parse(fs.readFileSync("data/raw/deadlines/fall-2027.json", "utf8"));
const realCheck = validateDeadlinesFile(real);
const rowCount = real.deadlines.length + real.checklists.length + real.checklist_steps.length;
check("fall-2027.json passes as checked", realCheck.problems.length === 0, JSON.stringify(realCheck.problems));
check("fall-2027.json rows have no placeholder left", !/TODO|TBD|PASTE/.test(JSON.stringify([real.deadlines, real.checklists, real.checklist_steps])));
// UC Dates & deadlines states the Transfer Academic Update's opening day
check("the Transfer Academic Update opens December 15", real.deadlines.find((d) => d.slug === "uc-academic-update-fall-2027").opens_at === "2026-12-15T00:00:00-08:00");
check("summaries leave out the claims removed after review",
  ![...real.deadlines, ...real.checklist_steps].some((r) => /late applications|Six UC campuses|deposit/.test(r.summary)));
// No page states a time, and no CSU page states May 1
check("no date in the file shows a time", real.deadlines.every((d) => d.due_has_time === false) && !/11:59/.test(JSON.stringify(real)));
check("the unconfirmed CSU offer date is gone", !real.deadlines.some((d) => d.slug === "accept-csu-fall-2027"));
check("a null opening day reaches the database as null",
  realCheck.payload.deadlines.find((d) => d.slug === "accept-uc-fall-2027").opens_at === null);
// Emptied here only, never written: a row nobody has checked is still refused
for (const table of ["deadlines", "checklists", "checklist_steps"]) for (const row of real[table]) row.retrieved_at = "";
const emptied = validateDeadlinesFile(real);
check("fall-2027.json is refused while any row is unchecked",
  emptied.problems.filter((p) => /retrieved_at is empty/.test(p)).length === rowCount && emptied.problems.every((p) => /retrieved_at is empty/.test(p)),
  `${rowCount} rows, problems: ${JSON.stringify(emptied.problems)}`);

// 13. The app's roles can't run a deadlines import
try {
  await asRole(db, "authenticated", "00000000-0000-0000-0000-00000000000a", "select import_deadlines_batch('{}'::jsonb, 'x', false)");
  check("a signed-in student can't run a deadlines import", false);
} catch (e) {
  check("a signed-in student can't run a deadlines import", /permission denied/.test(e.message), e.message);
}

// 14. Personal insight questions (17), with made-up questions: the same pipeline, the same rules
const RAW_ESSAYS = "data/raw/essays/.test-import";
fs.mkdirSync(RAW_ESSAYS, { recursive: true });
const piqProv = { cycle: "fall-2027", source_name: "Test source", source_url: "https://example.org/piq", confirm_on: "Test source, questions page", retrieved_at: "2026-10-19" };
const questions = () => ({
  written_by: "test",
  piq_prompts: [
    { key: "test-required", short_name: "Required one", summary: "A made-up required question.", required: true, sort: 1, ...piqProv },
    { key: "test-optional", short_name: "Optional one", summary: "A made-up optional question.", required: false, sort: 2, ...piqProv },
  ],
});
function writeQuestions(name, data) {
  const file = path.join(RAW_ESSAYS, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}
const asStudent = (sql) => asRole(db, "authenticated", "00000000-0000-0000-0000-00000000000a", sql);

out = await runImport({ file: writeQuestions("piq", questions()), dryRun: true, db: testDatabase, reportDir: REVIEW });
check("essays: a dry run reports what it would insert", out.ok && out.status === "dry_run" && out.counts.piq_prompts.inserted === 2, JSON.stringify(out));
check("essays: a dry run keeps nothing", (await count("piq_prompts")) === 0);
out = await runImport({ file: writeQuestions("piq", questions()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("essays: an import applies", out.ok && out.status === "applied", JSON.stringify(out));
check("essays: imported questions start unverified", (await count("piq_prompts", "verification_status = 'unverified'")) === 2);
check("essays: students can't see them yet", (await asStudent("select id from piq_prompts")).rows.length === 0);
const piqReport = `${out.report}.csv`;
const piqRows = readReportCsv(piqReport);
check("essays: the review report lists every question", piqRows.length === 2, `${piqRows.length} rows`);
check("essays: each report row says where to confirm it", piqRows.every((r) => r.confirm_on === "Test source, questions page" && r.cycle === "fall-2027"));
check(
  "essays: the report shows the summary to check",
  piqRows.some((r) => r.record === "test-required (required): Required one. A made-up required question."),
  JSON.stringify(piqRows.map((r) => r.record)),
);
out = await runImport({ file: writeQuestions("piq", questions()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("essays: re-importing the same file changes nothing", out.ok && out.counts.piq_prompts.unchanged === 2, JSON.stringify(out.counts));
const piqCsv = fs.readFileSync(piqReport, "utf8").split("\n");
fs.writeFileSync(piqReport, [piqCsv[0], ...piqCsv.slice(1).filter(Boolean).map((l) => l.replace(/,,$/, ",tester,2026-10-19"))].join("\n") + "\n");
v = await verifyFromCsv({ file: piqReport, db: testDatabase });
check("essays: checked questions become verified", v.ok && v.verified === 2, JSON.stringify(v));
check("essays: signed-in students can read them now", (await asStudent("select id from piq_prompts")).rows.length === 2);
try {
  await asRole(db, "anon", null, "select id from piq_prompts");
  check("essays: signed-out visitors still can't read them", false, "it was readable");
} catch (e) {
  check("essays: signed-out visitors still can't read them", /permission denied/.test(e.message), e.message);
}
const reworded = questions();
reworded.piq_prompts[1].summary = "A reworded summary.";
out = await runImport({ file: writeQuestions("piq-reworded", reworded), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("essays: rewording a verified question stops the import", !out.ok && out.stage === "upsert" && /is verified and the file would change it/.test(out.problems[0]), JSON.stringify(out));
const optionalId = (await db.query("select id from piq_prompts where key = 'test-optional'")).rows[0].id;
reopened = await reopenRow({ id: optionalId, by: "tester", reason: "summary reworded", apply: true, db: testDatabase });
check(
  "essays: a verified question can be reopened",
  reopened.ok && reopened.status === "reopened" && reopened.table === "piq_prompts" && reopened.record === "fall-2027 test-optional: Optional one",
  JSON.stringify(reopened),
);
out = await runImport({ file: writeQuestions("piq-reworded", reworded), dryRun: false, db: testDatabase, reportDir: REVIEW });
check(
  "essays: then the reworded file applies, unverified",
  out.ok && out.counts.piq_prompts.updated === 1 && (await count("piq_prompts", "verification_status = 'unverified'")) === 1,
  JSON.stringify(out),
);

const beforeEssays = await count("import_runs");
const badQuestions = (name, mutate, pattern) => {
  const data = questions();
  mutate(data);
  return runImport({ file: writeQuestions(name, data), dryRun: false, db: testDatabase, reportDir: REVIEW }).then((o) =>
    check(`essays refused: ${name}`, !o.ok && o.stage === "validate" && o.problems.some((p) => pattern.test(p)), JSON.stringify(o.problems)),
  );
};
await badQuestions("an empty retrieved_at", (d) => (d.piq_prompts[0].retrieved_at = ""), /retrieved_at is empty: check this row on the confirm_on page/);
await badQuestions("a TODO summary", (d) => (d.piq_prompts[0].summary = "TODO"), /summary still has a placeholder/);
await badQuestions("two required questions", (d) => (d.piq_prompts[1].required = true), /exactly 1 required question \(has 2\)/);
await badQuestions("no required question", (d) => (d.piq_prompts[0].required = false), /exactly 1 required question \(has 0\)/);
await badQuestions("a key twice", (d) => (d.piq_prompts[1].key = "test-required"), /key appears twice/);
await badQuestions("a sort twice", (d) => (d.piq_prompts[1].sort = 1), /sort appears twice/);
await badQuestions("setting verified_at", (d) => (d.piq_prompts[0].verified_at = "2026-10-19"), /can't be set by an import/);
await badQuestions("an http source", (d) => (d.piq_prompts[0].source_url = "http://example.org"), /https/);
await badQuestions("a missing confirm_on", (d) => delete d.piq_prompts[0].confirm_on, /confirm_on is missing/);
await badQuestions("a cycle like 2026-27", (d) => (d.piq_prompts[0].cycle = "2026-27"), /cycle must look like fall-2027/);
await badQuestions("required as text", (d) => (d.piq_prompts[0].required = "yes"), /required must be true or false/);
await badQuestions("an unknown field", (d) => (d.piq_prompts[0].prompt_text = "UC's words"), /isn't a field this table takes/);
check("essays: validation failures never reach the database", (await count("import_runs")) === beforeEssays);

// 15. The real fall 2027 questions file, checked on 2026-10-19
const realQ = JSON.parse(fs.readFileSync("data/raw/essays/piq-fall-2027.json", "utf8"));
const realQCheck = validateEssaysFile(realQ);
check("piq-fall-2027.json passes as checked", realQCheck.problems.length === 0, JSON.stringify(realQCheck.problems));
check(
  "piq-fall-2027.json has the 8 transfer questions, one required",
  realQ.piq_prompts.length === 8 && realQ.piq_prompts.filter((q) => q.required).map((q) => q.key).join() === "major",
);
check("piq-fall-2027.json rows have no placeholder left", !/TODO|TBD|PASTE/.test(JSON.stringify(realQ.piq_prompts)));
check(
  "piq-fall-2027.json points every row at UC's transfer questions page",
  realQ.piq_prompts.every((q) => q.source_url === "https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/personal-insight-questions.html"),
);
for (const row of realQ.piq_prompts) row.retrieved_at = "";
check("piq-fall-2027.json is refused while any row is unchecked", validateEssaysFile(realQ).problems.filter((p) => /retrieved_at is empty/.test(p)).length === 8);
try {
  await asRole(db, "authenticated", "00000000-0000-0000-0000-00000000000a", "select import_essays_batch('{}'::jsonb, 'x', false)");
  check("a signed-in student can't run an essays import", false);
} catch (e) {
  check("a signed-in student can't run an essays import", /permission denied/.test(e.message), e.message);
}

// 16. Explore (21), with a made-up major: the same pipeline, the same rules
const RAW_EXPLORE = "data/raw/explore/.test-import";
fs.mkdirSync(RAW_EXPLORE, { recursive: true });
const ucProv = { source_name: "Test source", source_url: "https://admission.universityofcalifornia.edu/test-pathway", academic_year: "2026-27", retrieved_at: "2026-10-31" };
const tmcProv = { source_name: "Test source", source_url: "https://www.cccco.edu/test-template.pdf", academic_year: "2026-27", retrieved_at: "2026-10-31" };
const major = () => ({
  written_by: "test",
  slug: "example-major",
  pathways: [
    {
      kind: "uc_pathway", name: "Example major", effective_term: null, ...ucProv,
      requirements: [
        { code: "shared", sort: 1, topic: "t-shared", name: "Shared course", description: "A made-up course both list.", how_many: "One course" },
        { code: "uc-only", sort: 2, topic: "t-uc", name: "UC-only course", description: "A made-up course only UC lists.", how_many: "One course" },
      ],
      campuses: [{ institution: "example-university", major_names: ["Test major, B.S."] }],
    },
    {
      kind: "tmc", name: "Example major", code: "9999", revision: "1", degree_name: "Associate in Science in Example for Transfer", major_units: 7, total_units: 60,
      effective_term: null, ...tmcProv,
      requirements: [
        { code: "test-101", sort: 1, topic: "t-shared", name: "Shared course", description: "A made-up course both list.", how_many: "One course", units: 3, c_id: ["TEST 101"] },
        { code: "pick", sort: 2, topic: "t-pick", name: "Pick one", description: "Made-up options.", how_many: "One of 3 options", units: 4,
          options: [{ label: "First option", c_id: ["TEST 102", "TEST 103"], units: 4 }, { label: "Second option", c_id: ["TEST 900S"], units: 5 }, { label: "Any course for the major", c_id: [], units: 4 }] },
      ],
    },
  ],
});
function writeMajor(name, data) {
  const file = path.join(RAW_EXPLORE, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}
const anonPathways = async () => (await asRole(db, "anon", null, "select id from pathways where slug = 'example-major'")).rows.length;
const verifyReport = async (file) => {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  fs.writeFileSync(file, [lines[0], ...lines.slice(1).filter(Boolean).map((l) => l.replace(/,,$/, ",tester,2026-10-31"))].join("\n") + "\n");
  return verifyFromCsv({ file, db: testDatabase });
};

out = await runImport({ file: writeMajor("major", major()), dryRun: true, db: testDatabase, reportDir: REVIEW });
check("explore: a dry run reports what it would insert",
  out.ok && out.status === "dry_run" && out.counts.pathways.inserted === 2 && out.counts.pathway_requirements.inserted === 4 && out.counts.pathway_campuses.inserted === 1, JSON.stringify(out));
check("explore: a dry run keeps nothing", (await count("pathways")) === 0 && (await count("pathway_requirements")) === 0);
out = await runImport({ file: writeMajor("major", major()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("explore: an import applies", out.ok && out.status === "applied", JSON.stringify(out));
check("explore: imported rows start unverified", (await count("pathway_requirements", "verification_status = 'unverified'")) === 4);
check("explore: requirement and campus rows take their pathway's source",
  (await count("pathway_requirements", "source_url = 'https://www.cccco.edu/test-template.pdf'")) === 2 && (await count("pathway_campuses", "source_url like 'https://admission.%'")) === 1);
check("explore: C-ID numbers and options are stored as written",
  (await count("pathway_requirements", "c_id = array['TEST 101']")) === 1 && (await count("pathway_requirements", "options -> 1 -> 'c_id' = '[\"TEST 900S\"]'")) === 1 && (await count("pathway_requirements", "options -> 2 -> 'c_id' = '[]'")) === 1);
let majorReport = `${out.report}.csv`;
const majorRows = readReportCsv(majorReport);
check("explore: the review report lists every record", majorRows.length === 7, `${majorRows.length} rows`);
check("explore: the report spells out C-ID numbers, options and campus majors",
  majorRows.some((r) => r.record.includes("[TEST 101]")) && majorRows.some((r) => r.record.includes("Second option [TEST 900S], 5 units")) && majorRows.some((r) => r.record.includes("Any course for the major [no C-ID], 4 units")) &&
    majorRows.some((r) => r.record.includes("at example-university: Test major, B.S.")),
  JSON.stringify(majorRows.map((r) => r.record)));
const majorMd = fs.readFileSync(`${out.report}.md`, "utf8");
check("explore: the report sets each topic's UC and Cal State rows side by side",
  majorMd.includes("## Counts for both: example-major") && majorMd.includes("1 of 2 UC course types also count for Cal State") &&
    majorMd.includes("| t-shared | 1. Shared course | 1. Shared course [TEST 101] | yes |") && majorMd.includes("| t-uc | 2. UC-only course |  | no |") &&
    majorMd.includes("| t-pick |  | 2. Pick one [3 options] | no |"),
  majorMd.slice(majorMd.indexOf("## Counts")));
out = await runImport({ file: writeMajor("major", major()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("explore: re-importing the same file changes nothing",
  out.ok && out.counts.pathways.unchanged === 2 && out.counts.pathway_requirements.unchanged === 4 && out.counts.pathway_campuses.unchanged === 1, JSON.stringify(out.counts));
check("explore: nothing shows before it's verified", (await anonPathways()) === 0);

v = await verifyReport(majorReport);
check("explore: checked rows become verified", v.ok && v.verified === 7, JSON.stringify(v));
check("explore: the app can read the major now", (await anonPathways()) === 2);

const renamed = major();
renamed.pathways[1].requirements[0].name = "Renamed course";
out = await runImport({ file: writeMajor("renamed", renamed), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("explore: changing a verified row stops the import", !out.ok && out.stage === "upsert" && /verified and the file would change it/.test(out.problems[0]), JSON.stringify(out));
check("explore: nothing from that file applied", (await count("pathway_requirements", "name = 'Renamed course'")) === 0);

const dropped = major();
dropped.pathways[0].requirements.pop();
out = await runImport({ file: writeMajor("dropped", dropped), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("explore: dropping a verified row stops the import", !out.ok && /no longer lists it; reopen it first/.test(out.problems[0]), JSON.stringify(out));
check("explore: so the row stays", (await count("pathway_requirements", "code = 'uc-only'")) === 1);

const ucOnlyId = (await db.query("select id from pathway_requirements where code = 'uc-only'")).rows[0].id;
const reopenedReq = await reopenRow({ id: ucOnlyId, by: "tester", reason: "UC dropped this course", apply: true, db: testDatabase });
check("explore: a requirement can be reopened", reopenedReq.ok && reopenedReq.table === "pathway_requirements" && /example-major uc_pathway uc-only/.test(reopenedReq.record), JSON.stringify(reopenedReq));
check("explore: reopening one row hides the whole major", (await anonPathways()) === 0);
out = await runImport({ file: writeMajor("dropped", dropped), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("explore: then the file can drop it", out.ok && out.counts.pathway_requirements.removed === 1 && out.counts.pathway_requirements.unchanged === 3, JSON.stringify(out));
check("explore: the major comes back once every row is verified again", (await anonPathways()) === 2);

const extra = JSON.parse(JSON.stringify(dropped));
extra.pathways[0].requirements.push({ code: "new", sort: 2, topic: "t-new", name: "New course", description: "Made up.", how_many: "One course" });
await runImport({ file: writeMajor("extra", extra), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("explore: a new unverified row hides the major until it's checked", (await anonPathways()) === 0);
out = await runImport({ file: writeMajor("dropped", dropped), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("explore: an unverified row the file drops is removed", out.ok && out.counts.pathway_requirements.removed === 1 && (await anonPathways()) === 2, JSON.stringify(out));

const notUc = major();
notUc.pathways[0].campuses.push({ institution: "example-college", major_names: ["Test major"] });
out = await runImport({ file: writeMajor("not-uc", notUc), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("explore: a campus that isn't a UC stops the import", !out.ok && out.stage === "upsert" && /must be a UC campus/.test(out.problems[0]), JSON.stringify(out));

const beforeExplore = await count("import_runs");
const badMajor = (name, mutate, pattern) => {
  const data = major();
  mutate(data);
  return runImport({ file: writeMajor(name, data), dryRun: false, db: testDatabase, reportDir: REVIEW }).then((o) =>
    check(`explore: refused: ${name}`, !o.ok && o.stage === "validate" && o.problems.some((p) => pattern.test(p)), JSON.stringify(o.problems)),
  );
};
await badMajor("a todo left", (d) => (d.pathways[1].requirements[0].todo = "check the units"), /still has a todo \("check the units"\)/);
await badMajor("an empty retrieved_at", (d) => (d.pathways[0].retrieved_at = ""), /retrieved_at is empty/);
await badMajor("a lowercase C-ID", (d) => (d.pathways[1].requirements[0].c_id = ["test 101"]), /C-ID numbers written like COMP 122/);
await badMajor("a C-ID on a UC row", (d) => (d.pathways[0].requirements[0].c_id = ["TEST 101"]), /names course types, not C-ID numbers/);
await badMajor("a TMC row with neither", (d) => (d.pathways[1].requirements[0].c_id = []), /c_id, or lists options/);
await badMajor("a campus on the TMC", (d) => (d.pathways[1].campuses = [{ institution: "example-university", major_names: ["X"] }]), /doesn't list campuses/);
await badMajor("a topic twice", (d) => (d.pathways[1].requirements[1].topic = "t-shared"), /topic appears twice/);
await badMajor("units that don't add up", (d) => (d.pathways[1].major_units = 8), /add up to 7 units, but major_units is 8/);
await badMajor("a pick-one row's units", (d) => (d.pathways[1].requirements[1].units = 5), /smallest option's units \(4\)/);
await badMajor("an option with UC's text", (d) => (d.pathways[1].requirements[1].options[0].text = "UC's words"), /isn't a field an option takes/);
await badMajor("an option's badly written C-ID", (d) => (d.pathways[1].requirements[1].options[0].c_id = ["TEST 102", "test 103"]), /C-ID numbers written like COMP 122/);
await badMajor("an option without a c_id list", (d) => delete d.pathways[1].requirements[1].options[2].c_id, /c_id must be a list/);
await badMajor("an option with no C-ID and no label", (d) => (d.pathways[1].requirements[1].options[2].label = " "), /label is missing/);
await badMajor("an option with no C-ID and no units", (d) => delete d.pathways[1].requirements[1].options[2].units, /units must be a number above 0/);
await badMajor("a TMC source off cccco.edu", (d) => (d.pathways[1].source_url = "https://example.org/template.pdf"), /must be on cccco.edu/);
await badMajor("a UC source off UC Admissions", (d) => (d.pathways[0].source_url = "https://www.ucop.edu/pathway"), /admission.universityofcalifornia.edu/);
await badMajor("an effective term with a space", (d) => (d.pathways[0].effective_term = "fall 2027"), /look like fall-2027/);
await badMajor("a TMC without its number", (d) => delete d.pathways[1].code, /template number/);
await badMajor("template fields on a UC pathway", (d) => (d.pathways[0].revision = "1"), /revision is for a TMC/);
await badMajor("two UC pathways", (d) => d.pathways.push({ ...d.pathways[0] }), /lists it twice/);
await badMajor("setting verified", (d) => (d.pathways[0].verification_status = "verified"), /can't be set by an import/);
check("explore: validation failures never reach the database", (await count("import_runs")) === beforeExplore);
try {
  await asRole(db, "authenticated", "00000000-0000-0000-0000-00000000000a", "select import_explore_batch('{}'::jsonb, 'x', false)");
  check("explore: a signed-in student can't run an import", false);
} catch (e) {
  check("explore: a signed-in student can't run an import", /permission denied/.test(e.message), e.message);
}

// 17. The real files, as drafted for Ryan to check. Filled in here only, in copies, never written back.
const fillIn = (data, date) => {
  const strip = (o) => {
    if (Array.isArray(o)) o.forEach(strip);
    else if (o && typeof o === "object") {
      delete o.todo;
      Object.values(o).forEach(strip);
    }
  };
  strip(data);
  for (const row of [...(data.pathways ?? []), ...(data.institutions ?? []), ...(data.majors ?? [])]) if (row.retrieved_at === "") row.retrieved_at = date;
  return data;
};
const realCs = () => JSON.parse(fs.readFileSync("data/raw/explore/computer-science.json", "utf8"));
const cs = validateExploreFile(realCs());
check("computer-science.json passes as checked", cs.problems.length === 0, JSON.stringify(cs.problems));
const csReqs = cs.payload?.pathway_requirements ?? [];
const ucReqs = csReqs.filter((r) => r.kind === "uc_pathway");
const tmcReqs = csReqs.filter((r) => r.kind === "tmc");
check("computer-science.json has UC's 9 course types in the page's order",
  ucReqs.map((r) => r.topic).join() === "cs1,cs2,comp-org,calculus-single,calculus-multi,discrete,linear-algebra,diff-eq,physics-year", ucReqs.map((r) => r.topic).join());
check("computer-science.json has the template's C-ID numbers exactly",
  JSON.stringify(tmcReqs.map((r) => (r.c_id.length ? r.c_id : r.options.map((o) => o.c_id)))) ===
    JSON.stringify([["COMP 122"], ["COMP 132"], ["COMP 142"], ["COMP 152"], [["MATH 210", "MATH 220"], ["MATH 211", "MATH 221"], ["MATH 900S"]], ["PHYS 205"], [["PHYS 210"], ["BIOL 190"], ["BIOL 140"], ["CHEM 110"]]]),
  JSON.stringify(tmcReqs.map((r) => r.c_id)));
check("computer-science.json: 5 of the 9 UC course types count for both", sharedTopics(csReqs).join() === "cs1,cs2,comp-org,discrete,calculus-single", sharedTopics(csReqs).join());
check("computer-science.json keeps the two physics rows apart", !sharedTopics(csReqs).some((t) => t.startsWith("physics")) && /Cal State/.test(ucReqs[8]?.description));
const tmcPath = cs.payload?.pathways.find((p) => p.kind === "tmc");
check("computer-science.json names template #2007 rev. 3 at 28 and 60 units",
  tmcPath?.code === "2007" && tmcPath.revision === "3" && tmcPath.major_units === 28 && tmcPath.total_units === 60 &&
    tmcPath.source_url === "https://www.cccco.edu/-/media/CCCCO-Website/docs/template/tmc-computersci-rev-3-a11y.pdf");
check("computer-science.json lists the 9 UC campuses, 5 majors at Santa Cruz",
  cs.payload?.pathway_campuses.length === 9 && cs.payload.pathway_campuses.find((c) => c.institution === "uc-santa-cruz").major_names.length === 5);

// Batch 2a: drafts stop only on their todos and empty dates, and pass once a person has cleared those
const BATCH_2A = ["biological-sciences", "psychology", "business-administration", "economics", "political-science", "sociology", "communication", "mathematics"];
const readRaw = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
for (const slug of BATCH_2A) {
  const explore = `data/raw/explore/${slug}.json`;
  const planning = `data/raw/planning/${slug}-majors.json`;
  const exploreOpen = validateExploreFile(readRaw(explore)).problems.filter((p) => !/still has a todo|retrieved_at is empty/.test(p));
  check(`${slug}.json is refused only for its todos and dates`, exploreOpen.length === 0, JSON.stringify(exploreOpen));
  const filled = validateExploreFile(fillIn(readRaw(explore), "2026-10-31"));
  check(`${slug}.json passes once checked`, filled.problems.length === 0, JSON.stringify(filled.problems));
  const majorsOpen = validatePlanningFile(readRaw(planning)).problems.filter((p) => !/retrieved_at is empty|todo isn't a field/.test(p));
  check(`${slug}-majors.json is refused only for its todos and dates`, majorsOpen.length === 0, JSON.stringify(majorsOpen));
  const majorsFilled = validatePlanningFile(fillIn(readRaw(planning), "2026-10-31"));
  check(`${slug}-majors.json passes once checked`, majorsFilled.problems.length === 0, JSON.stringify(majorsFilled.problems));
}
const bioCalculus = readRaw("data/raw/explore/biological-sciences.json").pathways[1].requirements.find((r) => r.code === "calculus-first");
check("biology's calculus row has the 3-unit course as its own option with no C-ID",
  bioCalculus.units === 3 && bioCalculus.c_id === undefined && JSON.stringify(bioCalculus.options.map((o) => [o.c_id, o.units])) === JSON.stringify([[["MATH 210"], 4], [["MATH 211"], 4], [[], 3]]), JSON.stringify(bioCalculus));
const santaCruzSlugs = (slug) => readRaw(`data/raw/planning/${slug}-majors.json`).majors.filter((m) => m.institution === "uc-santa-cruz").map((m) => m.slug);
const econCampus = readRaw("data/raw/explore/economics.json").pathways[0].campuses.find((c) => c.institution === "uc-santa-cruz");
check("UC Santa Cruz's Business Management Economics: both pathways list it, one majors row",
  econCampus.major_names.includes("Business Management Economics, B.A.") && santaCruzSlugs("business-administration").includes("business-management-economics-ba") && !santaCruzSlugs("economics").includes("business-management-economics-ba"));

const realInst = () => JSON.parse(fs.readFileSync("data/raw/planning/california-institutions.json", "utf8"));
const instAsIs = validatePlanningFile(realInst()).problems;
check("california-institutions.json is refused until every new row is checked", instAsIs.length === 145 && instAsIs.every((p) => /retrieved_at is empty/.test(p)), `${instAsIs.length}: ${instAsIs[0]}`);
const inst = validatePlanningFile(fillIn(realInst(), "2026-10-31"));
check("california-institutions.json passes once checked", inst.problems.length === 0, JSON.stringify(inst.problems.slice(0, 3)));
const bySystem = (s, type) => (inst.payload?.institutions ?? []).filter((r) => r.system === s && r.institution_type === type).length;
check("california-institutions.json has 116 community colleges, 22 Cal State and 9 UC",
  bySystem("CCC", "community_college") === 116 && bySystem("CSU", "university") === 22 && bySystem("UC", "university") === 9 && inst.payload.institutions.length === 147);
const firstSlice = JSON.parse(fs.readFileSync("data/raw/planning/las-positas-ucsd-cs.json", "utf8"));
check("california-institutions.json keeps las-positas and uc-san-diego exactly as the first slice has them",
  firstSlice.institutions.every((r) => JSON.stringify(realInst().institutions.find((i) => i.slug === r.slug)) === JSON.stringify(r)));
check("the first slice links UC San Diego's Computer Science to Explore",
  validatePlanningFile(firstSlice).problems.length === 0 && firstSlice.majors[0].explore_slug === "computer-science");
check("california-institutions.json has no Cal Maritime and no noncredit schools", !realInst().institutions.some((r) => /Maritime|Continuing Education/.test(r.name)));

// Both checked copies through the pipeline, into the in-memory database only
const RAW_PLANNING = "data/raw/planning/.test-import";
fs.mkdirSync(RAW_PLANNING, { recursive: true });
const instFile = path.join(RAW_PLANNING, "california-institutions.json");
fs.writeFileSync(instFile, JSON.stringify(fillIn(realInst(), "2026-10-31"), null, 2));
out = await runImport({ file: instFile, dryRun: false, db: testDatabase, reportDir: REVIEW });
check("california-institutions.json imports", out.ok && out.counts.institutions.inserted === 147, JSON.stringify(out.counts ?? out.problems));
out = await runImport({ file: writeMajor("computer-science", realCs()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("computer-science.json imports", out.ok && out.counts.pathways.inserted === 2 && out.counts.pathway_requirements.inserted === 16 && out.counts.pathway_campuses.inserted === 9,
  JSON.stringify(out.counts ?? out.problems));
const csMd = out.ok ? fs.readFileSync(`${out.report}.md`, "utf8") : "";
check("its review report shows 5 of 9 counting for both", csMd.includes("5 of 9 UC course types also count for Cal State"), csMd.slice(csMd.indexOf("## Counts")));

// The Computer Science majors at every UC campus in the pathway and every Cal State campus that offers the degree,
// so a student anywhere can pick a real major in onboarding
const realMajors = () => JSON.parse(fs.readFileSync("data/raw/planning/computer-science-majors.json", "utf8"));
const majorsAsIs = validatePlanningFile(realMajors()).problems;
check("computer-science-majors.json is refused until every row is checked",
  majorsAsIs.length === realMajors().majors.length && majorsAsIs.every((p) => /retrieved_at is empty/.test(p)), `${majorsAsIs.length}: ${majorsAsIs[0]}`);
const csMajors = realMajors().majors;
check("every major links to Explore's computer-science", csMajors.every((m) => m.explore_slug === "computer-science"));
check("UC San Diego's major isn't added twice (the first slice has it)", !csMajors.some((m) => m.institution === "uc-san-diego"));
const schoolSystem = new Map(realInst().institutions.map((i) => [i.slug, i.system]));
check("every row names a UC or Cal State school in california-institutions.json", csMajors.every((m) => ["UC", "CSU"].includes(schoolSystem.get(m.institution))));
// "Computer Science" + "BS" is "Computer Science, B.S." on the pathway page; Santa Cruz lists its B.A. and B.S. on one line
const dotted = (d) => `${d.split("").join(".")}.`;
const campusMajors = new Map((cs.payload?.pathway_campuses ?? []).map((c) => [c.institution, c.major_names]));
const ucMajors = csMajors.filter((m) => schoolSystem.get(m.institution) === "UC");
check("each UC major is one the pathway lists at that campus",
  ucMajors.every((m) => (campusMajors.get(m.institution) ?? []).some((n) => n === `${m.name}, ${dotted(m.degree_type)}` || (n.startsWith(`${m.name}, `) && n.includes(dotted(m.degree_type))))),
  ucMajors.map((m) => `${m.institution}: ${m.name} ${m.degree_type}`));
check("every pathway campus has a major (UC San Diego's from the first slice)",
  [...campusMajors.keys()].every((slug) => slug === "uc-san-diego" || ucMajors.some((m) => m.institution === slug)));
check("Cal State rows are Computer Science bachelor's degrees from the campus catalog",
  csMajors.filter((m) => schoolSystem.get(m.institution) === "CSU").every((m) => m.name === "Computer Science" && ["BS", "BA"].includes(m.degree_type) && new URL(m.source_url).protocol === "https:"));

const majorsFile = path.join(RAW_PLANNING, "computer-science-majors.json");
fs.writeFileSync(majorsFile, JSON.stringify(fillIn(realMajors(), "2026-10-31"), null, 2));
out = await runImport({ file: majorsFile, dryRun: false, db: testDatabase, reportDir: REVIEW });
check("computer-science-majors.json imports", out.ok && out.counts.majors.inserted === csMajors.length, JSON.stringify(out.counts ?? out.problems));
const majorsReport = out.ok ? readReportCsv(`${out.report}.csv`) : [];
check("its review report lists every major with its source", majorsReport.length === csMajors.length && majorsReport.every((r) => r.table === "majors" && r.source_url.startsWith("https://")),
  `${majorsReport.length} rows`);
v = out.ok ? await verifyReport(`${out.report}.csv`) : { ok: false };
check("the majors are verified from the report", v.ok && v.verified === csMajors.length, JSON.stringify(v));

// Onboarding's major step: getMajors (lib/data/catalog.ts) as a signed-in student, for the schools picked in step 2
const majorStep = async (slug) =>
  (await asRole(db, "authenticated", "00000000-0000-0000-0000-00000000000a",
    `select m.name, m.degree_type, m.verification_status from majors m join institutions i on i.id = m.institution_id
     where i.slug = $1 and m.is_demo = false order by m.name`, [slug])).rows;
for (const slug of ["uc-davis", "san-jose-state"]) {
  const rows = await majorStep(slug);
  check(`onboarding's major step shows Computer Science at ${slug}`,
    rows.some((m) => m.name === "Computer Science" && m.degree_type === "BS" && m.verification_status === "verified"), rows);
}

fs.rmSync(RAW, { recursive: true, force: true });
fs.rmSync(RAW_EXPLORE, { recursive: true, force: true });
fs.rmSync(RAW_PLANNING, { recursive: true, force: true });
fs.rmSync(RAW_ESSAYS, { recursive: true, force: true });
fs.rmSync(RAW_DATES, { recursive: true, force: true });
fs.rmSync(REVIEW, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
