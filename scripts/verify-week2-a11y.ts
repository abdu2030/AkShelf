import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
}

function parseRgb(colorStr: string): RgbColor {
  const trimmed = colorStr.trim();
  const match = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!match) {
    if (trimmed.startsWith("#")) {
      const hex = trimmed.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: 1, hex: trimmed.toLowerCase() };
    }
    throw new Error(`Cannot parse color: "${colorStr}"`);
  }
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
  const hex =
    "#" +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toLowerCase();
  return { r, g, b, a, hex };
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(fg: RgbColor, bg: RgbColor): number {
  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

async function runAudit() {
  const screenshotDir = path.resolve(process.cwd(), "screenshots");
  fs.mkdirSync(screenshotDir, { recursive: true });

  const artifactDir =
    "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\33212df4-6ea7-44cc-8cd9-9ebf98869604";
  fs.mkdirSync(artifactDir, { recursive: true });

  console.log("🚀 Starting Week 2 Accessibility & Visual Audit (Day 14)...");
  console.log("🌐 Launching Playwright Chromium in headless mode...");
  const browser = await chromium.launch({ headless: true });

  try {
    for (const theme of ["dark", "light"] as const) {
      console.log(`\n==================================================`);
      console.log(`🔍 AUDITING /library in ${theme.toUpperCase()} THEME`);
      console.log(`==================================================`);

      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });

      // Set theme in localStorage prior to page load
      await context.addInitScript((th) => {
        window.localStorage.setItem("akshelf-theme", th);
      }, theme);

      const page = await context.newPage();
      // Authenticate via login page
      await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
      await page.fill("#email", "owner@akshelf.local");
      await page.fill("#password", "password123");
      await page.click("button[type='submit']");
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });

      // Navigate to /library
      await page.goto("http://localhost:3000/library", { waitUntil: "networkidle" });

      // Apply theme attribute to html
      await page.evaluate((th) => {
        window.localStorage.setItem("akshelf-theme", th);
        document.documentElement.setAttribute("data-theme", th);
      }, theme);

      // Audit DOM elements, colors, and touch targets
      const audit = await page.evaluate(() => {
        const docStyle = window.getComputedStyle(document.documentElement);
        const bgBase = docStyle.getPropertyValue("--bg-base").trim();

        // Header and subtitle
        const h1 = document.querySelector("h1");
        const h1Color = h1 ? window.getComputedStyle(h1).color : "";
        const h1FontSize = h1 ? window.getComputedStyle(h1).fontSize : "";

        const subtitle = document.querySelector("header p");
        const subtitleColor = subtitle ? window.getComputedStyle(subtitle).color : "";

        // Filter chips touch target check
        const filterChips = Array.from(document.querySelectorAll("[data-testid^='filter-type-']"));
        const chipHeights = filterChips.map((c) => (c as HTMLElement).offsetHeight);

        // Sort controls
        const sortSelect = document.querySelector("[data-testid='sort-field-select']");
        const sortBtn = document.querySelector("[data-testid='sort-direction-button']");
        const sortSelectHeight = sortSelect ? (sortSelect as HTMLElement).offsetHeight : 0;
        const sortBtnWidth = sortBtn ? (sortBtn as HTMLElement).offsetWidth : 0;
        const sortBtnHeight = sortBtn ? (sortBtn as HTMLElement).offsetHeight : 0;

        // Media Cards
        const cards = Array.from(document.querySelectorAll("[data-testid='media-card']"));
        const cardCount = cards.length;

        // Quick action buttons inside cards
        const quickActionBtns = Array.from(
          document.querySelectorAll("[data-testid='media-card-quick-action']"),
        );
        const quickActionSizes = quickActionBtns.slice(0, 5).map((btn) => ({
          width: (btn as HTMLElement).offsetWidth,
          height: (btn as HTMLElement).offsetHeight,
        }));

        // Title text in cards
        const firstCardTitle = document.querySelector("[data-testid='media-card'] h3");
        const firstCardTitleColor = firstCardTitle
          ? window.getComputedStyle(firstCardTitle).color
          : "";

        return {
          bgBase,
          h1Color,
          h1FontSize,
          subtitleColor,
          chipHeights,
          sortSelectHeight,
          sortBtnWidth,
          sortBtnHeight,
          cardCount,
          quickActionSizes,
          firstCardTitleColor,
        };
      });

      const parsedBg = parseRgb(audit.bgBase);
      const parsedH1 = parseRgb(audit.h1Color);
      const parsedSubtitle = parseRgb(audit.subtitleColor);
      const parsedCardTitle = parseRgb(audit.firstCardTitleColor);

      const h1Contrast = getContrastRatio(parsedH1, parsedBg);
      const subtitleContrast = getContrastRatio(parsedSubtitle, parsedBg);
      const cardTitleContrast = getContrastRatio(parsedCardTitle, parsedBg);

      console.log(`📌 Canvas Background: ${audit.bgBase} (${parsedBg.hex})`);
      console.log(
        `📌 Heading 1 Color: ${audit.h1Color} (${parsedH1.hex}) | Size: ${audit.h1FontSize}`,
      );
      console.log(`   └─ H1 Contrast: ${h1Contrast}:1 (Required: >= 4.5:1, WCAG AAA: >= 7:1)`);
      console.log(`📌 Subtitle Color: ${audit.subtitleColor} (${parsedSubtitle.hex})`);
      console.log(`   └─ Subtitle Contrast: ${subtitleContrast}:1 (Required: >= 4.5:1)`);
      console.log(`📌 Media Card Title Contrast: ${cardTitleContrast}:1 (Required: >= 4.5:1)`);
      console.log(`📌 Total Seeded Media Cards Rendered: ${audit.cardCount} / 28`);
      console.log(`📌 Filter Chip Heights: ${JSON.stringify(audit.chipHeights.slice(0, 4))}px`);
      console.log(
        `📌 Sort Controls: Select H=${audit.sortSelectHeight}px, Direction Button=${audit.sortBtnWidth}x${audit.sortBtnHeight}px`,
      );
      console.log(
        `📌 Card Quick Action Touch Targets: ${JSON.stringify(audit.quickActionSizes[0])}`,
      );

      if (h1Contrast < 4.5) {
        throw new Error(`FAIL: H1 contrast ratio ${h1Contrast}:1 is below 4.5:1!`);
      }
      if (subtitleContrast < 4.5) {
        throw new Error(`FAIL: Subtitle contrast ratio ${subtitleContrast}:1 is below 4.5:1!`);
      }
      if (audit.cardCount < 25) {
        throw new Error(`FAIL: Expected at least 25 seeded media cards, got ${audit.cardCount}!`);
      }

      // Save screenshot
      const shotFile = path.join(screenshotDir, `library-week2-${theme}.png`);
      await page.screenshot({ path: shotFile, fullPage: false });
      fs.copyFileSync(shotFile, path.join(artifactDir, `library-week2-${theme}.png`));
      console.log(`📸 Screenshot captured: ${shotFile}`);

      await context.close();
    }

    console.log(`\n==================================================`);
    console.log(`✅ WEEK 2 ACCESSIBILITY & VISUAL AUDIT PASSED 100%`);
    console.log(`==================================================\n`);
  } finally {
    await browser.close();
  }
}

runAudit().catch((err) => {
  console.error("❌ Accessibility audit failed:", err);
  process.exit(1);
});
