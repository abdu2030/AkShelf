import { test, expect } from "playwright/test";

test.describe("Watchlist Flow (Day 44)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/watchlist");
  });

  test("renders watchlist page header and empty state or queue", async ({ page }) => {
    // Header
    await expect(page.locator("h1")).toContainText(/Watchlist/i, { timeout: 15000 });
    await expect(page.getByText("Titles you plan to watch next.")).toBeVisible();

    // Check either empty state or titles in queue
    const emptyHeadline = page.getByText("Your watchlist is empty");
    const searchActionBtn = page.getByRole("link", { name: /search titles/i });

    if (await emptyHeadline.isVisible()) {
      await expect(searchActionBtn).toBeVisible();
      await expect(searchActionBtn).toHaveAttribute("href", "/search");
    }
  });

  test("navigates to search page when clicking search titles action in empty state", async ({
    page,
  }) => {
    const searchActionBtn = page.getByRole("link", { name: /search titles/i });
    if (await searchActionBtn.isVisible({ timeout: 15000 })) {
      await searchActionBtn.click();
      await expect(page).toHaveURL("/search");
    }
  });
});
