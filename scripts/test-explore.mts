// Checks Explore's rules (lib/explore.ts) on the real Computer Science file, plus made-up rows for what it doesn't cover:
// majors, progress, "Counts for both", search, the source line and the links (spec 21 → Test). `npm run test:explore`
import fs from "node:fs";
import type { PlanTarget } from "../lib/data/plan";
import {
  agreementLine,
  buildMajors,
  campusRows,
  cIdGroups,
  panelTab,
  pathwayProgress,
  planMajor,
  problemMailto,
  progressLine,
  resolveTab,
  searchMajors,
  sharedTopics,
  sourceLine,
  statusOf,
  systemsLine,
  tabsOf,
  unitsLine,
  type CampusRecord,
  type ExploreRecords,
  type PathwayOption,
  type PathwayRow,
  type RequirementRecord,
} from "../lib/explore";
import { majorIcon, topicIcon } from "../lib/explore-icons";
import { collegeShortName } from "../lib/format";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failed++;
  console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : JSON.stringify(detail));
}

type FileRequirement = Omit<RequirementRecord, "id" | "pathway_id" | "c_id" | "options" | "units"> & { c_id?: string[]; options?: PathwayOption[]; units?: number };
type FilePathway = Omit<PathwayRow, "id" | "slug" | "verified_at" | "code" | "revision" | "major_units" | "total_units"> &
  Partial<PathwayRow> & { requirements: FileRequirement[]; campuses?: { institution: string; major_names: string[] }[] };

const file: { slug: string; pathways: FilePathway[] } = JSON.parse(fs.readFileSync("data/raw/explore/computer-science.json", "utf8"));

// The file as the database hands it back: ids, provenance and joined campuses
function fromFile(): ExploreRecords {
  const records: ExploreRecords = { pathways: [], requirements: [], campuses: [], majorNames: [{ name: "Computer Science and Engineering", explore_slug: "computer-science" }, { name: "Computer Science", explore_slug: "computer-science" }] };
  for (const { requirements, campuses = [], ...p } of file.pathways) {
    const id = `${file.slug}-${p.kind}`;
    records.pathways.push({
      id,
      slug: file.slug,
      code: null,
      revision: null,
      major_units: null,
      total_units: null,
      ...p,
      verified_at: "2026-10-31T00:00:00+00:00",
    });
    records.requirements.push(...requirements.map((r) => ({ ...r, id: `${id}-${r.code}`, pathway_id: id, units: r.units ?? null, c_id: r.c_id ?? [], options: r.options ?? [] })));
    records.campuses.push(
      ...campuses.map((c): CampusRecord => ({ pathway_id: id, major_names: c.major_names, institution: { id: c.institution, slug: c.institution, name: c.institution } })),
    );
  }
  return records;
}

const records = fromFile();
const [cs] = buildMajors(records);

check("one major from two pathways", buildMajors(records).length === 1 && cs.slug === "computer-science");
check("the major's proper name comes from a major in the same words", cs.name === "Computer Science", cs.name);
check("another major's name isn't taken", buildMajors({ ...records, majorNames: [{ name: "Computer Engineering", explore_slug: "computer-science" }] })[0].name === "Computer science");
check("a major with the same words under another slug isn't taken", buildMajors({ ...records, majorNames: [{ name: "Computer Science", explore_slug: "economics" }] })[0].name === "Computer science");
check("an older device copy with no majors keeps the stored name", buildMajors({ ...records, majorNames: undefined })[0].name === "Computer science");
check('the list says "UC and Cal State"', systemsLine(cs) === "UC and Cal State", systemsLine(cs));
check("UC has 9 rows in the pathway's order", cs.uc?.requirements.length === 9 && cs.uc.requirements[0].code === "intro-programming" && cs.uc.requirements[8].code === "physics");
check("Cal State has 7 rows", cs.calState?.requirements.length === 7);
check("9 campus rows", cs.uc?.campuses.length === 9);

const both = sharedTopics(cs);
check("5 topics count for both", both.size === 5, [...both]);
check("physics doesn't count for both", !both.has("physics-year") && !both.has("physics-mechanics"));

// A UC-only major, a Cal State-only one, and a pathway with no rows
const extra: ExploreRecords = {
  pathways: [...records.pathways, ...(["economics", "nursing", "empty"] as const).map((slug) => ({ ...records.pathways[slug === "economics" ? 1 : 0], id: slug, slug, name: slug[0].toUpperCase() + slug.slice(1) }))],
  requirements: [...records.requirements, { ...records.requirements[0], id: "e1", pathway_id: "economics" }, { ...records.requirements[0], id: "n1", pathway_id: "nursing" }],
  campuses: records.campuses,
};
const all = buildMajors(extra);
const economics = all.find((m) => m.slug === "economics")!;
const nursing = all.find((m) => m.slug === "nursing")!;
check("a pathway with no requirements isn't a major", !all.some((m) => m.slug === "empty"));
check("A to Z", all.map((m) => m.slug).join() === "computer-science,economics,nursing", all.map((m) => m.slug));
check("one system: one tab", tabsOf(economics).length === 1 && systemsLine(economics) === "Cal State" && systemsLine(nursing) === "UC");
check("a tab the major doesn't have falls back to one it does", resolveTab(economics, "uc") === "cal-state" && resolveTab(cs, "cal-state") === "cal-state" && resolveTab(cs, null) === "uc");

