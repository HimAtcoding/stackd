"use client";

import { cn } from "@/lib/cn";
import { shortDate } from "@/lib/deadlines";
import { findQuote, orderComments } from "@/lib/review";

export type Comment = { id: string; reviewer_name: string; body: string; quote: string | null; created_at: string; mine: boolean; can_delete: boolean };

type CommentListProps = {
  comments: Comment[];
  snapshot: string;
  // Comments outlined for a moment after their phrase was tapped (wide screens)
  outlined: string[];
  onQuote: (comment: Comment) => void;
  onDelete: (id: string) => void;
};

// The comments under the text, or in the rail on wide screens (20 → Comments list): whole-answer comments first, then
// in the order their phrases appear. Two labels only when both kinds are there.
export function CommentList({ comments, snapshot, outlined, onQuote, onDelete }: CommentListProps) {
  const ordered = orderComments(snapshot, comments);
  const whole = ordered.filter((c) => c.quote === null);
  const parts = ordered.filter((c) => c.quote !== null);
  const labelled = whole.length > 0 && parts.length > 0;
  const group = (list: Comment[], label: string) =>
    list.length > 0 && (
      <div className="mt-4 first:mt-0">
        {labelled && <h3 className="mb-2 text-slate-600 type-label">{label}</h3>}
        <ul className="space-y-1">
          {list.map((c) => (
            <CommentRow key={c.id} comment={c} snapshot={snapshot} outlined={outlined.includes(c.id)} onQuote={onQuote} onDelete={onDelete} />
          ))}
        </ul>
      </div>
    );
  return (
    <>
      {group(whole, "On the whole answer")}
      {group(parts, "On parts of the answer")}
    </>
  );
}

type CommentRowProps = { comment: Comment; snapshot?: string; outlined?: boolean; onQuote?: (comment: Comment) => void; onDelete: (id: string) => void };

// One comment: the quoted phrase with an indigo bar, the comment, then who and when, with Delete for your own while
// it can still be deleted
export function CommentRow({ comment, snapshot, outlined, onQuote, onDelete }: CommentRowProps) {
  const { quote } = comment;
  const findable = quote !== null && onQuote && snapshot !== undefined && findQuote(snapshot, quote) !== null;
  return (
    <li
      id={`rc-${comment.id}`}
      className={cn("-mx-2 scroll-my-4 rounded-sm px-2 py-2 outline-2 outline-offset-0", outlined ? "outline outline-indigo-600" : "outline-transparent")}
    >
      {quote !== null &&
        (findable ? (
          <button
            type="button"
            onClick={() => onQuote(comment)}
            aria-label={`Show "${quote}" in the text`}
            className="block border-l-2 border-indigo-600 pl-3 text-left text-slate-600 type-caption pressed:underline focus-ring:underline"
          >
            &ldquo;{quote}&rdquo;
          </button>
        ) : (
          <p className="border-l-2 border-indigo-600 pl-3 text-slate-600 type-caption">&ldquo;{quote}&rdquo;</p>
        ))}
      <p className={cn("whitespace-pre-wrap break-words text-navy-900 type-body", quote !== null && "mt-1")}>{comment.body}</p>
      <p className="mt-1 text-slate-600 type-caption">
        {comment.reviewer_name}, {shortDate(comment.created_at)}
        {comment.can_delete && (
          <>
            {", "}
            <button type="button" onClick={() => onDelete(comment.id)} className="-my-3 py-3 text-coral-700 type-caption pressed:underline focus-ring:underline">
              Delete
            </button>
          </>
        )}
      </p>
    </li>
  );
}
