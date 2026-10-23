// Runs supabase/migrations against an in-memory Postgres (PGlite) with stand-ins for Supabase's roles and auth schema,
// then checks the row-level security and verified-record rules. Touches no real database: `node scripts/test-migrations.mjs`
import { asRole, createTestDatabase } from "./test-db.mjs";

const db = await createTestDatabase();

let failed = 0;
const as = (role, sub, sql, params) => asRole(db, role, sub, sql, params);
async function expectOk(name, fn) {
  try {
    const r = await fn();
    console.log("ok   ", name, r?.rows ? `(${r.rows.length} rows)` : "");
    return r;
  } catch (e) {
    failed++;
    console.log("FAIL ", name, "-", e.message);
  }
}
async function expectError(name, fn, match) {
  try {
    await fn();
    failed++;
    console.log("FAIL ", name, "- no error");
  } catch (e) {
    if (match && !match.test(e.message)) {
      failed++;
      console.log("FAIL ", name, "- wrong error:", e.message);
    } else console.log("ok   ", name, "-", e.message.split("\n")[0]);
  }
}
async function expectRows(name, fn, n) {
  const r = await expectOk(name, fn);
  if (r && r.rows.length !== n) {
    failed++;
    console.log("FAIL ", name, `- expected ${n} rows, got ${r.rows.length}`);
  }
}

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const prov = `'Test source', 'https://example.org/test', '2026-27', now()`;
const college = `insert into institutions (slug, name, institution_type, source_name, source_url, academic_year, retrieved_at)
  values ('example-college', 'Example College', 'community_college', ${prov}) returning id`;

// Academic tables: readable by everyone, writable only by the service role
await expectError("anon cannot insert an institution", () => as("anon", null, college), /permission denied/);
await expectError("a signed-in student cannot insert an institution", () => as("authenticated", A, college), /permission denied/);
const inst = await expectOk("service role inserts an institution", () => as("service_role", null, college));
const instId = inst?.rows[0].id;
await expectRows("anon can read institutions", () => as("anon", null, "select * from institutions"), 1);
await expectError("a student cannot update an institution", () => as("authenticated", A, "update institutions set name = 'x'"), /permission denied/);
await expectRows("anon can read app_config", () => as("anon", null, "select * from app_config where key = 'current_cycle'"), 1);
await expectError("anon cannot read import_runs", () => as("anon", null, "select * from import_runs"), /permission denied/);

// Provenance rules
await expectError("academic_year must look like 2026-27", () =>
  as("service_role", null, `insert into institutions (slug, name, institution_type, source_name, source_url, academic_year, retrieved_at)
    values ('bad-year', 'X', 'university', 'S', 'https://x', '2026', now())`), /check/);
await expectError("verified needs verified_at", () =>
  as("service_role", null, `update institutions set verification_status = 'verified' where id = $1`, [instId]), /check/);
const uni = await as("service_role", null, `insert into institutions (slug, name, institution_type, source_name, source_url, academic_year, retrieved_at)
  values ('example-university', 'Example University', 'university', ${prov}) returning id`);
const major = await as("service_role", null, `insert into majors (institution_id, slug, name, source_name, source_url, academic_year, retrieved_at)
  values ($1, 'test-major', 'Test major', ${prov}) returning id`, [uni.rows[0].id]);
const link = (url) => as("service_role", null, `insert into agreement_links (sending_institution_id, receiving_institution_id, major_id, source_name, source_url, academic_year, retrieved_at)
  values ($1, $2, $3, 'Test source', $4, '2026-27', now())`, [instId, uni.rows[0].id, major.rows[0].id, url]);
await expectError("agreement links must be https", () => link("http://example.org/agreement"), /source_url_check/);
await expectOk("an https agreement link is accepted", () => link("https://example.org/agreement"));
await expectError("one link per college, school, major and year", () => link("https://example.org/other"), /duplicate key/);
await expectRows("anon can read agreement links", () => as("anon", null, "select * from agreement_links"), 1);

// A verified row can't be changed or deleted, except through the verify step
await expectOk("service role verifies the institution", () =>
  as("service_role", null, `update institutions set verification_status = 'verified', verified_at = now() where id = $1`, [instId]));
await expectError("a verified row can't be changed by an import", () =>
  as("service_role", null, `update institutions set name = 'Changed' where id = $1`, [instId]), /refusing to update verified/);
await expectError("a verified row can't be deleted", () =>
  as("service_role", null, `delete from institutions where id = $1`, [instId]), /refusing to delete verified/);
await expectOk("the verify step can change it", async () => {
  await db.exec("begin; select set_config('stackd.allow_verified_change', 'on', true);");
  const r = await db.query(`update institutions set name = 'Example College' where id = $1 returning id`, [instId]);
  await db.exec("commit;");
  return r;
});

// New accounts get a profile with their first name
await db.query(`insert into auth.users (id, raw_user_meta_data) values ($1, '{"first_name":" Maya "}'), ($2, '{}')`, [A, B]);
const profile = await expectOk("a profile is created at sign-up", () => db.query("select first_name from profiles where user_id = $1", [A]));
if (profile?.rows[0]?.first_name !== "Maya") {
  failed++;
  console.log("FAIL  first name is trimmed and stored - got", profile?.rows[0]?.first_name);
} else console.log("ok    first name is trimmed and stored");

