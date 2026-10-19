import { WindowBar } from "@/components/ui/window-bar";
import { cn } from "@/lib/cn";
import { cardForLine, dueOnCard, SOON_DAYS, shortDate, timeLine, windowProgress, type Deadline, type Scope } from "@/lib/deadlines";

type CountdownBlockProps = {
  deadline: Deadline;
  now: Date;
  scope: Scope;
  // No plan: the setup card is Home's hero, so the number steps down to title-1 (15 → Up next)
  quiet?: boolean;
  // On the solid blue or coral hero (16): every word white, at full opacity
  onFill?: boolean;
};

// The top layer's content (14 → The stack): the countdown, the date and time, and the window bar.
// Decorative; the stack names it.
export function CountdownBlock({ deadline: d, now, scope, quiet, onFill }: CountdownBlockProps) {
  const soon = d.daysLeft <= SOON_DAYS;
  const time = timeLine(d);
  const forLine = cardForLine(d, scope);
  const progress = windowProgress(d, now);
  const main = onFill ? "text-white" : "text-navy-900";
  const quietText = onFill ? "text-white" : "text-slate-600";
  const dueText = onFill ? "text-white" : "text-slate-700";

  return (
    <div aria-hidden>
      <div className="flex">
        {/* 72 wide; a three-digit count widens it rather than overlapping the text */}
        <div className="min-w-18 shrink-0">
          {d.daysLeft <= 0 ? (
            <p className={cn("type-title-1", onFill ? "text-white" : "text-coral-700")}>Today</p>
          ) : (
            <p className={cn(quiet ? "type-title-1" : "type-countdown", onFill ? "text-white" : soon ? "text-coral-700" : "text-navy-900")}>
              {d.daysLeft}
            </p>
          )}
          <p className={cn("mt-0.5 type-caption", quietText)}>{d.daysLeft <= 0 ? "Due today" : d.daysLeft === 1 ? "day left" : "days left"}</p>
        </div>
        <div className="ml-4 min-w-0 flex-1">
          <p className={cn("truncate type-headline", main)}>{d.title}</p>
          <p className={cn("mt-1 type-body", dueText)}>{dueOnCard(d)}</p>
          {time && <p className={cn("type-body", dueText)}>{time}</p>}
          {forLine && <p className={cn("mt-0.5 type-caption", quietText)}>{forLine}</p>}
        </div>
      </div>
      {d.opens_at && (
        <WindowBar
          className="mt-4"
          progress={progress}
          soon={soon}
          onFill={onFill}
          start={`${d.notOpenYet ? "Opens" : "Opened"} ${shortDate(d.opens_at)}`}
          end={shortDate(d.due_at)}
        />
      )}
    </div>
  );
}
