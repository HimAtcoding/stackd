// Every illustration the baseline uses, from docs/specs/art-assets.md.
// Paths have no extension: an .svg is used first, then a .png. A missing file renders the placeholder.
export const ART = {
  wordmark: "/art/brand/wordmark",
  "welcome-scene": "/art/scenes/welcome-scene",
  "welcome-books": "/art/scenes/welcome-books",
  "husky-welcome": "/art/husky/husky-welcome",
  "home-clouds": "/art/scenes/home-clouds",
  "husky-wave": "/art/husky/husky-wave",
  "husky-forgot": "/art/husky/husky-forgot",
  "burst-dashes": "/art/decor/burst-dashes",
  "logo-apple": "/art/brand/logo-apple",
  "logo-google": "/art/brand/logo-google",
} as const;

export type ArtId = keyof typeof ART;
