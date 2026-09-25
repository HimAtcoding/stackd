// Every illustration the baseline uses, from docs/specs/art-assets.md.
// A file missing from /public renders the labelled placeholder at the same size.
export const ART = {
  wordmark: { src: "/art/brand/wordmark.svg" },
  "welcome-scene": { src: "/art/scenes/welcome-scene.png" },
  "husky-welcome": { src: "/art/husky/husky-welcome.png", width: 300, height: 380 },
  "husky-wave": { src: "/art/husky/husky-wave.png", width: 176, height: 186 },
  "burst-dashes": { src: "/art/decor/burst-dashes.svg", width: 28, height: 28 },
  "logo-apple": { src: "/art/brand/logo-apple.svg", width: 17, height: 20 },
  "logo-google": { src: "/art/brand/logo-google.svg", width: 22, height: 22 },
  "husky-run-contact": { src: "/art/husky/husky-run-contact.png", width: 72, height: 72 },
  "husky-run-flight": { src: "/art/husky/husky-run-flight.png", width: 72, height: 72 },
} as const;

export type ArtId = keyof typeof ART;
