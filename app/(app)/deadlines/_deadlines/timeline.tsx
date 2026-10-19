"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { CaretDownIcon } from "@phosphor-icons/react/ssr";
import { Expand } from "@/components/ui/expand";
import { Pill } from "@/components/ui/pill";
import { TimelineRow } from "@/components/ui/timeline-row";
import { cn } from "@/lib/cn";
import { dateBlock, monthOf, rowDetail, rowLabel, shortDate, soonLabel, type Deadline, type Scope } from "@/lib/deadlines";

const COLLAPSE = { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] } as const;

function status(d: Deadline) {
  if (d.state === "soon") return <Pill variant="due">{soonLabel(d.daysLeft)}</Pill>;
  if (d.state === "open") return <span className="text-blue-700 type-caption font-semibold">Open now</span>;
  if (d.state === "done") return <span className="text-slate-600 type-caption">Done</span>;
  if (d.state === "missed") return <span className="text-slate-600 type-caption">Closed {shortDate(d.due_at)}</span>;
  return null;
}

type RowProps = { d: Deadline; scope: Scope; spineUp: boolean; spineDown: boolean; onOpen: () => void; dimmed?: boolean; actions?: ReactNode };

function Row({ d, scope, spineUp, spineDown, onOpen, dimmed, actions }: RowProps) {
  const { month, day } = dateBlock(d.due_at);
  return (
    <TimelineRow
      month={month}
      day={day}
      node={d.state}
      title={d.title}
      detail={rowDetail(d, scope)}
      status={status(d)}
      dimmed={dimmed}
      spineUp={spineUp}
      spineDown={spineDown}
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

// x of the spine's center: row padding 16 + date block 40 + 12 + half the 12 node
const SPINE_X = "73px";

// Every upcoming date grouped by month, on one spine from the first row's node to the last (15 → Timeline). The
// month headers sit in the text column and stay at the top while their rows are on screen. The first date not done
// opens with its buttons. A date marked done fades its buttons, then folds away and the next row's buttons fade in.
export function Timeline({ rows, scope, onOpen, actions }: TimelineProps) {
  const still = useReducedMotion();
  const collapse = still ? { duration: 0 } : COLLAPSE;
  const months: { key: string; title: string; rows: Deadline[] }[] = [];
  for (const d of rows) {
    const { key, title } = monthOf(d.due_at);
    const month = months.at(-1)?.key === key ? months.at(-1) : undefined;
    if (month) month.rows.push(d);
    else months.push({ key, title, rows: [d] });
  }
  const order = new Map(rows.map((d, i) => [d.id, i]));
  const last = rows.length - 1;

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

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence initial={false}>
        {months.map((m, i) => (
          <motion.section key={m.key} aria-labelledby={`month-${m.key}`} exit={{ opacity: 0, height: 0 }} transition={collapse}>
            {/* The space sits above the header, so each header belongs to the row under it: 24 above (the first one is the space below the Deadlines panel), 4 below */}
            <h2
              id={`month-${m.key}`}
              className="sticky z-10 bg-sky-50 pb-1 pt-6 pl-[92px] pr-6 text-slate-600 type-label"
              style={{ top: "calc(var(--safe-top) + var(--strip-h))" }}
            >
              {/* The spine carries on behind the header between two months */}
              {i > 0 && <span aria-hidden className="absolute inset-y-0 w-0.5 bg-border-strong" style={{ left: SPINE_X }} />}
              {m.title}
            </h2>
            <ul className="mx-2">
              <AnimatePresence initial={false}>
                {m.rows.map((d) => {
                  const at = order.get(d.id) ?? 0;
                  return (
                    <motion.li key={d.id} exit={{ height: 0, opacity: 0 }} transition={collapse} className="overflow-hidden">
                      <Row d={d} scope={scope} spineUp={at > 0} spineDown={at < last} actions={rowActions(d)} onOpen={() => onOpen(d.id)} />
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </motion.section>
        ))}
      </AnimatePresence>
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
          <ul className="mx-2">
            {rows.map((d, j) => (
              <li key={d.id}>
                <Row d={d} scope={scope} dimmed spineUp={j > 0} spineDown={j < rows.length - 1} onOpen={() => onOpen(d.id)} />
              </li>
            ))}
          </ul>
        </Expand>
      </div>
    </section>
  );
}
