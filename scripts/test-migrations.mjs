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

// Explore (21): pathways, their requirements and campuses are written only by the import, and reach the app only once
// every row behind that major is verified
const ucUni = (await as("service_role", null, `insert into institutions (slug, name, institution_type, system, source_name, source_url, academic_year, retrieved_at)
  values ('example-uc', 'Example UC', 'university', 'UC', ${prov}) returning id`)).rows[0].id;
const ucPathway = `insert into pathways (slug, kind, name, source_name, source_url, academic_year, retrieved_at)
  values ('test-major', 'uc_pathway', 'Test major', ${prov}) returning id`;
const tmcPathway = (slug, code) => `insert into pathways (slug, kind, name, code, revision, degree_name, major_units, total_units, source_name, source_url, academic_year, retrieved_at)
  values ('${slug}', 'tmc', 'Test major', ${code === null ? "null" : `'${code}'`}, '1', 'Test degree for transfer', 6, 60, ${prov}) returning id`;
await expectError("anon can't add a pathway", () => as("anon", null, ucPathway), /permission denied/);
await expectError("a student can't add a pathway", () => as("authenticated", A, ucPathway), /permission denied/);
const ucPath = (await expectOk("service role adds a UC pathway", () => as("service_role", null, ucPathway)))?.rows[0].id;
const tmcPath = (await expectOk("service role adds a TMC", () => as("service_role", null, tmcPathway("test-major", "9999"))))?.rows[0].id;
await expectError("one pathway per major and kind", () => as("service_role", null, ucPathway), /duplicate key/);
await expectError("a TMC needs its template number", () => as("service_role", null, tmcPathway("other-major", null)), /check/);
await expectError("a UC pathway has no template number", () =>
  as("service_role", null, `insert into pathways (slug, kind, name, code, source_name, source_url, academic_year, retrieved_at)
    values ('other-major', 'uc_pathway', 'X', '1', ${prov})`), /check/);
await expectError("effective_term looks like fall-2027", () =>
  as("service_role", null, `insert into pathways (slug, kind, name, effective_term, source_name, source_url, academic_year, retrieved_at)
    values ('other-major', 'uc_pathway', 'X', 'fall 2027', ${prov})`), /check/);

const pathwayRow = (pathway, code, sort, topic, cId, options) => as("service_role", null,
  `insert into pathway_requirements (pathway_id, code, sort, topic, name, description, how_many, units, c_id, options, source_name, source_url, academic_year, retrieved_at)
   values ($1, $2, $3, $4, 'Test course', 'A made-up course.', 'One course', 3, $5, $6::jsonb, ${prov}) returning id`,
  [pathway, code, sort, topic, cId, JSON.stringify(options)]);
const ucReq = (await expectOk("a UC requirement names a course type only", () => pathwayRow(ucPath, "first", 1, "test-topic", [], [])))?.rows[0].id;
await expectOk("a TMC requirement names its C-ID", () => pathwayRow(tmcPath, "first", 1, "test-topic", ["TEST 101"], []));
await expectOk("a pick-one requirement lists options, with or without a C-ID", () =>
  pathwayRow(tmcPath, "second", 2, "other-topic", [], [{ label: "Either", c_id: ["TEST 102", "TEST 103"], units: 3 }, { label: "Or", c_id: ["TEST 900S"], units: 3 }, { label: "Any course for the major", c_id: [], units: 3 }]));
await expectError("C-ID numbers are written like COMP 122", () => pathwayRow(tmcPath, "bad-c-id", 3, "t3", ["comp 122"], []), /c_id_check/);
await expectError("an option takes label, c_id and units only", () =>
  pathwayRow(tmcPath, "bad-option", 3, "t3", [], [{ label: "X", c_id: ["TEST 104"], units: 3, note: "UC's words" }]), /options_check/);
