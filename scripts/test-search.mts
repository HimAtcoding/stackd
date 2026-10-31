// Checks the picker search (lib/search.ts) against the real school list in data/raw/planning/california-institutions.json:
// 116 community colleges, 22 Cal State and 9 UC (spec 21 → Test). `npm run test:search`
import fs from "node:fs";
import { matchesSearch } from "../lib/search";

type Row = { slug: string; name: string; city?: string; institution_type: string };
const rows: Row[] = JSON.parse(fs.readFileSync("data/raw/planning/california-institutions.json", "utf8")).institutions;
const colleges = rows.filter((r) => r.institution_type === "community_college");
const schools = rows.filter((r) => r.institution_type === "university");

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failed++;
  console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : JSON.stringify(detail));
}
const find = (list: Row[], query: string) => list.filter((r) => matchesSearch(query, r.name, r.city)).map((r) => r.slug);
const finds = (list: Row[], query: string, expected: string[]) => {
  const got = find(list, query);
  check(`"${query}" finds ${expected.join(", ")}`, JSON.stringify(got) === JSON.stringify(expected), got);
};

check("the list has 116 colleges and 31 schools", colleges.length === 116 && schools.length === 31, [colleges.length, schools.length]);

// Onboarding and Settings share one picker; these are spec 21's test lines and the cases that failed before
finds(colleges, "diablo", ["diablo-valley"]);
finds(schools, "cal poly", ["cal-poly-humboldt", "cal-poly-pomona", "cal-poly-san-luis-obispo"]);
finds(colleges, "canada", ["canada"]);
finds(colleges, "Cañada", ["canada"]);
finds(schools, "san jose state", ["san-jose-state"]);
finds(colleges, "mt san antonio", ["mt-san-antonio"]);
finds(colleges, "trade tech", ["los-angeles-trade-tech"]);
finds(colleges, "dvc", ["diablo-valley"]);
finds(colleges, "lpc", ["las-positas"]);
finds(colleges, "ccsf", ["city-college-of-san-francisco"]);
finds(schools, "ucla", ["uc-los-angeles"]);
finds(schools, "UC San Diego", ["uc-san-diego"]);
finds(colleges, "  Las   Positas ", ["las-positas"]);
check("a city finds its colleges", find(colleges, "livermore").join() === "las-positas" && find(colleges, "oakland").join() === "laney,merritt", [find(colleges, "livermore"), find(colleges, "oakland")]);
check("initials match the name, not the city", !find(colleges, "ph").includes("diablo-valley"));
check("an empty search shows everything", find(colleges, "").length === 116 && find(colleges, "   ").length === 116);
check("one letter doesn't match initials", find(colleges, "d").every((s) => colleges.find((c) => c.slug === s)!.name.toLowerCase().includes("d") || colleges.find((c) => c.slug === s)!.city?.toLowerCase().includes("d")));
check("majors match by name", matchesSearch("computer sci", "Computer Science") && matchesSearch("cs", "Computer Science"));

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
