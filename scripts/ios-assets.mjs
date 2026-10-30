// Makes the iOS app icon, the web icons and the launch image: `npm run ios:assets`.
// Every icon is cut from the approved logo, assets/branding/Stackd-AppIcon-1024.png, resized only: no crop, no
// padding, no color change. The App Store icon is 1024 × 1024 with no transparency. The launch image is the wordmark
// on --sky-50.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "assets/branding/Stackd-AppIcon-1024.png";
const SKY_50 = "#EAF6FE";
const ASSETS = "ios/App/App/Assets.xcassets";

const resized = (size) => sharp(SOURCE).resize(size, size, { kernel: "lanczos3" }).removeAlpha().png();

async function icons() {
  await resized(1024).toFile(`${ASSETS}/AppIcon.appiconset/AppIcon-512@2x.png`);
  await resized(180).toFile("app/apple-icon.png");
  await resized(192).toFile("public/icons/icon-192.png");
  await resized(512).toFile("public/icons/icon-512.png");
  // The face sits inside the maskable safe circle (the middle 80%), so the full-bleed logo works as is
  await resized(512).toFile("public/icons/icon-maskable-512.png");
}

// favicon.ico with 16, 32 and 48 PNG frames (browsers read PNG inside ICO). ICO frames must be RGBA, so each gets an
// opaque alpha channel
async function favicon() {
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map((size) => sharp(SOURCE).resize(size, size, { kernel: "lanczos3" }).ensureAlpha(1).png().toBuffer()),
  );
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(pngs[i].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += pngs[i].length;
  });
  await writeFile("app/favicon.ico", Buffer.concat([header, ...pngs]));
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

const source = await sharp(SOURCE).metadata();
if (source.width !== 1024 || source.height !== 1024 || source.hasAlpha) {
  console.error(`${SOURCE} must be 1024 × 1024 with no transparency.`);
  process.exit(1);
}
await icons();
await favicon();
await splash();
const meta = await sharp(`${ASSETS}/AppIcon.appiconset/AppIcon-512@2x.png`).metadata();
console.log(`App icon ${meta.width} × ${meta.height}, alpha: ${meta.hasAlpha}. Web icons, favicon and launch image written.`);
if (meta.width !== 1024 || meta.height !== 1024 || meta.hasAlpha) process.exit(1);