await expectError("an option's C-ID is written like COMP 122", () => pathwayRow(tmcPath, "bad-option-id", 3, "t3", [], [{ label: "X", c_id: ["comp 122"], units: 3 }]), /options_check/);
await expectError("one bad C-ID among good ones is refused", () => pathwayRow(tmcPath, "mixed-id", 3, "t3", [], [{ label: "X", c_id: ["TEST 104", "comp 122"], units: 3 }]), /options_check/);
await expectError("an option with no C-ID still needs a label", () => pathwayRow(tmcPath, "no-label", 3, "t3", [], [{ label: " ", c_id: [], units: 3 }]), /options_check/);
await expectError("an option with no C-ID still needs units", () => pathwayRow(tmcPath, "no-units", 3, "t3", [], [{ label: "X", c_id: [] }]), /options_check/);
await expectError("an option's c_id is a list", () => pathwayRow(tmcPath, "no-list", 3, "t3", [], [{ label: "X", units: 3 }]), /options_check/);
await expectError("a requirement has c_id or options, not both", () =>
  pathwayRow(tmcPath, "both", 3, "t3", ["TEST 105"], [{ label: "X", c_id: ["TEST 106"], units: 3 }]), /check/);
await expectError("a topic appears once per pathway", () => pathwayRow(tmcPath, "same-topic", 3, "test-topic", ["TEST 107"], []), /duplicate key/);

const campus = (pathway, inst) => as("service_role", null,
  `insert into pathway_campuses (pathway_id, institution_id, major_names, source_name, source_url, academic_year, retrieved_at)
   values ($1, $2, array['Test major, B.S.'], ${prov}) returning id`, [pathway, inst]);
await expectError("campuses belong to the UC pathway", () => campus(tmcPath, ucUni), /UC pathway, not a TMC/);
await expectError("a pathway campus must be a UC campus", () => campus(ucPath, instId), /must be a UC campus/);
await expectOk("a UC campus on the UC pathway", () => campus(ucPath, ucUni));

const visible = async (role, sub) => {
  const n = async (t) => (await as(role, sub, `select id from ${t}`)).rows.length;
  return [await n("pathways"), await n("pathway_requirements"), await n("pathway_campuses")].join(",");
};
check("nothing shows while the major is unverified", (await visible("anon", null)) === "0,0,0", await visible("anon", null));
const verifyAll = (t, where = "true") =>
  as("service_role", null, `update ${t} set verification_status = 'verified', verified_at = now() where ${where} and verification_status <> 'verified'`);
await verifyAll("pathways");
await verifyAll("pathway_campuses");
await verifyAll("pathway_requirements", "code <> 'second'");
check("one unverified requirement hides the whole major", (await visible("anon", null)) === "0,0,0", await visible("anon", null));
await verifyAll("pathway_requirements");
check("a fully verified major shows to anon", (await visible("anon", null)) === "2,3,1", await visible("anon", null));
check("…and to signed-in students", (await visible("authenticated", A)) === "2,3,1", await visible("authenticated", A));
await as("service_role", null, `insert into pathways (slug, kind, name, verification_status, verified_at, source_name, source_url, academic_year, retrieved_at)
  values ('empty-major', 'uc_pathway', 'Empty', 'verified', now(), ${prov})`);
check("a verified pathway with no requirements stays hidden", (await as("anon", null, "select id from pathways where slug = 'empty-major'")).rows.length === 0);
await expectError("a student can't change a pathway", () => as("authenticated", A, "update pathways set name = 'x'"), /permission denied/);
await expectError("a verified requirement can't be changed by an import", () =>
  as("service_role", null, "update pathway_requirements set name = 'Changed' where id = $1", [ucReq]), /refusing to update verified/);
await expectError("a verified requirement can't be deleted", () =>
  as("service_role", null, "delete from pathway_requirements where id = $1", [ucReq]), /refusing to delete verified/);
const reopened = await expectOk("the service role reopens one requirement", () =>
  as("service_role", null, "select reopen_verified_row($1, 'tester', 'wording', false) as r", [ucReq]));
check("the reopen names the row", reopened?.rows[0].r.table === "pathway_requirements" && /test-major uc_pathway first/.test(reopened?.rows[0].r.record), reopened?.rows[0].r);
check("reopening one row hides the whole major again", (await visible("anon", null)) === "0,0,0", await visible("anon", null));
await verifyAll("pathway_requirements");
await expectError("students can't reopen rows", () => as("authenticated", A, "select reopen_verified_row($1, 'x', 'y', false)", [ucReq]), /permission denied/);

