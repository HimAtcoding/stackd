// Checks Build my plan (lib/plan/build.ts, spec 24 → 5) on made-up course types, units and order, plus majorNeeds on
// the real Computer Science file. `npm run test:plan`
import fs from "node:fs";
import type { PlanTarget } from "../lib/data/plan";
import { buildMajors, type ExploreRecords, type Statuses, type TopicStatus } from "../lib/explore";
import {
  buildPlan,
  currentTerm,
  majorNeeds,
  planTerms,
  type BuildInput,
  type BuildResult,
  type GeNeed,
  type MajorNeed,
  type PlacedItem,
  type PlanItem,
  type TermId,
} from "../lib/plan/build";
import { applyBuild, DEFAULT_SETTINGS, moveItem, planNeeds, planView, transferTermOf, type StoredItem, type ViewInput } from "../lib/plan/view";
import { planWarnings, termHeader, type WarnCard, type WarnInput } from "../lib/plan/warnings";
import { afterBuild, afterDoneMark } from "../lib/rating";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failed++;
  console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : JSON.stringify(detail));
}

// Made-up course types. "both" ones count for UC and Cal State.
const need = (topic: string, sort: number, units: number | null = 4, systems: MajorNeed["systems"] = ["uc"]): MajorNeed => ({ topic, name: `Made-up ${topic}`, systems, sort, units });
const both = (topic: string, sort: number, units: number | null = 4) => need(topic, sort, units, ["uc", "cal-state"]);
const ge = (code: string, sort: number, units: number | null = 3, courses: number | null = 1): GeNeed => ({ code, name: `Made-up area ${code}`, sort, units, courses });
const item = (fields: Partial<PlanItem> & Pick<PlanItem, "kind">): PlanItem => ({
  topic: null, ge_area: null, term: null, position: 0, placed_by: "builder", course_code: null, course_name: null, units: null,
  status: fields.kind === "major" ? null : "not_started", ...fields,
});

const TWO: TermId[] = ["fall-2026", "spring-2027"];
const build = (over: Partial<BuildInput>): BuildResult =>
  buildPlan({ majors: [], geAreas: [], statuses: {}, items: [], terms: TWO, unitLimit: 15, order: [], ...over });
const termOf = (r: BuildResult, key: string) => r.items.find((i) => i.key === key)?.term;
const unitsIn = (r: BuildResult, term: TermId) => r.items.filter((i) => i.term === term && i.progress !== "done").reduce((n, i) => n + i.units, 0);
const where = (r: BuildResult) => Object.fromEntries(r.items.map((i) => [i.key, i.term]));
// The result as plan_items rows again, for a rebuild
const asItems = (r: BuildResult): PlanItem[] =>
  r.items.map(({ key, chosenUnits, unitsEstimated, progress, reasons, ...rest }: PlacedItem) => (void key, void unitsEstimated, void progress, void reasons, { ...rest, units: chosenUnits }));

// Terms
check("January to May is spring", currentTerm(new Date(2026, 0, 15)) === "spring-2026" && currentTerm(new Date(2026, 4, 31)) === "spring-2026");
check("June and July are summer", currentTerm(new Date(2026, 5, 1)) === "summer-2026" && currentTerm(new Date(2026, 6, 31)) === "summer-2026");
check("August to December is fall", currentTerm(new Date(2026, 7, 1)) === "fall-2026" && currentTerm(new Date(2026, 11, 31)) === "fall-2026");
check("terms run to the one before the transfer term", JSON.stringify(planTerms("fall-2026", "fall-2027", false)) === JSON.stringify(["fall-2026", "spring-2027"]));
check("summers only when they're on", JSON.stringify(planTerms("fall-2026", "fall-2027", true)) === JSON.stringify(["fall-2026", "spring-2027", "summer-2027"]));
check("a current summer with summers off starts at the fall", planTerms("summer-2026", "fall-2027", false)[0] === "fall-2026");
check("a transfer term already here leaves no terms", planTerms("fall-2027", "fall-2027", false).length === 0 && planTerms("spring-2028", "fall-2027", true).length === 0);
check("terms cross the new year", JSON.stringify(planTerms("spring-2026", "spring-2027", true)) === JSON.stringify(["spring-2026", "summer-2026", "fall-2026"]));

