import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "./app-shell";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/library",
}));

// Mock theme provider
vi.mock("./theme-provider", () => ({
  useTheme: () => ({
    theme: "dark",
    resolvedTheme: "dark",
    setTheme: vi.fn(),
    mounted: true,
  }),
}));

// Mock auth action
vi.mock("@/actions/auth", () => ({
  logoutAction: vi.fn(),
}));

describe("AppShell Accessibility", () => {
  it("renders a skip to main content link targeting #main-content (WCAG 2.4.1)", () => {
    const html = renderToStaticMarkup(
      <AppShell>
        <div>Page Content</div>
      </AppShell>,
    );

    expect(html).toContain('href="#main-content"');
    expect(html).toContain("Skip to main content");
  });

  it("renders main element with id main-content", () => {
    const html = renderToStaticMarkup(
      <AppShell>
        <div>Page Content</div>
      </AppShell>,
    );

    expect(html).toContain('id="main-content"');
    expect(html).toContain("Page Content");
  });

  it("provides accessible navigation regions", () => {
    const html = renderToStaticMarkup(
      <AppShell>
        <div>Page Content</div>
      </AppShell>,
    );

    expect(html).toContain('aria-label="Main"');
    expect(html).toContain('aria-label="Mobile Navigation"');
  });
});
