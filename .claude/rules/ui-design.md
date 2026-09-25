# Stackd UI design rules

## Product context

Stackd helps community college students figure out how to transfer: which courses count, which routes lead where, and what's left to finish. Users are 18–24, mostly first-generation, often part-time, often on a phone between classes or shifts. They arrive confused and anxious. Every UI decision should reduce that.

The subject matter's real vocabulary — articulation agreements, IGETC, major prep, unit counts, TAG, deadlines, "what transfers where" — is where the visual identity comes from. Design for a planning tool, not a marketing site.

## Before writing any UI code

Produce a short design plan first. Do not skip to code.

1. **Tokens** — 4–6 named hex values, the typefaces and their roles, spacing scale.
2. **Layout** — one or two sentences plus an ASCII wireframe. State the alignment.
3. **Hierarchy** — name the single most important element on the screen.
4. **Self-check** — ask: "would I produce this same plan for any student app?" If yes, change it and say what changed and why.

Only then write code. If a spec in `docs/specs/` already defines tokens and layout, follow the spec and use this plan step to confirm it, not replace it.

## Banned by default

These are the current tells of AI-generated UI. Do not use them unless explicitly asked.

- Cream/off-white background (#F4F1EA family) + high-contrast serif display + terracotta accent (#D97757 family).
- Near-black background with one acid-green or vermilion accent.
- Tinted near-blacks (#0B0B0B, #111) standing in for real black or a real dark neutral.
- Every piece of content chopped into identical rounded cards with the same radius and the same `rgba(0,0,0,.1)` shadow.
- Gradient washes used as decoration.
- ALL-CAPS tracked-out eyebrow labels above headings.
- Meta strings joined with middle dots (`Fall 2027 · UC San Diego · CS`).
- `WORD — fragment` labels with a spaced em dash.
- `→` appended to link and button text.
- Monospace for small data labels (exception: actual course codes like CS 1A, where monospace is doing real work).
- One word in a headline italicized, bolded, or recolored for emphasis.
- 01 / 02 / 03 numbered markers unless the content is genuinely sequential. A transfer roadmap is sequential. A feature list is not.
- Fade-and-slide-up entrance on every section; hover lift on every card.

## Typography

- One family, or two that are obviously different. Not three.
- Pick deliberately. Inter, Poppins, and system-ui defaults read as no choice at all.
- Set a real type scale with intentional weights and spacing. Headline type is part of the design, not a container for words.
- Body line length under 80 characters. Serif body text gets more line-height than sans.
- Sentence case everywhere, including buttons and labels.

## Color and structure

- Build the palette around the product's job, not around a trend. Stackd shows status: done, in progress, missing, at risk. Let the palette carry that meaning instead of decorating with it.
- Borders, dividers, numbering, and labels must encode information. If a divider isn't separating two genuinely different things, delete it.
- Vary radius and elevation by hierarchy. A primary action and a passive list row should not look the same.
- Spend boldness in one place per screen. Everything around it stays quiet.

## Motion

- Motion answers a user action: expanding a course row, confirming a saved plan, showing what changed after a filter.
- At most one non-triggered moment per screen, and only if it directs attention.
- Respect `prefers-reduced-motion`.

## Copy

- Name things the way a student would: "Courses still needed," not "Unfulfilled requirement nodes."
- Active voice. A button says what happens: "Save plan," not "Submit."
- Keep an action's name identical through the whole flow — "Add course" → toast "Course added."
- Empty states propose the next action. Error states say what broke and how to fix it, without apologizing or being vague.
- No filler, no selling. These students are stressed; be plain.

## Quality floor (assume, don't announce)

Mobile-first and responsive. Visible keyboard focus. Real contrast ratios. Touch targets 44px minimum. Works one-handed — most sessions are on a phone.

## Code style

- Short, plain comments that say what a piece does. No formal or verbose explanations.
- No banner or divider comment lines (rows of `=` or `-`), no redundant comments restating obvious code.
- Watch CSS specificity — type-based selectors (`.section`) and element-based ones (`.cta`) cancelling each other out on padding and margin is the usual failure.

## Before you hand anything back

Look at it once more and remove one thing. Then say in one line what makes this screen specific to Stackd rather than to any app.
