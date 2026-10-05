import type { CSSProperties } from "react";
import { ART, type ArtId } from "@/lib/art";
import { cn } from "@/lib/cn";
import manifest from "@/lib/generated/art-manifest.json";
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
  // Background decoration: renders nothing while the file is missing.
  optional?: boolean;
};

const PLACEHOLDER_LABEL_MIN = 48;

// Every file in public/art with its size, from scripts/prepare-assets.mjs. No file system needed at runtime.
const FILES: Record<string, { src: string; w: number; h: number }> = manifest;

// The file's own size, for layouts that position by the art's proportions. Null while the file is missing.
export function artSize(id: ArtId) {
  const file = FILES[ART[id]];
  return file ? { w: file.w, h: file.h } : null;
}

// Renders the real file when it's in /public, otherwise the labelled placeholder from art-assets.md.
// With a real file, the missing side of the size follows the file's proportions.
export function Art({ id, width, height, fill, className, style, label, preload, reveal, optional }: ArtProps) {
  const file = FILES[ART[id]];
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  if (!file) {
    if (optional) return null;
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

  const byWidth = width !== undefined;
  const shownWidth = !byWidth && height !== undefined ? Math.round((height * file.w) / file.h) : width;
  const shownHeight = byWidth ? Math.round((width * file.h) / file.w) : height;

  return (
    <ArtImage
      src={file.src}
      alt={label ?? ""}
      width={fill ? undefined : shownWidth}
      height={fill ? undefined : shownHeight}
      fill={fill}
      preload={preload}
      reveal={reveal}
      className={className}
      style={style}
    />
  );
}
