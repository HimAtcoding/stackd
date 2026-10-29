import type { MetadataRoute } from "next";

// Written once at build time, so it ships in the static app
export const dynamic = "force-static";

// Installable PWA: Add to Home Screen opens full screen, without browser bars.
// The icons are the app icon (assets/branding/Stackd-AppIcon-1024.png), made by npm run ios:assets.
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
