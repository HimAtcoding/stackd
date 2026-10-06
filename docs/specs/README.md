# Design specs

Build-ready specs for the Stackd demo app. Every value (color, size, spacing, radius, timing) is measured from the team mockups in `docs/mockup/` and checked against shipped apps on Mobbin. Claude Code builds from these files without guessing.

## Files

| File | What it holds |
|---|---|
| `00-foundations.md` | The only source of tokens: color, type (Figtree), spacing, radius, elevation, icons, shared components, interaction states, motion, and the list of normalizations |
| `flows-and-states.md` | Routes, navigation map, local storage keys, celebration rule, copy rules, empty and error states, trust elements |
| `01-welcome.md` | First-launch screen (the "hero" screen) |
| `02-home.md` | Dashboard: greeting, journey tracker, shortcut tiles, upcoming |
| `03-university-requirements.md` | University screen, requirements tab, mark-done behavior |
| `04-essays.md` | Essays tab: draft, feedback, and review cards |
| `05-task-complete.md` | Milestone celebration, its animation timeline, and the husky run loop |
| `06-sign-in.md` | Sign in: fields, validation, errors, Apple and Google buttons, and the auth interface all three auth screens use |
| `07-create-account.md` | Create account: written as a list of differences from 06 (no mockup) |
| `08-forgot-password.md` | Forgot password: the request form that sends a reset code (no mockup) |
| `09-enter-code.md` | Enter code: the 6-digit code for password reset and email confirmation, the new password step, and the auth interface additions (no mockup) |
| `10-onboarding.md` | Onboarding: college, transfer schools, and major, saved to the account; also the edit screens Settings opens |
| `11-settings.md` | Settings: plan answers, change password, sign out, delete account (required by Apple) |
| `art-assets.md` | Every illustration, with sizes, layers, delivery rules, and placeholder behavior |

The source drawings live in `docs/mockup/`, one level up. The specs expect these file names:

| File | Drawn screen |
|---|---|
| `mockup-4-screens.png` | Welcome, Home, UC Davis requirements, Essays |
| `mockup-task-complete.png` | "Great job!" celebration |
| `mockup-sign-in.png` | Sign in |
| `welcome-reference.png` | Full-screen Welcome target (rev 2): scene fills the screen, books in front of the husky |
| `husky-run-sheet.png` | The 8-frame run attempt |

Create account, forgot password, enter code, onboarding, and settings have no mockups. They're built from parts that already exist and say which. Their specs are built from the sign-in drawing and say exactly what differs.

Temporary run-loop frames are in `public/art/husky/`.

## Rules for this phase

1. **Build the mockup as drawn.** No redesigns until the baseline exists as a working demo. Where a spec picks one of two versions the mockup drew, it's listed in `00-foundations.md → Normalizations`.
2. **Tokens only.** Every value comes from `00-foundations.md`. If a needed value isn't there, stop and ask; don't invent one.
3. **Ambiguity stops the build.** If a spec is unclear or two files disagree, ask. `00-foundations.md` wins over a screen spec unless the screen spec names the exception.
4. **Missing art never blocks.** Use the labelled placeholder from `art-assets.md` at the exact size. The layout mustn't move when the real file lands.
5. **Mobbin is for checking, not redesigning.** Each screen spec lists its references. Pull them to check spacing, type, and states against what shipped apps do. Report differences; don't apply them.

## Build order

Each step depends on the one before it.

| Step | Build | Spec | Done when |
|---|---|---|---|
| 1 | Tokens, Figtree, Phosphor, shared components, tab bar, demo strip, placeholder screen | `00`, `flows-and-states` | A component page at `/dev/components` renders every shared component in every state |
| 2 | Welcome | `01` | The test list in `01` passes at 320, 393, and 430 wide |
| 3 | Sign in, demo auth, and the signed-out redirect | `06` | The test list in `06` passes. A visit to `/` with no session lands on Welcome if Welcome hasn't been seen, and on Sign in if it has |
| 4 | Create account | `07` | The test list in `07` passes |
| 5 | Forgot password | `08` | The test list in `08` passes |
| 6 | Home | `02` | The test list in `02` passes, including the greeting from Create account |
| 7 | University requirements, with mark-done and local storage | `03` | Marking a row done survives reload and updates Home |
| 8 | Essays | `04` | The test list in `04` passes |
| 9 | Task complete + run loop | `05` | Marking a journey-linked row done opens the celebration once |
| 10 | Enter code, new password, revised forgot password, and the new auth errors on 06 and 07 | `09`, `08` | Done |
| 11 | Onboarding, saved to the account | `10`, `07`, `09` | The test list in `10` passes with a real account |
| 12 | Home plan states, the gear button, and the official agreement card on University | `02 → Plan states`, `03 → Real accounts` | Both rev 3 test lists pass with a real account, and no demo strip shows |
| 13 | Settings: plan rows, change password, sign out, delete account | `11` | The test list in `11` passes with a real account |

## Prompt template for Claude Code

Paste one per step, filling in the step. It keeps each session scoped to one spec.

```
Read .claude/rules/ui-design.md, docs/specs/README.md, docs/specs/00-foundations.md,
docs/specs/flows-and-states.md, and docs/specs/<NN-screen>.md.
Look at docs/mockup/<mockup file> for the drawing.

Build step <N> from the build order: <screen name>.

Before writing code, tell me: what you're building, which files you'll create or change,
what demo data it needs, and how you'll test it against the spec's Test section.
Wait for my OK.

Then pull the Mobbin references listed in the spec and compare them against the spec.
Report any differences as a list. Do not change the design based on them.

When done, give me screenshots at 393 × 852 and 320 × 568, and list anything
in the spec you couldn't match exactly and why.
```

For step 1, point it at `00-foundations.md` and `flows-and-states.md` only, and ask for the `/dev/components` page.

Steps 1–5 are enough to test the whole way in (welcome, sign in, create account, forgot password). Until step 6 is built, a successful sign-in lands on the placeholder screen at `/`, which is expected.

## Not in these specs yet

These all open the placeholder screen, so nothing is a dead end while they wait:

- **Requirement detail** (courses at other colleges that satisfy a requirement, with source and year, from `07-requirement-search.md`).
- Explore, Mentors, Events, notifications, the essay editor, and the Terms and Privacy pages.

## Adding a screen later

1. Put its mockup in `docs/mockup/`.
2. The design-spec chat writes the new spec (next number: `12-…`) and returns it together with updated copies of this README and `flows-and-states.md`, plus any other spec it touches.
3. Drag those files into `docs/specs/`, replacing the old copies.
4. Build it as the next step in the build order.

## Review loop

1. The spec is committed here.
2. Claude Code builds from it.
3. Screenshots come back to the design-spec chat and are compared against the spec, the mockup, and the Mobbin references.
4. Each difference is either a build bug (fix the code) or a spec problem (revise the spec and bump its status line).
