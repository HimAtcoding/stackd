import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";
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
  // The line under the label. An outside link shows its domain; a link inside Stackd names where it goes.
  detail?: string;
  // A link inside Stackd shows this instead of the outside-link arrow
  icon?: ReactNode;
  className?: string;
};

const isOutside = (href: string) => /^https?:\/\//.test(href);

// A link as a text button (18 → Link lines): icon and label in --blue-700, with the domain (or where it goes) in a
// caption under the label. No box. The 44 tall tap area covers both lines.
export function LinkLine({ href, label, detail, icon, className }: LinkLineProps) {
  const outside = isOutside(href);
  const under = detail ?? (outside ? domainOf(href) : "");
  const body = (
    <>
      <span aria-hidden className="flex h-[18px] shrink-0 items-center text-blue-700">
        {outside ? <ArrowSquareOutIcon weight="bold" size={16} /> : icon}
      </span>
      <span aria-hidden className="min-w-0">
        <span className="block text-blue-700 type-label group-pressed:underline">{label}</span>
        {under && <span className="mt-0.5 block text-slate-600 [overflow-wrap:anywhere] type-caption">{under}</span>}
      </span>
    </>
  );
  const classes = cn("group inline-flex min-h-11 max-w-full items-start gap-1.5 rounded-sm py-1", className);

  if (outside) {
    return (
      <a href={href} target="_blank" rel="noopener" aria-label={`${label}, ${under}, opens outside the app`} className={classes}>
        {body}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={under ? `${label}, ${under}` : label} className={classes}>
      {body}
    </Link>
  );
}