// Reopen now also covers the planning tables, so a verified major can take its explore_slug
await as("service_role", null, "update majors set verification_status = 'verified', verified_at = now() where id = $1", [majorId]);
await expectError("a verified major can't take an explore_slug by hand", () =>
  as("service_role", null, "update majors set explore_slug = 'test-major' where id = $1", [majorId]), /refusing to update verified/);
const majorReopen = await expectOk("the service role reopens a verified major", () =>
  as("service_role", null, "select reopen_verified_row($1, 'tester', 'adding explore_slug', false) as r", [majorId]));
check("the reopen names the major", majorReopen?.rows[0].r.table === "majors", majorReopen?.rows[0].r);
await expectOk("then explore_slug can be set", () => as("service_role", null, "update majors set explore_slug = 'test-major' where id = $1", [majorId]));
await expectError("explore_slug is a slug", () => as("service_role", null, "update majors set explore_slug = 'Test Major' where id = $1", [majorId]), /check/);

// Topic status: owner only, one row per course type
await expectOk("a student marks a course type done", () =>
  as("authenticated", A, "insert into user_topic_status (user_id, topic, status) values ($1, 'cs1', 'done')", [A]));
await expectError("one status per course type", () =>
  as("authenticated", A, "insert into user_topic_status (user_id, topic, status) values ($1, 'cs1', 'in_progress')", [A]), /duplicate key/);
await expectOk("a student changes it", () => as("authenticated", A, "update user_topic_status set status = 'in_progress' where topic = 'cs1'"));
await expectError("a student can't mark one for someone else", () =>
  as("authenticated", A, "insert into user_topic_status (user_id, topic, status) values ($1, 'cs2', 'done')", [B]), /row-level security/);
await expectError("anon can't read topic statuses", () => as("anon", null, "select * from user_topic_status"), /permission denied/);
await expectOk("another student marks their own", () =>
  as("authenticated", B, "insert into user_topic_status (user_id, topic, status) values ($1, 'cs1', 'done')", [B]));
await expectRows("a student sees only their own", () => as("authenticated", B, "select * from user_topic_status"), 1);
await expectError("status is not_started, in_progress or done", () =>
  as("authenticated", B, "insert into user_topic_status (user_id, topic, status) values ($1, 'cs2', 'maybe')", [B]), /invalid input value/);

// Explore hub (22): a school's abbreviation, and opportunities written only by the import, readable once verified
const abbr = (value) => as("service_role", null, "update institutions set abbreviation = $1 where id = $2", [value, uniId]);
await as("service_role", null, "update institutions set verification_status = 'unverified', verified_at = null where id = $1", [uniId]);
await expectOk("an abbreviation like UCSD", () => abbr("UCSD"));
await expectOk("…or letters and digits, like CSU2", () => abbr("CSU2"));
await expectError("an abbreviation is in capitals", () => abbr("Ucsd"), /abbreviation_check/);
await expectError("an abbreviation is 2 to 5 characters", () => abbr("CALSTA"), /abbreviation_check/);
await expectError("…not 1", () => abbr("U"), /abbreviation_check/);
await expectError("…with no spaces or dots", () => abbr("MT.S"), /abbreviation_check/);
await expectRows("anon reads a school's abbreviation", () => as("anon", null, "select abbreviation from institutions where abbreviation = 'CSU2'"), 1);

