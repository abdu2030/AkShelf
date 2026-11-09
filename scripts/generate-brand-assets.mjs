import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mark = JSON.parse(fs.readFileSync(path.join(rootDir, "src/lib/brand/mark.json"), "utf8"));
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mark.viewBox}" fill="none">
  <title>AkShelf</title>
  <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" fill="${mark.background}" stroke="${mark.border}"/>
  <path d="${mark.monogram}" fill="${mark.accent}" fill-rule="evenodd"/>
  <path d="${mark.shelfPath}" fill="${mark.shelf}"/>
</svg>
`;

async function main() {
  for (const file of ["public/favicon.svg", "src/app/icon.svg", "public/logo.svg"]) {
    fs.writeFileSync(path.join(rootDir, file), svgContent, "utf8");
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 180, height: 180 },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<style>body{margin:0;background:transparent}svg{display:block}</style>${svgContent}`,
    );
    const svg = page.locator("svg");
    async function render(size) {
      await svg.evaluate((el, pixels) => {
        el.setAttribute("width", String(pixels));
        el.setAttribute("height", String(pixels));
      }, size);
      return svg.screenshot({ omitBackground: true });
    }

    // Apple applies its own corner mask to an opaque square icon.
    await page.evaluate((background) => {
      const svg = document.querySelector("svg");
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("width", "48");
      rect.setAttribute("height", "48");
      rect.setAttribute("fill", background);
      rect.setAttribute("data-apple-background", "");
      svg.prepend(rect);
    }, mark.background);
    fs.writeFileSync(path.join(rootDir, "public/apple-touch-icon.png"), await render(180));
    await page.locator("[data-apple-background]").evaluate((el) => el.remove());

    // Native-size images keep the favicon sharp in tabs and bookmark menus.
    const sizes = [16, 32, 48];
    const images = [];
    for (const size of sizes) images.push(await render(size));
    const directory = Buffer.alloc(6 + 16 * images.length);
    directory.writeUInt16LE(1, 2);
    directory.writeUInt16LE(images.length, 4);
    let offset = directory.length;
    images.forEach((png, index) => {
      const entry = 6 + 16 * index;
      directory.writeUInt8(sizes[index], entry);
      directory.writeUInt8(sizes[index], entry + 1);
      directory.writeUInt16LE(1, entry + 4);
      directory.writeUInt16LE(32, entry + 6);
      directory.writeUInt32LE(png.length, entry + 8);
      directory.writeUInt32LE(offset, entry + 12);
      offset += png.length;
    });
    const ico = Buffer.concat([directory, ...images]);
    for (const file of ["src/app/favicon.ico", "public/favicon.ico"]) {
      fs.writeFileSync(path.join(rootDir, file), ico);
    }
    console.log("Generated matching SVG, 16/32/48px ICO, and 180px Apple icons.");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
