import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const assetsDir = path.join(projectRoot, "public", "assets");
const assetPath = (...parts) => path.join(assetsDir, ...parts);

const logoSvg = await fs.readFile(assetPath("logo.svg"), "utf8");
const logoBuffer = Buffer.from(logoSvg);
const bannerBuffer = await fs.readFile(assetPath("banner.svg"));

async function renderLogo(size, outputPath) {
  await sharp(logoBuffer).resize(size, size).png().toFile(outputPath);
}

async function renderMaskableIcon(outputPath) {
  const encodedLogo = Buffer.from(logoSvg).toString("base64");
  const maskableSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="#07131a"/>
      <image
        href="data:image/svg+xml;base64,${encodedLogo}"
        x="38"
        y="38"
        width="436"
        height="436"
      />
    </svg>
  `;

  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(outputPath);
}

await renderLogo(16, assetPath("favicon-16.png"));
await renderLogo(32, assetPath("favicon-32.png"));
await renderLogo(180, assetPath("apple-touch-icon.png"));
await renderLogo(192, assetPath("icon-192.png"));
await renderLogo(512, assetPath("icon-512.png"));
await renderMaskableIcon(assetPath("icon-maskable.png"));

await sharp(bannerBuffer)
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toFile(assetPath("banner.png"));

await sharp(bannerBuffer)
  .resize(1200, 630)
  .webp({ quality: 82 })
  .toFile(assetPath("banner.webp"));

console.log("Brand assets generated.");
