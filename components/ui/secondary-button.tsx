"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SecondaryButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
  href?: string;
  // With href: a link that leaves Stackd, opened outside the app
  external?: boolean;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

const classes = cn(
  "flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-border bg-surface text-blue-600 type-button edge-md",
);

// White with a 2 px border and its --border edge; icon 20 + 8 + label, both --blue-600 (00 → Secondary button).
export function SecondaryButton({ children, icon, href, external, onClick, className, ...rest }: SecondaryButtonProps) {
  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );
  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener" className={cn(classes, className)} {...rest}>
        {content}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cn(classes, className)} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(classes, className)} {...rest}>
      {content}
    </button>
  );
}