const addOpportunity = (slug, columns = {}) => {
  const row = {
    slug, kind: "research", title: "Test program", org_name: "Test University", summary: "A made-up program.", audience: "community_college",
    cost: "paid", url: "https://example.org/apply", source_name: "Test source", source_url: "https://example.org/program", academic_year: "2026-27",
    ...columns,
  };
  const entries = Object.entries(row).filter(([, v]) => v !== undefined);
  return as("service_role", null, `insert into opportunities (${entries.map(([k]) => k).join(", ")}, retrieved_at)
    values (${entries.map((_, i) => `$${i + 1}`).join(", ")}, now()) returning id`, entries.map(([, v]) => v));
};
await expectError("anon can't add an opportunity", () => as("anon", null, "insert into opportunities (slug) values ('x')"), /permission denied/);
await expectError("a student can't add an opportunity", () => as("authenticated", A, "insert into opportunities (slug) values ('x')"), /permission denied/);
const oppId = (await expectOk("service role adds an opportunity", () =>
  addOpportunity("test-program", { who_for: ["GPA 3.0 or higher"], major_slugs: ["computer-science"], systems: ["UC"], terms: ["fall-2027"],
    deadline: "2027-02-01", starts_on: "2027-06-21", ends_on: "2027-08-13" })))?.rows[0].id;
const rolling = (await expectOk("a rolling opportunity has no deadline, and lists default to empty", () => addOpportunity("rolling-program", { online: true })))?.rows[0].id;
check("lists start empty and online is stored", (await db.query("select wants, systems, online from opportunities where id = $1", [rolling])).rows[0]?.online === true &&
  (await db.query("select cardinality(wants) + cardinality(systems) as n from opportunities where id = $1", [rolling])).rows[0]?.n === 0);
await expectRows("an unverified opportunity is hidden from anon", () => as("anon", null, "select * from opportunities"), 0);
await expectRows("…and from students", () => as("authenticated", A, "select * from opportunities"), 0);
await verifyRow("opportunities", oppId);
await expectRows("a verified opportunity is readable by anon", () => as("anon", null, "select * from opportunities"), 1);
await expectRows("…and by students", () => as("authenticated", A, "select * from opportunities"), 1);
await expectError("a student can't change an opportunity", () => as("authenticated", A, "update opportunities set title = 'x'"), /permission denied/);
await expectError("a verified opportunity can't be changed by an import", () =>
  as("service_role", null, "update opportunities set title = 'Changed' where id = $1", [oppId]), /refusing to update verified/);
await expectError("a verified opportunity can't be deleted", () =>
  as("service_role", null, "delete from opportunities where id = $1", [oppId]), /refusing to delete verified/);
await expectError("one opportunity per slug", () => addOpportunity("test-program"), /duplicate key/);
await expectError("kind is one of the six", () => addOpportunity("bad-kind", { kind: "job" }), /invalid input value/);
await expectError("audience is one of the three", () => addOpportunity("bad-audience", { audience: "transfer" }), /invalid input value/);
await expectError("cost is free, paid or fee", () => addOpportunity("bad-cost", { cost: "cheap" }), /invalid input value/);
await expectError("url must be https", () => addOpportunity("bad-url", { url: "http://example.org/apply" }), /url_check/);
await expectError("source_url must be https", () => addOpportunity("bad-source", { source_url: "http://example.org" }), /source_url_check/);
await expectError("systems are UC or CSU", () => addOpportunity("bad-system", { systems: ["UC", "CCC"] }), /systems_check/);
await expectError("terms look like fall-2027", () => addOpportunity("bad-term", { terms: ["Fall 2027"] }), /terms_check/);
await expectError("major_slugs are slugs", () => addOpportunity("bad-major", { major_slugs: ["Computer Science"] }), /major_slugs_check/);
await expectError("no empty entries in a list", () => addOpportunity("empty-entry", { wants: ["An essay", ""] }), /wants_check/);
await expectError("a title can't be blank", () => addOpportunity("blank-title", { title: "  " }), /title_check/);
await expectError("it can't end before it starts", () => addOpportunity("bad-dates", { starts_on: "2027-08-13", ends_on: "2027-06-21" }), /check/);
const oppReopen = await expectOk("the service role reopens an opportunity", () =>
  as("service_role", null, "select reopen_verified_row($1, 'tester', 'new deadline', false) as r", [oppId]));
check("the reopen names the opportunity", oppReopen?.rows[0].r.table === "opportunities" && oppReopen.rows[0].r.record === "test-program: Test program", oppReopen?.rows[0].r);
await expectRows("a reopened opportunity is hidden again", () => as("anon", null, "select * from opportunities"), 0);
await expectError("students can't run the opportunities import", () =>
  as("authenticated", A, "select import_opportunities_batch('{}'::jsonb, 'x', false)"), /permission denied/);
