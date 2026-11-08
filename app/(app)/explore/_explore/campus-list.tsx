"use client";

import { useState } from "react";
import { StarIcon } from "@phosphor-icons/react/ssr";
import { SchoolTile } from "@/components/ui/school-tile";
import { cn } from "@/lib/cn";
import { FEATURES } from "@/lib/features";
import type { campusRows } from "@/lib/explore";

type Row = ReturnType<typeof campusRows>[number];

// tiles: the list shows school tiles, each in its own 48 column so the names keep the first column's full width
function CampusRow({ row, tiles }: { row: Row; tiles: boolean }) {
  const [open, setOpen] = useState(false);
  const more = row.majors.length - 1;
  const grid = cn(
    "grid min-h-12 w-full gap-3 px-6 py-2 text-left",
    tiles ? "grid-cols-[48px_minmax(0,2fr)_minmax(0,3fr)]" : "grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
  );

  // A pathway's campuses are all UC, so every tile is UC blue (22 → School tiles). A campus without an abbreviation
  // keeps the column empty, so the names still line up.
  const campus = (
    <>
      {tiles && <span className="self-start"><SchoolTile abbreviation={row.abbreviation} system="UC" /></span>}
      <span className="flex min-w-0 items-center gap-1 text-navy-900 type-row-title">
        {row.inPlan && <StarIcon weight="fill" size={16} aria-label="In your plan" className="shrink-0 text-yellow-400" />}
        {row.name}
      </span>
    </>
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
  const tiles = FEATURES.explore && rows.some((r) => r.abbreviation);
  return (
    <ul className="mt-2">
      {rows.map((r) => (
        <li key={r.id}>
          <CampusRow row={r} tiles={tiles} />
        </li>
      ))}
    </ul>
  );
}
