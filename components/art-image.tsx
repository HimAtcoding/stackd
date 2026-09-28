"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

type ArtImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  preload?: boolean;
  reveal?: boolean;
  className?: string;
  style?: CSSProperties;
};

// Art never blocks layout: a file that fails to load is simply hidden.
export function ArtImage({ src, alt, width, height, fill, preload, reveal, className, style }: ArtImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      preload={preload}
      placeholder="empty"
      unoptimized={src.endsWith(".svg")}
      data-loaded={loaded ? "" : undefined}
      // Also counts an image that finished loading before React attached onLoad.
      ref={(img) => {
        if (img?.complete && img.naturalWidth > 0) setLoaded(true);
      }}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn(reveal && "art-reveal", className)}
      // Keeps the file's proportions when only one side is set in CSS.
      style={fill ? style : { height: "auto", ...style }}
    />
  );
}