await expectError("students can't call the batch directly", () => as("authenticated", A, "select apply_opportunities_batch('{}'::jsonb)"), /permission denied/);

// Plan (24): the plan data written only by the import and readable once verified, and each student's plan, owner-only
const addOrder = (topic, before) => as("service_role", null, `insert into topic_order (topic, before_topic, source_name, source_url, academic_year, retrieved_at)
  values ($1, $2, ${prov}) returning id`, [topic, before]);
await expectError("anon can't add a topic order", () => as("anon", null, "insert into topic_order (topic, before_topic) values ('cs2', 'cs1')"), /permission denied/);
await expectError("a student can't add a topic order", () => as("authenticated", A, "insert into topic_order (topic, before_topic) values ('cs2', 'cs1')"), /permission denied/);
const orderId = (await expectOk("service role adds a topic order", () => addOrder("cs2", "cs1")))?.rows[0].id;
await expectError("a topic can't come before itself", () => addOrder("cs1", "cs1"), /check/);
await expectError("one row per pair", () => addOrder("cs2", "cs1"), /duplicate key/);
await expectError("topics are slugs", () => addOrder("CS 2", "cs1"), /topic_check/);
await expectRows("an unverified topic order is hidden from anon", () => as("anon", null, "select * from topic_order"), 0);
await expectRows("…and from students", () => as("authenticated", A, "select * from topic_order"), 0);
await verifyRow("topic_order", orderId);
await expectRows("a verified topic order is readable", () => as("authenticated", A, "select * from topic_order"), 1);
await expectError("a verified topic order can't be changed", () => as("service_role", null, "update topic_order set source_name = 'x' where id = $1", [orderId]), /refusing to update verified/);

const addArea = (code, columns = {}) => {
  const row = { pattern: "cal-getc", code, name: "Test area", courses: 1, units: 3, sort: 1, ...columns };
  const entries = Object.entries(row);
  return as("service_role", null, `insert into ge_areas (${entries.map(([k]) => k).join(", ")}, source_name, source_url, academic_year, retrieved_at)
    values (${entries.map((_, i) => `$${i + 1}`).join(", ")}, ${prov}) returning id`, entries.map(([, v]) => v));
};
const areaId = (await expectOk("service role adds a GE area", () => addArea("1A")))?.rows[0].id;
await expectError("one area per code in a pattern", () => addArea("1A", { sort: 2 }), /duplicate key/);
await expectError("one area per sort in a pattern", () => addArea("1B"), /duplicate key/);
await expectError("an area code looks like 1A or 2", () => addArea("A1", { sort: 3 }), /code_check/);
await expectError("an area needs at least one course", () => addArea("2", { sort: 3, courses: 0 }), /courses_check/);
await expectError("an area's units are above 0", () => addArea("2", { sort: 3, units: 0 }), /units_check/);
await expectRows("an unverified GE area is hidden", () => as("anon", null, "select * from ge_areas"), 0);
await verifyRow("ge_areas", areaId);
await expectRows("a verified GE area is readable", () => as("anon", null, "select * from ge_areas"), 1);

const addCourse = (institution, code, columns = {}) => {
  const row = { institution_id: institution, code, title: "Test course", units: 4, c_id: null, topics: ["cs1"], ...columns };
  const entries = Object.entries(row);
  return as("service_role", null, `insert into college_courses (${entries.map(([k]) => k).join(", ")}, source_name, source_url, academic_year, retrieved_at)
    values (${entries.map((_, i) => `$${i + 1}`).join(", ")}, ${prov}) returning id`, entries.map(([, v]) => v));
};
await expectError("a student can't add a college course", () =>
  as("authenticated", A, "insert into college_courses (institution_id, code, title, units, topics) values ($1, 'CS 1', 'x', 4, '{cs1}')", [instId]), /permission denied/);
