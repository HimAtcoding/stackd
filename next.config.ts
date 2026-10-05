import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import type { NextConfig } from "next";
import { DEVICE_SIZES, IMAGE_SIZES } from "./lib/image-widths.mjs";

export default function config(phase: string): NextConfig {
  return {
    // A static app in `out/`, so Capacitor can ship it with no Node server
    output: phase === PHASE_PRODUCTION_BUILD ? "export" : undefined,
    // Each page is a folder with index.html, which any static file server (and Capacitor) can serve
    trailingSlash: true,
    // No image optimizer at runtime: the loader points at sizes made by scripts/prepare-assets.mjs
    images: { loader: "custom", loaderFile: "./lib/image-loader.ts", imageSizes: IMAGE_SIZES, deviceSizes: DEVICE_SIZES },
    // Lets a phone on the same Wi-Fi load the dev server with hot reload.
    allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
    // `page.dev.tsx` files are routes only under `next dev`, so dev tools like /dev/reset don't exist in production.
    pageExtensions: phase === PHASE_DEVELOPMENT_SERVER ? ["dev.tsx", "tsx", "ts", "jsx", "js"] : ["tsx", "ts", "jsx", "js"],
  };
}
