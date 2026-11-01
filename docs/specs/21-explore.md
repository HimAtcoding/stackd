# 21 · Explore: what to take for your major, at UC and Cal State

Release: v1.4. Flag: `explore` (turns on the Explore tab). Adds the first course-requirement data inside the app: UC Transfer Pathways for UC and the statewide Transfer Model Curriculum (the degree behind the AS-T and AA-T) for Cal State. Builds the course data track's step B (`docs/15`). Course matches at a specific college (step E) are not in this spec.

## Why

Students come to Stackd to find out what to take. Today the app answers that with a link to ASSIST. Two public, statewide sources answer most of it without ASSIST:

1. **UC Transfer Pathways.** For 27 majors, UC lists the course types that prepare a student for that major at every UC campus that offers it (for Computer Science: intro programming, data structures, computer organization, a year of calculus, multivariable calculus, discrete math, linear algebra, differential equations, a year of physics). Each pathway also lists which campus majors it applies to.
2. **Transfer Model Curriculum (TMC).** The statewide template behind each Associate Degree for Transfer. Completing the degree gives priority admission to the Cal State system, though not to a particular campus or major. Each requirement is named by its C-ID number, which colleges print next to matching courses in their catalogs.

Most of the courses overlap: for Computer Science, 5 of the 9 UC course types also appear in the Cal State template (physics is kept apart: UC asks for a year, the Cal State template for the first course). "Take these first, they count for both" is the most useful sentence a first-year CS student can hear, and nothing else gives it to them in one place.

## What the terms allow (course data track, step A)

Checked Oct 26, 2026. Not legal advice; this is what the pages say and how Stackd stays inside it.