// Order: each course after the one before it, never in the same term
const chain = [need("first", 1), need("second", 2), need("third", 3)];
const chainOrder = [{ topic: "second", before_topic: "first" }, { topic: "third", before_topic: "second" }];
const THREE: TermId[] = ["fall-2026", "spring-2027", "fall-2027"];
let r = build({ majors: chain, order: chainOrder, terms: THREE });
check("order: a chain spreads across terms, one step a term", termOf(r, "major:first") === "fall-2026" && termOf(r, "major:second") === "spring-2027" && termOf(r, "major:third") === "fall-2027", where(r));
r = build({ majors: [...chain].reverse(), order: chainOrder, terms: THREE });
check("order: the same whatever order the needs come in", termOf(r, "major:first") === "fall-2026" && termOf(r, "major:third") === "fall-2027", where(r));
r = build({ majors: chain, order: chainOrder });
check("order: the last step doesn't fit in two terms", termOf(r, "major:third") === null && r.doesntFit === 1, where(r));
r = build({ majors: [both("shared", 1), need("uc-only", 2)], order: [{ topic: "shared", before_topic: "uc-only" }] });
check("order: a prerequisite in a later group is placed first", termOf(r, "major:uc-only") === "fall-2026" && termOf(r, "major:shared") === "spring-2027", where(r));
r = build({ majors: [need("loop-a", 1), need("loop-b", 2), need("free", 3)], order: [{ topic: "loop-a", before_topic: "loop-b" }, { topic: "loop-b", before_topic: "loop-a" }] });
check("order: a loop in the data stops instead of hanging, and the rest still places", termOf(r, "major:free") === "fall-2026" && termOf(r, "major:loop-a") === null, where(r));

// Groups: counts for both, then the rest of the major, then GE
r = build({ majors: [need("uc-only", 1), both("shared", 9)], geAreas: [ge("1A", 1, 4)], unitLimit: 4, terms: THREE });
check("courses that count for both come first, then the major, then GE",
  termOf(r, "major:shared") === "fall-2026" && termOf(r, "major:uc-only") === "spring-2027" && termOf(r, "ge:1A") === "fall-2027", where(r));
r = build({ majors: [need("deep", 1), need("shallow", 2), need("root", 3)], order: [{ topic: "deep", before_topic: "root" }], unitLimit: 4, terms: THREE });
check("within a group, earlier courses first, then the pathway's sort",
  termOf(r, "major:shallow") === "fall-2026" && termOf(r, "major:root") === "spring-2027" && termOf(r, "major:deep") === "fall-2027", where(r));

// Unit limits
const five = [1, 2, 3, 4, 5].map((n) => need(`course-${n}`, n));
r = build({ majors: five });
check("full time: three 4-unit courses fit in 15, not four", unitsIn(r, "fall-2026") === 12 && unitsIn(r, "spring-2027") === 8, { fall: unitsIn(r, "fall-2026"), spring: unitsIn(r, "spring-2027") });
r = build({ majors: five, unitLimit: 9 });
check("part time: two fit in 9, and the fifth doesn't fit", unitsIn(r, "fall-2026") === 8 && unitsIn(r, "spring-2027") === 8 && r.doesntFit === 1, where(r));
r = build({ majors: [need("big", 1, 5), need("small", 2, 3)], unitLimit: 4 });
check("a course over the limit on its own doesn't fit; a smaller one still does", termOf(r, "major:big") === null && termOf(r, "major:small") === "fall-2026", where(r));
r = build({ majors: [need("four", 1, 4), need("five", 2, 5), need("three", 3, 3)], unitLimit: 7 });
check("a later term takes what the first can't, and a smaller course fills the gap", termOf(r, "major:four") === "fall-2026" && termOf(r, "major:five") === "spring-2027" && termOf(r, "major:three") === "fall-2026", where(r));

// Summers
const seven = [1, 2, 3, 4, 5, 6, 7].map((n) => need(`course-${n}`, n));
r = build({ majors: seven, terms: planTerms("fall-2026", "fall-2027", false) });
check("summers off: no summer term, and one course doesn't fit", !r.items.some((i) => i.term?.startsWith("summer")) && r.doesntFit === 1, where(r));
r = build({ majors: seven, terms: planTerms("fall-2026", "fall-2027", true) });
check("summers on: the summer term takes it", termOf(r, "major:course-7") === "summer-2027" && r.doesntFit === 0, where(r));