const courseId = (await expectOk("service role adds a college course", () => addCourse(instId, "CS 1", { c_id: "COMP 122" })))?.rows[0].id;
await expectOk("a common course number like ENGL C1000", () => addCourse(instId, "ENGL C1000", { topics: ["english-comp"] }));
await expectError("a college course is at a community college", () => addCourse(uniId, "CS 2"), /community college/);
await expectError("one course per code and year at a college", () => addCourse(instId, "CS 1"), /duplicate key/);
await expectError("a course code looks like CS 1", () => addCourse(instId, "cs1"), /code_check/);
await expectError("a C-ID number looks like COMP 122", () => addCourse(instId, "CS 3", { c_id: "COMP122" }), /c_id_check/);
await expectError("a course is set to at least one topic", () => addCourse(instId, "CS 3", { topics: [] }), /topics_check/);
await expectError("topics are slugs", () => addCourse(instId, "CS 3", { topics: ["CS 1"] }), /topics_check/);
await expectError("units are above 0", () => addCourse(instId, "CS 3", { units: 0 }), /units_check/);
await expectRows("unverified college courses are hidden", () => as("anon", null, "select * from college_courses"), 0);
await verifyRow("college_courses", courseId);
await expectRows("a verified college course is readable", () => as("authenticated", A, "select * from college_courses"), 1);
for (const [table, id, record] of [["topic_order", orderId, "cs2 after cs1"], ["ge_areas", areaId, "cal-getc 1A: Test area"], ["college_courses", courseId, "example-college CS 1 (2026-27): Test course"]]) {
  const reopened = await expectOk(`the service role reopens a ${table} row`, () => as("service_role", null, "select reopen_verified_row($1, 'tester', 'test', false) as r", [id]));
  check(`…named ${record}`, reopened?.rows[0].r.table === table && reopened.rows[0].r.record === record, reopened?.rows[0].r);
  await expectRows("…and it's hidden again", () => as("anon", null, `select * from ${table}`), 0);
}
await expectError("students can't run the plan data import", () => as("authenticated", A, "select import_plan_data_batch('{}'::jsonb, 'x', false)"), /permission denied/);
await expectError("students can't call the batch directly", () => as("authenticated", A, "select apply_plan_data_batch('{}'::jsonb)"), /permission denied/);

const settings = (sub, columns) => as("authenticated", sub, `insert into plan_settings (user_id${Object.keys(columns).map((k) => `, ${k}`).join("")})
  values ($1${Object.keys(columns).map((_, i) => `, $${i + 2}`).join("")})`, [sub, ...Object.values(columns)]);
await expectOk("a student saves plan settings", () => settings(A, {}));
const defaults = (await db.query("select units_per_term, include_summer, units_done from plan_settings where user_id = $1", [A])).rows[0];
check("settings default to full time, no summers, units done empty", defaults?.units_per_term === 15 && defaults.include_summer === false && defaults.units_done === null, defaults);
await expectOk("a student sets 21 units and units done", () => as("authenticated", A, "update plan_settings set units_per_term = 21, units_done = 31.5"));
await expectError("units per term are 3 to 21", () => as("authenticated", A, "update plan_settings set units_per_term = 22"), /units_per_term_check/);
await expectError("…not under 3", () => as("authenticated", A, "update plan_settings set units_per_term = 2"), /units_per_term_check/);
await expectError("units done can't be negative", () => as("authenticated", A, "update plan_settings set units_done = -1"), /units_done_check/);
await expectError("a student can't save settings for someone else", () => settings(B, {}).then(() => as("authenticated", A, "insert into plan_settings (user_id) values ($1)", [B])), /row-level security/);
await expectRows("a student sees only their own settings", () => as("authenticated", B, "select * from plan_settings"), 1);
await expectError("anon can't read plan settings", () => as("anon", null, "select * from plan_settings"), /permission denied/);

