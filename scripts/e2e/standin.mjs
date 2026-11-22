// The test student's own rows for browser tests, kept in memory. Everything else (schools, majors, pathways, topic
// order, Cal-GETC, college courses) goes to the real project as anon, with the anon key the app itself sends.
// The test student: Las Positas, UC San Diego and SJSU in Computer Science, fall 2027, Discrete math taking now.
export const USER_ID = "5ad0c0de-0000-4000-8000-00000000a11c";

// Per-student tables answered here, never sent to the project
export const STANDIN = new Set([
  "profiles", "user_targets", "user_topic_status", "plan_items", "plan_settings", "course_suggestions", "user_deadlines",
  "user_checklist_steps", "essay_drafts", "essay_feedback", "review_links", "review_comments", "saved_schools",
  "user_requirement_status", "saved_courses",
]);

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

// A made-up session the app accepts; the auth endpoints below answer for it
export function session() {
  const exp = 4102444800;
  return {
    access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: USER_ID, role: "authenticated", aud: "authenticated", exp })}.c2ln`,
    token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "standin",
    user: { id: USER_ID, aud: "authenticated", role: "authenticated", email: "standin@example.com", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: { first_name: "Sam" } },
  };
}

// noPlan: a student who hasn't picked a college or schools yet. statuses: course types marked, by topic.
export function makeState({ noPlan = false, statuses = { discrete: "in_progress" } } = {}) {
  return { tables: Object.fromEntries([...STANDIN].map((t) => [t, []])), ids: null, base: null, apikey: null, seeded: false, noPlan, statuses };
}

// The real ids of the test student's schools and majors, read as anon
async function realIds(state, request) {
  if (state.ids) return state.ids;
  const h = { apikey: state.apikey, authorization: `Bearer ${state.apikey}` };
  const inst = await (await request.get(`${state.base}/rest/v1/institutions?select=id,slug,name,system,abbreviation&slug=in.(las-positas,uc-san-diego,san-jose-state)`, { headers: h })).json();
  const by = Object.fromEntries(inst.map((i) => [i.slug, i]));
  const majors = await (await request.get(`${state.base}/rest/v1/majors?select=id,name,degree_type,explore_slug,institution_id&explore_slug=eq.computer-science&institution_id=in.(${by["uc-san-diego"].id},${by["san-jose-state"].id})`, { headers: h })).json();
  state.ids = { by, majorAt: (id) => majors.find((m) => m.institution_id === id) };
  return state.ids;
}

function seed(state, { by, majorAt }) {
  const strip = ({ id, slug, name, system, abbreviation }) => ({ id, slug, name, system, abbreviation });
  state.tables.profiles = [{ user_id: USER_ID, first_name: "Sam", home: state.noPlan ? null : strip(by["las-positas"]), transfer_term: "fall-2027", transfer_term_asked: true }];
  state.tables.user_targets = state.noPlan
    ? []
    : ["uc-san-diego", "san-jose-state"].map((slug) => {
        const m = majorAt(by[slug].id);
        return { user_id: USER_ID, major_not_listed: false, institution: strip(by[slug]), major: { id: m.id, name: m.name, degree_type: m.degree_type, explore_slug: m.explore_slug } };
      });
  state.tables.user_topic_status = Object.entries(state.statuses).map(([topic, status]) => ({ user_id: USER_ID, topic, status }));
}

// eq. filters only; the app's other filters on these tables don't change which of one student's rows come back
const filtersOf = (url) =>
  [...url.searchParams.entries()].filter(([k, v]) => !["select", "order", "on_conflict", "limit", "columns"].includes(k) && v.startsWith("eq.")).map(([k, v]) => [k, v.slice(3)]);

// Signs the context in as the test student and answers the per-student tables, PostgREST style
export async function install(context, state) {
  await context.route("**/auth/v1/**", (route) => {
    const s = session();
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(route.request().url().includes("/user") ? s.user : s) });
  });
  await context.route("**/rest/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const table = url.pathname.split("/rest/v1/")[1];
    const headers = req.headers();
    state.apikey ??= headers.apikey;
    state.base ??= url.origin;
    if (!STANDIN.has(table)) return route.continue({ headers: { ...headers, authorization: `Bearer ${headers.apikey}` } });
    if (!state.seeded) {
      seed(state, await realIds(state, context.request));
      state.seeded = true;
    }
    const rows = state.tables[table];
    const filters = filtersOf(url);
    const match = (r) => filters.every(([k, v]) => String(r[k]) === v);
    const method = req.method();
    if (method === "GET" || method === "HEAD") {
      const found = rows.filter(match);
      const single = (headers.accept ?? "").includes("vnd.pgrst.object");
      if (single && found.length === 0) return route.fulfill({ status: 406, contentType: "application/json", body: JSON.stringify({ code: "PGRST116", message: "0 rows" }) });
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(single ? found[0] : found) });
    }
    if (method === "POST") {
      const body = JSON.parse(req.postData() || "[]");
      const conflict = (url.searchParams.get("on_conflict") ?? "id").split(",");
      for (const row of Array.isArray(body) ? body : [body]) {
        const at = rows.findIndex((r) => conflict.every((c) => r[c] !== undefined && r[c] === row[c]) || (row.id && r.id === row.id));
        if (at >= 0) rows[at] = { ...rows[at], ...row };
        else rows.push({ id: row.id ?? crypto.randomUUID(), created_at: new Date().toISOString(), ...row });
      }
      return route.fulfill({ status: 201, contentType: "application/json", body: "" });
    }
    if (method === "PATCH") {
      const body = JSON.parse(req.postData() || "{}");
      rows.forEach((r, i) => match(r) && (rows[i] = { ...r, ...body }));
      return route.fulfill({ status: 204, body: "" });
    }
    if (method === "DELETE") {
      state.tables[table] = rows.filter((r) => !match(r));
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fulfill({ status: 405, body: "" });
  });
  // A phone's safe areas, and no dev indicator in screenshots
  await context.addInitScript((auth) => {
    if (!localStorage.getItem("stackd.auth")) localStorage.setItem("stackd.auth", auth);
    localStorage.setItem("stackd.seenWelcome", "1");
    const style = () => {
      const el = document.createElement("style");
      el.textContent = "nextjs-portal{display:none!important} :root{--safe-top:59px!important;--safe-bottom:34px!important}";
      document.head.appendChild(el);
    };
    if (document.head) style();
    else document.addEventListener("DOMContentLoaded", style);
  }, JSON.stringify(session()));
}