// One status per course type
const statuses = { "calculus-single": "done", cs2: "in_progress" } as const;
const uc = pathwayProgress(cs.uc!, statuses);
const csu = pathwayProgress(cs.calState!, statuses);
check("a topic marked once counts on both tabs", uc.done === 1 && csu.done === 1 && uc.taking === 1 && csu.taking === 1, [uc, csu]);
check('"1 of 9 done, 1 taking now"', progressLine(uc) === "1 of 9 done, 1 taking now", progressLine(uc));
check('no taking now: "1 of 9 done"', progressLine({ done: 1, total: 9, taking: 0 }) === "1 of 9 done");
check("no row is not started", statusOf({}, "cs1") === "not_started");
check("one segment per requirement, in order", uc.list.length === 9 && uc.list[3] === "done" && uc.list[1] === "in_progress" && uc.list[0] === "not_started", uc.list);

// Search (21 → Test: "cs" finds Computer science only, "nursing" finds nothing)
const names = (query: string) => searchMajors(all, query).map((m) => m.slug);
check('"cs" finds Computer science, not Economics', names("cs").join() === "computer-science", names("cs"));
check('"coding" finds Computer science', names("coding").join() === "computer-science", names("coding"));
check('"CS " ignores case and spaces', names("CS ").join() === "computer-science", names("CS "));
check('"econ" finds Economics', names("econ").join() === "economics", names("econ"));
check('"zoology" finds nothing', names("zoology").length === 0);
check("an empty search shows them all", names("  ").length === 3);

// The panel
const target = (over: Partial<PlanTarget>): PlanTarget => ({
  institutionId: "uc-san-diego",
  slug: "uc-san-diego",
  name: "UC San Diego",
  system: "UC",
  majorId: "m1",
  majorName: "Computer Science",
  degreeType: "BS",
  exploreSlug: "computer-science",
  majorNotListed: false,
  ...over,
});
check("the panel uses the plan's own name for the major", planMajor([target({})], all)?.name === "Computer Science");
check("no panel for a major Explore has no data for", planMajor([target({ exploreSlug: "history" })], all) === null);
check("no panel with no major", planMajor([target({ majorId: null, majorName: null, exploreSlug: null })], all) === null);
check("the plan's first major with data wins", planMajor([target({ exploreSlug: null }), target({ exploreSlug: "economics", majorName: "Economics" })], all)?.major.slug === "economics");
check("a plan with a UC opens UC", panelTab([target({}), target({ system: "CSU" })]) === "uc");
check("a plan of only Cal State opens Cal State", panelTab([target({ system: "CSU" })]) === "cal-state");

// Campuses
const rows = campusRows(cs.uc!, ["uc-san-diego"]);
check("a campus in the plan comes first, starred", rows[0].name === "uc-san-diego" && rows[0].inPlan && !rows[1].inPlan, rows.slice(0, 2));
check("the rest stay A to Z", rows[1].name === "uc-berkeley" && rows[8].name === "uc-santa-cruz", rows.map((r) => r.name));

// C-ID numbers, the source line, the links
const calculus = cs.calState!.requirements.find((r) => r.topic === "calculus-single")!;
const scienceRow = { ...calculus, options: [{ label: "No number", c_id: [], units: 3 }, ...calculus.options] };
check("calculus lists 3 ways with their numbers", JSON.stringify(cIdGroups(calculus)) === JSON.stringify([["MATH 210", "MATH 220"], ["MATH 211", "MATH 221"], ["MATH 900S"]]), cIdGroups(calculus));
check("a one-course row has its one number", JSON.stringify(cIdGroups(cs.calState!.requirements[0])) === '[["COMP 122"]]');
check("an option with no C-ID number is left out of the sentence", cIdGroups(scienceRow).length === 3);
check("the UC source line", sourceLine(cs.uc!) === "From UC Admissions, Computer Science Transfer Pathway. Checked Oct 31, 2026.", sourceLine(cs.uc!));
check("the template source line", sourceLine(cs.calState!).endsWith("Transfer Model Curriculum #2007, revision 3. Checked Oct 31, 2026."), sourceLine(cs.calState!));
check("the unit totals", unitsLine(cs.calState!) === "At least 28 units in the major, 60 units total.", unitsLine(cs.calState!));

const mail = decodeURIComponent(problemMailto(cs, "cal-state", cs.calState!));
check("Report a problem names the major, tab and rows", mail.startsWith("mailto:joinstackd@gmail.com?") && mail.includes("Major: Computer Science") && mail.includes("Tab: Cal State") && mail.includes("comp-122"), mail);

const own = agreementLine("these", { url: "https://assist.org/x", academicYear: "2026-27", college: "Las Positas" });
const none = agreementLine("these", null);
check("an agreement on record names the college and year", own.label === "Find these at Las Positas" && own.detail === "Your 2026-27 agreement on assist.org" && own.href === "https://assist.org/x", own);
check("none on record says your college", none.label === "Find these at your college" && none.detail === "assist.org" && none.href === "https://assist.org", none);
check('the sheet says "it"', agreementLine("it", null).label === "Find it at your college");
check("short names", collegeShortName("Las Positas College") === "Las Positas" && collegeShortName("College of Marin") === "College of Marin");

check("every Computer Science topic and the major have their own icon", records.requirements.every((r) => topicIcon(r.topic) !== topicIcon("unknown")) && majorIcon("computer-science") !== majorIcon("unknown"));

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
