import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TONE, type Tone } from "./icon-circle";

type HeroProps = {
  tone: Extract<Tone, "blue" | "green" | "indigo" | "coral">;
  children: ReactNode;
  // The whole hero is the button: it sinks into its edge on press
  href?: string;
  transitionTypes?: string[];
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

// Tier 1, one per screen at most (00 → Hero): the section color, --r-hero, a 6 px edge in the partner color, white
// text. Bars inside read the partner color from --partner. Controls inside get a white focus outline.
export function Hero({ tone, children, href, transitionTypes, className, style, ...rest }: HeroProps) {
  const t = TONE[tone];
  const classes = cn("on-fill block rounded-hero px-[18px] pt-[18px] pb-5 text-white edge-lg", t.fill, t.edge, className);
  const vars = { "--partner": t.partner, ...style } as CSSProperties;
  if (href) {
    return (
      <Link href={href} transitionTypes={transitionTypes} {...rest} className={cn(classes, "focus-ring:outline-offset-3")} style={vars}>
        {children}
      </Link>
    );
  }
  return (
    <div {...rest} className={classes} style={vars}>
      {children}
    </div>
  );
}
