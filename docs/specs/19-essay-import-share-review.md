# 19 · Essays: bring drafts in, send them out, ask someone to review

Release: v1.2, with 17. Flag: `essays` (the same flag; this is part of Essays, not a separate feature). AI feedback (17 → AI feedback) stays off behind `essayFeedback` until later; nothing here depends on it.

## Why

Most students already have half-written personal insight answers in Google Docs or Notes, and they want a counselor, a professor or a friend to read them before Nov 30. Today that's copy, paste, email, and comments scattered across three apps. This spec makes Essays the one place a draft lives: get it in fast, get it out to UC's form in one tap, and collect feedback from real people on the exact sentences they mean.

The review link is also the mentor system's foundation. When Stackd has its own mentors, they use the same review page; only the matching is new.

## Mobbin references

Grounded at build time: Claude Code searches Mobbin for (1) a document share sheet with "copy link" and access settings, (2) a web page where a guest comments on selected text without an account, (3) a comment list under a document with quoted text. Record the screens used in the PR. Where they disagree with this spec on behavior, this spec wins; report differences.

## 1. Bring a draft in

In the editor (17), when the answer is empty, the text area shows two text buttons under its placeholder, 16 below, 24 apart:

| Button | Does |
|---|---|
| `ClipboardText` "Paste a draft" | Reads the clipboard (asks iOS's permission the first time). Puts the text in |
| `FileArrowUp` "Import a file" | Opens the file picker for `.docx`, `.txt` and `.md`. Reads the text on the phone (no upload): `.docx` through `mammoth` (raw text only), others as text |

When the answer already has text, both live in the editor's overflow menu (`DotsThree` circle in the top bar, 44) instead, and bringing text in asks first: bottom sheet "Replace this draft?" / "Your current 212 words will be replaced." / "Replace" (primary) / "Add to the end" (text button) / "Cancel".

**Cleaning**: plain text only. Collapse 3+ line breaks to 2, trim spaces at line ends, straighten nothing (keep the student's quotes and dashes as typed). If the file has more than one answer in it, it all goes in; the student trims. Over 350 words is fine: the counter shows it (17).

Toast: "Draft added, {n} words."

Errors: unreadable file → inline under the buttons "Couldn't read that file. Try copying the text and using Paste a draft." Clipboard empty → "Nothing to paste. Copy your draft first."

## 2. Send a draft out

**Editor overflow menu** (`DotsThree`): "Copy text", "Share…", "Ask for review" (3), then the import items (1).

| Action | Does |
|---|---|
| Copy text | Copies the plain text. Toast: "Copied. Paste it into UC's application." |
| Share… | iOS share sheet (Capacitor Share) with the plain text and the subject "{short name}: personal insight answer" |

**Essays screen**: under the questions list, a text button `DownloadSimple` "Download all answers". Builds one `.txt` file named `stackd-personal-insight-answers.txt`: for each chosen or required question with text, its short name, then the answer, then "({n} words)", separated by a blank line. On iPhone it opens the share sheet with the file (Save to Files, Mail, AirDrop); on the web it downloads.

## 3. Ask someone to review

### Student side

"Ask for review" opens a bottom sheet:

```
Ask someone to review
Send a private link to a counselor, teacher or friend.
They can read this answer and leave comments.
No account needed.

Who's reviewing? (optional)
[ Ms. Lee                       ]

[        Create link           ]   primary
They'll see this version. You can turn
the link off any time; it ends after 14 days.
```

"Create link" makes the link, then opens the iOS share sheet with: "Could you review my UC personal insight answer? {link}". The sheet closes; toast "Link created."

The reviewer sees a **snapshot**: the text at the moment the link was made. The student keeps editing freely. In the review section (below), "Send latest version" updates the snapshot for that link; existing comments stay, and a comment whose quoted text no longer appears shows "This part has changed."

**Reviews section in the editor**: under the text, after a 1 px `--border` divider, 24 below the text:

| Part | Spec |
|---|---|
| Header | "Reviews" `title-3` `--navy-900`, with "{n} new" in a `progress` pill when there are unread comments |
| Per link | A row: reviewer label (or "Shared link"), "Created Oct 19, ends Nov 2" `caption` `--slate-600`. Right: text button "Turn off" (confirm sheet: "Turn off this link? Ms. Lee won't be able to open it. Comments stay." / "Turn off" / "Cancel"). Under it, "Send latest version" text button when the draft changed since the snapshot |
| Comments | Under each link, newest first. Each: the quoted phrase (if any) in `caption` `--slate-600` with a 2 px `--indigo-600` left bar, then the comment `body` `--navy-900`, then "{reviewer name}, Oct 19" `caption` `--slate-600`. Tapping a quoted phrase selects it in the text. A `DotsThree` per comment: "Mark resolved" (dims it to 0.5, moves to a collapsed "Resolved ({n})"), "Delete comment" |
| Empty | "No comments yet. They'll show here when your reviewer adds some." |

Get ready's "Write your personal insight answers" step (17 → Entry points) shows "{n} new comments" under its title instead of "{done} of 4 done" while there are unread comments.

### Reviewer side (web, no account)

Route: `/review/?t={token}` on the public website (the same static build deployed to the joinstackd Vercel project). No sign-in, no tab bar, never redirects to sign-in.

```
stackd
Review request
Ryan asked you to review a UC personal
insight answer.

Your major                          212 words
How you've prepared for your intended major…

┃ When I took my first CS class at Las
┃ Positas, I …                     (the text, read-only)

Select any part of the text to comment on it.

Your name  [ Ms. Lee            ]
[ Comment on the whole answer…          ]
[         Add comment          ]

Only people with this link can see this
answer. It ends on Nov 2.
```

| Part | Spec |
|---|---|
| Who asked | First name only, from the student's profile. Nothing else about the student: no school, no email |
| Text | The snapshot, `body-lg`, read-only, max width 640 centered on wide screens. Existing comments' phrases show a `--tint-indigo` highlight; tapping one shows its comments |
| Comment on a selection | Selecting text shows a floating "Comment" button above the selection. It opens a small box with the quoted phrase, a text field (max 1,000 characters) and "Add comment" |
| Name | Required before the first comment, remembered in this browser (localStorage). 1–60 characters |
| Their comments | Listed under the text; the reviewer can delete their own (same browser) within 15 minutes |
| Ended or off | "This review link has ended. Ask the student for a new one." No text shown |

Accessibility: the selection flow also works by keyboard (select with Shift + arrows, then a visible "Comment on selection" button below the text).

### How it works

- **Token**: 32 random bytes, URL-safe. Only its SHA-256 hash is stored. The full link is shown once, at creation (it's in the share sheet; the student can create a new one any time).
- **Edge Function `review`** (service role): `GET` with the token returns the snapshot, question, student first name, comments and end date if the link is live; `POST` adds or deletes a comment. Checks: link exists, not turned off, not ended; name 1–60, comment 1–1,000 characters; quoted phrase (if any) appears in the snapshot; at most 60 comments per link per day. Reviewers never touch the database directly.
- **Students** read their links and comments through row-level security (owner only), and turn off, resolve, delete and send-latest through owner-checked database functions.

### Data

| Table | Columns | Access |
|---|---|---|
| `review_links` | `id`, `user_id`, `draft_id`, `token_hash` (unique), `reviewer_label`, `snapshot_body`, `snapshot_words`, `snapshot_at`, `created_at`, `expires_at` (created + 14 days), `revoked_at`, `mentor_id` (null; for mentors later) | Owner reads; owner-checked functions create, revoke, refresh snapshot. The function reads by token hash |
| `review_comments` | `id`, `link_id`, `reviewer_name`, `body`, `quote`, `created_at`, `resolved_at`, `read_at`, `deleted_at` | Owner (through the link) reads, resolves, marks read, deletes. Only the function inserts |

Deleting the account deletes both (extend `delete_my_account()`). Deleting a draft deletes its links and comments.

### Safety and Apple

- Comments are seen only by the student who shared the link; nobody else can browse them. The student can delete any comment and turn off any link, which covers Apple's requirement to remove unwanted content from others.
- Report: each comment's menu also has "Report", which emails joinstackd@gmail.com with the comment id (mailto) so we can act on abuse.
- Privacy page: add that a student can share an answer by private link, that anyone with the link can read that version and leave comments under the name they type, that links end after 14 days or when turned off, and that comments are deleted with the account.

## Building it

| Part | Notes |
|---|---|
| 1 and 2 | App only, no migration. `mammoth` for .docx; Capacitor Share and Clipboard plugins (or the web APIs where they work in the iOS web view) |
| 3, data | Migration PR: the two tables, row-level security, owner functions, delete-account change, tests that one student can't read another's links or comments and that a reviewer can't read a turned-off or ended link |
| 3, function | `review` Edge Function; deploy with `npx supabase functions deploy review` (Ryan, after review) |
| 3, screens | Student sheet, reviews section, and the web review page; the web page also needs a Vercel redeploy |

## Test

- Empty answer: "Paste a draft" with 280 words on the clipboard fills the editor; the counter reads 280 / 350; toast "Draft added, 280 words."
- Import a .docx with headings and bold: plain text arrives, no formatting characters.
- Answer with text, Import: the replace sheet; "Add to the end" appends.
- Copy text, paste in Notes: identical plain text.
- Download all answers with 2 drafts: one .txt with both, each with its short name and word count.
- Ask for review with "Ms. Lee": the share sheet has the message and link; the Reviews section shows "Ms. Lee" with today and the end date.
- Open the link signed out in another browser: the first name, the question, the text, no school or email. Select a phrase, comment as "Ms. Lee": it appears with the quote highlighted.
- Back in the app: Get ready's writing step says "1 new comment" under its title; the editor shows the comment with its quote; tapping the quote selects it in the text.
- Edit the draft, "Send latest version": the reviewer page shows the new text; a comment on removed text shows "This part has changed."
- Turn off the link: the reviewer page shows the ended message on reload. A link older than 14 days does too.
- 61st comment in a day on one link: refused with "This link has reached today's comment limit."
- Another student's account can't see these links or comments (test:db).
- Delete account: links and comments are gone; the reviewer page shows the ended message.
