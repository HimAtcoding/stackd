// Moves Sign in with Apple users to a new team when the app is transferred (docs/app-transfer.md).
// Apple gives each user a team-scoped `sub`, so after the transfer the same person signs in with a new `sub`.
// Without this, Supabase can't match them and makes a new, empty account.
//
// Step 1, the old team (before the recipient accepts, or up to 60 days after):
//   node scripts/apple-user-transfer.mjs export <AuthKey.p8> <oldTeamId> <keyId> <newTeamId> <in.csv> <out.csv>
//   in.csv:  user_id,sub            (from the SQL in docs/app-transfer.md)
//   out.csv: user_id,transfer_sub
// Step 2, the new team (within 60 days of accepting the transfer, as soon as possible):
//   node scripts/apple-user-transfer.mjs exchange <AuthKey.p8> <newTeamId> <keyId> <in.csv> <out.sql>
//   in.csv:  user_id,transfer_sub   (step 1's output)
//   out.sql: one update per user for auth.identities, to run in the Supabase SQL editor
//
// The key must be a Sign in with Apple key on the team named next to it. The client ID is the App ID
// (app.stackd.transfer), the primary App ID the web Services ID is grouped with. Keep every file
// outside the repo. Subs, emails and secrets are never printed.
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const CLIENT_ID = "app.stackd.transfer";
const APPLE = "https://appleid.apple.com";

function clientSecret(keyPath, teamId, keyId) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const data = `${b64({ alg: "ES256", kid: keyId, typ: "JWT" })}.${b64({ iss: teamId, iat: now, exp: now + 3600, aud: APPLE, sub: CLIENT_ID })}`;
  const sig = sign("sha256", Buffer.from(data), { key: createPrivateKey(readFileSync(keyPath)), dsaEncoding: "ieee-p1363" });
  return `${data}.${sig.toString("base64url")}`;
}

async function post(path, form, token) {
  const res = await fetch(`${APPLE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: new URLSearchParams(form),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} ${res.status} ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

async function accessToken(secret) {
  const r = await post("/auth/token", { grant_type: "client_credentials", scope: "user.migration", client_id: CLIENT_ID, client_secret: secret });
  return r.access_token;
}

function readCsv(path, second) {
  const rows = readFileSync(path, "utf8").trim().split(/\r?\n/).map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
  if (rows[0][0] === "user_id") rows.shift();
  for (const r of rows) if (r.length < 2 || !/^[0-9a-f-]{36}$/.test(r[0]) || !r[1]) throw new Error(`bad row (want user_id,${second})`);
  return rows;
}

const sqlText = (s) => `'${String(s).replace(/'/g, "''")}'`;
const [mode, ...a] = process.argv.slice(2);

if (mode === "export") {
  const [keyPath, oldTeam, keyId, newTeam, inCsv, outCsv] = a;
  if (!outCsv) throw new Error("usage: export <AuthKey.p8> <oldTeamId> <keyId> <newTeamId> <in.csv> <out.csv>");
  const secret = clientSecret(keyPath, oldTeam, keyId);
  const token = await accessToken(secret);
  const out = ["user_id,transfer_sub"];
  let failed = 0;
  for (const [userId, sub] of readCsv(inCsv, "sub")) {
    try {
      const r = await post("/auth/usermigrationinfo", { sub, target: newTeam, client_id: CLIENT_ID, client_secret: secret }, token);
      out.push(`${userId},${r.transfer_sub}`);
    } catch (e) {
      failed++;
      console.error(`user ${userId}: ${e.message}`);
    }
  }
  writeFileSync(outCsv, out.join("\n") + "\n", { mode: 0o600 });
  console.log(`${out.length - 1} transfer identifiers written to ${outCsv}; ${failed} failed.`);
} else if (mode === "exchange") {
  const [keyPath, newTeam, keyId, inCsv, outSql] = a;
  if (!outSql) throw new Error("usage: exchange <AuthKey.p8> <newTeamId> <keyId> <in.csv> <out.sql>");
  const secret = clientSecret(keyPath, newTeam, keyId);
  const token = await accessToken(secret);
  const out = ["-- Sign in with Apple users moved to the new team. Run once in the Supabase SQL editor.", "begin;"];
  let done = 0, failed = 0;
  for (const [userId, transferSub] of readCsv(inCsv, "transfer_sub")) {
    try {
      const r = await post("/auth/usermigrationinfo", { transfer_sub: transferSub, client_id: CLIENT_ID, client_secret: secret }, token);
      const extra = r.email ? `, 'email', ${sqlText(r.email)}` : "";
      out.push(
        `update auth.identities set provider_id = ${sqlText(r.sub)}, identity_data = identity_data || jsonb_build_object('sub', ${sqlText(r.sub)}${extra}), updated_at = now() where provider = 'apple' and user_id = ${sqlText(userId)};`,
      );
      done++;
    } catch (e) {
      failed++;
      console.error(`user ${userId}: ${e.message}`);
    }
  }
  out.push("commit;");
  writeFileSync(outSql, out.join("\n") + "\n", { mode: 0o600 });
  console.log(`${done} updates written to ${outSql}; ${failed} failed.`);
} else {
  console.error("usage: node scripts/apple-user-transfer.mjs export|exchange ... (see the top of this file)");
  process.exit(1);
}
