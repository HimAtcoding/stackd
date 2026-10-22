import { forwardRef } from "react";
import { cn } from "@/lib/cn";

// Type, padding and wrapping shared by the answer field and the mirror behind it, so their lines break in the same
// places. Set in full on both rather than left to the textarea's defaults.
export const FIELD_TEXT = "box-border px-6 py-4 type-body-lg whitespace-pre-wrap break-words [word-break:normal] [tab-size:8]";

type DraftMirrorProps = { text: string; marks: { start: number; end: number }[] };

// The highlights behind the answer (20 → Highlights). A textarea can't style parts of its text, so this copy of the
// text sits under it with the words transparent and the marked phrases tinted and underlined. It starts at the
// field's top and grows with the same text; the field grows to fit too, so the two never scroll apart.
export const DraftMirror = forwardRef<HTMLDivElement, DraftMirrorProps>(function DraftMirror({ text, marks }, ref) {
  const runs: { text: string; start: number | null }[] = [];
  let at = 0;
  for (const m of marks) {
    if (m.end <= at) continue;
    const start = Math.max(m.start, at);
    if (start > at) runs.push({ text: text.slice(at, start), start: null });
    runs.push({ text: text.slice(start, m.end), start });
    at = m.end;
  }
  runs.push({ text: text.slice(at), start: null });

  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 select-none text-transparent", FIELD_TEXT)}>
      {runs.map((r, i) =>
        r.start === null ? (
          <span key={i}>{r.text}</span>
        ) : (
          <mark
            key={i}
            data-start={r.start}
            className="bg-tint-indigo text-transparent underline decoration-indigo-600 decoration-2 underline-offset-[3px] [text-decoration-skip-ink:none] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
          >
            {r.text}
          </mark>
        ),
      )}
      {/* A textarea shows a last empty line after a final line break; a div needs something on it to do the same */}
      {"\u200b"}
    </div>
  );
});
