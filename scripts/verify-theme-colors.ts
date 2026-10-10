import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
  raw: string;
  hex: string;
}

function parseRgb(colorStr: string): RgbColor {
  const trimmed = colorStr.trim();
  const match = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!match) {
    // If hex string
    if (trimmed.startsWith("#")) {
      const hex = trimmed.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: 1, raw: trimmed, hex: trimmed.toLowerCase() };
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
  return { r, g, b, a, raw: trimmed, hex };
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

async function run() {
  const screenshotDir = path.resolve(process.cwd(), "screenshots");
  fs.mkdirSync(screenshotDir, { recursive: true });

  const artifactDir =
    "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\33212df4-6ea7-44cc-8cd9-9ebf98869604";
  fs.mkdirSync(artifactDir, { recursive: true });

  console.log("Launching Playwright Chromium...");
  const browser = await chromium.launch({ headless: true });

  interface VerificationResult {
    page: string;
    theme: string;
    bgBase: string;
    subtitle: { hex: string; contrast: number };
    input?: { hex: string; contrast: number };
    emptyBody?: { hex: string; contrast: number };
  }

  const results: VerificationResult[] = [];

  try {
    // 1. Verify /login page in dark and light themes
    for (const theme of ["dark", "light"] as const) {
      console.log(`\n=== Testing /login in ${theme.toUpperCase()} theme ===`);
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      await context.addInitScript((th) => {
        window.localStorage.setItem("akshelf-theme", th);
      }, theme);

      const page = await context.newPage();
      await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });

      // Ensure theme is set on html
      await page.evaluate((th) => {
        document.documentElement.setAttribute("data-theme", th);
      }, theme);

      const data = await page.evaluate(() => {
        const docStyle = window.getComputedStyle(document.documentElement);
        const bgBase = docStyle.getPropertyValue("--bg-base").trim();

        const subtitleEl = document.querySelector("div.text-center p");
        const subtitleColor = subtitleEl ? window.getComputedStyle(subtitleEl).color : "";

        const inputEl = document.querySelector("#email");
        const inputColor = inputEl ? window.getComputedStyle(inputEl).color : "";

        return {
          bgBase,
          subtitleColor,
          inputColor,
        };
      });

      const parsedBg = parseRgb(data.bgBase);
      const parsedSubtitle = parseRgb(data.subtitleColor);
      const parsedInput = parseRgb(data.inputColor);

      const expectedSubtitleHex = theme === "dark" ? "#dbe2fd" : "#2a3054";
      const expectedInputHex = theme === "dark" ? "#ffffff" : "#0e1124";

      const subtitleContrast = getContrastRatio(parsedSubtitle, parsedBg);
      const inputContrast = getContrastRatio(parsedInput, parsedBg);

      console.log(`--bg-base: ${data.bgBase} (${parsedBg.hex})`);
      console.log(
        `Subtitle color: ${data.subtitleColor} (${parsedSubtitle.hex}), Expected: ${expectedSubtitleHex}`,
      );
      console.log(`Subtitle contrast vs --bg-base: ${subtitleContrast}:1 (>= 4.5:1 requirement)`);
      console.log(
        `Input text color: ${data.inputColor} (${parsedInput.hex}), Expected: ${expectedInputHex}`,
      );
      console.log(`Input contrast vs --bg-base: ${inputContrast}:1 (>= 4.5:1 requirement)`);

      if (parsedSubtitle.hex === parsedBg.hex) {
        throw new Error(
          `FAIL: Subtitle color ${parsedSubtitle.hex} equals --bg-base ${parsedBg.hex}!`,
        );
      }
      if (parsedSubtitle.hex !== expectedSubtitleHex) {
        throw new Error(
          `FAIL: Subtitle color ${parsedSubtitle.hex} !== expected ${expectedSubtitleHex}`,
        );
      }
      if (parsedInput.hex !== expectedInputHex) {
        throw new Error(`FAIL: Input color ${parsedInput.hex} !== expected ${expectedInputHex}`);
      }
      if (subtitleContrast < 4.5) {
        throw new Error(`FAIL: Subtitle contrast ${subtitleContrast}:1 is below 4.5:1`);
      }

      const screenshotFile = path.join(screenshotDir, `login-${theme}.png`);
      await page.screenshot({ path: screenshotFile });
      fs.copyFileSync(screenshotFile, path.join(artifactDir, `login-${theme}.png`));
      console.log(`Saved screenshot: ${screenshotFile}`);

      results.push({
        page: "/login",
        theme,
        bgBase: parsedBg.hex,
        subtitle: { hex: parsedSubtitle.hex, contrast: subtitleContrast },
        input: { hex: parsedInput.hex, contrast: inputContrast },
      });

      await context.close();
    }

    // 2. Log in and test /library page in dark and light themes
    console.log("\n=== Authenticating for /library tests ===");
    const authContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const authPage = await authContext.newPage();
    await authPage.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await authPage.fill("#email", "owner@akshelf.local");
    await authPage.fill("#password", "password123");
    await authPage.click("button[type='submit']");
    await authPage.waitForTimeout(3000);
    console.log("Current URL after click:", authPage.url());
    const errorText = await authPage
      .locator("[role='alert']")
      .textContent()
      .catch(() => null);
    if (errorText) {
      console.log("Form error alert:", errorText);
    }
    await authPage.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    console.log("Authenticated successfully! Current URL:", authPage.url());

    for (const theme of ["dark", "light"] as const) {
      console.log(`\n=== Testing /library in ${theme.toUpperCase()} theme ===`);
      await authPage.evaluate((th) => {
        window.localStorage.setItem("akshelf-theme", th);
        document.documentElement.setAttribute("data-theme", th);
      }, theme);

      await authPage.goto("http://localhost:3000/library", { waitUntil: "networkidle" });

      await authPage.evaluate((th) => {
        window.localStorage.setItem("akshelf-theme", th);
        document.documentElement.setAttribute("data-theme", th);
      }, theme);

      const libData = await authPage.evaluate(() => {
        const docStyle = window.getComputedStyle(document.documentElement);
        const bgBase = docStyle.getPropertyValue("--bg-base").trim();

        const subtitleEl = document.querySelector("header p");
        const subtitleColor = subtitleEl ? window.getComputedStyle(subtitleEl).color : "";

        // Empty state body is the p inside empty state container
        const emptyBodyEl = document.querySelector("h3 + p");
        const emptyBodyColor = emptyBodyEl ? window.getComputedStyle(emptyBodyEl).color : "";

        return {
          bgBase,
          subtitleColor,
          emptyBodyColor,
        };
      });

      const parsedBg = parseRgb(libData.bgBase);
      const parsedSubtitle = parseRgb(libData.subtitleColor);
      const parsedEmptyBody = parseRgb(libData.emptyBodyColor);

      const expectedSubtitleHex = theme === "dark" ? "#dbe2fd" : "#2a3054";
      const expectedEmptyBodyHex = theme === "dark" ? "#dbe2fd" : "#2a3054";

      const subtitleContrast = getContrastRatio(parsedSubtitle, parsedBg);
      const emptyBodyContrast = getContrastRatio(parsedEmptyBody, parsedBg);

      console.log(`--bg-base: ${libData.bgBase} (${parsedBg.hex})`);
      console.log(
        `Library subtitle color: ${libData.subtitleColor} (${parsedSubtitle.hex}), Expected: ${expectedSubtitleHex}`,
      );
      console.log(
        `Library subtitle contrast vs --bg-base: ${subtitleContrast}:1 (>= 4.5:1 requirement)`,
      );
      console.log(
        `EmptyState body color: ${libData.emptyBodyColor} (${parsedEmptyBody.hex}), Expected: ${expectedEmptyBodyHex}`,
      );
      console.log(
        `EmptyState body contrast vs --bg-base: ${emptyBodyContrast}:1 (>= 4.5:1 requirement)`,
      );

      if (parsedSubtitle.hex === parsedBg.hex) {
        throw new Error(
          `FAIL: Library subtitle color ${parsedSubtitle.hex} equals --bg-base ${parsedBg.hex}!`,
        );
      }
      if (parsedEmptyBody.hex === parsedBg.hex) {
        throw new Error(
          `FAIL: EmptyState body color ${parsedEmptyBody.hex} equals --bg-base ${parsedBg.hex}!`,
        );
      }
      if (parsedSubtitle.hex !== expectedSubtitleHex) {
        throw new Error(
          `FAIL: Library subtitle color ${parsedSubtitle.hex} !== expected ${expectedSubtitleHex}`,
        );
      }
      if (parsedEmptyBody.hex !== expectedEmptyBodyHex) {
        throw new Error(
          `FAIL: EmptyState body color ${parsedEmptyBody.hex} !== expected ${expectedEmptyBodyHex}`,
        );
      }
      if (subtitleContrast < 4.5) {
        throw new Error(`FAIL: Subtitle contrast ${subtitleContrast}:1 is below 4.5:1`);
      }
      if (emptyBodyContrast < 4.5) {
        throw new Error(`FAIL: EmptyState body contrast ${emptyBodyContrast}:1 is below 4.5:1`);
      }

      const screenshotFile = path.join(screenshotDir, `library-${theme}.png`);
      await authPage.screenshot({ path: screenshotFile });
      fs.copyFileSync(screenshotFile, path.join(artifactDir, `library-${theme}.png`));
      console.log(`Saved screenshot: ${screenshotFile}`);

      results.push({
        page: "/library",
        theme,
        bgBase: parsedBg.hex,
        subtitle: { hex: parsedSubtitle.hex, contrast: subtitleContrast },
        emptyBody: { hex: parsedEmptyBody.hex, contrast: emptyBodyContrast },
      });
    }

    await authContext.close();

    console.log("\n================ ALL VERIFICATIONS PASSED ================");
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