// Kept student placements
const studentPut = item({ kind: "major", topic: "course-1", term: "spring-2027", placed_by: "student" });
r = build({ majors: five, items: [studentPut] });
check("a course the student placed stays there", termOf(r, "major:course-1") === "spring-2027" && r.items.find((i) => i.key === "major:course-1")?.placed_by === "student", where(r));
r = build({ majors: five, items: [studentPut], unitLimit: 8 });
check("…and counts toward that term's units", JSON.stringify(where(r)) === JSON.stringify({ "major:course-1": "spring-2027", "major:course-2": "fall-2026", "major:course-3": "fall-2026", "major:course-4": "spring-2027", "major:course-5": null }), where(r));
r = build({ majors: five, items: [studentPut] });
check("…with You moved it here as its reason", r.items.find((i) => i.key === "major:course-1")?.reasons[0]?.kind === "you-moved-it");
const rebuilt = build({ majors: five, items: asItems(r) });
check("rebuild keeps student placements and places the rest the same way", JSON.stringify(where(rebuilt)) === JSON.stringify(where(r)), { before: where(r), after: where(rebuilt) });
r = build({ majors: five, items: [item({ kind: "major", topic: "course-2", term: null, placed_by: "student" })] });
check("a course the student moved to Not in a term yet stays there", termOf(r, "major:course-2") === null && r.doesntFit === 0, where(r));
r = build({ majors: five, items: [item({ kind: "major", topic: "course-1", term: "summer-2027", placed_by: "student" })] });
check("a student's term that left the plan (summers off) is placed again", termOf(r, "major:course-1") === "fall-2026", where(r));
r = build({ majors: chain, order: chainOrder, items: [item({ kind: "major", topic: "first", term: null, placed_by: "student" })], terms: THREE });
check("a course waits while the student keeps its prerequisite out of the terms", termOf(r, "major:second") === null && termOf(r, "major:third") === null, where(r));
r = build({ majors: [need("old", 1)], items: [item({ kind: "major", topic: "gone", term: "fall-2026", placed_by: "student" })] });
check("a course type no longer in the major leaves the plan", !r.items.some((i) => i.key === "major:gone"));

// Custom courses
const custom = item({ kind: "custom", id: "c1", course_code: "ART 1", course_name: "Made-up drawing", units: 5, term: "fall-2026", placed_by: "student" });
r = build({ majors: five, items: [custom] });
check("a custom course stays where it is and counts toward units, leaving room for two",
  termOf(r, "custom:c1") === "fall-2026" && unitsIn(r, "fall-2026") === 13 && r.items.filter((i) => i.term === "fall-2026").length === 3, { fall: unitsIn(r, "fall-2026"), where: where(r) });
check("…never as a requirement or a reason", r.items.find((i) => i.key === "custom:c1")?.reasons.length === 0 && r.doesntFit === 0);

// Taking now
r = build({ majors: chain, order: chainOrder, statuses: { first: "in_progress" }, terms: THREE });
check("taking now goes in the current term", termOf(r, "major:first") === "fall-2026" && r.items.find((i) => i.key === "major:first")?.reasons[0]?.kind === "taking-now", where(r));
check("…and the course after it goes in a later term", termOf(r, "major:second") === "spring-2027", where(r));
r = build({ majors: [need("a", 1, 5), need("b", 2, 5)], statuses: { a: "in_progress", b: "in_progress" }, unitLimit: 6 });
check("taking now stays in the current term even over the limit", termOf(r, "major:a") === "fall-2026" && termOf(r, "major:b") === "fall-2026", where(r));
r = build({ majors: five, items: [item({ kind: "major", topic: "course-3", term: "spring-2027", placed_by: "student" })], statuses: { "course-3": "in_progress" } });
check("taking now wins over a student's later placement", termOf(r, "major:course-3") === "fall-2026", where(r));
r = build({ geAreas: [ge("1A", 1), ge("2", 2)], items: [item({ kind: "ge", ge_area: "2", status: "in_progress" })], unitLimit: 3 });
check("a GE area taken now goes in the current term too", termOf(r, "ge:2") === "fall-2026" && termOf(r, "ge:1A") === "spring-2027", where(r));

// Doesn't fit
r = build({ majors: [...five, ...[6, 7, 8].map((n) => need(`course-${n}`, n))], unitLimit: 8 });
check("Doesn't fit counts what's left in Not in a term yet", r.doesntFit === 4 && r.items.filter((i) => i.term === null).length === 4, where(r));
r = build({ majors: [need("blocker", 1, 6), need("after", 2, 3)], order: [{ topic: "after", before_topic: "blocker" }], unitLimit: 5 });
check("a course whose prerequisite doesn't fit doesn't fit either", termOf(r, "major:blocker") === null && termOf(r, "major:after") === null && r.doesntFit === 2, where(r));
r = build({ majors: five, terms: [] });
check("no terms left: everything goes to Not in a term yet", r.doesntFit === 5);

