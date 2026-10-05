// The fetch stage, for a source whose owner has given permission. Off today: sources.json is empty.
//   node scripts/import/fetch.mjs <source-id> <url> [--refresh]
// It refuses unless the source is listed in sources.json with the permission recorded (who, when, and where it's
// written down), the contact email is set, and robots.txt allows the path. One request at a time, at least
// REQUEST_GAP_MS apart, with a User-Agent naming Stackd. Every response is cached in data/raw/fetched/ with its URL
// and time, untouched, and never fetched again unless --refresh is given.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { CONTACT_EMAIL, REQUEST_GAP_MS, USER_AGENT } from "./config.mjs";

const CACHE = "data/raw/fetched";
let lastRequest = 0;

function loadSources() {
  return JSON.parse(fs.readFileSync(new URL("./sources.json", import.meta.url), "utf8"));
}

// A source is usable only with its permission written down
function permittedSource(sourceId, url) {
  const source = loadSources().find((s) => s.id === sourceId);
  if (!source) throw new Error(`"${sourceId}" isn't in scripts/import/sources.json, so it can't be fetched`);
  const p = source.permission ?? {};
  if (!p.granted_by || !p.granted_at || !p.recorded_in) throw new Error(`"${sourceId}" has no recorded permission (granted_by, granted_at, recorded_in)`);
  const host = new URL(url).hostname;
  if (!(source.hosts ?? []).includes(host)) throw new Error(`${host} isn't one of ${sourceId}'s hosts`);
  return source;
}

async function politeGet(url) {
  const wait = lastRequest + REQUEST_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();
  return fetch(url, { headers: { "User-Agent": USER_AGENT } });
}

// Minimal robots.txt check: the Disallow lines for User-agent * (or Stackd)
async function robotsAllows(url) {
  const u = new URL(url);
  const res = await politeGet(`${u.origin}/robots.txt`);
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/plain")) return { allowed: true, note: "no robots.txt" };
  let applies = false;
  const disallowed = [];
  for (const line of (await res.text()).split(/\r?\n/)) {
    const [field, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (/^user-agent$/i.test(field.trim())) applies = value === "*" || /stackd/i.test(value);
    else if (applies && /^disallow$/i.test(field.trim()) && value) disallowed.push(value);
  }
  const blocked = disallowed.find((rule) => u.pathname.startsWith(rule.replace(/\*.*$/, "")));
  return { allowed: !blocked, note: blocked ? `robots.txt disallows ${blocked}` : "robots.txt allows it" };
}

export async function fetchSource({ sourceId, url, refresh = false }) {
  if (CONTACT_EMAIL === "TODO") throw new Error("set CONTACT_EMAIL in scripts/import/config.mjs before fetching anything");
  permittedSource(sourceId, url);

  const key = crypto.createHash("sha1").update(url).digest("hex").slice(0, 16);
  const base = path.join(CACHE, sourceId, key);
  if (!refresh && fs.existsSync(`${base}.meta.json`)) return { cached: true, base };

  const robots = await robotsAllows(url);
  if (!robots.allowed) throw new Error(`${url}: ${robots.note}. Not fetched.`);

  const res = await politeGet(url);
  const body = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(base), { recursive: true });
  fs.writeFileSync(`${base}.body`, body);
  fs.writeFileSync(
    `${base}.meta.json`,
    JSON.stringify({ url, status: res.status, content_type: res.headers.get("content-type"), retrieved_at: new Date().toISOString(), robots: robots.note }, null, 2) + "\n",
  );
  return { cached: false, base, status: res.status };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [sourceId, url] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!sourceId || !url) {
    console.error("usage: node scripts/import/fetch.mjs <source-id> <url> [--refresh]");
    process.exit(2);
  }
  try {
    console.log(await fetchSource({ sourceId, url, refresh: process.argv.includes("--refresh") }));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