// Per-student tables: owner only
await expectRows("a student reads their own profile", () => as("authenticated", A, "select * from profiles"), 1);
await expectRows("a student can't see another student's profile", () => as("authenticated", A, "select * from profiles where user_id = $1", [B]), 0);
await expectError("anon can't read profiles", () => as("anon", null, "select * from profiles"), /permission denied/);
await expectOk("a student saves a school", () => as("authenticated", A, "insert into saved_schools (user_id, institution_id) values ($1, $2)", [A, instId]));
await expectError("a student can't save a school for someone else", () =>
  as("authenticated", A, "insert into saved_schools (user_id, institution_id) values ($1, $2)", [B, instId]), /row-level security/);
await expectRows("another student sees none of it", () => as("authenticated", B, "select * from saved_schools"), 0);
const changed = await expectOk("a student can't change another student's profile", () =>
  as("authenticated", B, "update profiles set first_name = 'x' where user_id = $1 returning user_id", [A]));
if (changed && changed.rows.length !== 0) {
  failed++;
  console.log("FAIL  the update reached another student's row");
}

// The plan: save_plan writes the caller's home college and targets, all or nothing
function check(name, pass, got) {
  if (pass) console.log("ok   ", name);
  else {
    failed++;
    console.log("FAIL ", name, "- got", JSON.stringify(got));
  }
}
const uniId = uni.rows[0].id;
const majorId = major.rows[0].id;
const uni2 = await as("service_role", null, `insert into institutions (slug, name, institution_type, source_name, source_url, academic_year, retrieved_at)
  values ('second-university', 'Second University', 'university', ${prov}) returning id`);
const uni2Id = uni2.rows[0].id;
const major2 = await as("service_role", null, `insert into majors (institution_id, slug, name, source_name, source_url, academic_year, retrieved_at)
  values ($1, 'other-major', 'Other major', ${prov}) returning id`, [uni2Id]);
const major2Id = major2.rows[0].id;
const savePlan = (role, sub, home, updateHome, targets) =>
  as(role, sub, "select save_plan($1, $2, $3::jsonb)", [home, updateHome, targets === null ? null : JSON.stringify(targets)]);
const targetsOf = async (sub) => (await db.query("select institution_id, major_id, major_not_listed, position from user_targets where user_id = $1 order by position", [sub])).rows;
const homeOf = async (sub) => (await db.query("select home_institution_id from profiles where user_id = $1", [sub])).rows[0]?.home_institution_id;

await expectError("anon can't call save_plan", () => savePlan("anon", null, instId, true, []), /permission denied/);
await expectError("save_plan needs a signed-in student", () => savePlan("authenticated", null, instId, true, []), /not signed in/);
await expectOk("a student saves a plan", () => savePlan("authenticated", A, instId, true, [{ institution_id: uniId, major_id: majorId }]));
check("the home college is saved", (await homeOf(A)) === instId, await homeOf(A));
let targets = await targetsOf(A);
check("the target is saved with its major", targets.length === 1 && targets[0].institution_id === uniId && targets[0].major_id === majorId, targets);
check("another student's plan is untouched", (await targetsOf(B)).length === 0 && (await homeOf(B)) === null, await targetsOf(B));

await expectOk("targets are replaced, in the order given", () =>
  savePlan("authenticated", A, null, false, [{ institution_id: uni2Id, major_id: null }, { institution_id: uniId, major_id: majorId }]));
targets = await targetsOf(A);
check("schools keep the order they were chosen in",
  targets.length === 2 && targets[0].institution_id === uni2Id && targets[0].position === 1 && targets[1].institution_id === uniId && targets[1].position === 2, targets);
check("a target can have no major", targets[0]?.major_id === null, targets);
check("a missing major is \"not picked yet\" unless the plan says otherwise", targets.every((t) => t.major_not_listed === false), targets);
await expectOk("\"Not listed yet\" is saved as its own answer", () =>
  savePlan("authenticated", A, null, false, [{ institution_id: uni2Id, major_id: null, major_not_listed: true }, { institution_id: uniId, major_id: majorId }]));
targets = await targetsOf(A);
check("the flag is on the school it was chosen for, and only that one", targets[0]?.major_not_listed === true && targets[0].major_id === null && targets[1]?.major_not_listed === false, targets);
await expectError("a school can't have a major and \"Not listed yet\" at once", () =>
  savePlan("authenticated", A, null, false, [{ institution_id: uniId, major_id: majorId, major_not_listed: true }]), /major_not_listed_check/);
check("the refused save changed nothing", (await targetsOf(A)).length === 2, await targetsOf(A));
check("the home college is left alone when p_update_home is false", (await homeOf(A)) === instId, await homeOf(A));

await expectError("a target that isn't on record stops the save", () =>
  savePlan("authenticated", A, null, true, [{ institution_id: "00000000-0000-0000-0000-0000000000ff", major_id: null }]), /university on record/);
check("a failed save changes nothing (home)", (await homeOf(A)) === instId, await homeOf(A));
check("a failed save changes nothing (targets)", (await targetsOf(A)).length === 2, await targetsOf(A));
await expectError("a major must belong to its school", () =>
  savePlan("authenticated", A, null, false, [{ institution_id: uni2Id, major_id: majorId }]), /belong to its school/);
await expectError("the home college must be a community college", () => savePlan("authenticated", A, uniId, true, null), /community college/);
await expectError("a school can't be in the plan twice", () =>
  savePlan("authenticated", A, null, false, [{ institution_id: uniId, major_id: null }, { institution_id: uniId, major_id: majorId }]), /only be in the plan once/);

// A removed school takes its saved progress with it; the schools that stay keep theirs
const requirement = (majorRow, code) => as("service_role", null, `insert into requirements (major_id, code, name, source_name, source_url, academic_year, retrieved_at)
  values ($1, $2, 'Test requirement', ${prov}) returning id`, [majorRow, code]);