// Units
r = build({ majors: [need("pathway", 1, 5), need("unknown", 2, null)], geAreas: [ge("1A", 1, null), ge("2", 2, 4)], items: [item({ kind: "major", topic: "chosen", units: 3 })] });
const u = (key: string) => r.items.find((i) => i.key === key);
check("units: the pathway's when the student hasn't picked a course", u("major:pathway")?.units === 5 && !u("major:pathway")?.unitsEstimated);
check("units: about 4 for a major course and 3 for a GE area when nothing says", u("major:unknown")?.units === 4 && u("major:unknown")?.unitsEstimated === true && u("ge:1A")?.units === 3 && u("ge:1A")?.unitsEstimated === true);
check("units: the area's units when ge_areas has them", u("ge:2")?.units === 4 && !u("ge:2")?.unitsEstimated);
r = build({ majors: [need("chosen", 1, 4)], items: [item({ kind: "major", topic: "chosen", course_code: "TEST 1", units: 5 })] });
check("units: the student's course wins", r.items[0]?.units === 5 && r.items[0]?.chosenUnits === 5 && r.items[0]?.course_code === "TEST 1");

// Done
const statuses: Statuses = { "course-1": "done" };
r = build({ majors: five, statuses, items: [item({ kind: "major", topic: "course-1", term: "fall-2026", placed_by: "student" })] });
check("a done course isn't placed again and stays as it was", termOf(r, "major:course-1") === "fall-2026" && r.items.filter((i) => i.term === "fall-2026" && i.key !== "major:course-1").length === 3, where(r));
check("…and doesn't count toward the term's units", unitsIn(r, "fall-2026") === 12);
r = build({ majors: chain, order: chainOrder, statuses: { first: "done" } });
check("a done prerequisite lets the next course start now", termOf(r, "major:second") === "fall-2026" && termOf(r, "major:third") === "spring-2027" && !r.items.some((i) => i.key === "major:first"), where(r));
r = build({ geAreas: [ge("1A", 1)], items: [item({ kind: "ge", ge_area: "1A", status: "done" })] });
check("a done GE area isn't placed", r.items.length === 1 && r.items[0].status === "done" && r.doesntFit === 0);

// An area met inside another area's course (a lab) gets no card
r = build({ geAreas: [ge("5A", 1), ge("5C", 2, 0, 0)] });
check("an area with 0 courses gets no card", r.items.length === 1 && r.items[0].key === "ge:5A", r.items.map((i) => i.key));
r = build({ geAreas: [ge("5C", 1, 0, 0)], items: [item({ kind: "ge", ge_area: "5C", term: "fall-2026" })] });
check("…and an old card for it drops out", r.items.length === 0 && r.doesntFit === 0, r.items.map((i) => i.key));
r = build({ geAreas: [ge("5A", 1), ge("5C", 2, null, null)] });
check("an area whose courses aren't known yet still gets a card", r.items.length === 2, r.items.map((i) => i.key));

// Prerequisites outside the plan
r = build({ majors: [need("needs-outside", 1)], order: [{ topic: "needs-outside", before_topic: "not-in-major" }, { topic: "needs-outside", before_topic: "done-elsewhere" }], statuses: { "done-elsewhere": "done" } });
check("a prerequisite the major doesn't need doesn't hold a course back", termOf(r, "major:needs-outside") === "fall-2026");
check("…and is returned, unless it's done", JSON.stringify(r.outsidePrereqs) === JSON.stringify([{ topic: "needs-outside", before_topic: "not-in-major" }]), r.outsidePrereqs);

// Reasons
r = build({ majors: [both("shared", 1), need("next", 2)], geAreas: [ge("4", 1)], order: [{ topic: "next", before_topic: "shared" }] });
const reasons = (key: string) => r.items.find((i) => i.key === key)?.reasons.map((x) => x.kind).join();
check("reasons: counts for both, needed before, fits", reasons("major:shared") === "both,needed-before,fits" &&
  JSON.stringify(r.items.find((i) => i.key === "major:shared")?.reasons[1]) === JSON.stringify({ kind: "needed-before", topic: "next" }), reasons("major:shared"));
