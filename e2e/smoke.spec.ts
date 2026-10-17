import { test, expect } from "playwright/test";

test.describe("Production Smoke Test Suite across Viewports & Devices (Day 52)", () => {
  test("health check endpoint returns 200 OK and connected database", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.app).toBe("AkShelf");
    expect(data.version).toBe("1.0.0-rc.1");
    expect(data.services.database.status).toBe("connected");
  });

  test("dashboard renders cleanly without horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Verify main content is rendered
    await expect(page.locator("main")).toBeVisible();

    // Verify no horizontal overflow (responsive safety)
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(overflow).toBe(false);
  });

  test("library page renders empty state and filter controls responsive", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("domcontentloaded");

    // Header and filter elements
    await expect(page.getByRole("heading", { name: /library/i })).toBeVisible();

    // Check no horizontal scroll
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(overflow).toBe(false);
  });

  test("search view handles responsive input and filter chip selection", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("domcontentloaded");

    // Search input
    const searchInput = page.getByPlaceholder(/search movies, tv series/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Inception");
    expect(await searchInput.inputValue()).toBe("Inception");

    // Filter chips
    const movieChip = page.getByRole("radio", { name: /^movies$/i });
    if (await movieChip.isVisible()) {
      await movieChip.click();
    }

    // Check no horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(overflow).toBe(false);
  });

  test("history page renders clean activity feed or empty state", async ({ page }) => {
    await page.goto("/history");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: /history/i })).toBeVisible();

    // Verify no horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(overflow).toBe(false);
  });

  test("settings page renders data safety export controls and theme switcher", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: /your data & backups/i })).toBeVisible();

    // Export buttons present
    const jsonExportBtn = page.getByRole("link", {
      name: /export json \(full backup\)/i,
    });
    const csvExportBtn = page.getByRole("link", {
      name: /export csv \(spreadsheet\)/i,
    });
    await expect(jsonExportBtn).toBeVisible();
    await expect(csvExportBtn).toBeVisible();
    expect(await jsonExportBtn.getAttribute("href")).toBe("/api/export/json");
    expect(await csvExportBtn.getAttribute("href")).toBe("/api/export/csv");

    // Theme switching works
    const darkBtn = page.getByRole("button", { name: /^dark$/i });
    if (await darkBtn.isVisible()) {
      await darkBtn.click();
      await expect(page.locator("html")).toHaveClass(/dark/);
    }

    // Verify no horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(overflow).toBe(false);
  });
});
