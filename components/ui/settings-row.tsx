import Link from "next/link";
import type { ReactNode } from "react";
import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

type SettingsRowProps = {
  label: string;
  // Shown on the right, cut with an ellipsis before the label ever is
  value?: string;
  // "action": a row that asks for attention (blue). "danger": deleting (coral).
  labelTone?: "action" | "danger";
  valueTone?: "action";
  // Opens another screen: the row is a link with a chevron
  href?: string;
  transitionTypes?: string[];
  // Does something in place: the row is a button, with a chevron only when it leads to another screen
  onClick?: () => void;
  chevron?: boolean;
  // Replaces the chevron, e.g. a spinner while the row's action runs
  trailing?: ReactNode;
  disabled?: boolean;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

// One row in a settings group (00 → Settings row). With neither href nor onClick it's plain text, like Email.
export function SettingsRow({ label, value, labelTone, valueTone, href, transitionTypes, onClick, chevron, trailing, disabled, ...data }: SettingsRowProps) {
  const content = (
    <>
      <span className={cn("shrink-0 type-row-title", labelTone === "action" ? "text-blue-600" : labelTone === "danger" ? "text-coral-700" : "text-navy-900")}>
        {label}
      </span>
      {value && (
        <span className={cn("ml-auto min-w-0 max-w-[60%] truncate text-right type-body", valueTone === "action" ? "text-blue-600" : "text-slate-600")}>
          {value}
        </span>
      )}
      {(trailing || href || chevron) && (
        <span aria-hidden className={cn("flex size-5 shrink-0 items-center justify-center text-navy-900", value ? "ml-3" : "ml-auto")}>
          {trailing ?? <CaretRightIcon weight="bold" size={20} />}
        </span>
      )}
    </>
  );
  const base = "flex h-14 w-full items-center px-4 text-left";
  const tappable = "transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120 focus-ring:-outline-offset-2";
  const name = value ? `${label}, ${value}` : label;

  if (href) {
    return (
      <Link href={href} transitionTypes={transitionTypes} aria-label={name} className={cn(base, tappable)} {...data}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        aria-label={name}
        aria-disabled={disabled || undefined}
        onClick={() => {
          if (!disabled) onClick();
        }}
        className={cn(base, tappable)}
        {...data}
      >
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
}

// The list container from 03, with a line between rows
export function SettingsGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-border overflow-hidden rounded-md border border-border bg-surface shadow-card", className)}>{children}</div>;
}
