// The review Edge Function (docs/specs/19-essay-import-share-review.md → 3). The public review page calls it with the
// link's token; it calls the review_* database functions as the service role, which check everything (live link,
// name and comment length, quote in the snapshot, 60 a day). Reviewers have no account and never reach the database
// directly. Everything is POST, so tokens stay out of request logs' URLs.
//
// Deploy: npx supabase functions deploy review   (verify_jwt is off in supabase/config.toml: reviewers have no session)

const URL_BASE = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

// Error codes the database raises that the page has a message for
const KNOWN = new Set(["review_ended", "review_bad_request", "review_bad_name", "review_bad_comment", "review_bad_quote", "review_daily_limit", "review_cant_delete"]);

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function rpc(name: string, args: Record<string, unknown>) {
  const res = await fetch(`${URL_BASE}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { ok: res.ok, data };
}

const str = (v: unknown, max: number) => (typeof v === "string" && v.length <= max ? v : null);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "method" });

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return reply(400, { error: "review_bad_request" });
  }
  const token = str(input.t, 64);
  const key = str(input.k, 64);
  if (!token) return reply(400, { error: "review_bad_request" });

  let result;
  switch (input.action) {
    case "open":
      result = await rpc("review_open", { p_token: token, p_reviewer_key: key });
      break;
    case "add":
      result = await rpc("review_add_comment", {
        p_token: token,
        p_reviewer_key: key,
        p_name: str(input.name, 200),
        p_body: str(input.body, 4000),
        p_quote: str(input.quote, 1000),
      });
      break;
    case "delete":
      result = await rpc("review_delete_comment", { p_token: token, p_reviewer_key: key, p_comment: str(input.id, 64) });
      break;
    default:
      return reply(400, { error: "review_bad_request" });
  }

  if (result.ok) return reply(200, result.data ?? { ok: true });
  const message = typeof result.data?.message === "string" ? result.data.message : "";
  if (KNOWN.has(message)) return reply(message === "review_ended" ? 410 : 400, { error: message });
  // A malformed id and the like come back as Postgres errors; anything else is ours
  console.error("review rpc failed", result.data?.code, message);
  return reply(result.data?.code === "22P02" ? 400 : 500, { error: result.data?.code === "22P02" ? "review_bad_request" : "review_failed" });
});
