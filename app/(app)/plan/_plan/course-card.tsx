"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes, type Ref } from "react";
import { DotsSixVerticalIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import type { Card } from "@/lib/plan/view";

// "4 u", "about 4 u"
export const unitsShort = (card: Card) => `${card.unitsEstimated ? "about " : ""}${card.units} u`;

// What line 2 says (24 → 2): a warning, else a quiet note, else counts for both, else the GE area or the one system
export function lineTwo(card: Card): { text: string; tone: "warning" | "both" | "quiet" } | null {
  if (card.line?.kind === "warning") return { text: card.line.text, tone: "warning" };
  if (card.line) return { text: card.line.text, tone: "quiet" };
  const d = card.detail;
  if (d?.kind === "both") return { text: "Counts for UC and Cal State", tone: "both" };
  if (d?.kind === "ge") return { text: `Cal-GETC Area ${d.code}`, tone: "quiet" };
  if (d?.kind === "system") return { text: d.system === "uc" ? "UC only" : "Cal State only", tone: "quiet" };
  return null;
}

// What VoiceOver reads for a card: code, name, units, line 2 and taking now
export function cardLabel(card: Card) {
  const line = lineTwo(card);
  const units = `${card.unitsEstimated ? "about " : ""}${card.units} ${card.units === 1 ? "unit" : "units"}`;
  return [card.code ? `${card.code}, ${card.name}` : card.name, units, line?.text, card.progress === "in_progress" ? "taking now" : null]
    .filter(Boolean)
    .join(", ");
}

type CourseCardProps = {
  card: Card;
  onOpen?: () => void;
  // Picked up and following the finger: lifted, with the bigger edge
  lifted?: boolean;
  // Its place in the list while it's being dragged
  placeholder?: boolean;
  handleProps?: HTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> };
  style?: CSSProperties;
} & HTMLAttributes<HTMLDivElement>;

// A course in the plan (24 → 2): drag handle, code and name, units, and line 2. White with its edge: it's a control.
export const CourseCard = forwardRef<HTMLDivElement, CourseCardProps>(function CourseCard(
  { card, onOpen, lifted, placeholder, handleProps, className, style, ...rest },
  ref,
) {
  const line = lineTwo(card);
  const taking = card.progress === "in_progress";
  return (
    <div
      ref={ref}
      {...rest}
      style={style}
      className={cn(
        "relative select-none [-webkit-touch-callout:none]",
        placeholder && "rounded-lg border-2 border-dashed border-slate-400",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex min-h-16 items-stretch overflow-hidden rounded-lg border-2 border-border bg-surface",
          "transition-[transform,box-shadow] duration-120 ease-out",
          lifted ? "edge-lg motion-safe:scale-[1.02]" : "edge-md",
          // Sinks into its edge while the card is pressed (00 → Edges)
          !lifted && "has-[.card-tap:active]:translate-y-1 has-[.card-tap:active]:[box-shadow:0_0_0_var(--border)] has-[.card-tap:active]:duration-80",
          placeholder && "invisible",
        )}
      >
        {/* Taking now: a 3 px blue ring along the left edge */}
        {taking && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-blue-600" />}
        <button
          type="button"
          {...handleProps}
          data-drag-handle
          aria-label={`Move ${card.name}`}
          className="flex w-11 shrink-0 touch-none items-center justify-center text-slate-400 focus-ring:-outline-offset-2"
        >
          <DotsSixVerticalIcon weight="bold" size={20} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onOpen}
          aria-label={cardLabel(card)}
          className="card-tap flex min-w-0 flex-1 flex-col justify-center py-3 pr-3.5 text-left focus-ring:-outline-offset-2"
        >
          <span aria-hidden className="flex w-full items-baseline gap-2">
            <span className="min-w-0 flex-1 text-navy-900">
              {card.code && <span className="mr-1.5 type-code">{card.code}</span>}
              <span className="type-row-title">{card.name}</span>
            </span>
            <span className="shrink-0 text-slate-600 tabular-nums type-label">{unitsShort(card)}</span>
          </span>
          {(line || taking) && (
            <span aria-hidden className="mt-1 flex w-full items-start gap-2">
              {line && (
                <span
                  className={cn(
                    "flex min-w-0 flex-1 items-start gap-1 type-caption",
                    line.tone === "warning" ? "font-extrabold text-coral-700" : line.tone === "both" ? "text-green-700" : "text-slate-600",
                  )}
                >
                  {line.tone === "warning" && <WarningCircleIcon weight="fill" size={16} className="mt-px shrink-0" />}
                  <span>{line.text}</span>
                </span>
              )}
              {taking && <span className="ml-auto shrink-0 text-blue-600 type-caption">Taking now</span>}
            </span>
          )}
        </button>
      </div>
    </div>
  );
});