check("reasons: fits names the term and the limit", JSON.stringify(r.items.find((i) => i.key === "major:next")?.reasons.at(-1)) === JSON.stringify({ kind: "fits", term: "spring-2027", limit: 15 }));
check("reasons: a GE area names its area", reasons("ge:4") === "ge-area,fits");
check("every placed item has 1 to 3 reasons", r.items.every((i) => i.reasons.length >= 1 && i.reasons.length <= 3));

// Positions and repeat builds
r = build({ majors: five, geAreas: [ge("1A", 1), ge("2", 2)], items: [custom] });
const positions = (term: TermId | null) => r.items.filter((i) => i.term === term).map((i) => i.position).join();
check("positions run 0, 1, 2 in each term", positions("fall-2026") === "0,1,2" && positions("spring-2027") === "0,1,2,3", { fall: positions("fall-2026"), spring: positions("spring-2027") });
check("the same input gives the same plan", JSON.stringify(build({ majors: five, geAreas: [ge("1A", 1), ge("2", 2)], items: [custom] })) === JSON.stringify(r));

// majorNeeds on the real Computer Science file
type FileRequirement = { code: string; sort: number; topic: string; name: string; description: string; how_many: string; units?: number; c_id?: string[] };
const file: { slug: string; pathways: { kind: "uc_pathway" | "tmc"; name: string; requirements: FileRequirement[] }[] } =
  JSON.parse(fs.readFileSync("data/raw/explore/computer-science.json", "utf8"));
const records: ExploreRecords = { pathways: [], requirements: [], campuses: [] };
for (const p of file.pathways) {
  const id = `${file.slug}-${p.kind}`;
  records.pathways.push({ id, slug: file.slug, kind: p.kind, name: p.name, code: null, revision: null, major_units: null, total_units: null, source_name: "", source_url: "", verified_at: null });
  records.requirements.push(...p.requirements.map((q) => ({ ...q, id: `${id}-${q.code}`, pathway_id: id, units: q.units ?? null, c_id: q.c_id ?? [], options: [] })));
}
const [cs] = buildMajors(records);
const ucAndCsu = majorNeeds(cs, ["uc", "cal-state"]);
const ucOnly = majorNeeds(cs, ["uc"]);
const tmcRow = (topic: string) => file.pathways[1].requirements.find((q) => q.topic === topic);
check("majorNeeds: UC alone gives UC's 9 course types, none counting for both", ucOnly.length === 9 && ucOnly.every((n) => n.systems.join() === "uc"));
check("majorNeeds: both systems mark the 5 shared course types",
  ucAndCsu.filter((n) => n.systems.length === 2).map((n) => n.topic).sort().join() === "calculus-single,comp-org,cs1,cs2,discrete", ucAndCsu.filter((n) => n.systems.length === 2).map((n) => n.topic));
check("majorNeeds: a shared topic keeps the UC row's name and sort", ucAndCsu.find((n) => n.topic === "cs2")?.sort === file.pathways[0].requirements.find((q) => q.topic === "cs2")?.sort);
check("majorNeeds: units come from the rows, the larger when both have them",
  ucAndCsu.every((n) => n.units === null || n.units >= (tmcRow(n.topic)?.units ?? 0)) && ucAndCsu.find((n) => n.topic === "cs1")?.units === (tmcRow("cs1")?.units ?? null));
r = build({ majors: ucAndCsu, terms: planTerms("fall-2026", "fall-2027", false) });
check("the real major builds into fall 2026 and spring 2027 within 15 units", unitsIn(r, "fall-2026") <= 15 && unitsIn(r, "spring-2027") <= 15 && r.items.length === ucAndCsu.length);
check("…courses that count for both placed before the rest", r.items.filter((i) => i.term === "fall-2026").every((i) => ucAndCsu.find((n) => n.topic === i.topic)!.systems.length === 2), where(r));

// Warnings and quiet notes (24 → 4)
const NAMES: Record<string, string> = { first: "Made-up first", second: "Made-up second" };
const wcard = (key: string, fields: Partial<WarnCard>): WarnCard => ({ key, kind: "major", topic: key, geArea: null, term: null, progress: "not_started", ...fields });
const warn = (cards: WarnCard[], over: Partial<WarnInput> = {}) =>
  planWarnings({ cards, terms: TWO, order: chainOrder, done: new Set(), geAreas: [], unitLimit: 15, unitsIn: () => 0, nameOf: (t) => NAMES[t] ?? t, ...over });
