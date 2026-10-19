"use client";

import { MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

// soon: 14 days or less. open: the window is open. later: not open yet, or further off.
export type NodeKind = "soon" | "open" | "later" | "done" | "missed";

const BOUNCY = { type: "spring", stiffness: 260, damping: 16 } as const;

// The status dot on the spine (14 → Node by status), reusing 00's status colors. Done fills in with a spring.
// `big`: 16 instead of 12, for the open next row (15 → Timeline).
export function TimelineNode({ kind, big }: { kind: NodeKind; big?: boolean }) {
  if (kind === "done") {
    return (
      <MotionConfig reducedMotion="user">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ scale: BOUNCY, opacity: { duration: 0.12 } }}
          className="relative -mx-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-green-600 text-white"
        >
          <CheckIcon weight="bold" size={10} />
        </motion.span>
      </MotionConfig>
    );
  }
  return (
    <span
      className={cn(
        "relative block shrink-0 rounded-full",
        big ? "size-4" : "size-3",
        kind === "soon" && "bg-coral-500",
        kind === "open" && "border-[2.5px] border-blue-600 bg-surface",
        (kind === "later" || kind === "missed") && "border-2 border-slate-400 bg-sky-50",
      )}
    />
  );
}

type TimelineRowProps = {
  month: string;
  day: string;
  node: NodeKind;
  title: string;
  detail: string;
  // Right-aligned: a due pill, "Open now", "Done", or nothing
  status?: ReactNode;
  // Done and past rows
  dimmed?: boolean;
  // The spine runs up to the row above and down to the row below
  spineUp: boolean;
  spineDown: boolean;
  // The open next row's buttons, under its second line (15 → The next row opens)
  actions?: ReactNode;
  onOpen: () => void;
  "aria-label": string;
  "data-pressed"?: boolean;
};

// The open row's title line is centered 21 below its top (10 padding + half the 22 line); its node sits there
const OPEN_NODE_Y = "21px";

// One date on the timeline (14 → Timeline row): date block 40, node 12 on the spine, text, status. The whole row
// is one button. No lines between rows; the spine is what ties them together.
export function TimelineRow({ month, day, node, title, detail, status, dimmed, spineUp, spineDown, actions, onOpen, ...rest }: TimelineRowProps) {
  if (actions) {
    // The row's own button lies underneath, so tapping anywhere but the actions still opens the sheet
    return (
      <div className="relative">
        <button
          type="button"
          onClick={onOpen}
          {...rest}
          className="absolute inset-0 rounded-md transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120 focus-ring:-outline-offset-2"
        />
        {/* Date 40, node 12 and text, 12 apart; the buttons get their own line under the text and the status */}
        <div className="pointer-events-none relative grid grid-cols-[40px_12px_minmax(0,1fr)_auto] items-start gap-x-3 px-2 py-2.5">
          <span aria-hidden className="flex flex-col items-center">
            <span className="text-slate-600 type-caption">{month}</span>
            <span className="mt-0.5 tabular-nums text-navy-900 type-title-2">{day}</span>
          </span>
          <span aria-hidden className="relative row-span-2 -my-2.5 self-stretch">
            {spineUp && <span className="absolute left-1/2 top-0 w-0.5 -translate-x-1/2 bg-border-strong" style={{ height: OPEN_NODE_Y }} />}
            {spineDown && <span className="absolute bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-border-strong" style={{ top: OPEN_NODE_Y }} />}
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ top: OPEN_NODE_Y }}>
              <TimelineNode kind={node} big />
            </span>
          </span>
          <span aria-hidden className={cn("min-w-0", !status && "col-span-2")}>
            <span className="line-clamp-2 text-navy-900 type-row-title">{title}</span>
            <span className="mt-0.5 block text-slate-600 type-caption">{detail}</span>
          </span>
          {status && <span aria-hidden>{status}</span>}
          {/* Only the buttons take taps; the space beside them still opens the sheet */}
          <span className="col-span-2 col-start-3 mt-3 [&_button]:pointer-events-auto">{actions}</span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      {...rest}
      className="flex min-h-16 w-full items-center rounded-md px-2 py-2.5 text-left transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120 focus-ring:-outline-offset-2"
    >
      <span aria-hidden className="flex w-10 shrink-0 flex-col items-center">
        <span className="text-slate-600 type-caption">{month}</span>
        <span className={cn("mt-0.5 tabular-nums type-title-2", dimmed ? "text-slate-600" : "text-navy-900")}>{day}</span>
      </span>
      {/* The node column runs the row's full height, padding included, so the spine meets the next row's */}
      <span aria-hidden className="relative -my-2.5 ml-3 flex w-3 shrink-0 items-center justify-center self-stretch">
        {spineUp && <span className="absolute bottom-1/2 left-1/2 top-0 w-0.5 -translate-x-1/2 bg-border-strong" />}
        {spineDown && <span className="absolute bottom-0 left-1/2 top-1/2 w-0.5 -translate-x-1/2 bg-border-strong" />}
        <TimelineNode kind={node} />
      </span>
      <span aria-hidden className="ml-3 min-w-0 flex-1">
        <span className={cn("line-clamp-2 type-row-title", dimmed ? "text-slate-600" : "text-navy-900")}>{title}</span>
        <span className="mt-0.5 block text-slate-600 type-caption">{detail}</span>
      </span>
      {status && (
        <span aria-hidden className="ml-3 shrink-0">
          {status}
        </span>
      )}
    </button>
  );
}
