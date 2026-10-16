import { test, expect } from "playwright/test";

test.describe("Library Filters & Sorting (Day 44)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library");
  });

  test("renders library header, status tabs, media type chips, and sort controls", async ({
    page,
  }) => {
    // Header
    await expect(page.locator("h1")).toContainText(/Library/i);

    // Status filter buttons
    await expect(page.getByTestId("filter-status-all")).toBeVisible();
    await expect(page.getByTestId("filter-status-watching")).toBeVisible();
    await expect(page.getByTestId("filter-status-plan_to_watch")).toBeVisible();
    await expect(page.getByTestId("filter-status-watched")).toBeVisible();

    // Media type filter chips
    await expect(page.getByTestId("filter-type-movie")).toBeVisible();
    await expect(page.getByTestId("filter-type-tv")).toBeVisible();
    await expect(page.getByTestId("filter-type-anime")).toBeVisible();

    // Sort control
    const sortTrigger = page.getByRole("button", { name: /sort|recently updated/i });
    await expect(sortTrigger.first()).toBeVisible();
  });

  test("filters library items by status tabs", async ({ page }) => {
    // Click "Watched" status button
    const watchedBtn = page.getByTestId("filter-status-watched");
    await watchedBtn.click();
    await expect(watchedBtn).toHaveAttribute("aria-pressed", "true");

    // Click "Watching" status button
    const watchingBtn = page.getByTestId("filter-status-watching");
    await watchingBtn.click();
    await expect(watchingBtn).toHaveAttribute("aria-pressed", "true");
    await expect(watchedBtn).toHaveAttribute("aria-pressed", "false");

    // Click "All" status button to reset
    const allBtn = page.getByTestId("filter-status-all");
    await allBtn.click();
    await expect(allBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("filters library items by media type chips", async ({ page }) => {
    // Click Movies chip
    const moviesChip = page.getByTestId("filter-type-movie");
    await moviesChip.click();
    await expect(moviesChip).toHaveAttribute("aria-pressed", "true");

    // Click TV Shows chip
    const tvChip = page.getByTestId("filter-type-tv");
    await tvChip.click();
    await expect(tvChip).toHaveAttribute("aria-pressed", "true");
    await expect(moviesChip).toHaveAttribute("aria-pressed", "false");

    // Click Anime chip
    const animeChip = page.getByTestId("filter-type-anime");
    await animeChip.click();
    await expect(animeChip).toHaveAttribute("aria-pressed", "true");

    // Click All chip
    const allChip = page.getByTestId("filter-type-all");
    await allChip.click();
    await expect(allChip).toHaveAttribute("aria-pressed", "true");
  });

  test("interacts with library sort dropdown", async ({ page }) => {
    const sortTrigger = page.getByRole("button", { name: /sort|recently updated|title/i }).first();
    await sortTrigger.click();

    // Select Title (A-Z) if available in dropdown
    const titleOption = page
      .getByRole("menuitem", { name: /title|a-z/i })
      .or(page.getByText(/title \(a-z\)/i));
    if (await titleOption.first().isVisible()) {
      await titleOption.first().click();
    }
  });

  test("navigates to title page on clicking a media card in the library grid", async ({ page }) => {
    // Locate first media card
    const firstCard = page.locator('a[href*="/title/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();

    await expect(page).toHaveURL(/\/title\/.+/);
  });
});
