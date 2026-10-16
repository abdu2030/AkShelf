import { test as setup, expect } from "playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate as owner", async ({ page }) => {
  await page.goto("/login");

  await page.fill('input[name="email"]', "owner@akshelf.local");
  await page.fill('input[name="password"]', "password123");

  const submitBtn = page.getByRole("button", { name: /sign in/i });
  await submitBtn.click();

  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
  await expect(page).not.toHaveURL(/\/login/);

  await page.context().storageState({ path: authFile });
});
