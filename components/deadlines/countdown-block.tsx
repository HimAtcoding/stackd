"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { WindowBar } from "@/components/ui/window-bar";
import { cn } from "@/lib/cn";
import { cardForLine, dueOnCard, SOON_DAYS, shortDate, timeLine, windowProgress, type Deadline, type Scope } from "@/lib/deadlines";

type CountdownBlockProps = {
  deadline: Deadline;
  now: Date;
  scope: Scope;
  // Counts from this number to the real one over 400 ms (the next-up card handing over after Mark done)
  countFrom?: number;
};

// The day count in heavy type, starting from `from` when given
function useCount(to: number, from: number | undefined) {
  const still = useReducedMotion();
  const [shown, setShown] = useState(from ?? to);
  const counting = from !== undefined && from !== to && !still;
  useEffect(() => {
    if (!counting) return;
    const run = animate(from, to, { duration: 0.4, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => run.stop();
  }, [counting, from, to]);
  return counting ? shown : to;
}

// The top layer's content (14 → The stack): the countdown, the date and time, and the window bar.
// Home's stack and the Deadlines screen's next-up card both draw it. Decorative; the parent names it.
export function CountdownBlock({ deadline: d, now, scope, countFrom }: CountdownBlockProps) {
  const soon = d.daysLeft <= SOON_DAYS;
  const count = useCount(d.daysLeft, countFrom);
  const time = timeLine(d);
  const forLine = cardForLine(d, scope);
  const progress = windowProgress(d, now);

  return (
    <div aria-hidden>
      <div className="flex">
        {/* 72 wide; a three-digit count widens it rather than overlapping the text */}
        <div className="min-w-18 shrink-0">
          {d.daysLeft <= 0 ? (
            <p className="text-coral-700 type-title-1">Today</p>
          ) : (
            <p className={cn("type-countdown", soon ? "text-coral-700" : "text-navy-900")}>{count}</p>
          )}
          <p className="mt-0.5 text-slate-600 type-caption">{d.daysLeft <= 0 ? "due tonight" : d.daysLeft === 1 ? "day left" : "days left"}</p>
        </div>
        <div className="ml-4 min-w-0 flex-1">
          <p className="truncate text-navy-900 type-headline">{d.title}</p>
          <p className="mt-1 text-slate-700 type-body">{dueOnCard(d)}</p>
          {time && <p className="text-slate-700 type-body">{time}</p>}
          {forLine && <p className="mt-0.5 text-slate-600 type-caption">{forLine}</p>}
        </div>
      </div>
      {d.opens_at && (
        <WindowBar
          className="mt-4"
          progress={progress}
          soon={soon}
          start={`${d.notOpenYet ? "Opens" : "Opened"} ${shortDate(d.opens_at)}`}
          end={shortDate(d.due_at)}
        />
      )}
    </div>
  );
}
