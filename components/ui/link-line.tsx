import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

// "apply.universityofcalifornia.edu". A leading "www." says nothing, so it's left off.
export const domainOf = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
};

type LinkLineProps = {
  href: string;
  // "Open the official page", "Write them in Stackd"
  label: string;
  // An outside link's line under the label, when it says more than the domain ("Your 2026-27 agreement on assist.org")
  detail?: string;
  className?: string;
};

const isOutside = (href: string) => /^https?:\/\//.test(href);

// A link as a text button (18 → Link lines), no box and no icon before it. One that leaves the app: the label in
// --blue-700 with the domain in a caption under it. One that stays inside the app: the label and a CaretRight, one
// line. The 44 tall tap area covers it all.
export function LinkLine({ href, label, detail, className }: LinkLineProps) {
  if (isOutside(href)) {
    const under = detail ?? domainOf(href);
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener"
        aria-label={`${label}, ${under}, opens outside the app`}
        className={cn("group inline-flex min-h-11 max-w-full flex-col rounded-sm py-1", className)}
      >
        <span aria-hidden className="text-blue-600 type-label group-pressed:underline">
          {label}
        </span>
        <span aria-hidden className="mt-0.5 text-slate-600 [overflow-wrap:anywhere] type-caption">
          {under}
        </span>
      </a>
    );
  }
  return (
    <Link href={href} className={cn("group inline-flex min-h-11 max-w-full items-center gap-1 rounded-sm", className)}>
      <span className="text-blue-600 type-label group-pressed:underline">{label}</span>
      <CaretRightIcon weight="bold" size={20} aria-hidden className="shrink-0 text-slate-600" />
    </Link>
  );
}
