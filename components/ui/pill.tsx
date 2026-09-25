import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PillProps = { variant: "due" | "progress"; children: ReactNode };

export function Pill({ variant, children }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 type-pill",
        variant === "due" ? "bg-coral-50 text-coral-700" : "bg-mint-100 text-mint-800",
      )}
    >
      {children}
    </span>
  );
}
