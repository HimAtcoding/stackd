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

// Passive: white, 2 px --border, flat. Tappable: the same with its --border edge, and it sinks on press (00 → Card).
export function Card({ children, href, className, ...rest }: CardProps) {
  const base = "block rounded-lg border-2 border-border bg-surface p-4";
  if (href) {
    return (
      <Link href={href} {...rest} className={cn(base, "edge-md", className)}>
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
