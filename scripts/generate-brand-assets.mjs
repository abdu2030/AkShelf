import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Concept 1: The Obsidian Film Gate (A24 & Criterion inspired)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="akshelf-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1e2029"/>
      <stop offset="1" stop-color="#0a0b0e"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#akshelf-bg)"/>
  <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="rgba(255,255,255,0.14)"/>
  <rect x="6" y="7" width="20" height="2.5" rx="1.25" fill="#f4f4f5"/>
  <path d="M13 12C13 11.2 13.9 10.8 14.5 11.2L20 15.2C20.6 15.6 20.6 16.4 20 16.8L14.5 20.8C13.9 21.2 13 20.8 13 20Z" fill="#e4e4e7"/>
  <rect x="6" y="22.5" width="20" height="2.5" rx="1.25" fill="#f4f4f5"/>
</svg>
`;

async function main() {
  console.log("Generating Obsidian Film Gate brand assets for AkShelf...");

  // 1. Write SVG to public/favicon.svg, src/app/icon.svg, public/logo.svg
  fs.writeFileSync(path.join(rootDir, "public", "favicon.svg"), svgContent.trim(), "utf8");
  fs.writeFileSync(path.join(rootDir, "src", "app", "icon.svg"), svgContent.trim(), "utf8");
  fs.writeFileSync(path.join(rootDir, "public", "logo.svg"), svgContent.trim(), "utf8");
  console.log("Wrote SVG assets: public/favicon.svg, src/app/icon.svg, public/logo.svg");

  // 2. Launch browser to render PNGs
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

  await page.setContent(html);

  // Apple touch icon (180x180)
  const appleIconSvg = page.locator("svg");
  await page.evaluate(() => {
    const el = document.querySelector("svg");
    if (el) {
      el.setAttribute("width", "180");
      el.setAttribute("height", "180");
    }
  });
  const appleTouchBuffer = await appleIconSvg.screenshot({ omitBackground: true });
  fs.writeFileSync(path.join(rootDir, "public", "apple-touch-icon.png"), appleTouchBuffer);
  console.log("Wrote public/apple-touch-icon.png (180x180)");

  // Favicon 48x48 for ICO
  await page.evaluate(() => {
    const el = document.querySelector("svg");
    if (el) {
      el.setAttribute("width", "48");
      el.setAttribute("height", "48");
    }
  });
  const faviconBuffer = await appleIconSvg.screenshot({ omitBackground: true });

  // Wrap PNG in standard ICO header
  const icoHeader = Buffer.alloc(22);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // 1 image
  icoHeader.writeUInt8(48, 6); // width
  icoHeader.writeUInt8(48, 7); // height
  icoHeader.writeUInt8(0, 8); // palette
  icoHeader.writeUInt8(0, 9); // reserved
  icoHeader.writeUInt16LE(1, 10); // planes
  icoHeader.writeUInt16LE(32, 12); // bits per pixel
  icoHeader.writeUInt32LE(faviconBuffer.length, 14); // image size
  icoHeader.writeUInt32LE(22, 18); // offset

  const icoBuffer = Buffer.concat([icoHeader, faviconBuffer]);
  fs.writeFileSync(path.join(rootDir, "src", "app", "favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(rootDir, "public", "favicon.ico"), icoBuffer);
  console.log("Wrote src/app/favicon.ico and public/favicon.ico (48x48)");

  await browser.close();
  console.log("Obsidian Film Gate brand assets generated successfully!");
}

main().catch((err) => {
  console.error("Error generating brand assets:", err);
  process.exit(1);
});
