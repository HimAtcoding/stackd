"use client";

import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";
import { AfterWait } from "@/components/deadlines/after-wait";
import { CountdownBlock } from "@/components/deadlines/countdown-block";
import { TextLink } from "@/components/ui/text-link";
import type { DeadlinesState } from "@/lib/data/deadlines";
import { cycleLabel, shortDate, stackLabel, type Deadline } from "@/lib/deadlines";
import { cn } from "@/lib/cn";
import { deadlinesHref } from "@/lib/features";

const PEEK_SHADOW = "shadow-[0_1px_2px_rgba(5,16,66,.02),0_6px_16px_rgba(5,16,66,.025)]";

// A layer behind the top one: only its bottom 24 shows, with the date and title on its edge
function Peek({ deadline, layer }: { deadline: Deadline; layer: 2 | 3 }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative -mt-5 flex h-11 items-end gap-2 rounded-lg px-4 pb-1 type-caption transition-transform duration-200 ease-out group-pressed:duration-120",
        layer === 2 ? `z-2 mx-3 bg-stack-2 ${PEEK_SHADOW} motion-safe:group-pressed:translate-y-1` : "z-1 mx-6 border border-border bg-stack-3 motion-safe:group-pressed:translate-y-2",
      )}
    >
      <span className="shrink-0 font-semibold text-navy-900">{shortDate(deadline.due_at)}</span>
      <span className="min-w-0 truncate text-slate-600">{deadline.title}</span>
    </span>
  );
}

// The stack's outline at its real size, for a load over 600 ms, so Home doesn't jump
function StackOutline() {
  return (
    <AfterWait>
      <div aria-hidden className="mx-4 mt-3">
        <div className="h-[146px] rounded-lg bg-stack-2" />
        <div className="-mt-5 mx-3 h-11 rounded-lg bg-stack-2" />
        <div className="-mt-5 mx-6 h-11 rounded-lg bg-stack-3" />
      </div>
    </AfterWait>
  );
}

// Home's Up next (14): the next deadline as the top layer, the two after it peeking out underneath.
// The whole stack opens the Deadlines screen. If dates couldn't load, the section hides and Home stays whole.
export function UpNext({ state }: { state: DeadlinesState }) {
  if (state.status === "error") return null;
  const href = deadlinesHref();
  const items = state.status === "ok" ? state.view.upcoming.slice(0, 3) : [];
  const [top, ...peeks] = items;

  return (
    <section aria-labelledby="up-next-title" className="mt-6">
      <div className="flex items-baseline justify-between px-6">
        <h2 id="up-next-title" className="text-navy-900 type-title-2">
          Up next
        </h2>
        {href && (
          <TextLink href={href} transitionTypes={["push"]} size="label" className="-mx-2.5 px-2.5">
            All deadlines
          </TextLink>
        )}
      </div>

      {state.status === "loading" && <StackOutline />}

      {state.status === "ok" && !top && (
        <p className="mt-3 px-6 text-slate-600 type-body">
          No deadlines coming up for {cycleLabel(state.view.cycle).toLowerCase()}. We add the next cycle when schools publish their dates.
        </p>
      )}

      {state.status === "ok" && top && (
        <>
          <Stack href={href} label={stackLabel(items, Boolean(href))}>
            <div className="relative z-3 rounded-lg bg-surface p-4 shadow-card transition-colors duration-200 ease-out group-pressed:bg-surface-pressed group-pressed:duration-120">
              {/* The same object as the Deadlines screen's next-up card, for the push (14 → Motion) */}
              <ViewTransition name="next-deadline" share="next-deadline" enter="none" exit="none" update="none">
                <div>
                  <CountdownBlock deadline={top} now={state.now} scope={state.scope} />
                </div>
              </ViewTransition>
            </div>
            {peeks[0] && <Peek deadline={peeks[0]} layer={2} />}
            {peeks[1] && <Peek deadline={peeks[1]} layer={3} />}
          </Stack>
          {!state.scope && (
            <p className="mt-3 px-6 text-slate-600 type-caption">Showing UC and CSU dates. Set up your plan to see only yours.</p>
          )}
        </>
      )}
    </section>
  );
}

// One link around every layer. Without the Deadlines screen (its flag off) the stack is still read as one item.
function Stack({ href, label, children }: { href: string | null; label: string; children: ReactNode }) {
  const className = "group mx-4 mt-3 block rounded-lg focus-ring:outline-offset-2";
  if (!href) {
    return (
      <div role="group" aria-label={label} className={className}>
        {children}
      </div>
    );
  }
  return (
    <Link href={href} transitionTypes={["push"]} aria-label={label} className={className}>
      {children}
    </Link>
  );
}
