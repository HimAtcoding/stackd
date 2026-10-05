// next/image loader for a static app: points at the WebP sizes scripts/prepare-assets.mjs made in public/_art.
// SVGs are passed through as they are.
export default function imageLoader({ src, width }: { src: string; width: number }) {
  if (!src.startsWith("/art/") || src.endsWith(".svg")) return src;
  return `/_art/${src.slice("/art/".length).replace(/\.(png|jpe?g)$/i, "")}-${width}.webp`;
}
