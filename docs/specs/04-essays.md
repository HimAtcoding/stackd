# 04 · Essays

Route: `/essays`. Tab: Essays. Mockup: panel 4 of `../mockup/mockup-4-screens.png`.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Substack drafts](https://mobbin.com/screens/50dbae4a-89f6-494a-8db5-265c3efab581) | Two-way segmented switch between draft types; draft rows carry metadata under the title |
| [Grab drafts, empty](https://mobbin.com/screens/83c0a32d-65e3-441d-9d8a-c532c338105e) | Empty state: illustration, bold title, one muted line, centered. We add a button (project rule: empty states propose an action) |
| [Givingli drafts, empty](https://mobbin.com/screens/32e661ff-deac-4bff-927c-aa3afb7f1430) | Same pattern with an icon instead of an illustration: the model for our placeholder tab |
| [Mimo practice](https://mobbin.com/screens/54b61209-26b8-4d28-ac60-9f888e099b6e) | Card with a leading icon tile, title, metadata and trailing control |

## One data correction (not a drawing change)

The mockup shows a UC personal insight essay at "642 words". UC's personal insight questions have a 350-word limit per response, so the demo would be teaching a wrong fact. The demo record uses **220 of 350 words**. That's 63% of the bar, the same fill the mockup draws (146 of 233 px). The screen looks identical; only the number changes.

## Layout

```
┌───────────────────────────────┐  white header zone
│ Demo data                     │  24
│ Your essays ⸝⸝          (+)   │  title-1 + 44 circle, 16 below strip
│ Plan, write, and get feedback │  body-lg navy, 8 below
│ to tell your story with…      │
│   My essays      Resources    │  tabs, 16 below, columns 140 from x 24
│ ──▀▀▀▀▀▀▀▀▀────────────────── │  divider, end of white zone
├───────────────────────────────┤  --sky-50 below
│ ┌───────────────────────────┐ │  16
│ │▣ Leadership through (In p)│ │  draft card
│ │  community                │ │
│ │  Personal insight essay   │ │
│ │ 220 words ▬▬▬▬▬▬▬▭▭▭▭     │ │
│ │ Draft saved just now      │ │
│ │ [      ✎ Edit draft      ]│ │
│ └───────────────────────────┘ │  12
│ ┌───────────────────────────┐ │
│ │Peer mentor feedback       │ │  feedback card
│ │ (◕‿◕) "Your story really… │ │
│ │       View feedback >     │ │
│ └───────────────────────────┘ │  12
│ ┌───────────────────────────┐ │
│ │▣ Essay ready for re… 1h ago│ │  review card
│ │  A peer mentor finished… •│ │
│ └───────────────────────────┘ │  24
├───────────────────────────────┤
│ Home  Explore  Essays Mentors │  Essays active
└───────────────────────────────┘
```

Alignment: left.

## Header zone

Background `--white` from the physical top down to and including the tab divider. Below that, the page is `--sky-50`.

- **Title row**: 16 below the demo strip. "Your essays", `title-1` `--navy-900`, `h1`, x 24.
  - `burst-dashes.svg`, 24 × 24, `--yellow-400`, placed 4 right of the title's last glyph and 8 above its cap line. Wrap the title text in an inline-block so the burst attaches to it. `aria-hidden`.
  - New-essay button: "+" circle variant (00), 44, right 16, vertically centered on the title's 40 line box. `aria-label="New essay"`. Tap: placeholder.
- **Intro**: "Plan, write, and get feedback to tell your story with confidence." `body-lg` `--navy-900`, 8 below the title, max-width 330.
- **Tabs**: underline tabs (00), 16 below the intro, fixed-width layout. Two columns of 140 starting at x 24, labels centered in each: "My essays", "Resources". The indicator is the standard label + 28, which draws about 18 narrower than the mockup's 129. It's normalized to the shared component so both tab rows behave the same.
  - Resources renders the placeholder empty state.

## My essays list

Cards (00), margins 16, first card 16 below the divider, gap 12. Rendered from `essays.json`.

### Draft card

Padding 16. Not itself tappable; its button is the action.

1. **Header row**: icon tile 44 (`--r-sm`, solid `--blue-600`, `FileText` fill 24 white) + 12 gap + text column.
   - Text column, line 1: title (`title-3` `--navy-900`, wraps to 2 lines, then clamps) with the `progress` pill ("In progress") on the right, 8 gap, pill aligned to the first line of the title (`align-self: flex-start; margin-top: -2px`).
   - Subtitle: "{essay.kind}" (`body` `--slate-600`), 4 below the title.
2. **Word count row**: 20 below the header row, aligned to the card's inner left edge (not the text column), height 20.
   - "{count} words", `body` `--slate-600`, tabular-nums.
   - 16 gap, then a progress bar (00) filling the rest, width = count / limit. `role="progressbar"`, `aria-valuenow={count}`, `aria-valuemax={limit}`, `aria-label="Word count"`.
3. **Saved line**: "Draft saved {relative time}", `caption` `--slate-600`, 8 below. "just now" under a minute, then "{n} min ago", "{n}h ago", then a date.
4. **Edit draft**: tinted button (00) with `PencilSimple` fill 20, full inner width, 16 below. Tap: placeholder editor.

Measured card height 236. Spec height: 16 + 72 + 20 + 20 + 8 + 16 + 16 + 48 + 16 = 232. The 4 difference is the render's title line gap.

### Feedback card

Padding 16.
- "Peer mentor feedback": `title-3` `--navy-900`, `h2`.
- 12 below, a row: avatar 88 × 88 (`--r-full`, `mentor-avatar-01`, `alt="{mentor.name}"`) + 16 gap + text column.
  - Quote: `body` `--slate-700`, curly quotes, 3-line clamp. The mockup's quote reads lighter; `--slate-700` is used over `--slate-600` because it's longer reading text.
  - "View feedback" + `CaretRight` bold 16 (gap 4), `link` `--blue-600`, 12 below the quote. The link's hit area is 44 tall via 12 vertical padding with negative margin, so the layout doesn't move. Tap: placeholder.

The mockup indents this card's title about 8 further than the other cards. Normalized to 16 padding like every card.

### Review card

The whole card is one link to the feedback placeholder. Padding 16.
- Icon tile 44, `--tint-sky`, `FileText` fill 24 `--blue-600`. 16 gap to the text column. Text column padding-right 24.
- Title row: "Essay ready for review" (`headline`) and "{relative time}" (`caption` `--slate-600`) on the right, sharing a baseline.
- Body: `body` `--slate-600`, 4 below, 2-line clamp.
- Unread dot: 8 `--coral-500`, right 16, vertically centered. The accessible name ends with ", unread".

Height: 16 + 22 + 4 + 40 + 16 = 98 (measured 98).

The list ends with 24 of padding above the tab bar (Essays active).

## Demo data (`essays.json`)

```json
{ "demo": true,
  "drafts": [ { "id": "piq-1", "title": "Leadership through community", "kind": "Personal insight essay",
                "status": "in_progress", "wordCount": 220, "wordLimit": 350, "savedAt": "now" } ],
  "feedback": [ { "mentorName": "Maya", "avatar": "mentor-avatar-01",
                  "quote": "Your story really shows your impact! Consider adding a specific example to make it even stronger." } ],
  "notices": [ { "type": "review_ready", "title": "Essay ready for review",
                 "body": "A peer mentor finished reviewing your draft. Check out their feedback!", "at": "-1h", "unread": true } ] }
```

## States

- **No drafts**: the empty state (00) replaces the draft card. Icon `FileText`, title "No essays yet", body "Start a draft and it'll show up here.", button "New essay" (the same action name as the "+" button).
- **No feedback / no notices**: omit those cards. No placeholder.
- **Over the limit** (count > limit): the bar stays full, and its fill and the count text change to `--coral-700`. The saved line becomes "{n} words over the limit". Not drawn; defined so the data can't produce a broken bar.

## Motion

Press states and the tab indicator only. The progress bar animates only when the count changes, never on load.

## Test

- `wordCount: 0` shows an empty track, not a sliver.
- `wordCount: 400` shows the over-limit state.
- The Resources tab shows the placeholder and doesn't push a new screen.
- Title and burst don't collide at 320 wide: the title wraps and the burst follows the last glyph.
