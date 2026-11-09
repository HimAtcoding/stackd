// Checks lib/opportunities.ts, Explore's Still needed, and Remind me's reminders (22), with made-up opportunities and a
// fixed clock. `npm run test:opportunities`
import { buildMajors, majorDetail, stillNeeded, type ExploreRecords, type Statuses } from "../lib/explore";
import {
  applyLine,
  datePill,
  detailLine,
  feedGroups,
  fits,
  forYou,
  goodPills,
  isOpen,
  majorNamer,
  pacificToday,
  reminderDays,
  reminderToast,
  sourceSentence,
  tileStatus,
  whoItsFor,
  type Opportunity,
  type Student,
} from "../lib/opportunities";
import { opportunityReminderItems } from "../lib/reminders/opportunities";
import { planReminders } from "../lib/reminders/schedule";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failed++;
  console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : JSON.stringify(detail));
}

const base: Opportunity = {
  id: "x",
  slug: "x",
  kind: "research",
  title: "Test research",
  org_name: "Test University",
  summary: "Made up.",
  who_for: [],
  wants: [],
  offers: [],
  audience: "community_college",
  major_slugs: [],
  systems: [],
  terms: [],
  deadline: null,
  starts_on: null,
  ends_on: null,
  location: null,
  online: false,
  cost: "paid",
  url: "https://example.org/apply",
  source_name: "Test University",
  source_url: "https://example.org",
  verified_at: "2026-11-08T00:00:00+00:00",
};
const opp = (slug: string, more: Partial<Opportunity> = {}): Opportunity => ({ ...base, id: slug, slug, title: slug, ...more });

const cs: Student = { majorSlug: "computer-science", majorName: "Computer Science", schools: [{ name: "UC San Diego", system: "UC" }], term: "fall-2027" };
const noPlan: Student = { majorSlug: null, majorName: null, schools: [], term: null };
const names = majorNamer({ "computer-science": "Computer Science", mathematics: "Mathematics", "biological-sciences": "Biological Sciences" });

// Pacific day
check("Pacific today, before midnight Pacific", pacificToday(new Date("2026-11-09T07:30:00Z")) === "2026-11-08");
check("…and after it", pacificToday(new Date("2026-11-09T08:30:00Z")) === "2026-11-09");
const today = "2026-11-08";
check("open on its deadline day", isOpen(opp("a", { deadline: "2026-11-08" }), today));
check("gone the day after", !isOpen(opp("a", { deadline: "2026-11-07" }), today));
check("rolling is always open", isOpen(opp("a"), today));

// Who it's for (22 → 5)
const rows = whoItsFor(opp("a", { major_slugs: ["computer-science", "mathematics"], who_for: ["GPA 3.0 or higher"] }), cs, names);
check("college type and major are checked against the student",
  rows[0].state === "met" && rows[0].text === "California community college students" && rows[1].state === "met" && rows[1].text === "Computer Science or Mathematics majors (you: Computer Science)",
  rows);
check("GPA is left to the student", rows[2].state === "check" && rows[2].text === "GPA 3.0 or higher", rows[2]);
const bio = opp("bio", { major_slugs: ["biological-sciences"] });
check("a biology-only opportunity doesn't fit a CS student", !fits(bio, cs));
check("…and says why, without a cross", whoItsFor(bio, cs, names)[1].text === "For Biological Sciences majors; your major is Computer Science");
check("with no major in the plan it's shown, marked check yourself", fits(bio, noPlan) && whoItsFor(bio, noPlan, names)[1].state === "check");
const admitted = opp("adm", { audience: "admitted_transfer" });
check("admitted-transfer programs don't fit anyone in Stackd yet", !fits(admitted, cs) && whoItsFor(admitted, cs, names)[0].text === "For admitted transfers; you're at a community college");
check("audience any adds no row", whoItsFor(opp("any", { audience: "any" }), cs, names).length === 0);
const csuOnly = opp("csu", { systems: ["CSU"] });
check("a Cal State-only program doesn't fit a UC-only plan", !fits(csuOnly, cs) && /your plan has none/.test(whoItsFor(csuOnly, cs, names)[1].text));
check("a UC program fits, naming the school", whoItsFor(opp("uc", { systems: ["UC", "CSU"] }), cs, names)[1].text === "Transferring to UC or Cal State (you: UC San Diego)");
check("no schools in the plan: check yourself", fits(csuOnly, noPlan));
check("a term that matches", whoItsFor(opp("t", { terms: ["fall-2027"] }), cs, names)[1].text === "Transferring fall 2027 (you: fall 2027)");
check("a term that doesn't", !fits(opp("t", { terms: ["fall-2028"] }), cs));
check("no term in the plan: shown", fits(opp("t", { terms: ["fall-2028"] }), noPlan));

