"use client";

import { useState } from "react";
import { StarIcon } from "@phosphor-icons/react/ssr";
import type { campusRows } from "@/lib/explore";

type Row = ReturnType<typeof campusRows>[number];

function CampusRow({ row }: { row: Row }) {
  const [open, setOpen] = useState(false);
  const more = row.majors.length - 1;
  const grid = "grid min-h-12 w-full grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-6 py-2 text-left";

  const campus = (
    <span className="flex items-center gap-1 text-navy-900 type-row-title">
      {row.inPlan && <StarIcon weight="fill" size={16} aria-label="In your plan" className="shrink-0 text-yellow-400" />}
      {row.name}
    </span>
  );

  if (more === 0) {
    return (
      <div className={grid}>
        {campus}
        <span className="text-slate-700 type-body">{row.majors[0]}</span>
      </div>
    );
  }
  return (
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={`${grid} pressed:bg-surface-pressed`}>
      {campus}
      {open ? (
        <span className="flex flex-col gap-1 text-slate-700 type-body">
          {row.majors.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </span>
      ) : (
        <span className="line-clamp-2 text-slate-700 type-body">
          {row.majors[0]}, and {more} more
        </span>
      )}
    </button>
  );
}

// The campuses a UC pathway covers (21 → Campuses), the student's own first. Only a campus with more majors than fit taps open.
export function CampusList({ rows }: { rows: Row[] }) {
  return (
    <ul className="mt-2">
      {rows.map((r) => (
        <li key={r.id}>
          <CampusRow row={r} />
        </li>
      ))}
    </ul>
  );
}
