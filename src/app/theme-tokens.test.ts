import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Theme token collision regression guard", () => {
  const globalsCssPath = path.resolve(__dirname, "./globals.css");
  const globalsCssContent = fs.readFileSync(globalsCssPath, "utf-8");

  // Extract the @theme block
  const themeBlockMatch = globalsCssContent.match(/@theme\s+inline\s*\{([\s\S]*?)\}/);

  it("contains a valid @theme inline block in globals.css", () => {
    expect(themeBlockMatch).not.toBeNull();
  });

  it("does not define any --color-* token that collides with a Tailwind size key", () => {
    const themeBlock = themeBlockMatch ? themeBlockMatch[1] : "";

    // Find all --color-<name> declarations
    const colorTokenRegex = /--color-([a-zA-Z0-9-]+)\s*:/g;
    const colorNames: string[] = [];
    let match;

    while ((match = colorTokenRegex.exec(themeBlock)) !== null) {
      colorNames.push(match[1]);
    }

    expect(colorNames.length).toBeGreaterThan(0);

    // Standard Tailwind size and scale keys that generate text-*, bg-*, etc. utilities
    const tailwindSizeKeys = [
      "base",
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
      "2xl",
      "3xl",
      "4xl",
      "5xl",
      "6xl",
      "7xl",
      "8xl",
      "9xl",
    ];

    const collidingTokens = colorNames.filter((name) => tailwindSizeKeys.includes(name));

    expect(
      collidingTokens,
      `Found --color-* tokens colliding with Tailwind size keys: ${collidingTokens.join(", ")}. In Tailwind v4, this causes utilities like text-<size> to set color to background value.`,
    ).toEqual([]);
  });

  it("renames --color-base to --color-canvas mapping to var(--bg-base)", () => {
    const themeBlock = themeBlockMatch ? themeBlockMatch[1] : "";
    expect(themeBlock).not.toMatch(/--color-base\s*:/);
    expect(themeBlock).toMatch(/--color-canvas\s*:\s*var\(--bg-base\)/);
  });
});
