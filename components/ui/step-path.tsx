"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { stepLook } from "@/lib/step-icons";
import { BURST, StepBurst } from "./step-burst";

export type PathStep = {
  id: string;
  title: string;
  done: boolean;
  // A line under the current step's title ("1 of 4 written")
  caption?: string | null;
};

type StepPathProps = {
  steps: PathStep[];
  onToggle: (id: string, done: boolean) => void;
  onOpen: (id: string) => void;
  // One step left, and this checklist hasn't been finished on this device: the bigger burst
  finale?: boolean;
};

// The application checklist as a path (00 → Step path): a column of step circles joined by short bars. The circle is
// the step's check; the title opens its sheet. The first step not done is the current one, drawn bigger in blue.
// The order is the path, so there are no numbers.
export function StepPath({ steps, onToggle, onOpen, finale }: StepPathProps) {
  const current = steps.find((s) => !s.done)?.id;
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => (
        <li key={s.id} className="flex flex-col">
          {/* The bar starts under the circle above's 3 px edge */}
          {i > 0 && <span aria-hidden className="ml-[26px] mt-[3px] h-2.5 w-1 rounded-[4px] bg-border" />}
          <PathRow step={s} current={s.id === current} finale={Boolean(finale) && s.id === current} onToggle={onToggle} onOpen={onOpen} />
        </li>
      ))}
    </ol>
  );
}

function PathRow({ step, current, finale, onToggle, onOpen }: { step: PathStep; current: boolean; finale: boolean } & Omit<StepPathProps, "steps" | "finale">) {
  const still = useReducedMotion();
  const [taps, setTaps] = useState<{ n: number; big: boolean }>({ n: 0, big: false });
  const { icon: Glyph } = stepLook(step.title);
  return (
    <div className="flex items-center gap-3">
      {/* A 56 column, so 48 and 56 circles share one center line with the bars */}
      <span className="flex w-14 shrink-0 justify-center">
        <button
          type="button"
          role="checkbox"
          aria-checked={step.done}
          aria-label={step.title}
          onClick={() => {
            if (!step.done && !still) setTaps((t) => ({ n: t.n + 1, big: finale }));
            onToggle(step.id, !step.done);
          }}
          className={cn(
            "relative flex items-center justify-center rounded-full edge-sm",
            current ? "size-14" : "size-12",
            step.done
              ? "bg-green-600 text-white edge-green-700 focus-ring:outline-offset-3"
              : current
                ? "bg-blue-600 text-white edge-blue-700 focus-ring:outline-offset-3"
                : "border-[3px] border-border bg-surface text-slate-400",
          )}
        >
          {step.done ? <CheckIcon weight="bold" size={24} aria-hidden /> : <Glyph weight="fill" size={current ? 26 : 22} aria-hidden />}
          {step.done && !still && taps.n > 0 && <StepBurst key={taps.n} {...(taps.big ? BURST.finale : BURST.step)} />}
        </button>
      </span>
      <button type="button" onClick={() => onOpen(step.id)} className="group min-h-11 min-w-0 flex-1 rounded-sm py-1 text-left">
        <span className={cn("line-clamp-2 group-pressed:underline", current ? "type-headline" : "type-row-title", step.done ? "text-slate-600" : "text-navy-900")}>
          {step.title}
        </span>
        {current && step.caption && <span className="mt-0.5 block text-slate-600 tabular-nums type-caption">{step.caption}</span>}
      </button>
    </div>
  );
}
