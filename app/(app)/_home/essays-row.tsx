"use client";

import Link from "next/link";
import { PencilLineIcon } from "@phosphor-icons/react/ssr";
import { useEssaysDone } from "@/lib/data/essays";
import { useUnreadComments } from "@/lib/data/reviews";
import { ANSWERS } from "@/lib/essays";
import { essaysHref } from "@/lib/features";
import { newComments } from "@/lib/review";

// Home's way into Essays (17 → Entry points): a tier 2 row under Get ready, with how many answers are done.
// Home renders it only when Essays is on and the plan includes a UC. Unread review comments take the count's place (19).
export function EssaysRow({ term }: { term: string | null }) {
  const done = useEssaysDone(term);
  const unread = useUnreadComments();
  const href = essaysHref();
  if (!href || done === null) return null;
  const status = unread > 0 ? newComments(unread) : `${done} of ${ANSWERS} done`;
  return (
    <Link
      href={href}
      transitionTypes={["push"]}
      aria-label={`Personal insight answers, ${status}`}
      className="mx-4 mt-6 flex min-h-14 items-center gap-3 rounded-md border border-border bg-surface px-4 transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120"
    >
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-tint-indigo text-indigo-600">
        <PencilLineIcon weight="duotone" size={20} />
      </span>
      <span aria-hidden className="min-w-0 flex-1 text-navy-900 type-row-title">
        Personal insight answers
      </span>
      <span aria-hidden className="shrink-0 text-slate-600 tabular-nums type-caption">
        {status}
      </span>
    </Link>
  );
}
