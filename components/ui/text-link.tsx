import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type TextLinkProps = ComponentProps<typeof Link> & {
  size?: "link" | "label";
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

// 44 tall hit area from vertical padding plus a matching negative margin, so layout doesn't move.
export function TextLink({ size = "link", className, ...props }: TextLinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        "inline-block text-blue-600 no-underline pressed:underline focus-ring:underline",
        size === "link" ? "-my-3 py-3 type-link" : "-my-[13px] py-[13px] type-label",
        className,
      )}
    />
  );
}
