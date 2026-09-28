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
  // Background decoration: renders nothing while the file is missing.
  optional?: boolean;
};

const PLACEHOLDER_LABEL_MIN = 48;

const EXTENSIONS = [".svg", ".png"];

function findFile(base: string) {
  const ext = EXTENSIONS.find((e) => fs.existsSync(path.join(process.cwd(), "public", base + e)));
  return ext ? base + ext : null;
}

// Intrinsic size from the PNG header or the SVG's width/height or viewBox.
function intrinsicSize(src: string): { w: number; h: number } | null {
  const file = path.join(process.cwd(), "public", src);
  if (src.endsWith(".png")) {
    const head = Buffer.alloc(24);
    const fd = fs.openSync(file, "r");
    fs.readSync(fd, head, 0, 24, 0);
    fs.closeSync(fd);
    return { w: head.readUInt32BE(16), h: head.readUInt32BE(20) };
  }
  const svg = fs.readFileSync(file, "utf8").slice(0, 2000);
  const box = svg.match(/viewBox="[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/);
  return box ? { w: Number(box[1]), h: Number(box[2]) } : null;
}

// Renders the real file when it's in /public, otherwise the labelled placeholder from art-assets.md.
// With a real file, height follows the file's proportions from the given width.
export function Art({ id, width, height, fill, className, style, label, preload, reveal, optional }: ArtProps) {
  const src = findFile(ART[id]);
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  if (!src) {
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

  const size = intrinsicSize(src);
  const shownHeight = width !== undefined && size ? Math.round((width * size.h) / size.w) : height;

  return (
    <ArtImage
      src={src}
      alt={label ?? ""}
      width={fill ? undefined : width}
      height={fill ? undefined : shownHeight}
      fill={fill}
      preload={preload}
      reveal={reveal}
      className={className}
      style={style}
    />
  );
}