const req1 = (await requirement(majorId, "req-1")).rows[0].id;
const req2 = (await requirement(major2Id, "req-2")).rows[0].id;
await as("authenticated", A, "insert into user_requirement_status (user_id, requirement_id, status) values ($1, $2, 'done'), ($1, $3, 'in_progress')", [A, req1, req2]);
await expectOk("a student removes a school from the plan", () => savePlan("authenticated", A, null, false, [{ institution_id: uni2Id, major_id: major2Id }]));
const statuses = (await db.query("select requirement_id from user_requirement_status where user_id = $1", [A])).rows.map((r) => r.requirement_id);
check("the removed school's progress is deleted, the kept school's stays", statuses.length === 1 && statuses[0] === req2, statuses);

await expectOk("null targets leave the targets alone", () => savePlan("authenticated", A, null, true, null));
check("\"My college isn't listed\" clears the home college", (await homeOf(A)) === null, await homeOf(A));
check("the targets are still there", (await targetsOf(A)).length === 1, await targetsOf(A));

// Deadlines (14): only verified dates, checklists and steps reach the app, and only the service role writes them
const addDeadline = (slug, columns = {}) => {
  const row = {
    slug, cycle: "fall-2027", audience: "uc", kind: "application", title: "Test application", summary: "A test date.",
    opens_at: "2026-10-01T00:00:00-07:00", due_at: "2026-11-30T23:59:00-08:00", due_has_time: true,
    source_name: "Test source", source_url: "https://example.org/dates", ...columns,
  };
  // An undefined column is left out, so the table's default applies
  const entries = Object.entries(row).filter(([, v]) => v !== undefined);
  return as("service_role", null, `insert into deadlines (${entries.map(([k]) => k).join(", ")}, retrieved_at)
    values (${entries.map((_, i) => `$${i + 1}`).join(", ")}, now()) returning id`, entries.map(([, v]) => v));
};
const verifyRow = (table, id) => as("service_role", null, `update ${table} set verification_status = 'verified', verified_at = now() where id = $1`, [id]);

await expectError("anon cannot add a deadline", () => as("anon", null, "insert into deadlines (slug) values ('x')"), /permission denied/);
await expectError("a student cannot add a deadline", () => as("authenticated", A, "insert into deadlines (slug) values ('x')"), /permission denied/);
const dueId = (await expectOk("service role adds a deadline", () => addDeadline("test-application")))?.rows[0].id;
await expectRows("an unverified deadline is hidden from anon", () => as("anon", null, "select * from deadlines"), 0);
await expectRows("an unverified deadline is hidden from students", () => as("authenticated", A, "select * from deadlines"), 0);
await verifyRow("deadlines", dueId);
await expectRows("a verified deadline is readable by anon", () => as("anon", null, "select * from deadlines"), 1);
const dueRow = (await as("authenticated", A, "select due_at, due_has_time from deadlines where id = $1", [dueId])).rows[0];
check("an 11:59 p.m. Pacific deadline keeps its exact instant", dueRow?.due_at.toISOString() === "2026-12-01T07:59:00.000Z" && dueRow.due_has_time === true, dueRow);
const dateOnly = await addDeadline("date-only", { opens_at: undefined, due_at: "2027-01-31T23:59:59-08:00", due_has_time: undefined });
const dateOnlyRow = (await db.query("select due_has_time from deadlines where id = $1", [dateOnly.rows[0].id])).rows[0];
check("a date with no stated time defaults to due_has_time false", dateOnlyRow?.due_has_time === false, dateOnlyRow);
await expectError("a verified deadline can't be changed by an import", () =>
  as("service_role", null, "update deadlines set title = 'Changed' where id = $1", [dueId]), /refusing to update verified/);
await expectError("a deadline can't open after it's due", () => addDeadline("bad-window", { opens_at: "2026-12-01T00:00:00-08:00" }), /check/);
await expectError("a deadline's source must be https", () => addDeadline("bad-source", { source_url: "http://example.org" }), /source_url_check/);
await expectError("a cycle must look like fall-2027", () => addDeadline("bad-cycle", { cycle: "2027" }), /cycle_check/);
await expectError("a campus-only date needs its school", () => addDeadline("no-campus", { audience: "campus" }), /check/);
await expectError("a UC-wide date can't name one school", () => addDeadline("uc-with-school", { institution_id: uniId }), /check/);
await expectOk("a campus-only date names its school", () => addDeadline("campus-date", { audience: "campus", institution_id: uniId }));

const addChecklist = (slug, deadlineId) => as("service_role", null, `insert into checklists (slug, cycle, deadline_id, name, apply_label, apply_url, source_name, source_url, retrieved_at)
  values ($1, 'fall-2027', $2, 'Test application', 'Open the test application', 'https://example.org/apply', 'Test source', 'https://example.org/how', now()) returning id`, [slug, deadlineId]);
const addStep = (checklistId, position) => as("service_role", null, `insert into checklist_steps (checklist_id, position, title, summary, source_name, source_url, retrieved_at)
  values ($1, $2, 'A step', 'What to do.', 'Test source', 'https://example.org/how', now()) returning id`, [checklistId, position]);
