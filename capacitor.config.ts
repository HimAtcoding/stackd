import type { CapacitorConfig } from "@capacitor/cli";

// The iOS app ships the static export in out/ (npm run build); it never loads a dev server or a Node server.
const config: CapacitorConfig = {
  appId: "app.stackd.transfer",
  appName: "Stackd",
  webDir: "out",
  ios: {
    // The web app pads for the notch and home indicator itself (--safe-top, --safe-bottom)
    contentInset: "never",
    // Links to other sites (ASSIST, Terms) open in Safari, not inside the app's web view
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
