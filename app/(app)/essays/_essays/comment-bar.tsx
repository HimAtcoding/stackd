"use client";

type CommentBarProps = {
  name: string;
  body: string;
  onSeeComment: () => void;
  // Called when a press starts on the bar, before the answer field loses focus
  onPress: () => void;
};

// The bar above the word counter while the caret is in a marked phrase (20 → Comment bar), like Google Docs on a
// phone: who commented and the newest comment, with a way to the full comment in Reviews. Not a card, so no shadow.
export function CommentBar({ name, body, onSeeComment, onPress }: CommentBarProps) {
  return (
    <section
      aria-label="Comment on this part"
      data-comment-bar
      className="border-t border-border bg-surface px-6 py-3"
      onPointerDown={onPress}
      // Keeps the caret in the answer where the browser allows it, so the bar stays put
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="border-l-2 border-indigo-600 pl-3" aria-live="polite">
        <div className="flex items-baseline gap-3">
          <p className="min-w-0 flex-1 truncate text-navy-900 type-label">{name}</p>
          <button
            type="button"
            onClick={onSeeComment}
            className="-my-3 shrink-0 py-3 text-blue-600 type-label pressed:underline focus-ring:underline"
          >
            See comment
          </button>
        </div>
        <p className="line-clamp-2 break-words text-navy-900 type-body">{body}</p>
      </div>
    </section>
  );
}