const listId = (await expectOk("service role adds a checklist", () => addChecklist("test-checklist", dueId)))?.rows[0].id;
await expectError("one checklist per deadline", () => addChecklist("second-checklist", dueId), /duplicate key/);
const stepId = (await addStep(listId, 1)).rows[0].id;
await expectError("one step per position", () => addStep(listId, 1), /duplicate key/);
await expectRows("an unverified checklist is hidden", () => as("anon", null, "select * from checklists"), 0);
await verifyRow("checklists", listId);
await expectRows("a verified checklist on a verified deadline is readable", () => as("anon", null, "select * from checklists"), 1);
await expectRows("an unverified step is hidden", () => as("anon", null, "select * from checklist_steps"), 0);
await verifyRow("checklist_steps", stepId);
await expectRows("a verified step on a verified checklist is readable", () => as("authenticated", A, "select * from checklist_steps"), 1);
const hiddenDue = (await addDeadline("unverified-application")).rows[0].id;
const hiddenList = (await addChecklist("hidden-checklist", hiddenDue)).rows[0].id;
await verifyRow("checklists", hiddenList);
await expectRows("a verified checklist on an unverified deadline stays hidden", () => as("anon", null, "select * from checklists where id = $1", [hiddenList]), 0);
const hiddenStep = (await addStep(hiddenList, 1)).rows[0].id;
await verifyRow("checklist_steps", hiddenStep);
await expectRows("a verified step under a hidden checklist stays hidden", () => as("anon", null, "select * from checklist_steps where id = $1", [hiddenStep]), 0);
await expectError("a student cannot change a step", () => as("authenticated", A, "update checklist_steps set title = 'x'"), /permission denied/);

// The student's marks: owner only
await expectError("anon can't read deadline marks", () => as("anon", null, "select * from user_deadlines"), /permission denied/);
await expectOk("a student marks a deadline done with reminders", () =>
  as("authenticated", A, "insert into user_deadlines (user_id, deadline_id, done_at, reminders) values ($1, $2, now(), '{7,1}')", [A, dueId]));
await expectOk("reminders can follow the default (null)", () =>
  as("authenticated", B, "insert into user_deadlines (user_id, deadline_id) values ($1, $2)", [B, dueId]));
await expectError("reminders are only 7, 3, 1 or 0 days before", () =>
  as("authenticated", B, "update user_deadlines set reminders = '{5}' where user_id = $1", [B]), /reminders_check/);
await expectError("a student can't mark a deadline for someone else", () =>
  as("authenticated", A, "insert into user_deadlines (user_id, deadline_id) values ($1, $2)", [B, hiddenDue]), /row-level security/);
await expectRows("a student sees only their own marks", () => as("authenticated", A, "select * from user_deadlines"), 1);
const undone = await expectOk("a student can't undo another student's mark", () =>
  as("authenticated", B, "update user_deadlines set done_at = null where user_id = $1 returning user_id", [A]));
check("the update reached no one else's row", undone?.rows.length === 0, undone?.rows);
await expectOk("a student undoes their own mark", () => as("authenticated", B, "delete from user_deadlines where user_id = $1", [B]));
await expectOk("a student checks off a step", () => as("authenticated", A, "insert into user_checklist_steps (user_id, step_id) values ($1, $2)", [A, stepId]));
await expectRows("another student doesn't see it", () => as("authenticated", B, "select * from user_checklist_steps"), 0);
await expectError("a student can't check a step off for someone else", () =>
  as("authenticated", B, "insert into user_checklist_steps (user_id, step_id) values ($1, $2)", [A, hiddenStep]), /row-level security/);

// The transfer term on the profile
await expectOk("a student saves their transfer term", () =>
  as("authenticated", A, "update profiles set transfer_term = 'fall-2027', transfer_term_asked = true where user_id = $1", [A]));
await expectOk("\"Not sure yet\" saves no term, and stops the asking", () =>
  as("authenticated", B, "update profiles set transfer_term = null, transfer_term_asked = true where user_id = $1", [B]));
await expectError("a transfer term must look like fall-2027", () =>
  as("authenticated", A, "update profiles set transfer_term = 'next year' where user_id = $1", [A]), /transfer_term_check/);
await expectError("a term can't be saved without counting as asked", () =>
  as("authenticated", A, "update profiles set transfer_term = 'fall-2028', transfer_term_asked = false where user_id = $1", [A]), /transfer_term_asked_check/);
const termChange = await expectOk("a student can't change another student's term", () =>
  as("authenticated", B, "update profiles set transfer_term = 'fall-2028' where user_id = $1 returning user_id", [A]));
check("the term update reached no one else's row", termChange?.rows.length === 0, termChange?.rows);

// Essays (17): questions readable by signed-in students once verified, written only by the import
const addPrompt = (key, sort, required = false) => as("service_role", null, `insert into piq_prompts (key, cycle, short_name, summary, required, sort, source_name, source_url, retrieved_at)
  values ($1, 'fall-2027', 'Test question', 'A made-up summary.', $2, $3, 'Test source', 'https://example.org/piq', now()) returning id`, [key, required, sort]);
await expectError("a student cannot add a question", () => as("authenticated", A, "insert into piq_prompts (key) values ('x')"), /permission denied/);
const requiredQ = (await expectOk("service role adds a question", () => addPrompt("major", 1, true)))?.rows[0].id;
await addPrompt("leadership", 2);
await expectError("only one required question per cycle", () => addPrompt("other", 3, true), /piq_prompts_one_required/);
await expectRows("an unverified question is hidden from students", () => as("authenticated", A, "select * from piq_prompts"), 0);
await verifyRow("piq_prompts", requiredQ);
await expectRows("a verified question is readable by a signed-in student", () => as("authenticated", A, "select * from piq_prompts"), 1);
await expectError("anon can't read questions", () => as("anon", null, "select * from piq_prompts"), /permission denied/);
await expectError("a student cannot change a question", () => as("authenticated", A, "update piq_prompts set summary = 'x'"), /permission denied/);
await expectError("a verified question can't be changed, even by the service role", () =>
  as("service_role", null, "update piq_prompts set summary = 'Changed' where id = $1", [requiredQ]), /refusing to update verified/);