let w = warn([wcard("first", { term: "fall-2026" }), wcard("second", { term: "fall-2026" })]);
check("order: same term warns, naming the term", w.lines.get("second")?.text === "Take Made-up first first (Fall 2026)" && w.lines.get("second")?.kind === "warning", w.lines.get("second"));
check("…and counts as a thing to check, the first one", w.count === 1 && w.first === "second");
w = warn([wcard("first", { term: "spring-2027" }), wcard("second", { term: "fall-2026" })]);
check("order: an earlier term warns too", w.lines.get("second")?.text === "Take Made-up first first (Spring 2027)");
w = warn([wcard("first", { term: "fall-2026" }), wcard("second", { term: "spring-2027" })]);
check("order: moved back to a later term, the warning clears", !w.lines.has("second") && w.count === 0);
w = warn([wcard("first", { term: null }), wcard("second", { term: "fall-2026" })]);
check("order: a prerequisite not in a term says so without a term", w.lines.get("second")?.text === "Take Made-up first first");
w = warn([wcard("first", { term: "fall-2026", progress: "in_progress" }), wcard("second", { term: "fall-2026" })]);
check("order: a prerequisite taking now in the same term still warns", w.lines.get("second")?.kind === "warning");
w = warn([wcard("first", { term: "fall-2026", progress: "in_progress" }), wcard("second", { term: "spring-2027" })]);
check("…and the next term is fine", !w.lines.has("second"));
w = warn([wcard("second", { term: "fall-2026" })], { done: new Set(["first"]) });
check("order: a done prerequisite is fine", !w.lines.has("second"));
w = warn([wcard("second", { term: "fall-2026" })]);
check("a prerequisite outside the plan is a quiet note", w.lines.get("second")?.kind === "note" && w.lines.get("second")?.text === "Needs Made-up first first, or placement");
check("…that isn't counted", w.count === 0 && w.first === null);
const lab = [ge("5A", 1), ge("5B", 2), ge("5C", 3, 0, 0)];
const gecard = (code: string, progress: TopicStatus = "not_started") => wcard(`ge:${code}`, { kind: "ge", topic: null, geArea: code, term: "fall-2026", progress });
w = warn([gecard("5A"), gecard("5B")], { geAreas: lab });
check("5C: the lab note on 5A and 5B", w.lines.get("ge:5A")?.text === "Take one science course with a lab (Cal-GETC 5C)" && w.lines.get("ge:5B")?.kind === "note");
check("…not counted", w.count === 0);
w = warn([gecard("5A", "done"), gecard("5B")], { geAreas: lab });
check("…and gone once either is done", w.lines.size === 0);
check("term header: within the limit", termHeader(15, 15).text === "15 units" && !termHeader(15, 15).over);
check("term header: 16 is over a 15 limit", termHeader(16, 15).text === "16 units, over your limit" && termHeader(16, 15).over);
check("term header: 19 needs approval", termHeader(19, 21).text === "19 units. Most colleges need approval above 18" && termHeader(19, 15).over);
w = warn([wcard("first", { term: "spring-2027" }), wcard("second", { term: "spring-2027" })], { unitsIn: (t) => (t === "fall-2026" ? 16 : 3) });
check("a term over the limit counts, and comes first top to bottom", w.count === 2 && w.first === "fall-2026", { count: w.count, first: w.first });

// What the Plan tab draws
const stored = (id: string, fields: Partial<StoredItem> & Pick<StoredItem, "kind">): StoredItem => ({ ...item(fields), id, college_course_id: null, ...fields });
const viewOf = (over: Partial<ViewInput>) =>
  planView({
    needs: [], geAreas: [], order: [], statuses: {}, items: [], terms: TWO, settings: DEFAULT_SETTINGS, systems: new Set(["uc", "cal-state"]),
    nameOf: (t) => t, newId: (k) => `new-${k}`, ...over,
  });
let v = viewOf({ needs: [both("shared", 1), need("uc-only", 2, null)], geAreas: lab });
check("view: an empty plan isn't built, and every need waits in Not in a term yet", !v.built && v.unplaced.length === 4 && v.coursesLeft === 4, v.unplaced.map((c) => c.key));
check("view: line 2 counts for both, UC only, or the area", v.cardsByKey.get("major:shared")?.detail?.kind === "both" &&
  JSON.stringify(v.cardsByKey.get("major:uc-only")?.detail) === JSON.stringify({ kind: "system", system: "uc" }) && v.cardsByKey.get("ge:5A")?.detail?.kind === "ge");
