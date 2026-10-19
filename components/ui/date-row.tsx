"use client";

import type { ReactNode } from "react";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

// soon: 14 days or less. open: the window is open. later: not open yet, or further off.
export type DateStatus = "soon" | "open" | "later" | "done" | "missed";

const TILE: Record<DateStatus, string> = {
  soon: "bg-coral-700 text-white",
  // An inset shadow, since browsers round a 1.5 border down to 1
  open: "bg-tint-sky text-blue-700 shadow-[inset_0_0_0_1.5px_var(--blue-600)]",
  later: "bg-surface text-slate-600 border border-border-strong",
  done: "bg-green-600 text-white",
  missed: "bg-surface text-slate-400 border border-border",
};

// The date tile (18 → Date tiles): month over day in a 48 square whose color carries the status. Done swaps the
// day for a check. Hidden from screen readers; the row's name carries the date.
export function DateTile({ month, day, status }: { month: string; day: string; status: DateStatus }) {
  return (
    <span aria-hidden className={cn("flex size-12 shrink-0 flex-col items-center justify-center rounded-md tabular-nums", TILE[status])}>
      <span className="type-caption font-semibold">{month}</span>
      {status === "done" ? <CheckIcon weight="bold" size={20} /> : <span className="type-title-3 font-extrabold">{day}</span>}
    </span>
  );
}

type DateRowProps = {
  month: string;
  day: string;
  status: DateStatus;
  title: string;
  detail: string;
  // Done and past rows
  dimmed?: boolean;
  // The open next row's buttons, on their own line under the text
  actions?: ReactNode;
  onOpen: () => void;
  "aria-label": string;
  "data-pressed"?: boolean;
};

const PRESS = "rounded-md transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120 focus-ring:-outline-offset-2";

// One date in the Deadlines list (18 → Date tiles): the tile, then the title and one line under it. Nothing on the
// right. The whole row is one button.
export function DateRow({ month, day, status, title, detail, dimmed, actions, onOpen, ...rest }: DateRowProps) {
  const text = (
    <span aria-hidden className="min-w-0 flex-1">
      <span className={cn("line-clamp-2 type-row-title", dimmed ? "text-slate-600" : "text-navy-900")}>{title}</span>
      <span className="mt-0.5 block text-slate-600 type-caption">{detail}</span>
    </span>
  );

  if (actions) {
    // The row's own button lies underneath, so tapping anywhere but the actions still opens the sheet
    return (
      <div className="relative">
        <button type="button" onClick={onOpen} {...rest} className={cn("absolute inset-0", PRESS)} />
        <div className="pointer-events-none relative flex min-h-16 items-start gap-3 px-2 py-3">
          <DateTile month={month} day={day} status={status} />
          <div className="min-w-0 flex-1">
            {text}
            {/* Only the buttons take taps; the space beside them still opens the sheet */}
            <div className="mt-3 [&_button]:pointer-events-auto">{actions}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button type="button" onClick={onOpen} {...rest} className={cn("flex min-h-16 w-full items-center gap-3 px-2 py-3 text-left", PRESS)}>
      <DateTile month={month} day={day} status={status} />
      {text}
    </button>
  );
}
