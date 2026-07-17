/**
 * Generates PWA icons from app/icon.svg using sharp.
 *
 * Outputs:
 *   public/icons/icon-192.png            192x192 standard icon
 *   public/icons/icon-512.png            512x512 standard icon
 *   public/icons/icon-512-maskable.png   512x512 maskable (art at 80%, safe-zone padding)
 *   public/apple-touch-icon.png          180x180 iOS home-screen icon
 *
 * Run: npm run generate:icons (from apps/web)
 */
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const svgPath = path.join(webRoot, "app", "icon.svg");
const publicDir = path.join(webRoot, "public");
const iconsDir = path.join(publicDir, "icons");

const BACKGROUND = "#0a0e1a";

async function main() {
  const svg = await readFile(svgPath);
  await mkdir(iconsDir, { recursive: true });

  // Standard icons: render the SVG edge-to-edge.
  await sharp(svg, { density: 300 })
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));
  console.log("wrote icons/icon-192.png");

  await sharp(svg, { density: 300 })
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512.png"));
  console.log("wrote icons/icon-512.png");

  // Maskable icon: same art at 80% size, centered on a solid background,
  // so the safe zone survives circular/rounded masks.
  const artSize = Math.round(512 * 0.8);
  const art = await sharp(svg, { density: 300 })
    .resize(artSize, artSize)
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toFile(path.join(iconsDir, "icon-512-maskable.png"));
  console.log("wrote icons/icon-512-maskable.png");

  // Apple touch icon (iOS applies its own rounded mask).
  await sharp(svg, { density: 300 })
    .resize(180, 180)
    .flatten({ background: BACKGROUND })
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("wrote apple-touch-icon.png");
}

main().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
