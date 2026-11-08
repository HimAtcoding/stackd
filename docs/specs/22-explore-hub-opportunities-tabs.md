# 22 · Floating tab bar, school tiles, Explore hub and Opportunities

Release: v1.4, with 21. Flags: `explore` (Explore and Opportunities), and the tab bar change ships to everyone. Builds on 21; where they disagree, this spec wins.

## Why

Three things from the Nov 7 review of 21's screens:

1. **Explore's bottom half is empty and its rows are generic.** One major row with a pale icon tile, a grey subtitle and a faint footer is the "any app" look. Explore should show what's next for *you*: the courses you still need and the opportunities open to you now, then the majors.
2. **Students need more than courses.** Research programs, scholarships, competitions and transfer events, with deadlines and what they look for, are scattered across program sites and Instagram posts. Stackd collects them **in its own words, linked to the official page**. It never copies posts from Instagram or anywhere else: that breaks those platforms' terms and the posters' copyright, and Apple rejects apps that republish other people's content.
3. **The full-width tab bar looks dated.** Current iOS apps use a floating capsule.

School logos are trademarks, so Stackd doesn't use them. Each school gets a **monogram tile** instead ("UCSD", "SJSU", "LPC"), colored by system, so the color tells you something.

## Design plan

**Tokens.** One new color.

| Name | Value | Role here |
|---|---|---|
| `--blue-700` | #0252D1 | UC monogram tiles (white text 6.71:1), active tab icon and label |
| `--amber-800` | #8A5600 (new) | Cal State monogram tiles (white text 6.16:1), small amber text on `--yellow-50` |
| `--slate-700` | #3F4A6E | Community college monogram tiles (white text 8.69:1) |
| `--yellow-50` | #FFF6D6 | Opportunities band (16 → Events) |
| `--coral-700` | #B8361B | Deadline tiles 14 days or less (18), unchanged |
| `--surface` | #FAFCFE | Tab bar capsule |

Contrast: navy on `--yellow-50` 16.74:1; `--slate-700` on `--yellow-50` 8.03:1. `--amber-700` on `--yellow-50` is only 4.11:1, so small text there uses `--amber-800`.

Type: Figtree, existing scale. Monograms: weight 800, tracking 0, 15 for 2–3 letters, 12 for 4–5; nothing below 12. (At 13, 4–5 letters overflowed the first 40-wide tile: "UCSD" is 42 at 13 and "CSUSM" 46. The tile is now 48 wide: "MTSAC", the widest, is 43 at 12.)

**Layout.** Tabs float 12 above the safe area in a capsule. Explore reads top to bottom: band and search, your major, what you still need, opportunities for you, then all majors, with one source line at the very bottom.

**Hierarchy.** Explore: still the "Your major" panel. Opportunities feed: the deadline tiles. Opportunity page: the "Open the official page" button.

**Self-check.** A floating tab bar and a feed of cards fit any app. What makes these Stackd's:
- the feed is sorted by **deadline**, with the same date tiles as Deadlines
- "Who it's for" checks each requirement against **your** college, major and transfer term
- school tiles are colored by system (UC, Cal State, community college)
- every opportunity ends with its source and the date a person checked it

## Mobbin references

Saved to `docs/refs/22-explore-hub/` (git-ignored), numbered in this order.