| Source | What it says | What Stackd does |
|---|---|---|
| UC Admissions site ([terms of use](https://admission.universityofcalifornia.edu/terms-of-use.html)) | Content belongs to the Regents. Copyrighted material isn't reposted without permission. No general reuse grant | States the **facts** (course types, sequence lengths, which campus majors a pathway covers) **in Stackd's own words**, never UC's text, with the source and a link to the pathway page on every screen. **UC Admissions confirmed this approach on Oct 26, 2026**, in reply to Ryan's email describing it. Keep that reply; if UC ever asks for a change, the change wins |
| CCC Chancellor's Office TMC templates (public PDFs on cccco.edu) | Published for colleges building transfer degrees. No separate terms on the template | Records the template number, revision and C-ID numbers exactly (they're identifiers), names requirements in Stackd's words, and links to the template |
| ASSIST | No outside data access yet (`docs/16`, Oct 5 2026) | Unchanged: no ASSIST data in the app. "Find it at your college" links to ASSIST |

Claude Code adds this table to `docs/16-open-questions.md` as the step A record.

**Permission (confirmed Oct 26, 2026).** Ryan emailed UC Admissions describing exactly this: Transfer Pathway course expectations summarized in Stackd's own words, a link back to each pathway page with the date checked, no UC text reproduced, and no UC name or logo used to suggest endorsement. UC replied that it's fine. Claude Code records the date and the gist in `docs/16`; the reply itself stays in the Stackd inbox.

## Design plan

**Tokens.** No new tokens. Explore's section color from 16 is mint; the solid panel uses `--mint-800` because white on `--mint-600` is only 3.84:1.

| Name | Value | Role here |
|---|---|---|
| `--mint-800` | #0A6C44 | The "Your major" panel fill (white text 6.48:1), and mint text on `--mint-100` (5.48:1) |
| `--mint-600` | #12946A | Icons on `--mint-100` tiles, the "Counts for both" icon |
| `--mint-100` | #D2F3EC | Explore's header band, major icon tiles |
| `--yellow-400` | #FDC940 | "Taking now" segments on the panel bar (4.2:1 on `--mint-800`) |
| `--green-600` | #40A459 | Done tiles and segments on white, as everywhere |
| `--navy-900` | #051042 | Text |

Type: Figtree only, existing scale. C-ID numbers (COMP 122, MATH 210) are course codes, so they're the one place monospace is allowed (project rules), at `caption` size.

**Layout.** Explore is a tab. A quiet mint band holds the title and the search field. Under it, one solid mint panel for the student's own major with their progress, then the list of majors. A major opens a pushed page with UC and Cal State tabs. Each tab is a list of course types the student can mark, the campuses it applies to, and the source.

**Hierarchy.** Explore tab: the "Your major" panel. Major page: the course list.

**Self-check.** Would this plan fit any student app? A browse list with a featured card is common (Whatnot, Matter). What makes it Stackd's:
- The list items are UC and Cal State requirements for transferring.
- "Counts for both" marks the courses that serve both systems.
- C-ID numbers tell a student exactly what to look for in their own catalog.
- Every list ends with where the data came from and when a person checked it.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Whatnot categories](https://mobbin.com/screens/22fe93c8-d111-46fc-96fc-f52536f5aeb7) | Search on top, then rows with a colored icon tile, a name and one line of detail. A list you can scan, not a grid of images |
| [Matter search](https://mobbin.com/screens/99a48611-3da3-4db7-82e9-5d2a01a3fed4) | The search tab's first screen is useful before you type: your own things first, then everything |
| [Fable book status](https://mobbin.com/screens/341f0f42-6be1-4dd5-9598-519a503f331a) | One status control on an item's page (want to read, reading, read). Ours: not yet, taking now, done |
| [Goodreads progress](https://mobbin.com/screens/4ac3456e-a840-425e-8dc3-fd7acc52ac77) | Status and progress sit together near the top of the item |
| [Uxcel Go lessons](https://mobbin.com/screens/dba87d9e-9955-49be-be73-686477e601ee) | Each row: an icon tile on the left, the name, and its status on the right, with done rows checked green |
| [Realtor.com schools](https://mobbin.com/screens/e9772a5d-4e68-4e7e-9065-97f1f8cbfbf5) | A list of schools ends with a source line and "Flag this listing as inaccurate". Our source line and Report a problem follow it |
| [Deepstash no results](https://mobbin.com/screens/b537fc59-dd61-4293-bf46-70257fbac79e) | The no-results state uses the app's own illustrated character, with one plain sentence |
| [Tonal tabs](https://mobbin.com/screens/2d0bfd69-e610-48f4-adf7-8ce2ffdaed0d) | Underline tabs right under a pushed page's title, switching what the list below shows |

### Mobbin, as a standing rule

From this spec on, Mobbin is part of every build:

1. The spec lists its references, as above.
2. In its plan, Claude Code searches Mobbin for **two more references per screen** (iOS first) and lists them with links and one line each on what they show.
3. After building, it compares the screens with all references and lists differences. It **never changes the design** based on them; the differences come back to the design-spec chat, which updates the spec if one is worth taking.
4. Reference screenshots live in `docs/refs/{spec number}-{name}/` (for this spec, `docs/refs/21-explore/`, numbered in the order of the table above), so they can be opened in VS Code while building. The folder is **git-ignored**: they're other companies' screens, shown for reference only, and the repo is public. When Claude Code's own Mobbin search returns image files, it saves its extra references there too; otherwise it lists the links.
5. References shape layout, hierarchy and interaction only. Stackd keeps its own look everywhere: Figtree, the token colors, the cartoon husky, solid section panels and the container tiers. Nothing is copied from another app's art, icons or copy.

## The husky in Explore

The husky appears once per screen at most.

| Where | Art | Fallback until it exists |
|---|---|---|
| "Your major" panel, peeking in at the bottom right, bottom edge cut straight by the panel's edge | `husky-looking` (holding a map or magnifier, listed in `art-assets.md` as needed) at 112 wide | `husky-wave` at 104 wide |
| No search results | `husky-looking`, full pose, 140 wide | `husky-wave` at 140 wide |
| No major in the plan | Same as no results, with its own copy | `husky-wave` |

Add to `art-assets.md`: `husky-looking` moves from "for later" to "Need, v1.4", with these two sizes (PNG 336 × 360 bust with a straight bottom edge, and the full pose at 420 × 500, transparent).

## 1. Explore tab

```
┌ mint-100 band ──────────────────────────────┐
│ Explore                                      │  title-1 navy
│ What to take for your major, at UC and       │  body slate-700
│ Cal State.                                   │
│ [ 🔍 Search majors                        ]  │  search field (00)
└──────────────────────────────────────────────┘

┌ mint-800 panel, r-lg, shadow-lift ──────────┐
│ Your major                                   │  label white 90%
│ Computer Science                             │  title-1 white
│ ▮▮▮▮▯▯▯▯▯   4 of 9 done for UC               │  bar + label white
│ 5 also count for Cal State.        [husky]   │  body white 90%
└──────────────────────────────────────────────┘

All majors                                       title-3
[▣] Aerospace engineering            UC          row: tile 40, name, systems
[▣] Biological sciences              UC, Cal State
[▣] Computer science                 UC, Cal State
…
From UC Admissions and the CCC Chancellor's Office. How we check this
```

| Part | Spec |
|---|---|
| Band | `--mint-100`, from the physical top to 16 below the search field. Title `title-1` `--navy-900`, 8 below it the subtitle in `body` `--slate-700`, 16 below that the search field (00) on `--surface`, placeholder "Search majors". The band has no back button (it's a tab) |
| Panel | Shows when the plan has a major that Explore has data for (Data → `majors.explore_slug`). Inset 16, 16 below the band, `--mint-800`, `--r-lg`, `--shadow-lift`, padding 20, the whole panel a button opening that major's page on the UC tab (or Cal State if the plan has only Cal State schools). Pressed: #085A38 |
| Panel text | "Your major" `label` white at 90% (5.57:1). The major `title-1` white, 4 below. The bar 16 below: one segment per UC requirement, 6 tall, gap 4; done white, taking now `--yellow-400`, not yet white at 28%. Right of the bar: "{done} of {total} done for UC" `label` white. Under it, 8 below: "{n} also count for Cal State." `body` white 90%. Max text width leaves 96 for the husky |
| Husky | Bottom right, cut by the panel's bottom edge, `aria-hidden`. Not shown under 340 wide (text needs the room) |
| No major in the plan | No panel. In its place, a tier-3 ask (00): "Pick your major to see what to take." with a text button "Choose your major", opening Settings → Your plan |
| List title | "All majors" `title-3`, 24 below the panel |
| Row | Min height 64, padding 12 16, whole row a button. Icon tile 40 (`--r-sm`, `--mint-100`, icon 22 duotone `--mint-600`, from a code map by slug, `lib/explore-icons.ts`, fallback `GraduationCap`). Name `row-title` `--navy-900`. Second line `caption` `--slate-600`: "UC and Cal State", "UC" or "Cal State", by which pathways exist. No chevron, no dividers; rows 4 apart |
| Only verified majors | A major shows only when every row behind it is verified. No empty or "coming soon" majors |
| Footer | `caption` `--slate-600`, 24 below the list: "From UC Admissions and the California Community Colleges Chancellor's Office." Then a link line (18) "How we check this" opening `/about/data/` (2) |

**Search.** Filters the list as you type, matching the name and a few plain synonyms kept with the icon map ("cs", "coding" → Computer science; "bio" → Biological sciences; "business" → Business administration). The panel hides while the field has text. No results:

```
        [husky-looking]
   No majors match "nursing" yet.
   Explore has {n} majors so far. Your
   counselor or ASSIST can help with others.
   ↗ Open ASSIST
     assist.org
```

Headline `title-3`, body `body` `--slate-700`, centered, then a link line. "Yet" is honest: more majors come with more data.

## 2. Major page

Route `/explore/major/?slug=computer-science&tab=uc`. Pushed screen with the mint band (16 → Header band).

```
┌ mint-100 band ──────────────────────────────┐
│ ‹                                            │
│ Computer science                             │  title-1
│ What to take before you transfer.            │  body slate-700
│  UC        Cal State                         │  UnderlineTabs
└──────────────────────────────────────────────┘
 4 of 9 done                         segmented bar, full width
 ▮▮▮▮▯▯▯▯▯

 [✓] Intro to programming                       row: status tile 40
     One course. Counts for both ⊕
 [◔] Data structures
     One course, after intro. Counts for both ⊕
 [∑] Single-variable calculus
     A one-year sequence. Counts for both ⊕
 …

 ↗ Find these at Las Positas
   Your 2026-27 agreement on assist.org

 Campuses that use this pathway (9)             title-3
 Berkeley              Computer Science, B.A.
 Davis                 Computer Science, B.S.
 …
 Santa Cruz            Computer Science, B.A. and B.S.,
                       and 4 more

 From UC Admissions, Computer Science
 Transfer Pathway. Checked Oct 27, 2026.
 ↗ Open UC's pathway page
   admission.universityofcalifornia.edu
 Report a problem
```

| Part | Spec |
|---|---|
| Tabs | "UC" and "Cal State", only the ones the major has. With one, no tabs; the title line says which ("Cal State degree for transfer" under the title). Switching tabs replaces the list with no slide; the URL's `tab` follows |
| Progress | 16 under the band, inset 24: "{done} of {total} done" `label` `--navy-900`, then the existing `SegmentedBar` (green done, `--blue-100` not yet) 8 below. Taking now shows in the count's sentence only: "4 of 9 done, 1 taking now" |
| Requirement row | Min height 64, padding 12 24. Left: the status tile (below). Text: name `row-title` `--navy-900`, up to 2 lines; second line `caption` `--slate-600` with how many ("One course", "A one-year sequence", "One of 3 options") and, when the course type is in both systems, `Intersect` bold 14 `--mint-600` + "Counts for both". The row's text opens the requirement sheet (3) |
| Status tile | 40, `--r-sm`, hit area 44, `role="checkbox"`. Not yet: `--mint-100` with the course type's icon (code map by topic: `Code`, `TreeStructure`, `Cpu`, `Function`, `MathOperations`, `Atom` …) in `--mint-600`. Taking now: `--tint-sky` with `HourglassMedium` `--blue-600`. Done: `--green-600` with a white `Check`, like step tiles (16). A tap toggles Done (from either other state) with the step burst (16 → Small rewards); "Taking now" is set in the sheet. Toast "Marked done" with Undo |
| Find at your college (UC tab) | A link line (18). With an agreement link in the plan for this campus and major: "Find these at {college short name}" / "Your {year} agreement on assist.org", opening that exact URL. Without: "Find these at your college" / "assist.org". Never a list of college courses (step E) |
| Find at your college (Cal State tab) | One sentence in `body` `--slate-700`: "Your college's catalog shows the C-ID number next to each matching course." Then a link line "See which Cal State majors match" / "adegreewithaguarantee.com" (the site Cal State points students to) |
| Campuses (UC tab) | "Campuses that use this pathway ({n})" `title-3`, 32 below the link line. Rows 48 min, padding 8 24, two columns: campus short name `row-title`, its major names `body` `--slate-700` (up to 2 lines, then "and {n} more", tapping the row expands it). A campus in the student's plan gets `Star` fill 16 `--yellow-400` before its name and moves to the top. Not tappable otherwise in v1.4 |
| About the degree (Cal State tab) | In place of campuses: "What this degree does" `title-3`, then in `body` `--navy-900`: "Finish this degree at your college and you get priority admission to Cal State. That's the system, not a specific campus or major: if your first choice is full, you may be offered another campus. If you're admitted to a similar major, you can finish the bachelor's in about 60 more units." Then "{total} units in the major, {max} units total." `caption` `--slate-600`. Wording checked against [Cal State's ADT page](https://calstate.edu/apply/transfer/pages/ccc-associate-degree-for-transfer.aspx) on Oct 26, 2026 |
| Source block | 32 below, inset 24. "From {source}, {pathway or template name}. Checked {date}." `caption` `--slate-600` (template: "Transfer Model Curriculum #2007, revision 3"). Link line to the source page or PDF. Then a text button "Report a problem" (`caption` size, `--blue-700`), a mailto to joinstackd@gmail.com with the major, tab and the row codes in the body |
| Demo or unverified | Never shown. A major with any unverified row isn't listed (1) |

## 3. Requirement sheet

Bottom sheet (00) from a requirement row.

```
[tile] Single-variable calculus                  tile 40 + title-2
A one-year calculus sequence for science and     body slate-700
engineering majors, two semesters or three
quarters.

Counts for both                                  headline
⊕ Also in the Cal State degree as
  MATH 210 and MATH 220, or MATH 211 and          C-ID in monospace caption
  MATH 221, or MATH 900S.

Your status                                      headline
[ Not yet | Taking now | Done ]                  segmented control

↗ Find it at Las Positas
  Your 2026-27 agreement on assist.org
```

| Part | Spec |
|---|---|
| Header | Status tile at 40 (same states), 12 gap, name `title-2` |
| What it is | `body` `--slate-700`, 8 below: Stackd's plain description (from the data file, our words) |
| Options (Cal State rows with alternatives) | "Pick one" `headline`, then each option as a line: its name in `body` and its C-ID numbers in monospace `caption` `--slate-600`, with its units |
| Counts for both | Only when the topic is in both pathways. On the UC sheet it names the Cal State C-ID numbers; on the Cal State sheet it names the UC course type |
| Your status | The segmented control (00), three segments, 44 tall. Changing it saves at once and updates the row, the bar and the Explore panel. "Done" plays the burst on the sheet's tile |
| Link line | As on the page (2). The Cal State sheet uses the catalog sentence instead |

**One status per course type.** Status is stored per topic (Data), so marking "Intro to programming" done on the UC tab also shows done on the Cal State tab's COMP 122 row. The student marks a course once.

## 4. How we check this

A short static page, `/about/data/`, also on the website. Plain copy:

- Where Explore's data comes from (UC Transfer Pathways, the Transfer Model Curriculum templates), with links.
- That every row is written in Stackd's words from the official page, then checked by a person against that page before it shows, with the date checked on each major.
- That Stackd isn't affiliated with UC, Cal State, the community colleges or ASSIST (the line from `06`), and that the official pages win if they disagree.
- That requirements change every August, and Stackd rechecks them then.
- "Report a problem" (mailto).

Settings → About gets a link to it too.

## 5. Elsewhere in the app

| Where | Change |
|---|---|
| Tab bar | Explore turns on (`explore: true` at release) |
| University page, Requirements tab (03, real accounts) | Under the official agreement card, a link line "See what to take for {major}" / "Explore", opening the major page on the UC or Cal State tab, when the plan's major has Explore data |
| Home | No change in v1.4 |

## Data

### Migration (`supabase/migrations/2026xxxxxxxxxx_explore.sql`)

Every academic table uses the same provenance columns and `protect_verified` trigger as `institutions`, `majors` and `requirements` (`source_name`, `source_url`, `academic_year`, `retrieved_at`, `verified_at`, `is_demo`, timestamps), and can be reopened with `npm run import:reopen`.

| Table | Columns (beyond provenance) | Notes |
|---|---|---|
| `pathways` | `id`, `slug` (computer-science), `kind` (`uc_pathway` or `tmc`), `name` (our words), `code` (TMC number, null for UC), `revision`, `degree_name` (for TMC: "Associate in Science in Computer Science for Transfer"), `major_units`, `total_units`, `effective_term` (null or `fall-2027`, the same format as `cycle` elsewhere) | `unique (slug, kind)`. Explore's majors are the distinct slugs |
| `pathway_requirements` | `id`, `pathway_id`, `code` (stable within the pathway), `sort`, `topic` (shared key across pathways, e.g. `cs1`, `calculus-single`), `name`, `description`, `how_many`, `units`, `c_id text[]` (a one-course TMC row's C-ID numbers; empty for UC rows and pick-one rows), `options` (jsonb list of `{ label, c_id: [..], units }`, empty for one-course rows) | `unique (pathway_id, code)`; `sort` and `topic` unique within the pathway. A row has `c_id` or `options`, not both. `c_id` values match `^[A-Z]{2,5} \d{3}[A-Z]?$` |
| `pathway_campuses` | `id`, `pathway_id`, `institution_id`, `major_names text[]` | UC pathways only. Needs the 9 UC campuses in `institutions` (names, city, website: added through the planning import) |
| `majors.explore_slug` | New nullable column | Links a plan's major (UC San Diego Computer Science B.S.) to Explore's `computer-science` |
| `user_topic_status` | `user_id`, `topic`, `status progress_status`, `updated_at`; primary key `(user_id, topic)` | Owner-only row-level security like the other per-student tables; deleted by `delete_my_account()` |

Public read (anon and authenticated) on the three academic tables, verified rows only, like `piq_prompts`.

"Counts for both" isn't stored: it's computed as "this topic appears in both the UC pathway and the TMC with the same slug." Because topics are set by a person and verified, the claim is only as strong as that check, which is why the review report lists each shared topic side by side.

### Data files and pipeline

- `data/raw/explore/computer-science.json`: the UC pathway, the TMC, their requirements and the 9 campus rows. Claude Code drafts it **in Stackd's own words** from the UC pathway page and the current TMC template, with `retrieved_at` empty and `TODO` where a person must confirm.
- Ryan checks every row against the two sources, fills `retrieved_at`, and runs the import as with deadlines and essays: `npm run import -- data/raw/explore/computer-science.json --dry-run`, the real import, the review CSV's `checked_by` and `checked_at`, then `npm run import:verify`.
- The review report adds one table per major: each `topic` with its UC row and its Cal State row next to each other, so the "Counts for both" pairs are checked on purpose.
- **Version check:** the TMC template used must be the current one on cccco.edu (Computer Science is template #2007; confirm the latest revision before import, since Cal-GETC changed GE in 2025). Checked 2026-10-31: Rev. 3 (10/14/16), with `source_url` the PDF the templates page links, https://www.cccco.edu/-/media/CCCCO-Website/docs/template/tmc-computersci-rev-3-a11y.pdf. The current Cal-GETC ADT form lists the same courses (it shows "28-29*" without explaining it; `major_units` is 28, shown as "at least 28 units in the major"). The templates page labels the files "Rev 1: 10/14/2016"; the files say Rev. 3.
- **Physics topics:** UC's year of physics is `physics-year`; the TMC's PHYS 205 row is `physics-mechanics`. They don't count for both. The UC row's description says Cal State's degree asks for the first course of the sequence too.

**Batches.**

| Batch | What | Why this order |
|---|---|---|
| 1 (this release) | **Every California public college and university as a school**: all 116 community colleges (including Calbright), all Cal State universities, and the 9 UC campuses, with name, city, website and system, from the official system lists. Plus **Computer Science, end to end** (the UC pathway, the TMC, the campus rows) | School names are cheap facts and let a student at any community college pick their college in onboarding and Settings. Computer Science proves the data format, the import and the checking before it's repeated 26 times |
| 2 (next, right after batch 1 passes a TestFlight round) | The other 26 UC Transfer Pathways, each with its TMC where one exists, plus TMCs that have no UC pathway (Cal State only majors) | Same file format and checks as Computer Science. Roughly 20 to 30 minutes of checking per major |
| Later | Which Cal State campuses accept each transfer degree as a similar major; course matches at each college (step E) | Needs a structured source (step E or Cal State's own data) |

Because Transfer Pathways and TMCs are statewide, batch 2 covers students at **every** community college at once: there's no per-college requirement data to add. What stays per college is only which local course matches each requirement, and that's still ASSIST's job ("Find these at your college").

**School lists and sources.** `data/raw/planning/california-institutions.json`: the community colleges from the CCC Chancellor's Office college directory (116 colleges as of Oct 2026), Cal State from calstate.edu's campus list (22 universities; Cal Maritime is integrating into Cal Poly San Luis Obispo in fall 2026, so follow how calstate.edu lists it on the day of the check), and the 9 UC campuses from universityofcalifornia.edu. Each row has its source URL; Ryan spot-checks 10 community colleges plus every UC and Cal State row before verifying. `data/raw/planning/computer-science-majors.json` adds a Computer Science major at every UC campus in the pathway (its campus majors) and every Cal State campus (from the campus catalogs), each with `explore_slug` `computer-science`, so onboarding's major step has a real major at each. Explore lists only majors with data, so adding schools never adds empty majors.

## Building it

| PR | Contains | Risk |
|---|---|---|
| A | The migration, the import and review-report changes, `data/raw/planning/california-institutions.json` (all 116 community colleges, the Cal State universities, the 9 UCs), `data/raw/explore/computer-science.json` drafted with TODOs, the `docs/16` record, `art-assets.md`, and a check that onboarding's and Settings' college and school pickers search well with 116+ entries | Migration and data: branch and PR. Ryan pushes the migration, checks the files, runs the imports |
| B | Screens 1–5, behind `explore`, built against the verified Computer Science data (or the local demo seed in development) | App only |

## Test

- Explore tab with a plan of Las Positas → UC San Diego, Computer Science: the mint band, the solid panel with "Computer Science", "0 of 9 done for UC", "5 also count for Cal State.", the husky (or `husky-wave`) at the bottom right; then "All majors" with Computer science, "UC and Cal State".
- Plan without a major: no panel; the "Pick your major" ask opens Settings → Your plan.
- Search "cs": Computer science only, panel hidden. Search "nursing": the husky, "No majors match "nursing" yet.", and the ASSIST link line.
- Open Computer science: UC tab, 9 rows in the pathway's order, 5 with "Counts for both" (not physics), the agreement link line names Las Positas and 2026-27, 9 campus rows with UC San Diego starred at the top, the source block with the checked date and Report a problem.
- Tap the calculus tile: green with a check, the burst, "1 of 9 done", toast with Undo. Switch to Cal State: the calculus row (MATH 210 …) shows done too.
- Open the Data structures sheet, set Taking now: the tile turns sky with an hourglass; the count reads "1 of 9 done, 1 taking now"; on Explore the panel's bar shows one yellow segment.
- Cal State tab: COMP 122, 132, 142, 152 in monospace in the sheets; the calculus row says "One of 3 options" and its sheet lists the three with C-ID numbers and units; "What this degree does" and the unit totals; the source block names template #2007 and its revision.
- A row set back to unverified (`import:reopen`): Computer science disappears from the list.
- Another student can't read this student's `user_topic_status` (test:db). Delete account removes it.
- University page → Requirements for UC San Diego: "See what to take for Computer Science" opens the major page.
- `/about/data/` opens from the footer, from Settings → About, and on the website.
- At 320 wide: no husky on the panel, rows wrap to 2 lines, campus major names wrap.
- Onboarding and Settings: typing "diablo" in the college picker finds Diablo Valley College among 116; typing "cal poly" in the school picker finds the 3 Cal Poly campuses (Humboldt, Pomona, San Luis Obispo), since calstate.edu now lists Cal Poly Humboldt by that name. The list scrolls smoothly at 320 wide.
- A student at a college other than Las Positas sees the Computer Science UC tab with "Find these at your college" / "assist.org" (no agreement link for their pair yet).
- Reduced motion: no burst; colors still change.

## Additions to 00

| Addition | Value |
|---|---|
| Component: requirement row | As in 2 |
| Component: status tile (3 states) | As in 2; the step tile gains the "taking now" state |
| Pattern: source block with Report a problem | As in 2; use it under every list of facts from now on |
| Rule: Mobbin references | As in "Mobbin, as a standing rule" |
