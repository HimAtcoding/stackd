"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { AfterWait } from "@/components/deadlines/after-wait";
import { CountdownBlock } from "@/components/deadlines/countdown-block";
import { TONE } from "@/components/ui/icon-circle";
import { TextLink } from "@/components/ui/text-link";
import type { DeadlinesState } from "@/lib/data/deadlines";
import { cycleLabel, shortDate, SOON_DAYS, stackLabel, type Deadline } from "@/lib/deadlines";
import { cn } from "@/lib/cn";
import { deadlinesHref } from "@/lib/features";

// A layer behind the top one: only its bottom 24 shows, with the date and title on its edge. White and flat.
function Peek({ deadline, layer }: { deadline: Deadline; layer: 2 | 3 }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex h-11 items-end gap-2 rounded-lg border-2 border-border bg-surface px-4 pb-1 type-caption",
        // The first starts 6 lower, so the hero's edge never covers its words (00 → Edges, Layout)
        layer === 2 ? "z-2 -mt-[14px] mx-3" : "z-1 -mt-5 mx-6",
      )}
    >
      <span className="shrink-0 font-black text-navy-900">{shortDate(deadline.due_at)}</span>
      <span className="min-w-0 truncate text-slate-600">{deadline.title}</span>
    </span>
  );
}

// The stack's outline at its real size, for a load over 600 ms, so Home doesn't jump
function StackOutline() {
  return (
    <AfterWait>
      <div aria-hidden className="mx-4 mt-3">
        <div className="relative z-3 h-[146px] rounded-hero bg-surface-pressed" />
        <div className="relative z-2 -mt-[14px] mx-3 h-11 rounded-lg border-2 border-border bg-surface" />
        <div className="relative z-1 -mt-5 mx-6 h-11 rounded-lg border-2 border-border bg-surface" />
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
          <Stack href={href} label={stackLabel(items, Boolean(href))} filled={Boolean(state.scope)}>
            {/* With a plan, the hero: blue, or coral at 14 days or less, sinking into its edge on press. With none,
                the setup card is the hero, so this steps down to a white tappable card (15 → Up next) */}
            <div
              className={cn(
                "relative z-3 p-4 edge-face",
                !state.scope
                  ? "rounded-lg border-2 border-border bg-surface edge-md"
                  : cn("rounded-hero text-white edge-lg", TONE[top.daysLeft <= SOON_DAYS ? "coral" : "blue"].fill, TONE[top.daysLeft <= SOON_DAYS ? "coral" : "blue"].edge),
              )}
              style={state.scope ? ({ "--partner": TONE[top.daysLeft <= SOON_DAYS ? "coral" : "blue"].partner } as CSSProperties) : undefined}
            >
              <CountdownBlock deadline={top} now={state.now} scope={state.scope} quiet={!state.scope} onFill={Boolean(state.scope)} />
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
function Stack({ href, label, filled, children }: { href: string | null; label: string; filled: boolean; children: ReactNode }) {
  const className = cn("group mx-4 mt-3 block", filled ? "rounded-hero focus-ring:outline-offset-3" : "rounded-lg focus-ring:outline-offset-2");
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