// Drafts: owner only, one per question and cycle
const addDraft = (sub, key, body = "Draft text.") =>
  as("authenticated", sub, "insert into essay_drafts (user_id, prompt_key, cycle, body, word_count) values ($1, $2, 'fall-2027', $3, 2) returning id", [sub, key, body]);
const draftA = (await expectOk("a student saves a draft", () => addDraft(A, "major")))?.rows[0].id;
await expectError("one draft per question and cycle", () => addDraft(A, "major"), /essay_drafts_user_id_prompt_key_cycle_key/);
await expectError("a draft needs a real question", () => addDraft(A, "no-such-question"), /foreign key/);
await expectError("a student can't save a draft as someone else", () =>
  as("authenticated", A, "insert into essay_drafts (user_id, prompt_key, cycle) values ($1, 'leadership', 'fall-2027')", [B]), /row-level security/);
const draftB = (await addDraft(B, "major", "Their own words.")).rows[0].id;
await expectRows("a student sees only their own drafts", () => as("authenticated", A, "select * from essay_drafts"), 1);
await expectRows("another student's draft can't be read by its id", () => as("authenticated", A, "select * from essay_drafts where id = $1", [draftB]), 0);
const draftEdit = await expectOk("a student can't change another student's draft", () =>
  as("authenticated", A, "update essay_drafts set body = 'x' where id = $1 returning id", [draftB]));
check("the draft update reached no one else's row", draftEdit?.rows.length === 0, draftEdit?.rows);
const draftDelete = await expectOk("a student can't delete another student's draft", () =>
  as("authenticated", A, "delete from essay_drafts where id = $1 returning id", [draftB]));
check("the draft delete reached no one else's row", draftDelete?.rows.length === 0, draftDelete?.rows);
await expectError("anon can't read drafts", () => as("anon", null, "select * from essay_drafts"), /permission denied/);

// The app saves with an upsert on (user, question, cycle), then reads the account's copy back on the next open
const saveAsApp = (sub, body, words) =>
  as("authenticated", sub, `insert into essay_drafts (user_id, prompt_key, cycle, body, word_count, chosen, done_at) values ($1, 'leadership', 'fall-2027', $2, $3, true, null)
    on conflict (user_id, prompt_key, cycle) do update set body = excluded.body, word_count = excluded.word_count, chosen = excluded.chosen, done_at = excluded.done_at
    returning updated_at`, [sub, body, words]);
const firstSave = await expectOk("the app's upsert saves a new draft", () => saveAsApp(A, "First version.", 2));
await db.query("select pg_sleep(0.01)");
const secondSave = await expectOk("the same upsert updates it", () => saveAsApp(A, "Second, longer version.", 3));
const reread = (await as("authenticated", A, "select body, word_count, chosen, updated_at from essay_drafts where prompt_key = 'leadership'")).rows;
check("reading it back gives the latest save, once", reread.length === 1 && reread[0].body === "Second, longer version." && reread[0].word_count === 3 && reread[0].chosen === true, reread);
check("each save moves updated_at forward", new Date(secondSave?.rows[0].updated_at) > new Date(firstSave?.rows[0].updated_at), [firstSave?.rows[0], secondSave?.rows[0]]);
await expectError("the upsert can't reach another student's draft", () =>
  as("authenticated", A, `insert into essay_drafts (user_id, prompt_key, cycle, body) values ($1, 'major', 'fall-2027', 'x')
    on conflict (user_id, prompt_key, cycle) do update set body = excluded.body`, [B]), /row-level security/);
check("…and B's draft is unchanged", (await db.query("select body from essay_drafts where id = $1", [draftB])).rows[0].body === "Their own words.");

// Notes (20 → 3): saved with the draft, owner only, at most 12 and 30,000 characters
const NOTE_TEXT = "I took CS 1A because my cousin did.";
const notesOf = (n, body = "x") => JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, starter: i ? null : "major-1", body })));
const saveNotes = (sub, draft, notes) => as("authenticated", sub, "update essay_drafts set notes = $2::jsonb where id = $1 returning id", [draft, notes]);
check("a draft starts with no notes", (await db.query("select notes from essay_drafts where id = $1", [draftB])).rows[0].notes.length === 0);
await expectRows("a student saves notes on their draft", () => saveNotes(A, draftA, notesOf(2, NOTE_TEXT)), 1);
const ownNotes = (await as("authenticated", A, "select notes from essay_drafts where id = $1", [draftA])).rows[0]?.notes;
check("the student reads their notes back", ownNotes?.length === 2 && ownNotes[0].starter === "major-1" && ownNotes[0].body === NOTE_TEXT, ownNotes);
await expectRows("another student can't read them", () => as("authenticated", B, "select notes from essay_drafts where id = $1", [draftA]), 0);
await expectRows("another student can't change them", () => saveNotes(B, draftA, "[]"), 0);
await expectError("13 notes are refused", () => saveNotes(A, draftA, notesOf(13)), /essay_drafts_notes_check/);
await expectRows("12 notes are accepted", () => saveNotes(A, draftA, notesOf(12)), 1);
await expectError("notes over 30,000 characters are refused", () => saveNotes(A, draftA, notesOf(2, "n".repeat(15000))), /essay_drafts_notes_check/);
await expectError("notes must be a list", () => saveNotes(A, draftA, JSON.stringify({ body: "x" })), /essay_drafts_notes_check/);
await expectRows("notes can be saved back to a short list", () => saveNotes(A, draftA, notesOf(2, NOTE_TEXT)), 1);
check("notes don't change the draft's word count", (await db.query("select word_count from essay_drafts where id = $1", [draftA])).rows[0].word_count === 2);

