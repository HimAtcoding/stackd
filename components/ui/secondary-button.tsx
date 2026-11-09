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
  // Hugs its label (padding 0 20) instead of filling the width
  hug?: boolean;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

const base = "flex h-12 items-center justify-center gap-2 rounded-md border-2 border-border bg-surface text-blue-600 type-button edge-md";

// White with a 2 px border and its --border edge; icon 20 + 8 + label, both --blue-600 (00 → Secondary button).
export function SecondaryButton({ children, icon, href, external, hug, onClick, className, ...rest }: SecondaryButtonProps) {
  const classes = cn(base, hug ? "w-fit px-5" : "w-full");
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