| Screen | What it grounds |
|---|---|
| [Waymo tab bar](https://mobbin.com/screens/209d586d-c74b-476b-883f-50b5d26c6a78) | Floating capsule with a grey pill behind the active tab, icon over label |
| [GitHub tab bar](https://mobbin.com/screens/65ea599a-0c4d-434c-8e8f-6cd881ecf8f8) | Four tabs in a floating capsule; active tab in the brand color on a neutral pill |
| [Reddit tab bar](https://mobbin.com/screens/74b6fa80-afd8-4dc1-8943-7cc5567fa633) | A narrower capsule when there are only three tabs |
| [SCMP agenda](https://mobbin.com/screens/b9992a3c-b16d-4d63-8c95-5665fade5f4b) | A list of upcoming items, each led by a date tile (day over month) |
| [LinkedIn events](https://mobbin.com/screens/7f173882-7d43-4fe7-b4f0-f07f4a68738e) | A short "Events" section on a hub page with "Show all" |
| [Handshake fit](https://mobbin.com/screens/55662361-2d29-4c48-9eea-2eff7e407b82) | "You're a great fit": each requirement checked against your profile, plus "Apply externally" |
| [Glassdoor qualifications](https://mobbin.com/screens/921438d0-7396-4229-b2c8-c77da85b000d) | What they're looking for as a checklist near the top of the page |
| [LinkedIn job](https://mobbin.com/screens/ea460ab2-8032-4f22-8916-02a218179898) | Organization, title and an external apply button above the description |

Mobbin standing rule (21) applies: two more references per screen in the plan, saved to the same folder.

## 1. Floating tab bar

Replaces the full-width tab bar everywhere.

```
                                              (page scrolls under it)
      ┌──────────────────────────────────────┐
      │ (⌂ Home) ( ◎ Explore)  ✎ Essays  ☺ You │   capsule, 64 tall
      └──────────────────────────────────────┘
                     12 + safe area
```

| Part | Spec |
|---|---|
| Tabs in v1.4 | **Home** (`House`), **Explore** (`Compass`, with `explore` on), **Essays** (`PencilLine`, with `essays` on; opens `/essays/`), **You** (`UserCircle`; opens Settings). A tab shows only when its screen is on. Plan replaces Essays with spec 23, and Community is added with spec 24 |
| Capsule | Centered, inset 16 from each side (max width 420), 64 tall, `--r-full`, `--surface` at 92% with a 20 px background blur, 1 px `--border`, `--shadow-float`. Sits 12 above the bottom safe area. Without blur support, solid `--surface` |
| Tab | Equal widths. Icon 24 over label `type-tab`, 4 apart. Inactive: icon regular, `--slate-600`. Active: icon fill, `--blue-700`, label `--blue-700`, on a pill `--surface-pressed` that fills the tab minus 6 on each side, `--r-full`. The pill slides between tabs over 200 ms (instant under reduced motion) |
| Hit area | The whole tab, at least 44 tall. `nav` with `aria-label="Main"`, `aria-current="page"` on the active tab |
| Page padding | Every tab screen's bottom padding grows to 64 + 12 + safe area + 16, so the last row scrolls clear of the capsule |
| Pushed screens | No tab bar (as now) |
| Tab roots | Essays and Settings are tabs now: no back button, the title 24 under the safe area (00 → Section band, on a tab), and the bar shows. Their own pushed screens (the essay editor, onboarding's edit steps) stay pushed with no bar. Home's gear goes away: You is Settings. Demo mode has only Home, so no bar |

## 2. School tiles

A monogram tile replaces the generic icon wherever a school is listed: onboarding's college and school steps, Settings → Your plan, Explore's campus rows (21), and the university page header.

| Part | Spec |
|---|---|
| Tile | 48 wide and 40 tall everywhere, so the names after it line up in every list; `--r-sm`, solid fill by system: UC `--blue-700`, Cal State `--amber-800`, community college `--slate-700`. White letters, centered. (Drafted as 40 × 40, and 32 in compact rows; neither holds 4–5 letters at 12) |
| Where | Onboarding's college and school rows: the choice circle, then the tile, then the name. Settings → Your plan: the College row's tile before its value, and the Schools row's first 2 tiles, 4 apart, before "{n} schools"; under 375 wide Settings shows no tiles, because "Las Positas College" and "2 schools" don't fit beside them. Explore's campus rows: the tile in its own 48 column before the campus name (a campus without an abbreviation leaves it empty, so names line up). University page: the tile left of the name, on its first line |
| No abbreviation | No tile; the row looks as it did before. Behind the `explore` flag with the rest of Explore |
| Letters | The school's `abbreviation` (Data): "UCSD", "UCLA", "SJSU", "SLO", "LPC", "DVC". Never a logo, seal or mascot |
| Accessibility | `aria-hidden`; the row's name carries it |
| Search | The school pickers also match the abbreviation: "sjsu", "slo", "ucsd" |

## 3. Explore hub

Replaces 21's layout below the panel.

```
 [band: Explore, subtitle, search]
 [Your major panel, as 21]

 Still needed for UC                 See all 9       title-3 / text button
 [◔] Data structures (CS 2)          Taking now      compact rows
 [ ] Multivariable calculus
 [ ] Linear algebra
 [ ] Differential equations

 Opportunities for you               See all         title-3 / text button
 ┌──┐ NSF research program at UC Davis
 │DEC│ For CS and math transfer students
 │ 1 │
 └──┘
 ┌──┐ …
 Majors (9)                                          title-3
 [</>] Computer Science      ▮▮▯▯▯▯▯▯▯  2 of 9 for UC
 [∑ ]  Mathematics           12 UC campuses, 2 count for both
 …
 From UC Admissions and the CCC Chancellor's Office. How we check this
```

| Part | Spec |
|---|---|
| Still needed | Shows when the panel shows. Title "Still needed for UC" (or "for Cal State" when the plan has only Cal State schools), with "See all {n}" opening the major page. Up to 4 rows: taking-now first, then not-yet in pathway order. Row: status tile 32 (21's three states), name `row-title`, and "Taking now" `caption` `--blue-700` on the right when it applies. Tapping a row opens 21's requirement sheet. When everything is done: one line "Every UC course for Computer Science is marked done." in `body` `--slate-700` |
| Opportunities for you | Up to 3 open opportunities that match the student (5), soonest deadline first. Row: 18's date tile (deadline: coral at 14 days or less, the open look before that; "Rolling" tile when there's none: `--surface`, 1 px `--border-strong`, `Infinity` bold 24 `--slate-600`), title `row-title`, second line `caption` `--slate-600` with the organization, third line "For {who}" in `caption` `--navy-900`, built from the rules: "For Computer Science or Mathematics majors at community colleges", "For students at community colleges transferring to UC or Cal State". "See all" opens the feed. With none open: the section is hidden |
| Majors | Title "Majors ({n})". Row: icon tile 40 with `--surface` fill, 1 px `--border-strong`, icon `--mint-800` (no pale tint). Name `row-title`. Your major's second line: a 4-tall segmented bar (60 wide) and "2 of 9 for UC" in `caption`. Other majors: "{n} UC campuses, {k} count for both" or "Cal State only". Rows 4 apart, no dividers |
| Source line | One `caption` `--slate-600` line at the very bottom, 32 below the last row: "From UC Admissions and the CCC Chancellor's Office." followed by the inline link "How we check this" in `--blue-700`. Replaces 21's two-part footer |
| Search | Unchanged (21); while searching, Still needed and Opportunities hide |

## 4. Opportunities feed

Route `/explore/opportunities/`. Pushed screen with a `--yellow-50` band (back button, "Opportunities" `title-1`, subtitle "Research programs, scholarships and competitions for transfer students." `body` `--slate-700`).

```
 [All] [Research] [Scholarships] [Competitions] [Programs] [Events]   choice chips, scroll sideways
 [ ] Only ones that fit me                                            switch, on by default

 Closing soon                                                         title-3
 ┌──┐ Summer research program, UC Davis
 │NOV│ UC Davis
 │ 20│ For STEM transfer students
 └──┘
 Open
 …
 Rolling
 …
 Stackd lists each opportunity in its own words and links to the official page.
```

| Part | Spec |
|---|---|
| Chips | Existing choice chips (00), one row that scrolls sideways. One kind at a time; "All" by default. Internships have no chip and show under All |
| Fits me | Switch (00), on by default: hides opportunities whose audience, majors or system rule out this student (5). Off shows everything open |
| Groups | "Closing soon" (deadline 14 days or less), "Open" (later deadline), "Rolling" (no deadline). Each sorted by deadline, then title. Empty groups hidden |
| Row | As in 3, min height 72, padding 12 16, whole row a button |
| Past deadline | Hidden the day after the deadline (Pacific time) |
| Empty | With "Fits me" on and nothing left: `husky-looking-full` at 140, "Nothing open for you right now." and a text button "Show all opportunities" that turns the switch off |
| Footer | `caption` `--slate-600`, 24 below the list, the sentence in the wireframe |

## 5. Who it's for (matching)

Stored per opportunity (Data). A student fits when every stored rule that applies is met:

| Rule | Check |
|---|---|
| `audience` | `community_college` (current CCC students), `admitted_transfer` (admitted or enrolled at a UC or Cal State), or `any`. Everyone in Stackd counts as `community_college` today |
| `major_slugs` | Empty means any major. Otherwise the plan's major `explore_slug` must be in the list. No major in the plan: shown, but the page marks this rule "Check yourself" |
| `systems` | Empty means any. Otherwise at least one school in the plan is in a listed system (UC, CSU) |
| `term` | Optional: the transfer terms it's for ("fall-2027"). Checked against the plan's term when the plan has one |

Anything Stackd can't check (GPA, citizenship, year in school) is never filtered on. It shows on the opportunity page as a requirement to check yourself.

## 6. Opportunity page

Route `/explore/opportunities/item/?slug=…`. Pushed, `--yellow-50` band.

```
 ‹
 Summer research program                         title-1
 UC Davis                                        body slate-700
 [NOV 20]  Apply by Nov 20, 2026                 date tile + label
           Research, paid, on campus             caption

 Who it's for                                    title-3
 ✓ California community college students         checked against you
 ✓ STEM majors (you: Computer Science)
 ○ GPA 3.0 or higher                             check yourself

 What they want                                  title-3
 • A short statement of interest
 • One recommendation letter

 What you get                                    title-3
 • $5,000 stipend, 8 weeks in summer 2027

 [ Open the official page ]                      primary, 56
 🔔 Remind me before Nov 20                      text button

 From UC Davis, checked Nov 8, 2026.             source block (21)
 ucdavis.edu
 Report a problem
```

| Part | Spec |
|---|---|
| Header | Title `title-1`, organization `body` `--slate-700`, then the date tile 48 with "Apply by {date}" `label` `--navy-900` and a `caption` `--slate-700` line: kind, cost, where (`location`, or "Online"): "Research, paid, Davis". Cost words: Free, Paid, Has a fee. With no deadline: the rolling tile and "Open now, no deadline" |
| Who it's for | `title-3`. One row per rule: `CheckCircle` fill `--green-600` when Stackd checked it against the student ("Computer Science or Mathematics majors (you: Computer Science)"); `Circle` `--slate-400` with "Check yourself" `caption` for anything it can't check. Text `body` `--navy-900`. A rule the student doesn't meet gets the grey `Circle` and the reason, never a red cross: "For admitted transfers; you're at a community college", "For Biological Sciences majors; your major is Computer Science", "For students transferring to Cal State; your plan has none". Audience `any` adds no row |
| What they want / What you get | `title-3` then bullets (`body`, 6 px `--slate-400` dot), from the data, in Stackd's words |
| Open the official page | Primary button, text only (no icon, no chevron), opens `url` outside the app. This is the screen's one bold thing |
| Remind me | Text button with `Bell`, "Remind me before {Nov 20}": schedules local reminders at 9 a.m. 7 days and 1 day before the deadline through the existing reminders code (only the ones still ahead). Toast "Reminder set for Nov 13 and Nov 19." iOS's permission is asked first if it hasn't been (the Deadlines soft ask), and "Turn on reminders?" comes first if Settings has them off. Once set the button reads "Reminders set" with `Bell` fill; tapping it again turns them off, toast "Reminders off". Tapping the notification opens this page. On the web: "Reminders work in the Stackd iPhone app." in `caption` `--slate-600` instead. Hidden for rolling opportunities and when no reminder day is still ahead |
| Source block | 21's pattern: "From {source_name}, checked {date}." then a link line whose label is the source's domain (no second line), then Report a problem |

## Data

### Migration

| Change | Detail |
|---|---|
| `institutions.abbreviation` | `text`, 2–5 capital letters or digits, nullable until filled. Shown on tiles, matched by search. Added to the planning import and filled for all 147 schools in `california-institutions.json` (a reopen, re-import and verify, like the name fix) |
| `opportunities` | `id`, `slug` (unique), `kind` (`research`, `scholarship`, `competition`, `program`, `event`, `internship`), `title`, `org_name`, `summary`, `who_for text[]` (what to check yourself), `wants text[]`, `offers text[]`, `audience`, `major_slugs text[]`, `systems text[]`, `terms text[]`, `deadline date` (null = rolling), `starts_on`, `ends_on`, `location`, `online boolean`, `cost` (`free`, `paid`, `fee`), `url` (https), plus the provenance columns and `protect_verified` like every academic table. Verified rows readable by anon and students; only the import writes |

### Data files

- `data/raw/opportunities/2026-27.json`: one file, the same import, review report, verify and reopen as the other files. Every row in Stackd's own words from the **official program page** (`source_url`). If an opportunity was first seen on Instagram or elsewhere, the source is still the official page; posts are never copied, quoted or embedded.
- First batch (Abyan): 20 to 30 real opportunities open to California community college students in STEM and CS for the next six months, from official pages (university summer research programs for transfer students, NSF REU sites that accept community college students, scholarships, hackathons and competitions, UC and Cal State transfer events). Checked by a second person before verify.

## Later (not in this spec)

**Where you stand (spec 25).** Instead of percentage chances, which no one can honestly compute for holistic transfer review and which would mislead anxious first-time applicants:
- **Your GPA next to admitted transfers' middle-half GPA**, by campus and major, from UC's own published "Transfers by major" data, and Cal State's published thresholds where they exist.
- **TAG eligibility**, which is a real guarantee at six UC campuses.
- Labels **Likely, Target, Reach** with the reason and the source on each, never a number.

## Building it

| PR | Contains | Risk |
|---|---|---|
| A | Migration (`abbreviation`, `opportunities`), the import changes, `abbreviation` drafted for all 147 schools (Abyan checks), an empty `2026-27.json` with 2 example rows marked todo | Migration and data: Ryan pushes, checks, imports |
| B | Floating tab bar, school tiles, Explore hub, Opportunities feed and page, behind `explore` (the tab bar for everyone) | App |

## Test

- Tab bar: floating capsule 12 above the safe area at 393 and 320 wide; four tabs with Explore on (Home, Explore, Essays, You); the grey pill slides on tap; the last row of every tab screen scrolls clear of it; no tab bar on pushed screens; reduced motion: no slide.
- School tiles: UC San Diego shows a blue "UCSD" tile, San José State an amber "SJSU", Las Positas a slate "LPC", in onboarding, Settings, Explore campus rows and the university page.
- Explore with Computer Science and 2 of 9 done, 1 taking now: Still needed lists Data structures first with "Taking now", then three not-yet courses; "See all 9" opens the major page.
- Opportunities for you shows the 3 soonest matching opportunities; a CS student doesn't see a biology-only one.
- Majors list: Computer Science with its mini bar; other majors with campus counts; no pale tiles; one source line at the bottom.
- Feed: chips filter by kind; "Fits me" off shows everything open; Closing soon holds a deadline 10 days out with a coral tile; a deadline yesterday is gone; empty state with the husky.
- Opportunity page: who-it's-for rows check the student's college type and major and leave GPA as "Check yourself"; Open the official page leaves the app; Remind me schedules two reminders and shows the toast; source block present.
- No Instagram or other social content anywhere in the data or the UI.
