"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useState } from "react";
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

function Row({ d, scope, spineUp, spineDown, onOpen, dimmed }: { d: Deadline; scope: Scope; spineUp: boolean; spineDown: boolean; onOpen: () => void; dimmed?: boolean }) {
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
};

// Every upcoming date grouped by month, on one spine per month (14 → Timeline). Month headers stay at the top
// while their rows are on screen. A date marked done shows its green node, then its row folds away.
export function Timeline({ rows, scope, onOpen }: TimelineProps) {
  const months: { key: string; title: string; rows: Deadline[] }[] = [];
  for (const d of rows) {
    const { key, title } = monthOf(d.due_at);
    const month = months.at(-1)?.key === key ? months.at(-1) : undefined;
    if (month) month.rows.push(d);
    else months.push({ key, title, rows: [d] });
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence initial={false}>
        {months.map((m, i) => (
          <motion.section key={m.key} aria-labelledby={`month-${m.key}`} exit={{ opacity: 0, height: 0 }} transition={COLLAPSE}>
            <h2
              id={`month-${m.key}`}
              className={cn("sticky z-10 bg-sky-50 px-6 py-2 text-navy-900 type-title-3", i === 0 ? "mt-2" : "mt-4")}
              style={{ top: "calc(var(--safe-top) + var(--strip-h))" }}
            >
              {m.title}
            </h2>
            <ul className="mx-2">
              <AnimatePresence initial={false}>
                {m.rows.map((d, j) => (
                  <motion.li key={d.id} exit={{ height: 0, opacity: 0 }} transition={COLLAPSE} className="overflow-hidden">
                    <Row d={d} scope={scope} spineUp={j > 0} spineDown={j < m.rows.length - 1} onOpen={() => onOpen(d.id)} />
                  </motion.li>
                ))}
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