// Opportunities for you, and the feed (22 → 3, 4)
const all = [
  opp("later", { deadline: "2027-02-01" }),
  opp("soon", { deadline: "2026-11-18" }),
  opp("past", { deadline: "2026-11-07" }),
  opp("rolling"),
  bio,
  opp("sooner", { deadline: "2026-11-10", kind: "scholarship" }),
];
check("for you: the 3 soonest that fit, past and biology left out", forYou(all, cs, today, 3).map((o) => o.slug).join() === "sooner,soon,later", forYou(all, cs, today, 3).map((o) => o.slug));
check("for you on the hub: just the soonest (23)", forYou(all, cs, today).map((o) => o.slug).join() === "sooner", forYou(all, cs, today).map((o) => o.slug));
// The card's pills (23 → Opportunity card)
const pill = (o: Opportunity) => datePill(o, today);
check("date pill: 14 days is due", JSON.stringify(pill(opp("p", { deadline: "2026-11-22" }))) === JSON.stringify({ variant: "due", text: "Nov 22, 14 days left" }), pill(opp("p", { deadline: "2026-11-22" })));
check("date pill: 15 to 60 days is soon", pill(opp("p", { deadline: "2026-11-23" })).variant === "soon" && pill(opp("p", { deadline: "2027-01-07" })).variant === "soon");
check("date pill: beyond 60 days is neutral", pill(opp("p", { deadline: "2027-01-08" })).variant === "neutral");
check("date pill: 1 day left, and the last day", pill(opp("p", { deadline: "2026-11-09" })).text === "Nov 9, 1 day left" && pill(opp("p", { deadline: "2026-11-08" })).text === "Nov 8, last day");
check("date pill: an event shows its dates", pill(opp("e", { kind: "event", starts_on: "2027-02-12", ends_on: "2027-02-14" })).text === "Feb 12 to 14" && pill(opp("e", { kind: "event", starts_on: "2027-02-28", ends_on: "2027-03-02" })).text === "Feb 28 to Mar 2", pill(opp("e", { kind: "event", starts_on: "2027-02-28", ends_on: "2027-03-02" })));
check("date pill: no deadline is Rolling", JSON.stringify(pill(opp("r"))) === JSON.stringify({ variant: "neutral", text: "Rolling" }));
check("good pills: cost then Fits you, at most two", goodPills(opp("g", { cost: "free" }), true).join() === "Free,Fits you" && goodPills(opp("g", { cost: "fee" }), true).join() === "Fits you" && goodPills(opp("g"), false).join() === "Paid");
const groups = feedGroups(all, { kind: null, fitsOnly: true, student: cs, today });
check("feed groups: Closing soon, Open, Rolling", groups.map((g) => `${g.title}:${g.rows.map((o) => o.slug).join("+")}`).join() === "Closing soon:sooner+soon,Open:later,Rolling:rolling", groups);
check("10 days out is closing soon with a coral tile", tileStatus(opp("s", { deadline: "2026-11-18" }), today) === "soon");
check("14 days is still soon, 15 is open", tileStatus(opp("s", { deadline: "2026-11-22" }), today) === "soon" && tileStatus(opp("s", { deadline: "2026-11-23" }), today) === "open");
check("Fits me off shows every open one, biology too", feedGroups(all, { kind: null, fitsOnly: false, student: cs, today }).flatMap((g) => g.rows).some((o) => o.slug === "bio"));
check("a kind chip shows only that kind", feedGroups(all, { kind: "scholarship", fitsOnly: true, student: cs, today }).flatMap((g) => g.rows).map((o) => o.slug).join() === "sooner");
check("empty groups are left out", feedGroups([opp("rolling")], { kind: null, fitsOnly: true, student: cs, today }).length === 1);
check("nothing that fits: no groups", feedGroups([bio], { kind: null, fitsOnly: true, student: cs, today }).length === 0);

