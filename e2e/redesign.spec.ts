import { test, expect } from "playwright/test";

// Visual artifacts are evidence, not image snapshots that silently redefine behavior.
test.describe("Cinematic archive responsive verification", () => {
  test.setTimeout(180_000);

  test("failed search offers retry without losing the query", async ({ page }) => {
    let attempts = 0;
    await page.route("**/api/search?**", (route) => {
      attempts++;
      return route.fulfill({
        status: attempts === 1 ? 503 : 200,
        contentType: "application/json",
        body: JSON.stringify(
          attempts === 1 ? { error: "Unavailable" } : { onShelf: [], results: [] },
        ),
      });
    });
    await page.goto("/search");
    const input = page.getByRole("searchbox", { name: "Search titles" });
    await input.fill("a title");
    await expect(page.locator("main").getByRole("alert")).toContainText("Search is unavailable");
    await expect(input).toHaveValue("a title");
    await page.getByRole("button", { name: "Retry search" }).click();
    await expect(page.getByRole("heading", { name: "No matches found" })).toBeVisible();
    expect(attempts).toBe(2);
  });

  for (const theme of ["dark", "light"] as const) {
    test(`desktop routes in ${theme} theme`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.addInitScript((value) => localStorage.setItem("akshelf-theme", value), theme);
      for (const route of ["/", "/library", "/search", "/watchlist", "/history", "/settings"]) {
        await page.goto(route);
        await expect(page.locator("main h1")).toBeVisible();
        if (route === "/library")
          await expect(page.getByTestId("library-header")).toBeVisible({ timeout: 60_000 });
        if (route === "/")
          await expect(page.getByTestId("stats-band")).toBeVisible({ timeout: 60_000 });
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`${route.replaceAll("/", "") || "home"}-${theme}.png`),
          fullPage: true,
        });
      }
    });
  }

  test("small screens retain navigation and working search input", async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      localStorage.setItem("akshelf-motion", "reduced");
      localStorage.setItem("akshelf-theme", "light");
    });
    for (const width of [360, 390, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/library");
      await expect(page.getByTestId("library-header")).toBeVisible({ timeout: 60_000 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`library-${width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/search");
    const search = page.getByRole("searchbox", { name: "Search titles" });
    await search.fill("a");
    await expect(search).toHaveValue("a");
    await page.getByRole("button", { name: "Clear search input" }).click();
    await expect(search).toHaveValue("");
    await expect(page.getByRole("navigation", { name: "Mobile Navigation" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath("search-360.png"), fullPage: true });
  });

  test("film and series records keep tracking controls reachable", async ({ page }, testInfo) => {
    for (const width of [1440, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const [id, type] of [
        ["demo-tmdb-27205", "MOVIE"],
        ["demo-tmdb-1399", "TV"],
      ]) {
        await page.goto(`/title/${id}?type=${type}`);
        await expect(page.locator("#your-shelf-heading")).toBeVisible({ timeout: 60_000 });
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`${type.toLowerCase()}-${width}.png`),
          fullPage: true,
        });
      }
    }
  });

  test("login fits desktop and phone without an authenticated session", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    for (const width of [1440, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("http://127.0.0.1:3000/login");
      await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
      await page.getByLabel("Password", { exact: true }).fill("visibility-test");
      await page.getByRole("button", { name: "Show password" }).click();
      await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      await page.getByLabel("Password", { exact: true }).fill("");
      await page.screenshot({ path: testInfo.outputPath(`login-${width}.png`), fullPage: true });
    }
    await context.close();
  });
});
