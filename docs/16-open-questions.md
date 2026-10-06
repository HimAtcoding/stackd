# Open questions and pushback

Everything here is mine. Each item is a decision that needs making, with a recommendation. Delete the ones you disagree with — but decide them rather than letting them get decided by default.

## Decided (October 2026)

These were open and are now settled. Everything below this section is the original list, kept for the reasoning.

| Decision | Choice | Why | Affects |
|---|---|---|---|
| Distribution | **App Store first, packaged with Capacitor.** No Vercel or public website for now | Keeps every screen already built; Capacitor wraps the existing app as a real iOS app | `11`, `13`, `15` |
| Native feature for App Review | **Push notifications** for deadlines and registration windows | Apple Guideline 4.2 rejects apps that are only a website in a wrapper | `13`, `15` |
| Backend | **Supabase** for data and sign-in; the app talks to it directly | An App Store app still needs a server for accounts and data | `11` |
| Sign-in | Email and password first, then Google, then **Sign in with Apple** (required by Apple when Google is offered) | Cost and setup order | `15` |
| First real data slice | **Las Positas → UC San Diego, Computer Science** (replaces SDSU Business Administration) | The founder is on this path and can spot wrong data instantly; the LPC CS club is a ready first test group | `09`, `12` |
| Data strategy | **California first via ASSIST, with permission**: read ASSIST's terms and ask about data access before any automated import. Then states with statewide course numbering, then licensed sources | One official source covers every CCC → UC/CSU pair; bulk scraping risks losing access to it | `12` |
| Data approach (revised) | **Planning layer first.** For California, Stackd links each student to the official ASSIST agreement for their college, school, and major, and handles planning (progress, deadlines, saved schools). No ASSIST or university data is copied into the app without permission. One email to ASSIST asks for permission for all of California at once; course matches show in-app only after it's granted | ASSIST and UCSD terms prohibit using their data without permission (checked October 2026), so scraping isn't an option. Linking is | `07`, `09`, `12`, `15` |
| ASSIST data access (reply, Oct 5 2026) | **Not available to Stackd yet. Course matches stay locked.** ASSIST is still setting up a license agreement, fees, and terms of use. System offices and institutions (including AICCU members) get access first, estimated fall 2026; access for everyone else is still being decided. Stackd keeps the planning layer and official links, and checks the ASSIST Resource Center Data page each term | ASSIST replied to our request on Oct 5, 2026. Its Data page currently limits data to CCC, CSU, UC, and AICCU administrators. Expect a paid license when it opens, so budget for it | `12`, `15` |
| Out-of-state transfer data | **A later phase, not the MVP.** Build an ASSIST-like database for states without one, starting with states that publish public statewide transfer systems. Every source's terms get checked before import, and only permitted data goes in, with provenance | No national ASSIST exists, so this is a real gap, but each source has its own terms and the first users are California students | `15` |
| Screens after launch | **Essays, Mentors, Student life, the celebration animation** wait until after launch | Not in the MVP workflow | `09`, `15` |
| Screens before launch | **Onboarding, Explore (search), requirement detail, university Overview tab** | They complete the core workflow | `15` |

## The ten that matter most

**1. Four products already do the MVP.**
Transfermatic/Pipeline, Plan My Transfer, TransferAI, and TransferPlanner are all live and California-focused. The MVP as specified is a product that exists four times over. *Recommendation:* spend an afternoon using all four as a student, write down what each gets wrong, and let that shape v0. The differentiated idea in your own braindump is cross-college sourcing — "your college isn't offering stats next term; here's where else it counts" — and it's the part that gets the least space.

**2. There's no GE in the spec.**
Cal-GETC replaced IGETC and CSU GE Breadth as of fall 2025 and is half of what students are confused about. It's also cheaper data than major prep. *Recommendation:* add Cal-GETC progress in v0.1. Add `catalog_year` to the user model now, since pattern eligibility depends on when they first enrolled.

**3. The ADT is the CSU shortcut you're not using.**
Transfer Model Curriculum templates are statewide — one dataset covers every community college, versus one agreement per college pair. If the first destination is SDSU Business Administration, the AS-T is the spine. *Recommendation:* build the first dataset from the TMC, then layer campus-specific ASSIST detail on top.

**4. Flat articulations will produce wrong answers.**
ASSIST agreements contain "A and B together" and "one of A, B, C" groups. A flat `course → requirement` table will tell a student they're done when they aren't. *Recommendation:* add `requirement_groups` before seeding any data. Retrofitting means re-entering everything.

**5. "Not verified" is doing two jobs.**
"We checked and there's no agreement" and "we haven't checked" are different facts and must not render the same. *Recommendation:* four statuses — verified, conditional, no agreement, unchecked — and coverage expressed as verified-out-of-checked.

**6. The MVP still has three abandonment traps.**
Auth, an onboarding wizard, and a course-history step, all before the student sees anything useful. *Recommendation:* v0 is one route, no account, local storage, land straight on the requirement list. Details in `09-mvp-scope.md`.

**7. Section and seat data is a trap.**
No statewide feed, one SIS per college, stale in days. It underpins the filters, the semester planner, and the "fastest path" mode. *Recommendation:* don't build it. Link to CVC.edu. Revisit only if usage proves students want it badly enough to justify the maintenance.

**8. The App Store is a distribution decision, not an architecture decision.**
A WebView wrapper risks rejection under Apple's minimum-functionality rule, and install friction kills first sessions for a tool students use a few times a semester. *Recommendation:* installable PWA now; native later, when deadline and registration notifications give it a real reason to exist. Full argument in `13-distribution-and-app-store.md`.

**9. Data curation belongs to the business co-founder.**
It's the highest-value work in the project, it isn't engineering, and assigning it to the person also building the entire application makes it the bottleneck. *Recommendation:* define the CSV schema in week one and hand curation over.

**10. Nothing in the spec is dated.**
Every rule in California transfer changes annually, in August. TAG matrices, ASSIST cycles, campus requirements, GE patterns. *Recommendation:* every academic record carries an academic year, the current cycle is a config value, and anything older renders with a visible year label automatically.

## Smaller ones

- The braindump calls this "Transfer Pathway Platform" throughout; the product is Stackd. Reconcile the naming everywhere before anyone outside sees a doc.
- No terms of use, no "not affiliated with ASSIST/UC/CSU" line. Both needed before the first real user.
- No accessibility commitment despite an audience that includes students on old phones and slow connections. The quality floor in `10-ux-flows.md` covers it; keep it there.
- If transcript upload ever happens, transcripts are education records. Parse client-side or don't store them.
- "Estimated planning time saved" is a modeled number. Never present it as measured.

## Questions only you can answer

- Is the first destination SDSU Business Administration, or is it UCSD CS — the transfer path you're personally walking? The second gives you a user (you) who can spot wrong data instantly, and a launch audience (the CS club you're treasurer of). The first matches the braindump. Pick deliberately; the dataset is different.
- Who is the first non-founder student to use this, by name, and when? If there isn't a name, the launch plan isn't real yet.
- What's the honest weekly hour budget for each founder? Curating 10 college-major pairs properly is 10–15 hours by itself, and it has to come from somewhere.