// Words
check("apply line", applyLine(opp("a", { deadline: "2026-11-20" })) === "Apply by Nov 20, 2026" && applyLine(opp("a")) === "Open now, no deadline");
check("detail line: kind, cost, where", detailLine(opp("a", { location: "Davis" })) === "Research, paid, Davis" && detailLine(opp("a", { online: true, cost: "fee", kind: "event" })) === "Event, has a fee, Online");
check("source sentence", sourceSentence(opp("a")) === "From Test University, checked Nov 8, 2026.", sourceSentence(opp("a")));
check("an unknown major slug reads as words", names("data-science") === "Data Science");

// Remind me: 7 days and 1 day before, at 9 a.m., only those still ahead
const now = new Date(2026, 10, 8, 12);
check("two reminders for Nov 20", reminderDays("2026-11-20", now).join() === "2026-11-13,2026-11-19", reminderDays("2026-11-20", now));
check("the toast names both", reminderToast(reminderDays("2026-11-20", now)) === "Reminder set for Nov 13 and Nov 19.");
check("only the day-before one when the week is gone", reminderDays("2026-11-12", now).join() === "2026-11-11");
check("none when it's due tomorrow and 9 a.m. today has passed", reminderDays("2026-11-09", now).length === 0);
const planned = planReminders(opportunityReminderItems([{ slug: "sum", title: "Summer research", deadline: "2026-11-20" }], now), now);
check("the scheduler plans both at 9 a.m.", planned.length === 2 && planned.every((p) => p.at.getHours() === 9) && planned[0].at.getDate() === 13 && planned[1].at.getDate() === 19, planned);
check("tapping one opens the opportunity", planned.every((p) => p.deadlineId === "opportunity:sum"));
check("the notification names it", planned[0].title === "Summer research due in 7 days", planned[0].title);
check("a past opportunity is never scheduled", opportunityReminderItems([{ slug: "old", title: "Old", deadline: "2026-11-01" }], now).length === 0);

// Explore's Still needed and major rows
const path = (id: string, kind: "uc_pathway" | "tmc", topics: string[]) => ({
  pathway: { id, slug: "computer-science", kind, name: "Computer Science", code: kind === "tmc" ? "2007" : null, revision: null, major_units: null, total_units: null, source_name: "S", source_url: "https://x", verified_at: null },
  reqs: topics.map((t, i) => ({ id: `${id}-${t}`, pathway_id: id, code: t, sort: i + 1, topic: t, name: t, description: "", how_many: "One course", units: null, c_id: [], options: [] })),
});
const uc = path("uc", "uc_pathway", ["cs1", "cs2", "org", "calc", "multi", "discrete", "linear", "diffeq", "physics"]);
const tmc = path("tmc", "tmc", ["cs1", "cs2"]);
const recs: ExploreRecords = {
  pathways: [uc.pathway, tmc.pathway],
  requirements: [...uc.reqs, ...tmc.reqs],
  campuses: ["a", "b", "c"].map((c) => ({ pathway_id: "uc", major_names: ["CS"], institution: { id: c, slug: c, name: c } })),
};
const [major] = buildMajors(recs);
const statuses: Statuses = { cs1: "done", calc: "done", cs2: "in_progress" };
const needed = stillNeeded(major.uc!, statuses);
check("Still needed: taking now first, then not yet in order, 4 at most", needed.map((r) => r.topic).join() === "cs2,org,multi,discrete", needed.map((r) => r.topic));
check("all done: nothing still needed", stillNeeded(major.uc!, Object.fromEntries(uc.reqs.map((r) => [r.topic, "done" as const]))).length === 0);
check("major detail with both systems", majorDetail(major) === "3 UC campuses, 2 count for UC and Cal State", majorDetail(major));
check("Cal State only", majorDetail({ ...major, uc: null }) === "Cal State only");
check("UC only", majorDetail({ ...major, calState: null }) === "3 UC campuses");

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
