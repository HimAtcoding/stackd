// Makes the iOS app icon and launch image from the art already in the repo: `npm run ios:assets`.
// The icon is the same husky-head crop as the temporary web icons (public/icons/), on --sky-200, at 1024 × 1024 with
// no transparency, as the App Store requires. The launch image is the wordmark on --sky-50.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const SKY_200 = "#B8E7FD";
const SKY_50 = "#EAF6FE";
const ASSETS = "ios/App/App/Assets.xcassets";

// The husky head in husky-welcome.png (1114 × 1411), framed like public/icons/icon-512.png and stopping left of the
// yellow burst marks (they start at x 930).
// It starts 29 above the art, so the top is filled with sky.
const HEAD = { left: 130, top: -29, size: 790 };

async function icon() {
  const top = Math.max(0, -HEAD.top);
  // sharp runs extend after resize in one pipeline, so the padding gets its own pass
  const padded = await sharp("public/art/husky/husky-welcome.png")
    .extend({ top, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const head = await sharp(padded)
    .extract({ left: HEAD.left, top: HEAD.top + top, width: HEAD.size, height: HEAD.size })
    .resize(1024, 1024, { kernel: "lanczos3" })
    .toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 3, background: SKY_200 } })
    .composite([{ input: head }])
    .removeAlpha()
    .png()
    .toFile(`${ASSETS}/AppIcon.appiconset/AppIcon-512@2x.png`);
}

// LaunchScreen.storyboard shows "Splash" with aspect fill, so on a phone only the middle of the square shows.
// 2732 maps to the screen height; 800 wide is about Welcome's 252-point wordmark.
async function splash() {
  const wordmark = await sharp("public/art/brand/wordmark.png").trim().resize({ width: 800 }).toBuffer();
  const image = await sharp({ create: { width: 2732, height: 2732, channels: 3, background: SKY_50 } })
    .composite([{ input: wordmark, gravity: "center" }])
    .removeAlpha()
    .png()
    .toBuffer();
  await mkdir(`${ASSETS}/Splash.imageset`, { recursive: true });
  for (const name of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
    await sharp(image).toFile(`${ASSETS}/Splash.imageset/${name}`);
  }
}

await icon();
await splash();
const meta = await sharp(`${ASSETS}/AppIcon.appiconset/AppIcon-512@2x.png`).metadata();
console.log(`App icon ${meta.width} × ${meta.height}, alpha: ${meta.hasAlpha}. Launch image 2732 × 2732.`);
if (meta.width !== 1024 || meta.height !== 1024 || meta.hasAlpha) process.exit(1);
