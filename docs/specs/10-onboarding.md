# 10 · Onboarding

Route: `/onboarding/?step=college`, `?step=schools`, `?step=major`. No tab bar. No mockup: built from existing parts (00 text field, list container from 03, primary button, progress bar). Real data only: every list reads the database tables from phase 3 (`institutions`, `majors`), and the answers save to the student's account.

Three questions, in order. This is a genuine sequence, so the step count is shown.

| Step | Question | Picks | Saves to |
|---|---|---|---|
| 1 `college` | Where do you go now? | One community college, or "My college isn't listed" | `profiles.home_institution_id` (null for not listed) |
| 2 `schools` | Where do you want to transfer? | One or more universities | `user_targets` rows (one per school) |
| 3 `major` | What's your major? | One major per chosen school, or "Not listed yet" | `user_targets.major_id` (null for not listed) |

Use whatever table and column names Claude Code created in phase 3; the names above are from `05-data-model.md`.

## When it shows

- Right after an account is created: after `signUp` with `needsCode: false`, or after the confirmation code is accepted (09). Instead of going to Home, replace the history entry with `/onboarding/?step=college`. After a confirmation code, the "Email confirmed" toast shows here on step 1 (12 above the pinned button).
- From Home's setup card (02 → Plan states) and from Settings (11), for students who skipped it.
- Never on its own after that. A student who skipped isn't asked again; Home's setup card is the reminder.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Jomo pick apps](https://mobbin.com/screens/560ea397-8294-4491-be7a-942fe5e00057) | Back circle + progress bar in one header row, selectable rows with a circle on the left inside one rounded container, Continue pinned at the bottom |
| [Beli select school](https://mobbin.com/screens/98be6758-732e-4203-b23c-0b6f859ef440) | Big left-aligned question, search right under it, school list, Continue at the bottom |
| [Life Reset where from](https://mobbin.com/screens/77a871d8-907a-4604-bf57-470831db26c2) | The selected row gets a colored border and a filled check |
| [Pangea countries](https://mobbin.com/screens/b2cdd012-a028-4ff6-a934-1eb69eac63eb) | Search field above a long multi-select list |

## Layout (step 1 at 393 × 852)

```
┌───────────────────────────────┐  06 background, no clouds
│ (←)  ▬▬▬▬▬▬░░░░░░░░░░░   Skip │  header 44, safe-area top + 8
│      Step 1 of 3              │  caption, 4 below the bar
│                               │  24
│ Where do you go now?          │  title-1, x 24, max 320
│ Pick your community college.  │  body-md --slate-600, 8 below
│ [🔍 Search colleges         ] │  20 below, text field 48
│ ┌───────────────────────────┐ │  12 below, list container
│ │ ○  Las Positas College    │ │  row 64
│ │    Livermore              │ │
│ ├───────────────────────────┤ │
│ │ ○  My college isn't listed│ │  row 56
│ └───────────────────────────┘ │
│                               │  flexible
│ (         Continue        >) │  pinned, safe-area bottom + 16
└───────────────────────────────┘
```

Alignment: left. Free text at x 24, field and list at 16.

## Header row

Height 44, at safe-area top + 8, padding 0 16. Background is the page's.

| Element | Spec |
|---|---|
| Back | Circle button (00), `ArrowLeft` bold 22, `aria-label="Back"`. Hidden on step 1 when arriving from sign-up (there's nothing to go back to). On steps 2 and 3, goes to the previous step with its choices kept |
| Progress bar | Progress bar component (00), 8 tall, filling the space between Back (or the left padding, on step 1) and Skip, with 16 on each side. Value: 1/3, 2/3, 3/3. Animates 320 ms `--ease-out` on step change, as 00 already says |
| Step count | "Step {n} of 3", `caption` `--slate-600`, tabular-nums, left-aligned under the bar's left end, 4 below the bar. The bar has `role="progressbar"`, `aria-valuenow`, `aria-valuemax="3"`, and `aria-label="Step {n} of 3"` |
| Skip | Text link (00), `label` (14/18 600) `--blue-600`, "Skip", right-aligned, 44 hit area. Only during first-run onboarding. Goes to Home (replace), saving nothing. No confirmation |

## Question block

| Element | Spec |
|---|---|
| Question | `title-1` (36/40 900) `--navy-900`, `h1`, x 24, 24 below the step count, max-width 320. Focus moves here on each step change (`tabindex="-1"`) |
| Helper | `body-md` `--slate-600`, 8 below, max-width 320 |
| Search | Shared text field (00) without a label: `aria-label` = the placeholder. `MagnifyingGlass` regular 22 leading icon. 20 below the helper, margins 16. `type="search"`, `enterkeyhint="search"`, `autocapitalize="off"`. A clear button (`XCircle` fill 20 `--slate-600`, 44 hit area, right 2) appears once there's text |

| Step | Question | Helper | Search placeholder |
|---|---|---|---|
| 1 | Where do you go now? | Pick your community college. | Search colleges |
| 2 | Where do you want to transfer? | Pick one or more schools. You can change this later. | Search schools |
| 3 | What's your major? | Pick the major you plan to transfer into. | Search majors |

Search filters the list as the student types (this is filtering, not validation, so it's live). It matches the name and the city, ignoring case and spaces. No matches: the list container is replaced by a `body` `--slate-600` line at x 24: `No {colleges / schools / majors} match "{text}".` The "isn't listed" row (below) always stays visible, even when nothing matches.

## Choice list

List container from 03: margins 16, `--surface`, 1 px `--border`, `--r-md`, `--shadow-card`, `overflow: hidden`. 12 below the search. Rows are separated by a 1 px `--border` line (none after the last).

**Choice row**: the whole row is the button. Padding 0 16. Min height 56 (64 with a second line).

| Part | Spec |
|---|---|
| Choice circle | New shared component (add to 00): 24 circle, decorative (the row is the button). Not chosen: 2 px `--slate-400` ring. Chosen: `--blue-600` fill with a white `Check` bold 14. Swap over 120 ms, no bounce. Blue, not green: green means "done" in Stackd, and this is a choice, not a finished requirement |
| Gap | 16 |
| Name | `row-title` `--navy-900`. Wraps to 2 lines before it truncates |
| Second line | `caption` `--slate-600`, 2 below: the city for colleges and schools, the degree for majors ("B.S."). Omitted when the record has none |
| Chosen row | Background `--blue-50`, and the container's border isn't changed. Pressed: `--surface-pressed` |

Semantics: step 1 and each school's list on step 3 are single choice (`role="radiogroup"`, rows `role="radio"`, `aria-checked`). Step 2 is multiple choice (`role="group"`, rows `role="checkbox"`). The circle is `aria-hidden`; the row carries the name.

**"Isn't listed" row**: always the last row of its list, separated by a divider like the others, with no second line.

| Step | Row | Chosen means |
|---|---|---|
| 1 | My college isn't listed | No home college saved. A note appears 12 below the list: `caption` `--slate-600`, x 24, max 320: "We're starting with a few colleges and adding more. You can still save schools and deadlines." |
| 2 | (none) | A student must pick at least one school, or Skip |
| 3 | Not listed yet | That target saves with no major. Same note pattern: "We'll add more majors. Your school is still saved." |

### Step 1: colleges

Rows: every institution with type community college, sorted by name. Today that's Las Positas College only, which is expected; the list grows as the database does.

### Step 2: schools

Rows: every institution with type university, sorted by name. Multiple choice. A caption under the list shows the count once at least one is chosen: "{n} selected", `caption` `--slate-600`, x 24, 12 below, tabular-nums.

### Step 3: majors

One section per school chosen on step 2, in the order they were chosen.

- With one school: no section heading. The helper becomes "Pick the major you plan to transfer into at {school}."
- With two or more: each section has the school's name as a `title-3` `--navy-900` `h2` at x 24, 24 above its list (20 for the first one, below the search). Search filters all sections at once; a section with no matches shows only its "Not listed yet" row.
- Rows: the majors in the database for that school, sorted by name, plus "Not listed yet".

## Continue button

Primary button (00), pinned: `position: sticky; bottom: 0` inside a bottom area with padding 16 16 `calc(16px + env(safe-area-inset-bottom))`, background `--sky-50`. A 24-tall fade from transparent to `--sky-50` sits above the area so rows don't end abruptly behind it. The list's last row must scroll fully above the fade.

| Step | Label | On tap |
|---|---|---|
| 1 | Continue | Next step |
| 2 | Continue | Next step |
| 3 | Save plan | Saves everything, then Home |

**Checking on tap** (not while choosing, matching 06): if the step has no choice, a message appears 12 above the button, in the field error style from 00 (`WarningCircle` 16 + 14/18 500 `--coral-700`), and focus moves to the list's first row.

| Step | Message |
|---|---|
| 1 | Pick your college, or choose "My college isn't listed." |
| 2 | Pick at least one school. |
| 3 | Pick a major for each school, or choose "Not listed yet." Focus goes to the first section missing a choice |

The message clears as soon as a choice is made.

**Saving** (step 3): the button shows its loading state, the lists become read-only (opacity 0.6). Save the home college and replace the student's targets in one go, so a failure never leaves half a plan.

| Result | What the student sees |
|---|---|
| Saved | Replace history with `/` (Home), 200 ms crossfade, toast "Plan saved" |
| Network failure | Inline error (00), 12 above the button: "Couldn't save your plan" / "Check your connection, then try again." Choices stay |

Steps 1 and 2 don't save on their own; nothing is written until "Save plan". Leaving with Skip or by closing the app saves nothing.

## Editing from Settings

Settings (11) opens one step at a time to change one answer: `/onboarding/?step=college&edit=1` (or `schools`, `major`).

- Header: Back (returns to Settings without saving), no progress bar, no step count, no Skip.
- The current answers are already chosen.
- The button reads "Save plan" on every step. It saves that step only, then goes back to Settings with the toast "Plan saved".
- Editing schools: newly added schools save with no major. Settings then shows "Pick a major" on the Major row. Removing a school removes its target row and that school's saved progress for this student.
- If the student removes every school, the step-2 message shows; a plan needs at least one school.

## Loading and errors

- Lists load from the database when each step opens. Waits under 600 ms show nothing; longer ones show the loading component (00) in place of the list: "Loading colleges" / "Loading schools" / "Loading majors".
- Load failure: inline error in place of the list: "Couldn't load colleges" (or schools, majors) / "Check your connection, then try again." / "Try again".

## Motion

- Step change: the question block and list crossfade over 200 ms. The progress bar fills as 00 says. Focus goes to the new question. Instant under reduced motion.
- Choice circles and the chosen row background change over 120 ms.
- No husky and no entrance animation; the list needs the room.

## Test

- Sign up with a new real account: you land on step 1, with no Back button, the bar at a third, and "Step 1 of 3".
- Tap Continue with nothing chosen: the step-1 message, with focus on the first row.
- Choose Las Positas College: the row turns pale blue with a blue check. Continue goes to step 2 with the bar at two thirds.
- Search "san d": only UC San Diego shows. Search "zzz": the "No schools match" line.
- Choose UC San Diego, then Continue: step 3 says "…at UC San Diego" with Computer Science listed.
- Back from step 3: step 2 with UC San Diego still chosen.
- Choose Computer Science, then Save plan: Home with "Plan saved", and the plan card shows UC San Diego (02 → Plan states). Reload: still there. Sign in on another browser: still there.
- Skip on step 1: Home with the setup card. Nothing was saved.
- At 320 wide: the question wraps to two lines, rows wrap long names to 2 lines, and the pinned button never covers the last row.