// Feedback: the function (service role) writes it; the student only reads their own
const addFeedback = (sub, draft) =>
  as("service_role", null, "insert into essay_feedback (user_id, draft_id, model, input_words, result) values ($1, $2, 'test-model', 2, '{}'::jsonb) returning id", [sub, draft]);
await expectError("a student can't write feedback", () =>
  as("authenticated", A, "insert into essay_feedback (user_id, draft_id, model, input_words, result) values ($1, $2, 'x', 1, '{}')", [A, draftA]), /permission denied/);
const feedbackA = (await expectOk("the function saves feedback", () => addFeedback(A, draftA)))?.rows[0].id;
await addFeedback(B, draftB);
await expectError("feedback can't point at another student's draft", () => addFeedback(A, draftB), /foreign key/);
await expectRows("a student reads their own feedback", () => as("authenticated", A, "select * from essay_feedback"), 1);
await expectRows("another student's feedback can't be read", () => as("authenticated", B, "select * from essay_feedback where user_id = $1", [A]), 0);
await expectError("a student can't change feedback, even their own", () =>
  as("authenticated", A, "update essay_feedback set helpful = true where id = $1", [feedbackA]), /permission denied/);
await expectError("a student can't delete feedback", () => as("authenticated", A, "delete from essay_feedback where id = $1", [feedbackA]), /permission denied/);
await expectError("anon can't read feedback", () => as("anon", null, "select * from essay_feedback"), /permission denied/);

// Consent to AI feedback, on the student's own profile
await expectOk("a student records consent to AI feedback", () =>
  as("authenticated", A, "update profiles set ai_feedback_consent_at = now() where user_id = $1", [A]));
const consentOther = await expectOk("a student can't record consent for someone else", () =>
  as("authenticated", B, "update profiles set ai_feedback_consent_at = now() where user_id = $1 returning user_id", [A]));
check("the consent update reached no one else's row", consentOther?.rows.length === 0, consentOther?.rows);

// Review links (19 → 3): the student shares a snapshot; a reviewer comments through the review function only
const TOKEN = "t".repeat(43);
const TOKEN_B = "b".repeat(43);
const KEY = "reviewer-key-0123456789abcdef";
const createLink = (sub, key, token, label = "Ms. Lee") =>
  as("authenticated", sub, "select create_review_link('fall-2027', $1, $2, $3) as r", [key, label, token]);
await expectError("anon can't create a review link", () => as("anon", null, "select create_review_link('fall-2027', 'major', null, $1)", [TOKEN]), /permission denied/);
await expectError("a link needs a well-formed token", () => createLink(A, "major", "short"), /invalid token/);
await expectError("a link needs a draft with words", () => createLink(A, "creativity", TOKEN), /no draft to share/);
const linkA = (await expectOk("a student creates a review link", () => createLink(A, "major", TOKEN)))?.rows[0].r;
check("the link ends 14 days after it's made", Math.round((new Date(linkA?.expires_at) - new Date(linkA?.created_at)) / 864e5) === 14, linkA);
const stored = (await db.query("select token_hash, snapshot_body, reviewer_label from review_links where id = $1", [linkA?.id])).rows[0];
check("only the token's hash is stored, with the draft's text as the snapshot", stored?.token_hash !== TOKEN && /^[0-9a-f]{64}$/.test(stored?.token_hash) && stored?.snapshot_body === "Draft text." && stored?.reviewer_label === "Ms. Lee", stored);
const linkB = (await createLink(B, "major", TOKEN_B, "")).rows[0].r;
check("an empty reviewer name is stored as none", (await db.query("select reviewer_label from review_links where id = $1", [linkB.id])).rows[0].reviewer_label === null);
await expectRows("a student sees only their own links", () => as("authenticated", A, "select * from review_links"), 1);
await expectError("anon can't read links", () => as("anon", null, "select * from review_links"), /permission denied/);
await expectError("a student can't write a link directly", () =>
  as("authenticated", A, "update review_links set expires_at = now() + interval '1 year'"), /permission denied/);

const open = (token, key = KEY) => as("service_role", null, "select review_open($1, $2) as r", [token, key]).then((x) => x.rows[0].r);
await expectError("a student can't call the reviewer's functions", () => as("authenticated", A, "select review_open($1, $2)", [TOKEN, KEY]), /permission denied/);
await expectError("neither can anon", () => as("anon", null, "select review_add_comment($1, $2, 'x', 'y', null)", [TOKEN, KEY]), /permission denied/);
const page = await open(TOKEN);
check("the review page gets the snapshot, the question and the first name only", page.status === "live" && page.snapshot === "Draft text." &&
  page.short_name === "Test question" && page.first_name === "Maya" && !("email" in page) && !("user_id" in page), page);
check("an unknown token is just ended", (await open("x".repeat(43))).status === "ended");

const comment = (token, name, body, quote = null, key = KEY) =>
  as("service_role", null, "select review_add_comment($1, $2, $3, $4, $5) as r", [token, key, name, body, quote]).then((x) => x.rows[0].r);
