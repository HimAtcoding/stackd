"use client";

import type { Icon } from "@phosphor-icons/react";
import { IntersectIcon } from "@phosphor-icons/react/ssr";
import { StatusTile, type TileStatus } from "./status-tile";

type RequirementRowProps = {
  name: string;
  // "One course", "A one-year sequence", "One of 3 options"
  howMany: string;
  countsForBoth: boolean;
  status: TileStatus;
  icon: Icon;
  onToggle: () => void;
  onOpen: () => void;
};

// A course type to mark (21 → Requirement row). The tile checks it; the text opens its sheet.
export function RequirementRow({ name, howMany, countsForBoth, status, icon, onToggle, onOpen }: RequirementRowProps) {
  return (
    <div className="flex min-h-16 items-start gap-2.5 px-[22px] py-3">
      <StatusTile status={status} name={name} icon={icon} tile="bg-mint-100" color="text-mint-600" onToggle={onToggle} />
      <button type="button" onClick={onOpen} className="group min-h-11 min-w-0 flex-1 rounded-sm text-left">
        <span className="line-clamp-2 text-navy-900 type-row-title group-pressed:underline">{name}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-1 text-slate-600 type-caption">
          <span>{countsForBoth ? `${howMany}.` : howMany}</span>
          {countsForBoth && (
            <span className="inline-flex items-center gap-1">
              <IntersectIcon weight="bold" size={14} aria-hidden className="text-mint-600" />
              Counts for both
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