check("view: a course with no units is about 4", v.cardsByKey.get("major:uc-only")?.units === 4 && v.cardsByKey.get("major:uc-only")?.unitsEstimated === true);
v = viewOf({ needs: [need("uc-only", 2)], systems: new Set(["uc"]) });
check("view: UC only isn't said when the plan is only UC", v.cardsByKey.get("major:uc-only")?.detail === null);
const planned = [
  stored("a", { kind: "major", topic: "shared", term: "fall-2026", position: 0 }),
  stored("b", { kind: "major", topic: "uc-only", term: "spring-2027", position: 0, placed_by: "student" }),
  stored("c", { kind: "custom", course_name: "Drawing", units: 3, term: "fall-2026", position: 1, placed_by: "student" }),
  stored("d", { kind: "ge", ge_area: "5A", term: null, status: "not_started" }),
  stored("e", { kind: "ge", ge_area: "5B", term: "fall-2026", position: 2, status: "done" }),
];
v = viewOf({ needs: [both("shared", 1), need("uc-only", 2)], geAreas: lab, items: planned });
check("view: built, with cards in their terms by position", v.built && v.terms[0].cards.map((c) => c.key).join() === "major:shared,custom:c" && v.terms[1].cards.map((c) => c.key).join() === "major:uc-only");
check("view: the current term is Now", v.terms[0].now && !v.terms[1].now && v.terms[0].label === "Fall 2026");
check("view: a custom course counts toward the term's units", v.terms[0].header.units === 7, v.terms[0].header);
check("view: …and never toward courses left", v.coursesLeft === 3, v.coursesLeft);
check("view: done items leave the terms for Already done", v.done.map((c) => c.key).join() === "ge:5B" && !v.terms[0].cards.some((c) => c.key === "ge:5B"));
check("view: units done counts the done items", v.unitsDone === 3);
check("view: units done from settings wins", viewOf({ items: planned, settings: { ...DEFAULT_SETTINGS, units_done: 31 } }).unitsDone === 31);
check("view: a builder item left out is Doesn't fit", v.doesntFit === 1 && v.unplaced[0].key === "ge:5A");
check("view: reasons are true for the plan as it is",
  v.cardsByKey.get("major:shared")?.reasons.join("|") === "Counts for UC and Cal State|Fits your 15 units in Fall 2026" &&
  v.cardsByKey.get("major:uc-only")?.reasons.join("|") === "You moved it here" &&
  v.cardsByKey.get("custom:c")?.reasons.join("|") === "You added it", [...v.cardsByKey.values()].map((c) => `${c.key}: ${c.reasons.join("|")}`));
check("view: a done 5B clears the lab note on 5A", v.cardsByKey.get("ge:5A")?.line === null);
v = viewOf({ needs: [both("shared", 1)], items: planned, settings: { ...DEFAULT_SETTINGS, units_per_term: 4 } });
check("view: no Fits reason in a term over the limit", !v.cardsByKey.get("major:shared")?.reasons.some((r) => r.startsWith("Fits")) && v.terms[0].header.over);
check("view: a custom course is counted in the over-limit header", v.terms[0].header.text === "7 units, over your limit");
v = viewOf({ needs: [need("first", 1), need("second", 2)], order: chainOrder, items: [stored("x", { kind: "major", topic: "second", term: "fall-2026" }), stored("y", { kind: "major", topic: "first", term: "spring-2027" })] });
check("view: Data structures above Intro to programming warns on the later course", v.cardsByKey.get("major:second")?.line?.kind === "warning" && v.checks === 1 && v.firstCheck === "major:second");
check("view: …and the earlier course says what it's needed before", Boolean(v.cardsByKey.get("major:first")?.reasons.includes("Needed before Made-up second")));

