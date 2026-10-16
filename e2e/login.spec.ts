import { test, expect } from "playwright/test";

test.describe("Login Flow & Route Protection (Day 44)", () => {
  // Use unauthenticated context for login tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test("renders the glassmorphic login card with branding and form controls", async ({ page }) => {
    await page.goto("/login");

    // Check header and branding
    await expect(page.locator("h1")).toContainText("Welcome back");
    await expect(page.getByText("Your movies, shows and anime, on one shelf.")).toBeVisible();

    // Check input fields
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("placeholder", "owner@akshelf.local");
    await expect(passwordInput).toHaveAttribute("placeholder", "Enter password");

    // Check submit button
    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await expect(submitBtn).toBeVisible();
  });

  test("toggles password visibility when clicking the eye toggle button", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = page.getByRole("button", { name: /show password/i });
    await expect(toggleButton).toBeVisible();

    // Allow React hydration to attach handlers
    await page.waitForTimeout(500);
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    const hideButton = page.getByRole("button", { name: /hide password/i });
    await hideButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("displays error feedback on invalid credential submission", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "stranger@unknown.local");
    await page.fill('input[name="password"]', "wrongpassword");

    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await submitBtn.click();

    // Error alert banner should display
    const errorAlert = page
      .getByRole("alert")
      .filter({ hasText: "That email or password is not right." });
    await expect(errorAlert).toBeVisible({ timeout: 15000 });
  });

  test("redirects unauthenticated users trying to access protected routes to /login", async ({
    page,
  }) => {
    const protectedPaths = ["/", "/library", "/search", "/watchlist", "/history", "/settings"];

    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(
        new RegExp(`/login\\?callbackUrl=.*${encodeURIComponent(path)}`),
      );
    }
  });

  test("successfully signs in with owner credentials and redirects to dashboard", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "owner@akshelf.local");
    await page.fill('input[name="password"]', "password123");

    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await submitBtn.click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
    expect(page.url()).not.toContain("/login");
  });
});
