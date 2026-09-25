# Problem, positioning, and competitive landscape

## The problem

Transfer planning is fragmented. A student assembling a plan today has to cross-reference ASSIST, California Virtual Campus, community college catalogs, individual college schedules, university sites, transfer admission pages, degree requirement pages, counselors, personal spreadsheets, and search engines. Each source is accurate on its own. Nobody connects them but the student.

The existing tools answer *"Does course A articulate to course B?"*. Students actually need answers to:

- What should I take?
- Where should I take it?
- What requirements do I still need?
- Which course keeps the greatest number of transfer options open?
- What's my fastest path?
- Can I finish this requirement online?
- Which universities could I transfer to without losing credits?

## Positioning

Stackd does not replace ASSIST, counselors, universities, or official articulation systems.

- **Official sources** are the source of truth.
- **Stackd** is the planning, organization, search, and optimization layer on top.

ASSIST tells students what articulates. CVC helps them find courses. Stackd tells them how to build the path. The rough analogy is Google Flights for college transfer: the student supplies where they are, where they want to go, what they've finished, and their preferences; the platform searches paths and recommends routes.

## Who else is building this

> **My note:** This section did not exist in the braindump, and its absence is the biggest gap in the whole document. As of September 2026 there are at least four live products doing some version of the MVP as specified, plus three official tools students already use for free.

**Direct commercial competitors (all live, all California-focused):**

- **Transfermatic / Pipeline** — semester-by-semester roadmaps against articulation agreements, claims coverage of 500+ universities, actively publishing SEO content on IGETC/Cal-GETC/TAG.
- **Plan My Transfer** — free, markets "live ASSIST articulation data," AI-built semester roadmap, multi-major comparison, Cal-GETC and UC-7 progress tracking, and cross-college search.
- **TransferAI** — course planner plus essay tooling aimed at UC transfers.
- **TransferPlanner** — preserves ASSIST's requirement group structure (including the "two courses must arrive together" groups) and tracks them against a plan.

**Official / incumbent tools:**

- **ASSIST.org** — the authoritative articulation record. Free. Everyone's data source, including the competitors'.
- **UC TAP** — free UC coursework planner; required for TAG. Students transferring to UC are already told by their counselor to use it.
- **CVC.edu** — cross-enrollment marketplace for finding open online sections at other CCCs.

**What this means:**

1. The MVP as written — single college, single university, single major, requirement checklist — is a product that already exists in four forms. Shipping it does not, on its own, get you users.
2. The genuinely differentiated idea in the braindump is the one that gets the least space in it: **requirement-first, cross-college sourcing.** "You need statistics. Here are the sections at eight colleges that satisfy it for all three of your targets, three of them online and 8 weeks long." Plan My Transfer gestures at this; nobody has made it the center of the product.
3. The second differentiator is **local trust**. A tool built by Las Positas students, endorsed by the Las Positas transfer center, used by the Las Positas CS and business clubs, beats a generic statewide site for Las Positas students. That advantage does not scale, which is exactly why it's a good place to start.
4. Before writing more code, spend an afternoon using all four competitors as a student would. Write down what each gets wrong. That document is worth more than another page of spec.
