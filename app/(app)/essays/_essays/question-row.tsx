"use client";

import { CheckCircleIcon, PencilLineIcon } from "@phosphor-icons/react/ssr";
import { ChoiceCircle } from "@/components/ui/choice-row";
import { cn } from "@/lib/cn";
import { rowStatus, type Draft, type Prompt } from "@/lib/essays";

type QuestionRowProps = {
  prompt: Prompt;
  draft: Draft | undefined;
  // Optional questions only: the choice circle and what tapping it does. Absent on the required question.
  choice?: { chosen: boolean; dimmed: boolean; onToggle: () => void };
  onOpen: () => void;
};

function statusText(draft: Draft | undefined) {
  const s = rowStatus(draft);
  if (s.kind === "done") return "Done";
  if (s.kind === "words") return `${s.words} ${s.words === 1 ? "word" : "words"}`;
  return "Not started";
}

// One question (17 → Question row): the choice circle or the required tile, the short name and summary, and how
// far the answer is. The whole row opens the editor; the circle is its own button.
export function QuestionRow({ prompt, draft, choice, onOpen }: QuestionRowProps) {
  const status = rowStatus(draft);
  const chosenText = choice ? (choice.chosen ? ", chosen" : ", not chosen") : ", required";
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${prompt.short_name}${chosenText}. ${prompt.summary} ${statusText(draft)}.`}
        className="absolute inset-0 transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120 focus-ring:-outline-offset-2"
      />
      <div className="pointer-events-none relative flex min-h-16 items-center gap-3 px-4 py-2.5">
        {/* A 36 slot either way, so every row's text starts at the same place */}
        {choice ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={choice.chosen}
            aria-label={`Choose ${prompt.short_name}`}
            onClick={choice.onToggle}
            className="pointer-events-auto -m-1 flex size-11 shrink-0 items-center justify-center rounded-full"
          >
            <span className={cn("transition-opacity duration-120 ease-out", choice.dimmed && "opacity-40")}>
              <ChoiceCircle checked={choice.chosen} />
            </span>
          </button>
        ) : (
          <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-tint-indigo text-indigo-600">
            <PencilLineIcon weight="duotone" size={20} />
          </span>
        )}
        <span aria-hidden className="min-w-0 flex-1">
          <span className="block text-navy-900 type-row-title">{prompt.short_name}</span>
          <span className="mt-0.5 line-clamp-2 text-slate-600 type-caption">{prompt.summary}</span>
        </span>
        <span aria-hidden className="flex shrink-0 items-center gap-1 tabular-nums type-caption">
          {status.kind === "done" ? (
            <>
              <CheckCircleIcon weight="fill" size={16} className="text-green-600" />
              <span className="text-navy-900">Done</span>
            </>
          ) : (
            <span className={status.kind === "words" && status.over ? "text-coral-700" : "text-slate-600"}>{statusText(draft)}</span>
          )}
        </span>
      </div>
    </li>
  );
}
