"use client";

import { useEffect, useState } from "react";
import { DotsThreeIcon } from "@phosphor-icons/react/ssr";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Pill } from "@/components/ui/pill";
import { SUPPORT_EMAIL } from "@/lib/about";
import { cn } from "@/lib/cn";
import { markRead, sendLatestVersion, setComment, turnOffLink, type ReviewComment, type ReviewLink } from "@/lib/data/reviews";
import { shortDate } from "@/lib/deadlines";
import { linkDates, linkLive, quoteChanged } from "@/lib/review";
import { ConfirmSheet } from "./confirm-sheet";

type ReviewsSectionProps = {
  links: ReviewLink[];
  // The editor's text now, to tell whether a link's snapshot is behind and whether a quote is still there
  text: string;
  onSelectQuote: (quote: string) => void;
  onToast: (text: string) => void;
};

// The Reviews section under the answer (19 → Student side): each link, newest first, with its comments
export function ReviewsSection({ links, text, onSelectQuote, onToast }: ReviewsSectionProps) {
  // Comments that were unread when they showed here, for the "{n} new" pill; showing them marks them read
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());
  const unreadKey = links.flatMap((l) => l.comments.filter((c) => !c.read_at).map((c) => c.id)).join(",");
  const [seen, setSeen] = useState("");
  if (unreadKey && unreadKey !== seen) {
    setSeen(unreadKey);
    setFresh((prev) => new Set([...prev, ...unreadKey.split(",")]));
  }
  useEffect(() => {
    if (unreadKey) markRead(links);
  }, [unreadKey, links]);

  const [menu, setMenu] = useState<{ comment: ReviewComment; open: boolean } | null>(null);
  const [turningOff, setTurningOff] = useState<{ link: ReviewLink; open: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function sendLatest(link: ReviewLink) {
    setBusy(link.id);
    const ok = await sendLatestVersion(link);
    setBusy(null);
    onToast(ok ? "Latest version sent." : "Couldn't send it. Check your connection, then try again.");
  }

  async function commentAction(action: "resolve" | "unresolve" | "delete") {
    if (!menu) return;
    setMenu({ ...menu, open: false });
    const ok = await setComment(menu.comment.id, action);
    if (!ok) onToast("Couldn't change that comment. Check your connection, then try again.");
  }

  const newCount = links.reduce((n, l) => n + l.comments.filter((c) => fresh.has(c.id)).length, 0);

  return (
    <section aria-labelledby="reviews-title" className="mt-6 border-t border-border px-6 pt-6">
      <div className="flex items-center gap-3">
        <h2 id="reviews-title" className="text-navy-900 type-title-3">
          Reviews
        </h2>
        {newCount > 0 && <Pill variant="progress">{newCount} new</Pill>}
      </div>

      <ul className="mt-4 space-y-6">
        {links.map((link) => {
          const live = linkLive(link);
          const open = link.comments.filter((c) => !c.resolved_at);
          const resolved = link.comments.filter((c) => c.resolved_at);
          return (
            <li key={link.id}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-navy-900 type-row-title">{link.reviewer_label ?? "Shared link"}</p>
                  <p className="text-slate-600 type-caption">{linkDates(link)}</p>
                </div>
                {live && (
                  <button
                    type="button"
                    onClick={() => setTurningOff({ link, open: true })}
                    className="-my-3 shrink-0 py-3 text-blue-600 type-label pressed:underline focus-ring:underline"
                  >
                    Turn off
                  </button>
                )}
              </div>
              {live && link.snapshot_body !== text && text.trim() && (
                <button
                  type="button"
                  disabled={busy === link.id}
                  onClick={() => sendLatest(link)}
                  className="-my-[13px] mt-1 py-[13px] text-blue-600 type-label pressed:underline focus-ring:underline disabled:opacity-40"
                >
                  {busy === link.id ? "Sending…" : "Send latest version"}
                </button>
              )}

              {link.comments.length === 0 ? (
                <p className="mt-3 text-slate-600 type-body">No comments yet. They&apos;ll show here when your reviewer adds some.</p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {open.map((c) => (
                    <Comment key={c.id} comment={c} snapshot={link.snapshot_body} text={text} onSelectQuote={onSelectQuote} onMenu={() => setMenu({ comment: c, open: true })} />
                  ))}
                </ul>
              )}
              {resolved.length > 0 && (
                <details className="mt-4">
                  <summary className="-my-3 cursor-pointer py-3 text-slate-600 type-label">Resolved ({resolved.length})</summary>
                  <ul className="mt-3 space-y-4 opacity-50">
                    {resolved.map((c) => (
                      <Comment key={c.id} comment={c} snapshot={link.snapshot_body} text={text} onSelectQuote={onSelectQuote} onMenu={() => setMenu({ comment: c, open: true })} />
                    ))}
                  </ul>
                </details>
              )}
            </li>
          );
        })}
      </ul>

      <BottomSheet open={Boolean(menu?.open)} onClose={() => setMenu((m) => (m ? { ...m, open: false } : m))} labelledBy="comment-menu-title">
        <h2 id="comment-menu-title" tabIndex={-1} className="truncate text-navy-900 type-title-2 focus:outline-none">
          Comment from {menu?.comment.reviewer_name}
        </h2>
        <ul className="-mx-6 mt-3 divide-y divide-border border-y border-border">
          <li>
            <MenuButton onClick={() => commentAction(menu?.comment.resolved_at ? "unresolve" : "resolve")}>
              {menu?.comment.resolved_at ? "Mark not resolved" : "Mark resolved"}
            </MenuButton>
          </li>
          <li>
            <MenuButton onClick={() => commentAction("delete")} danger>
              Delete comment
            </MenuButton>
          </li>
          <li>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Report a review comment")}&body=${encodeURIComponent(`Comment ${menu?.comment.id ?? ""}\n\nWhat's wrong with it:\n`)}`}
              onClick={() => setMenu((m) => (m ? { ...m, open: false } : m))}
              className="flex h-14 w-full items-center px-6 text-left text-coral-700 type-row-title transition-colors duration-200 ease-out pressed:bg-surface-pressed focus-ring:-outline-offset-2"
            >
              Report
            </a>
          </li>
        </ul>
      </BottomSheet>

      <ConfirmSheet
        open={Boolean(turningOff?.open)}
        id="turn-off-title"
        title="Turn off this link?"
        body={`${turningOff?.link.reviewer_label ?? "Whoever has it"} won't be able to open it. Comments stay.`}
        confirm="Turn off"
        busy={busy === turningOff?.link.id}
        onClose={() => setTurningOff((t) => (t ? { ...t, open: false } : t))}
        onConfirm={async () => {
          if (!turningOff) return;
          setBusy(turningOff.link.id);
          const ok = await turnOffLink(turningOff.link.id);
          setBusy(null);
          setTurningOff((t) => (t ? { ...t, open: false } : t));
          onToast(ok ? "Link turned off." : "Couldn't turn it off. Check your connection, then try again.");
        }}
      />
    </section>
  );
}