// Saving a build and moving cards
const NEED2 = [need("first", 1), need("second", 2)];
let ids = 0;
let built = applyBuild([], { majors: NEED2, geAreas: [], statuses: {}, terms: TWO, unitLimit: 15, order: chainOrder }, () => `id-${++ids}`);
check("build: every placed item gets an id and is saved", built.items.length === 2 && built.changed.length === 2 && built.items.every((i) => i.id.startsWith("id-")) && built.removed.length === 0);
const again = applyBuild(built.items, { majors: NEED2, geAreas: [], statuses: {}, terms: TWO, unitLimit: 15, order: chainOrder }, () => `id-${++ids}`);
check("rebuild: the same plan keeps its ids and changes nothing", again.changed.length === 0 && again.items.map((i) => i.id).sort().join() === built.items.map((i) => i.id).sort().join());
const dropped = applyBuild(built.items, { majors: [need("first", 1)], geAreas: [], statuses: {}, terms: TWO, unitLimit: 15, order: chainOrder }, () => `id-${++ids}`);
check("rebuild: a course type no longer in the plan is deleted", dropped.removed.length === 1 && dropped.items.length === 1);
built = applyBuild([], { majors: NEED2, geAreas: [], statuses: { first: "in_progress" }, terms: TWO, unitLimit: 15, order: chainOrder }, () => `id-${++ids}`);
const second = built.items.find((i) => i.topic === "second")!;
const moved = moveItem(built.items, second, "fall-2026", null);
check("move: to another term, at the end, as the student's placement",
  moved.items.find((i) => i.id === second.id)?.term === "fall-2026" && moved.items.find((i) => i.id === second.id)?.placed_by === "student" && moved.items.find((i) => i.id === second.id)?.position === 1);
check("move: only what changed is saved", moved.changed.length === 1, moved.changed.map((i) => i.topic));
const rebuiltAfterMove = applyBuild(moved.items, { majors: NEED2, geAreas: [], statuses: { first: "in_progress" }, terms: TWO, unitLimit: 15, order: chainOrder }, () => `id-${++ids}`);
check("rebuild keeps the moved course and the one taking now", rebuiltAfterMove.items.find((i) => i.topic === "second")?.term === "fall-2026" && rebuiltAfterMove.items.find((i) => i.topic === "first")?.term === "fall-2026");
const first = moved.items.find((i) => i.topic === "first")!;
const reordered = moveItem(moved.items, moved.items.find((i) => i.topic === "second")!, "fall-2026", first.id);
check("move: within a term reorders and keeps who placed it", reordered.items.find((i) => i.topic === "second")?.position === 0 && reordered.items.find((i) => i.topic === "first")?.position === 1 &&
  reordered.items.find((i) => i.topic === "first")?.placed_by === first.placed_by);
const fresh = stored("new", { kind: "ge", ge_area: "1A", term: null, status: "not_started" });
check("move: a card the plan didn't hold yet is added", moveItem(moved.items, fresh, "spring-2027", null).items.some((i) => i.id === "new" && i.term === "spring-2027" && i.placed_by === "student"));

// The student's needs and transfer term
const target = (system: string, slug: string | null): PlanTarget => ({ institutionId: system, slug: system, name: system, system, majorId: "m", majorName: "m", degreeType: null, exploreSlug: slug, majorNotListed: false });
check("needs: UC San Diego and SJSU in Computer Science mark the shared courses", planNeeds([target("UC", "computer-science"), target("CSU", "computer-science")], [cs]).filter((n) => n.systems.length === 2).length === 5);
check("needs: a school without a major adds nothing", planNeeds([target("UC", null)], [cs]).length === 0);
check("transfer term: the student's own", JSON.stringify(transferTermOf({ asked: true, term: "fall-2028" }, new Date(2026, 10, 11))) === JSON.stringify({ term: "fall-2028", guessed: false }));
check("transfer term: not sure yet plans to fall of next year", JSON.stringify(transferTermOf({ asked: true, term: null }, new Date(2026, 10, 11))) === JSON.stringify({ term: "fall-2027", guessed: true }));
check("transfer term: never asked, the screen asks", transferTermOf({ asked: false, term: null }, new Date(2026, 10, 11)) === null);

// Apple's rating prompt (24 → 7)
const day = (d: number) => new Date(2026, 10, d, 12);
let rs = afterBuild({ builtOn: null, laterDone: 0, askedAfterDone: false }, day(11));
check("rating: asks after the first build", rs.ask && rs.state.builtOn === "2026-11-11");
check("rating: not after the next build", !afterBuild(rs.state, day(12)).ask);
let st = rs.state;
for (let i = 0; i < 3; i++) st = afterDoneMark(st, day(11)).state;
check("rating: done marks on the build day don't count", st.laterDone === 0);
const asks: boolean[] = [];
for (const d of [12, 12, 13, 14]) {
  rs = afterDoneMark(st, day(d));
  st = rs.state;
  asks.push(rs.ask);
}
check("rating: asks on the 3rd done mark on a later day, once", asks.join() === "false,false,true,false", asks);
check("rating: no done-mark ask before any build", !afterDoneMark({ builtOn: null, laterDone: 5, askedAfterDone: false }, day(20)).ask);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
