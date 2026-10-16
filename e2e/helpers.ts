import { Page } from "playwright/test";

export const OWNER_EMAIL = "owner@akshelf.local";
export const OWNER_PASSWORD = "password123";

/**
 * Authenticates as the single owner and ensures navigation to dashboard.
 */
export async function loginAsOwner(page: Page) {
  await page.goto("/login");

  // Check if already logged in (redirected to /)
  if (page.url().endsWith("/") && !page.url().includes("/login")) {
    return;
  }

  await page.fill('input[name="email"]', OWNER_EMAIL);
  await page.fill('input[name="password"]', OWNER_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
}