function MenuButton({ children, onClick, danger }: { children: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 w-full items-center px-6 text-left type-row-title transition-colors duration-200 ease-out pressed:bg-surface-pressed focus-ring:-outline-offset-2",
        danger ? "text-coral-700" : "text-navy-900",
      )}
    >
      {children}
    </button>
  );
}

type CommentProps = { comment: ReviewComment; snapshot: string; text: string; onSelectQuote: (q: string) => void; onMenu: () => void };

// A quoted phrase with a 2 indigo bar, the comment, then who and when (19 → Comments)
function Comment({ comment, snapshot, text, onSelectQuote, onMenu }: CommentProps) {
  const { quote } = comment;
  // Changed when the reviewer's version moved on (Send latest version) or the student has edited it away since
  const gone = quote ? quoteChanged(quote, snapshot) || quoteChanged(quote, text) : false;
  return (
    <li className="flex gap-2">
      <div className="min-w-0 flex-1">
        {quote &&
          (gone ? (
            <p className="border-l-2 border-indigo-600 pl-3 text-slate-600 type-caption">
              &ldquo;{quote}&rdquo; <span className="italic">This part has changed.</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onSelectQuote(quote)}
              aria-label={`Show "${quote}" in your answer`}
              className="block border-l-2 border-indigo-600 pl-3 text-left text-slate-600 type-caption pressed:underline focus-ring:underline"
            >
              &ldquo;{quote}&rdquo;
            </button>
          ))}
        <p className={cn("whitespace-pre-wrap break-words text-navy-900 type-body", quote && "mt-1")}>{comment.body}</p>
        <p className="mt-1 text-slate-600 type-caption">
          {comment.reviewer_name}, {shortDate(comment.created_at)}
        </p>
      </div>
      <button
        type="button"
        onClick={onMenu}
        aria-label={`More for the comment from ${comment.reviewer_name}`}
        className="-mr-3 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-slate-600 pressed:bg-surface-pressed"
      >
        <DotsThreeIcon weight="bold" size={22} aria-hidden />
      </button>
    </li>
  );
}
