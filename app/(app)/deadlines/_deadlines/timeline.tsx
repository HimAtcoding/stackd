"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { CaretDownIcon } from "@phosphor-icons/react/ssr";
import { DateRow } from "@/components/ui/date-row";
import { Expand } from "@/components/ui/expand";
import { cn } from "@/lib/cn";
import { dateBlock, rowDetail, rowLabel, type Deadline, type Scope } from "@/lib/deadlines";

const COLLAPSE = { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] } as const;

type RowProps = { d: Deadline; scope: Scope; onOpen: () => void; dimmed?: boolean; actions?: ReactNode };

function Row({ d, scope, onOpen, dimmed, actions }: RowProps) {
  const { month, day } = dateBlock(d.due_at);
  return (
    <DateRow
      month={month}
      day={day}
      status={d.state}
      title={d.title}
      detail={rowDetail(d, scope)}
      dimmed={dimmed}
      actions={actions}
      onOpen={onOpen}
      aria-label={rowLabel(d)}
    />
  );
}

type TimelineProps = {
  // Upcoming dates, soonest first, plus any just marked done that are still settling
  rows: Deadline[];
  scope: Scope;
  onOpen: (id: string) => void;
  // The buttons the next row opens with (15 → The next row opens)
  actions?: (d: Deadline) => ReactNode;
};

// Every upcoming date as a plain list of date-tile rows, 4 apart, no dividers (18 → Date tiles). The first date not
// done opens with its buttons. A date marked done fades its buttons, then folds away and the next row's buttons fade in.
export function Timeline({ rows, scope, onOpen, actions }: TimelineProps) {
  const still = useReducedMotion();
  const collapse = still ? { duration: 0 } : COLLAPSE;

  // The open row, the one before it (fading out while it settles), and the first one shown, which doesn't fade in
  const openId = rows.find((d) => d.state !== "done")?.id;
  const [opened, setOpened] = useState({ open: openId, closing: undefined as string | undefined, first: openId });
  if (opened.open !== openId) setOpened({ open: openId, closing: opened.open, first: opened.first });

  function rowActions(d: Deadline) {
    if (!actions) return undefined;
    const closing = d.id === opened.closing && d.state === "done";
    if (d.id !== openId && !closing) return undefined;
    return (
      <motion.span
        key={closing ? "out" : "in"}
        initial={closing || d.id === opened.first ? false : { opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: still ? 0 : closing ? 0.12 : 0.16 }}
        className="flex flex-wrap items-center gap-4"
      >
        {actions(d)}
      </motion.span>
    );
  }

  if (rows.length === 0) return null;
  return (
    <MotionConfig reducedMotion="user">
      {/* The first tile sits 24 below whatever is above the list */}
      <ul aria-label="Upcoming deadlines" className="mx-2 mt-3">
        <AnimatePresence initial={false}>
          {rows.map((d) => (
            <motion.li key={d.id} exit={{ height: 0, opacity: 0 }} transition={collapse} className="overflow-hidden pt-1 first:pt-0">
              <Row d={d} scope={scope} actions={rowActions(d)} onOpen={() => onOpen(d.id)} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </MotionConfig>
  );
}

// "Done and past ({n})", collapsed until opened. Newest first, dimmed.
export function DonePast({ rows, scope, onOpen }: TimelineProps) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="mx-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="done-past"
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 w-full items-center justify-between rounded-md px-4 text-left text-navy-900 tabular-nums type-row-title transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120"
        >
          Done and past ({rows.length})
          <CaretDownIcon weight="bold" size={20} aria-hidden className={cn("transition-transform duration-200 ease-out", open && "rotate-180")} />
        </button>
      </h2>
      <div id="done-past">
        <Expand open={open}>
          <ul className="mx-2 flex flex-col gap-1">
            {rows.map((d) => (
              <li key={d.id}>
                <Row d={d} scope={scope} dimmed onOpen={() => onOpen(d.id)} />
              </li>
            ))}
          </ul>
        </Expand>
      </div>
    </section>
  );
}
