"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TintedButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

const classes = cn(
  "flex h-12 w-full items-center justify-center gap-2 rounded-md border border-blue-50-border bg-blue-50 text-blue-700 type-button",
  "transition-[background-color,transform] duration-200 ease-out",
  "pressed:bg-blue-100 pressed:duration-120 motion-safe:pressed:scale-[0.98]",
);

// Icon 20 + 8 gap + label, both --blue-700.
export function TintedButton({ children, icon, href, onClick, className, ...data }: TintedButtonProps) {
  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cn(classes, className)} {...data}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(classes, className)} {...data}>
      {content}
    </button>
  );
}
