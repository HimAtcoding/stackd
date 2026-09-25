import fs from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import { ART, type ArtId } from "@/lib/art";
import { cn } from "@/lib/cn";
import { ArtImage } from "./art-image";

type ArtProps = {
  id: ArtId;
  // Display size in CSS px. Omit both with `fill` to size from the parent.
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
  // Accessible name. Without one the art is decorative.
  label?: string;
  preload?: boolean;
  // Fade the art up once it has loaded (Welcome and Sign in husky).
  reveal?: boolean;
};

const PLACEHOLDER_LABEL_MIN = 48;

function exists(src: string) {
  return fs.existsSync(path.join(process.cwd(), "public", src));
}

// Renders the real file when it's in /public, otherwise the labelled placeholder from art-assets.md.
export function Art({ id, width, height, fill, className, style, label, preload, reveal }: ArtProps) {
  const { src } = ART[id];
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  if (!exists(src)) {
    const small =
      (width !== undefined && width < PLACEHOLDER_LABEL_MIN) ||
      (height !== undefined && height < PLACEHOLDER_LABEL_MIN);
    return (
      <span
        {...a11y}
        data-asset={id}
        data-loaded={reveal ? "" : undefined}
        className={cn(
          "flex items-center justify-center overflow-hidden bg-tint-sky text-center type-caption text-slate-600",
          fill && "absolute inset-0",
          reveal && "art-reveal",
          className,
        )}
        style={{ width, height, ...style }}
      >
        {small ? null : id}
      </span>
    );
  }

  return (
    <ArtImage
      src={src}
      alt={label ?? ""}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      preload={preload}
      reveal={reveal}
      className={className}
      style={style}
    />
  );
}