const addItem = (sub, columns) => {
  const entries = Object.entries({ user_id: sub, ...columns });
  return as("authenticated", sub, `insert into plan_items (${entries.map(([k]) => k).join(", ")}) values (${entries.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
    entries.map(([, v]) => v));
};
await expectOk("a student adds a major item", () => addItem(A, { kind: "major", topic: "cs1", term: "fall-2026" }));
await expectOk("…a GE item with its own status", () => addItem(A, { kind: "ge", ge_area: "1A", term: "spring-2027", status: "in_progress" }));
await expectOk("…a custom course they placed", () => addItem(A, { kind: "custom", course_name: "Drawing", units: 3, placed_by: "student", status: "not_started" }));
await expectOk("…and one with the college's course", () => addItem(A, { kind: "major", topic: "cs2", college_course_id: courseId, course_code: "CS 1", units: 4 }));
await expectError("one item per topic", () => addItem(A, { kind: "major", topic: "cs1" }), /duplicate key/);
await expectError("one item per GE area", () => addItem(A, { kind: "ge", ge_area: "1A", status: "not_started" }), /duplicate key/);
await expectError("a major item names its topic", () => addItem(A, { kind: "major" }), /check/);
await expectError("a GE item names its area, not a topic", () => addItem(A, { kind: "ge", topic: "cs3", ge_area: "2", status: "not_started" }), /check/);
await expectError("a major item's status lives in user_topic_status", () => addItem(A, { kind: "major", topic: "cs3", status: "done" }), /check/);
await expectError("a GE item has a status", () => addItem(A, { kind: "ge", ge_area: "2" }), /check/);
await expectError("a custom course has a name and units", () => addItem(A, { kind: "custom", course_name: "Drawing", placed_by: "student", status: "not_started" }), /check/);
await expectError("a custom course is placed by the student", () => addItem(A, { kind: "custom", course_name: "Drawing", units: 3, status: "not_started" }), /check/);
await expectError("a term looks like fall-2026", () => addItem(A, { kind: "major", topic: "cs3", term: "Fall 2026" }), /term_check/);
await expectError("there's no winter term in a plan", () => addItem(A, { kind: "major", topic: "cs3", term: "winter-2027" }), /term_check/);
await expectError("units are above 0", () => addItem(A, { kind: "major", topic: "cs3", units: 0 }), /units_check/);
await expectError("a student can't add an item to someone else's plan", () => as("authenticated", A, "insert into plan_items (user_id, kind, topic) values ($1, 'major', 'cs1')", [B]), /row-level security/);
await expectOk("another student plans the same topic", () => addItem(B, { kind: "major", topic: "cs1" }));
await expectRows("a student sees only their own items", () => as("authenticated", B, "select * from plan_items"), 1);
await expectOk("a student can't change someone else's item (nothing matches)", () => as("authenticated", B, "update plan_items set term = 'spring-2027' where user_id = $1", [A]));
check("…and it's unchanged", (await db.query("select term from plan_items where user_id = $1 and topic = 'cs1'", [A])).rows[0]?.term === "fall-2026");
await expectError("anon can't read plan items", () => as("anon", null, "select * from plan_items"), /permission denied/);

// Deleting an account: only the caller's, with every per-student row
const course =await as("service_role", null, `insert into courses (institution_id, subject, course_number, title, source_name, source_url, academic_year, retrieved_at)
  values ($1, 'TEST', '1', 'Test course', ${prov}) returning id`, [instId]);
await as("authenticated", A, "insert into saved_courses (user_id, course_id) values ($1, $2)", [A, course.rows[0].id]);
await savePlan("authenticated", B, instId, true, [{ institution_id: uniId, major_id: majorId }]);
await as("authenticated", B, "insert into saved_schools (user_id, institution_id) values ($1, $2)", [B, uniId]);
const PER_STUDENT = [
  "profiles", "user_targets", "user_requirement_status", "saved_courses", "saved_schools", "user_deadlines", "user_checklist_steps",
  "essay_drafts", "essay_feedback", "user_topic_status", "plan_settings", "plan_items",
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
check("another student's plan is untouched", others.plan_settings === 1 && others.plan_items === 1, others);
check("another student's draft and feedback are untouched", others.essay_drafts === 1 && others.essay_feedback === 1, others);
const leftover = (await db.query("select (select count(*)::int from essay_drafts where id = $1) as d, (select count(*)::int from essay_feedback where id = $2) as f", [draftA, feedbackA])).rows[0];
check("the deleted student's draft and feedback are gone by id", leftover.d === 0 && leftover.f === 0, leftover);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
