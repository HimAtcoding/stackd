"use client";

import { Fragment, useState } from "react";
import { IntersectIcon } from "@phosphor-icons/react/ssr";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { LinkLine } from "@/components/ui/link-line";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusTile } from "@/components/ui/status-tile";
import type { PlanAgreement } from "@/lib/data/explore";
import { setTopicStatus } from "@/lib/data/topic-status";
import { agreementLine, cIdGroups, unitsLabel, type RequirementRecord, type SystemTab, type TopicStatus } from "@/lib/explore";
import { topicIcon } from "@/lib/explore-icons";

const STATUS_OPTIONS: { value: TopicStatus; label: string }[] = [
  { value: "not_started", label: "Not yet" },
  { value: "in_progress", label: "Taking now" },
  { value: "done", label: "Done" },
];

type RequirementSheetProps = {
  open: boolean;
  onClose: () => void;
  // Kept while the sheet slides away, so it doesn't empty as it closes
  row: RequirementRecord | null;
  // The same course type in the other system, when it counts for both
  other: RequirementRecord | undefined;
  tab: SystemTab;
  status: TopicStatus;
  agreement: PlanAgreement | null;
};

// "MATH 210 and MATH 220, or MATH 211 and MATH 221, or MATH 900S", the numbers in monospace
function CIds({ groups }: { groups: string[][] }) {
  return groups.map((group, g) => (
    <Fragment key={group.join()}>
      {g > 0 && ", or "}
      {group.map((id, i) => (
        <Fragment key={id}>
          {i > 0 && " and "}
          <span className="type-code">{id}</span>
        </Fragment>
      ))}
    </Fragment>
  ));
}

function BothLine({ other, tab }: { other: RequirementRecord; tab: SystemTab }) {
  const groups = cIdGroups(other);
  return (
    <p className="mt-1 flex gap-1.5 text-slate-700 type-body">
      <IntersectIcon weight="bold" size={16} aria-hidden className="mt-0.5 shrink-0 text-mint-600" />
      <span>
        {tab === "uc" && groups.length > 0 ? (
          <>
            Also in the Cal State degree as <CIds groups={groups} />.
          </>
        ) : tab === "uc" ? (
          `Also in the Cal State degree as ${other.name}.`
        ) : (
          `Also in the UC pathway as ${other.name}.`
        )}
      </span>
    </p>
  );
}

function Content({ row, other, tab, status, agreement }: Omit<RequirementSheetProps, "open" | "onClose" | "row"> & { row: RequirementRecord }) {
  const [burst, setBurst] = useState(0);
  const find = agreementLine("it", agreement);

  function change(next: TopicStatus) {
    if (next === status) return;
    if (next === "done") setBurst((n) => n + 1);
    setTopicStatus(row.topic, next);
  }

  return (
    <div className="-mx-6 -mt-6 max-h-[calc(100dvh-var(--safe-top)-72px)] overflow-y-auto px-6 pt-6">
      <div className="flex items-center gap-3">
        <StatusTile status={status} name={row.name} icon={topicIcon(row.topic)} tile="bg-mint-100" color="text-mint-600" burst={burst} />
        <h2 id="requirement-sheet-title" tabIndex={-1} className="min-w-0 flex-1 text-navy-900 type-title-2 focus:outline-none">
          {row.name}
        </h2>
      </div>
      <p className="mt-2 text-slate-700 type-body">{row.description}</p>

      {row.c_id.length > 0 && (
        <p className="mt-2 text-slate-600 type-caption">
          <CIds groups={[row.c_id]} />
          {row.units !== null && `, ${unitsLabel(row.units)}`}
        </p>
      )}

      {row.options.length > 0 && (
        <>
          <h3 className="mt-5 text-navy-900 type-headline">Pick one</h3>
          <ul className="mt-1 flex flex-col gap-2">
            {row.options.map((o) => (
              <li key={o.label}>
                <p className="text-navy-900 type-body">{o.label}</p>
                <p className="text-slate-600 type-caption">
                  {o.c_id.length > 0 && (
                    <>
                      <CIds groups={[o.c_id]} />,{" "}
                    </>
                  )}
                  {unitsLabel(o.units)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {other && (
        <>
          <h3 className="mt-5 text-navy-900 type-headline">Counts for both</h3>
          <BothLine other={other} tab={tab} />
        </>
      )}

      <h3 className="mt-5 text-navy-900 type-headline">Your status</h3>
      <SegmentedControl options={STATUS_OPTIONS} value={status} onChange={change} aria-label="Your status" className="mt-2" />

      <div className="mt-4">
        {tab === "uc" ? (
          <LinkLine href={find.href} label={find.label} detail={find.detail} />
        ) : (
          <p className="text-slate-700 type-body">Your college&apos;s catalog shows the C-ID number next to each matching course.</p>
        )}
      </div>
    </div>
  );
}

// One course type in full (21 → Requirement sheet). Status changes save at once.
export function RequirementSheet({ open, onClose, row, ...rest }: RequirementSheetProps) {
  return (
    <BottomSheet open={open && row !== null} onClose={onClose} labelledBy="requirement-sheet-title">
      {row && <Content key={row.id} row={row} {...rest} />}
    </BottomSheet>
  );
}
