import type { MetadataRoute } from "next";

// Installable PWA: Add to Home Screen opens full screen, without browser bars.
// The icons are temporary, cut from husky-welcome until the real app-icon exists (art-assets).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Stackd",
    short_name: "Stackd",
    description: "Transfer planning for California community college students",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EAF6FE",
    theme_color: "#EAF6FE",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