const c1 = await expectOk("a reviewer comments on a phrase", () => comment(TOKEN, " Ms. Lee ", "Say more here.", "Draft text"));
check("the name is trimmed and the quote kept", c1?.reviewer_name === "Ms. Lee" && c1?.quote === "Draft text", c1);
await expectError("a quote must be in the snapshot", () => comment(TOKEN, "Ms. Lee", "Hm.", "not in the text"), /review_bad_quote/);
await expectError("a name is required", () => comment(TOKEN, "   ", "Hm."), /review_bad_name/);
await expectError("a name is at most 60 characters", () => comment(TOKEN, "n".repeat(61), "Hm."), /review_bad_name/);
await expectError("a comment is required", () => comment(TOKEN, "Ms. Lee", "  "), /review_bad_comment/);
await expectError("a comment is at most 1,000 characters", () => comment(TOKEN, "Ms. Lee", "c".repeat(1001)), /review_bad_comment/);
await expectError("a reviewer key is required", () => comment(TOKEN, "Ms. Lee", "Hm.", null, "bad"), /review_bad_request/);
const other = await comment(TOKEN, "Mr. Kim", "Strong start.", null, "another-reviewer-key-0123456789");
const seen = await open(TOKEN);
check("the page lists both comments, and marks which are this browser's", seen.comments.length === 2 &&
  seen.comments.find((c) => c.id === c1.id)?.mine === true && seen.comments.find((c) => c.id === other.id)?.mine === false, seen.comments);
check("the page never shows the reviewer key", !JSON.stringify(seen).includes("reviewer_key"), seen);
const deleteAs = (token, id, key = KEY) => as("service_role", null, "select review_delete_comment($1, $2, $3)", [token, key, id]);
await expectError("a reviewer can't delete someone else's comment", () => deleteAs(TOKEN, other.id), /review_cant_delete/);
await db.query("update review_comments set created_at = now() - interval '16 minutes' where id = $1", [other.id]);
await expectError("…or their own after 15 minutes", () => deleteAs(TOKEN, other.id, "another-reviewer-key-0123456789"), /review_cant_delete/);
await expectOk("a reviewer deletes their own comment within 15 minutes", () => deleteAs(TOKEN, c1.id));
check("a deleted comment leaves the page", (await open(TOKEN)).comments.length === 1);

// The student's side of the comments
await comment(TOKEN, "Ms. Lee", "One more thought.");
const readable = (await as("authenticated", A, "select id, body, read_at from review_comments where deleted_at is null")).rows;
check("the student reads the comments on their link", readable.length === 2 && readable.every((r) => r.read_at === null), readable);
await expectError("the student can't read the reviewer key", () => as("authenticated", A, "select reviewer_key_hash from review_comments"), /permission denied/);
await expectRows("another student can't read them", () => as("authenticated", B, "select id from review_comments"), 0);
await expectError("a student can't add a comment directly", () =>
  as("authenticated", A, "insert into review_comments (link_id, reviewer_name, body, reviewer_key_hash) values ($1, 'me', 'x', $2)", [linkA.id, "0".repeat(64)]), /permission denied/);
const marked = (await as("authenticated", A, "select mark_review_comments_read($1) as n", [linkA.id])).rows[0].n;
check("opening the reviews marks them read", marked === 2, marked);
check("another student can't mark them", (await as("authenticated", B, "select mark_review_comments_read($1) as n", [linkA.id])).rows[0].n === 0);
await expectOk("the student resolves a comment", () => as("authenticated", A, "select set_review_comment($1, 'resolve')", [other.id]));
await expectError("another student can't resolve or delete it", () => as("authenticated", B, "select set_review_comment($1, 'delete')", [other.id]), /no such comment/);
await expectOk("the student deletes a comment", () => as("authenticated", A, "select set_review_comment($1, 'delete')", [other.id]));
check("the student's delete hides it from the reviewer too", !(await open(TOKEN)).comments.some((c) => c.id === other.id));
check("a review link never carries the student's notes", !JSON.stringify(await open(TOKEN)).includes(NOTE_TEXT));

// Finish review (20 → 6): through the review function only; set once; the link must be live
const finish = (token, key = KEY) => as("service_role", null, "select review_finish($1, $2) as r", [token, key]).then((x) => x.rows[0].r);
const finishedOf = async (id) => (await as("authenticated", A, "select finished_at from review_links where id = $1", [id])).rows[0]?.finished_at;
check("a link starts not finished", (await open(TOKEN)).finished_at === null);
await expectError("a student can't call review_finish", () => as("authenticated", A, "select review_finish($1, $2)", [TOKEN, KEY]), /permission denied/);
await expectError("neither can anon", () => as("anon", null, "select review_finish($1, $2)", [TOKEN, KEY]), /permission denied/);
const finished = await expectOk("a reviewer finishes the review", () => finish(TOKEN));
check("review_finish returns the page, with finished_at", finished?.status === "live" && finished.finished_at && Array.isArray(finished.comments) && finished.snapshot === "Draft text.", finished);
const firstFinish = await finishedOf(linkA.id);
check("the student sees finished_at on their link", firstFinish instanceof Date, firstFinish);
await db.query("select pg_sleep(0.01)");
await finish(TOKEN);
check("finishing again doesn't change finished_at", (await finishedOf(linkA.id))?.getTime() === firstFinish?.getTime());

