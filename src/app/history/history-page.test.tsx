import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

import HistoryPage from "./page";

describe("HistoryPage", () => {
  it("renders page title, filter chips, and history feed", async () => {
    const page = await HistoryPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain("History");
    expect(html).toContain("Chronological activity log");
    expect(html).toContain("All");
    expect(html).toContain("Movies");
    expect(html).toContain("TV");
    expect(html).toContain("Anime");
    expect(html).not.toContain("Milestones");
  });
});
