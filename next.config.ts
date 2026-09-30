import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";

export default function config(phase: string): NextConfig {
  return {
    // Lets a phone on the same Wi-Fi load the dev server with hot reload.
    allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
    // `page.dev.tsx` files are routes only under `next dev`, so dev tools like /dev/reset don't exist in production.
    pageExtensions: phase === PHASE_DEVELOPMENT_SERVER ? ["dev.tsx", "tsx", "ts", "jsx", "js"] : ["tsx", "ts", "jsx", "js"],
  };
}