// Send latest version, the daily limit, turning off and ending
await as("authenticated", A, "update essay_drafts set body = 'A new draft text.', word_count = 4 where id = $1", [draftA]);
check("the reviewer keeps the old snapshot until the student sends it", (await open(TOKEN)).snapshot === "Draft text.");
await expectOk("the student sends the latest version", () => as("authenticated", A, "select refresh_review_snapshot($1)", [linkA.id]));
check("the reviewer sees the new text", (await open(TOKEN)).snapshot === "A new draft text.");
check("sending the latest version clears Finished", (await finishedOf(linkA.id)) === null && (await open(TOKEN)).finished_at === null);
await finish(TOKEN);
check("…and the reviewer can finish again", (await finishedOf(linkA.id)) instanceof Date);
await expectError("another student can't refresh it", () => as("authenticated", B, "select refresh_review_snapshot($1)", [linkA.id]), /no such link/);
await db.query(`insert into review_comments (link_id, reviewer_name, body, reviewer_key_hash) select $1, 'Bot', 'x', $2 from generate_series(1, 56)`, [linkA.id, "0".repeat(64)]);
// Deleted comments count toward the day's 60 too
await expectOk("the 60th comment of the day is accepted", () => comment(TOKEN, "Ms. Lee", "Sixtieth."));
await expectError("the 61st is refused", () => comment(TOKEN, "Ms. Lee", "Sixty-first."), /review_daily_limit/);
await expectError("another student can't turn the link off", () => as("authenticated", B, "select revoke_review_link($1)", [linkA.id]), /no such link/);
await expectOk("the student turns the link off", () => as("authenticated", A, "select revoke_review_link($1)", [linkA.id]));
check("a turned-off link has ended", (await open(TOKEN)).status === "ended");
await expectError("nobody can comment on it", () => comment(TOKEN, "Ms. Lee", "Late."), /review_ended/);
await expectError("a turned-off link can't be finished", () => finish(TOKEN), /review_ended/);
await expectRows("its comments stay with the student", () => as("authenticated", A, "select id from review_comments where deleted_at is null"), 58);
await db.query("update review_links set expires_at = now() - interval '1 second' where id = $1", [linkB.id]);
check("a link past its 14 days has ended", (await open(TOKEN_B)).status === "ended");
await expectError("an ended link can't be finished", () => finish(TOKEN_B), /review_ended/);
check("…and stays not finished", (await db.query("select finished_at from review_links where id = $1", [linkB.id])).rows[0].finished_at === null);
await expectError("an ended link can't be refreshed", () => as("authenticated", B, "select refresh_review_snapshot($1)", [linkB.id]), /link has ended/);
const linkB2 = (await createLink(B, "major", "c".repeat(43))).rows[0].r;
await as("service_role", null, "select review_add_comment($1, $2, 'Ms. Lee', 'Nice.', null)", ["c".repeat(43), KEY]);
await expectOk("deleting a draft deletes its links", () => as("authenticated", B, "delete from essay_drafts where id = $1", [draftB]));
check("…and their comments", (await db.query("select count(*)::int as n from review_comments c join review_links l on l.id = c.link_id where l.id = $1", [linkB2.id])).rows[0].n === 0 &&
  (await db.query("select count(*)::int as n from review_links where user_id = $1", [B])).rows[0].n === 0);
const draftB2 = (await addDraft(B, "major", "Their own words.")).rows[0].id;
await createLink(B, "major", "d".repeat(43));
await addFeedback(B, draftB2);

// Deleting an account: only the caller's, with every per-student row
const course =await as("service_role", null, `insert into courses (institution_id, subject, course_number, title, source_name, source_url, academic_year, retrieved_at)
  values ($1, 'TEST', '1', 'Test course', ${prov}) returning id`, [instId]);
await as("authenticated", A, "insert into saved_courses (user_id, course_id) values ($1, $2)", [A, course.rows[0].id]);
await savePlan("authenticated", B, instId, true, [{ institution_id: uniId, major_id: majorId }]);
await as("authenticated", B, "insert into saved_schools (user_id, institution_id) values ($1, $2)", [B, uniId]);
const PER_STUDENT = [
  "profiles", "user_targets", "user_requirement_status", "saved_courses", "saved_schools", "user_deadlines", "user_checklist_steps",
  "essay_drafts", "essay_feedback",
];
const rowCounts = async (sub) => Object.fromEntries(await Promise.all(
  PER_STUDENT.map(async (t) => [t, (await db.query(`select count(*)::int as n from ${t} where user_id = $1`, [sub])).rows[0].n])));
const reviewCounts = async (sub) => (await db.query(`select (select count(*)::int from review_links where user_id = $1) as links,
  (select count(*)::int from review_comments c join review_links l on l.id = c.link_id where l.user_id = $1) as comments`, [sub])).rows[0];
const reviewsBefore = await reviewCounts(A);
check("the student has review links and comments", reviewsBefore.links > 0 && reviewsBefore.comments > 0, reviewsBefore);
const before = await rowCounts(A);
check("the student has a row in every per-student table", Object.values(before).every((n) => n > 0), before);
await expectError("anon can't call delete_my_account", () => as("anon", null, "select delete_my_account()"), /permission denied/);
await expectError("delete_my_account needs a signed-in student", () => as("authenticated", null, "select delete_my_account()"), /not signed in/);
await expectOk("a student deletes their account", () => as("authenticated", A, "select delete_my_account()"));
const users = (await db.query("select id from auth.users order by id")).rows.map((r) => r.id);
check("only that account is gone", users.length === 1 && users[0] === B, users);
const after = await rowCounts(A);
check("every per-student row went with it", Object.values(after).every((n) => n === 0), after);
const reviewsAfter = await reviewCounts(A);
check("their review links and comments went too", reviewsAfter.links === 0 && reviewsAfter.comments === 0, reviewsAfter);
check("…and the reviewer page shows the ended message", (await open(TOKEN)).status === "ended");
check("another student's review link is untouched", (await reviewCounts(B)).links === 1);
const others = await rowCounts(B);
check("another student's rows are untouched", others.profiles === 1 && others.user_targets === 1 && others.saved_schools === 1, others);
check("another student's draft and feedback are untouched", others.essay_drafts === 1 && others.essay_feedback === 1, others);
const leftover = (await db.query("select (select count(*)::int from essay_drafts where id = $1) as d, (select count(*)::int from essay_feedback where id = $2) as f", [draftA, feedbackA])).rows[0];
check("the deleted student's draft and feedback are gone by id", leftover.d === 0 && leftover.f === 0, leftover);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
