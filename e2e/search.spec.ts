import { test, expect } from "playwright/test";

test.describe("Search Flow & Filter Chips (Day 44)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
  });

  test("renders the search view with input field and filter chips", async ({ page }) => {
    // Check page heading
    await expect(page.locator("h1")).toContainText("Search");
    await expect(
      page.getByText("Find movies, TV shows, and anime across TMDB and AniList."),
    ).toBeVisible();

    // Check search input field
    const searchInput = page.getByRole("searchbox");
    await expect(searchInput).toBeVisible();

    // Check filter chips with role="radio"
    await expect(page.getByRole("radio", { name: /^All$/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /^Movies$/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /^TV$/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /^Anime$/i })).toBeVisible();
  });

  test("allows switching between filter chips", async ({ page }) => {
    const moviesChip = page.getByRole("radio", { name: /^Movies$/i });
    const tvChip = page.getByRole("radio", { name: /^TV$/i });
    const allChip = page.getByRole("radio", { name: /^All$/i });

    // Click Movies filter chip
    await moviesChip.click();
    await expect(moviesChip).toHaveAttribute("aria-checked", "true");

    // Click TV filter chip
    await tvChip.click();
    await expect(tvChip).toHaveAttribute("aria-checked", "true");
    await expect(moviesChip).toHaveAttribute("aria-checked", "false");

    // Click All filter chip
    await allChip.click();
    await expect(allChip).toHaveAttribute("aria-checked", "true");
  });

  test("executes search query and renders search result items", async ({ page }) => {
    const searchInput = page.getByRole("searchbox");
    await searchInput.fill("Inception");

    // Result row containing Inception should be visible
    const inceptionRow = page.getByText("Inception").first();
    await expect(inceptionRow).toBeVisible({ timeout: 15000 });
  });

  test("navigates to title detail page upon clicking a search result row", async ({ page }) => {
    const searchInput = page.getByRole("searchbox");
    await searchInput.fill("Inception");

    // Find and click the search result row
    const resultItem = page.locator('a[href*="/title/"]').first();
    await expect(resultItem).toBeVisible({ timeout: 15000 });
    await resultItem.click();

    // Should navigate to /title/...
    await expect(page).toHaveURL(/\/title\/.+/);
  });
});
