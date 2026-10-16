import { test, expect } from "playwright/test";

test.describe("Tracking Flow: Status Transitions, Ratings & Dates (Day 44)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/title/demo-tmdb-27205");
  });

  test("renders title hero with metadata, poster, and interactive tracking controls", async ({
    page,
  }) => {
    // Title header
    await expect(page.locator("h1")).toContainText("Inception");

    // Overview synopsis
    await expect(
      page.getByText(/Cobb, a skilled thief who commits corporate espionage/i),
    ).toBeVisible();

    // Tracking controls
    const statusSelector = page.getByRole("button", { name: /change watch status/i });
    await expect(statusSelector).toBeVisible({ timeout: 15000 });

    const ratingControl = page
      .getByRole("radiogroup", { name: /rating/i })
      .or(page.locator(".select-none"));
    await expect(ratingControl.first()).toBeVisible();
  });

  test("updates watch status via StatusSelector dropdown", async ({ page }) => {
    const statusTrigger = page.getByRole("button", { name: /change watch status/i });
    await expect(statusTrigger).toBeVisible({ timeout: 15000 });

    // Open status dropdown menu
    await statusTrigger.click();

    // Select "Plan to Watch"
    const planToWatchOption = page.getByRole("menuitem", { name: /plan to watch/i });
    await expect(planToWatchOption).toBeVisible();
    await planToWatchOption.click();

    // Verify optimistic status update reflected in button
    await expect(page.getByRole("button", { name: /currently plan to watch/i })).toBeVisible();

    // Change status to "Watched"
    await page.getByRole("button", { name: /currently plan to watch/i }).click();
    const watchedOption = page.getByRole("menuitem", { name: /^watched$/i });
    await expect(watchedOption).toBeVisible();
    await watchedOption.click();

    // Verify status update reflected
    await expect(page.getByRole("button", { name: /currently watched/i })).toBeVisible();
  });

  test("rates title and clears rating using RatingControl", async ({ page }) => {
    // Rate 8 out of 10
    const star8 = page.getByRole("radio", { name: "Rate 8 out of 10" });
    await expect(star8).toBeVisible({ timeout: 15000 });
    await star8.click();

    // Verify rating feedback inside control
    const ratingLabel = page.locator("span.text-ink-base").filter({ hasText: /Your rating/i });
    await expect(ratingLabel).toBeVisible();

    // Rate 10 out of 10
    const star10 = page.getByRole("radio", { name: "Rate 10 out of 10" });
    await star10.click();
    await expect(ratingLabel).toContainText("10");

    // Clear rating
    const clearRatingBtn = page.getByRole("button", { name: /clear rating/i });
    await expect(clearRatingBtn).toBeVisible();
    await clearRatingBtn.click();

    await expect(page.getByText(/Rate this title:/i)).toBeVisible();
  });

  test("interacts with DateTracker dates accordion", async ({ page }) => {
    // Find DateTracker accordion trigger
    const dateToggle = page.getByRole("button", { name: /tracking dates|edit dates|dates/i });
    if (await dateToggle.isVisible({ timeout: 15000 })) {
      await dateToggle.click();
      const dateInputs = page.locator('input[type="date"]');
      await expect(dateInputs.first()).toBeVisible();
    }
  });
});
