import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  children: ReactNode;
  // A tappable card is one link; its chevron stays decorative.
  href?: string;
  "aria-label"?: string;
  className?: string;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

export function Card({ children, href, className, ...rest }: CardProps) {
  const base = "block rounded-lg bg-surface p-4 shadow-card";
  if (href) {
    return (
      <Link
        href={href}
        {...rest}
        className={cn(base, "transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120", className)}
      >
        {children}
      </Link>
    );
  }
  return (
    <div {...rest} className={cn(base, className)}>
      {children}
    </div>
  );
}
