// Welcome rev 3 geometry (01 → Lines everything sits on). Pure, so it can be checked without a browser.

// Measured in welcome-scene.png (852 × 1846): the low wall meets the pavement at row ~1362,
// and the banner's bottom edge (with its outline) is at row 1105.
export const PLAZA_LINE = 0.738;
export const BANNER_BOTTOM = 0.599;

export const HUSKY_MIN = 160;

export type WelcomeRatios = {
  // Height ÷ width of the scene and the books, width ÷ height of the husky
  scene: number;
  husky: number;
  books: number;
};

export type WelcomeMeasure = {
  vw: number;
  vh: number;
  ctaTop: number;
  textBottom: number;
};

export function welcomeLayout({ vw, vh, ctaTop, textBottom }: WelcomeMeasure, r: WelcomeRatios) {
  const ground = ctaTop - 16;
  const huskyLine = ground - 24;

  // Width 100% and its own proportions, grown to the viewport height if the phone is taller than the art
  const sceneHeight = Math.max(vw * r.scene, vh);
  // Plaza line on ground − 48, clamped so there's no gap at the top or bottom
  const sceneTop = Math.min(0, Math.max(vh - sceneHeight, ground - 48 - PLAZA_LINE * sceneHeight));

  // Books top at least 4 below the banner. Books height = husky height × this
  const booksPerHusky = r.husky * 0.58 * r.books;
  const bannerBottom = sceneTop + BANNER_BOTTOM * sceneHeight;

  const huskyHeight = Math.min(
    350,
    0.4 * vh,
    huskyLine - (textBottom + 8),
    (ground - bannerBottom - 4) / booksPerHusky,
  );

  return { sceneTop, sceneHeight, huskyHeight: huskyHeight >= HUSKY_MIN ? huskyHeight : 0 };
}
