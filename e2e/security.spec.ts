import { test, expect } from "playwright/test";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./helpers";

test.describe("Security Boundaries & Permission Controls (Day 45)", () => {
  test.describe("Unauthenticated Visitor Boundary", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("defends against open redirect attacks by sanitizing external callbackUrl on login", async ({
      page,
    }) => {
      // Attacker constructs a phishing link with external destination
      await page.goto("/login?callbackUrl=https://evil.com/phishing-target");

      await page.fill('input[name="email"]', OWNER_EMAIL);
      await page.fill('input[name="password"]', OWNER_PASSWORD);

      const submitBtn = page.getByRole("button", { name: /sign in/i });
      await submitBtn.click();

      // Ensure user is redirected to local application dashboard and never external domain
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
      const currentUrl = page.url();
      expect(currentUrl).not.toContain("evil.com");
      expect(new URL(currentUrl).origin).toBe("http://127.0.0.1:3000");
    });

    test("defends against protocol-relative open redirect attacks", async ({ page }) => {
      await page.goto("/login?callbackUrl=//evil-attacker.org/steal");

      await page.fill('input[name="email"]', OWNER_EMAIL);
      await page.fill('input[name="password"]', OWNER_PASSWORD);

      const submitBtn = page.getByRole("button", { name: /sign in/i });
      await submitBtn.click();

      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
      const currentUrl = page.url();
      expect(currentUrl).not.toContain("evil-attacker.org");
      expect(new URL(currentUrl).origin).toBe("http://127.0.0.1:3000");
    });

    test("protects against unauthorized data leakage on API endpoints", async ({ request }) => {
      const response = await request.get("/api/search?q=Inception");
      expect(response.ok()).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("onShelf");
      expect(data).toHaveProperty("results");

      // Verify no sensitive session or database user secrets are leaked
      const rawText = JSON.stringify(data);
      expect(rawText).not.toContain("password");
      expect(rawText).not.toContain("hash");
      expect(rawText).not.toContain("DATABASE_URL");
      expect(rawText).not.toContain("AUTH_SECRET");
    });

    test("guards against short-query scraping or database probing", async ({ request }) => {
      const response = await request.get("/api/search?q=x");
      expect(response.ok()).toBe(true);

      const data = await response.json();
      expect(data).toEqual({ onShelf: [], results: [] });
    });
  });

  test.describe("Authenticated Session Boundary", () => {
    // Uses the authenticated storage state from auth.setup.ts
    test("redirects authenticated owner away from /login back to dashboard", async ({ page }) => {
      await page.goto("/login");

      // Logged in owner should immediately bounce away from login page
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
      expect(new URL(page.url()).pathname).toBe("/");
    });
  });
});
