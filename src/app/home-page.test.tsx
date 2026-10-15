import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-123", email: "user@akshelf.local" },
  }),
}));

vi.mock("@/lib/db", () => {
  const mockPrisma = {
    userTitle: {
      groupBy: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import HomePage from "./page";
import { prisma } from "@/lib/db";

describe("HomePage (Dashboard - Day 36)", () => {
  it("renders live dashboard stats and active shelf when user has tracked titles", async () => {
    vi.mocked(prisma.userTitle.groupBy).mockResolvedValueOnce([
      { status: "WATCHED", _count: { status: 18 } },
      { status: "WATCHING", _count: { status: 3 } },
      { status: "PLAN_TO_WATCH", _count: { status: 7 } },
    ] as unknown as never);

    const page = await HomePage();
    const html = renderToStaticMarkup(page);

    // Header
    expect(html).toContain("Your shelf");
    expect(html).toContain("Track what you watch, what is next, and your ratings.");

    // Stat tiles with real counts
    expect(html).toContain("Total tracked");
    expect(html).toContain("28");
    expect(html).toContain("Watched");
    expect(html).toContain("18");
    expect(html).toContain("Watching");
    expect(html).toContain("3");
    expect(html).toContain("Plan to Watch");
    expect(html).toContain("7");

    // Active shelf overview
    expect(html).toContain("Active Shelf Overview");
    expect(html).toContain("View Library");
    expect(html).toContain("Watching (3)");
    expect(html).toContain("Plan to Watch (7)");
    expect(html).toContain("Watched (18)");
  });

  it("renders stat tiles with 0 and spec empty state when user has zero tracked titles", async () => {
    vi.mocked(prisma.userTitle.groupBy).mockResolvedValueOnce([] as unknown as never);

    const page = await HomePage();
    const html = renderToStaticMarkup(page);

    // Stat tiles render zeros per spec (Section 10.2)
    expect(html).toContain("Total tracked");
    expect(html).toContain("Watched");
    expect(html).toContain("Watching");
    expect(html).toContain("Plan to Watch");

    // Empty state headline & CTA
    expect(html).toContain("Your shelf is empty");
    expect(html).toContain("Search for a movie, show or anime to start.");
    expect(html).toContain("Search titles");
  });
});
