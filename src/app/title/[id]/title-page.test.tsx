import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

import TitleDetailPage from "./page";

describe("TitleDetailPage Component", () => {
  it("renders movie detail view for demo title ID", async () => {
    const page = await TitleDetailPage({
      params: Promise.resolve({ id: "demo-tmdb-27205" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Inception");
    expect(html).toContain("2010");
    expect(html).toContain("Movie");
    expect(html).toContain("Watched");
    expect(html).toContain("9.5/10");
    expect(html).toContain("Back to Library");
  });

  it("renders anime detail view with episodes breakdown", async () => {
    const page = await TitleDetailPage({
      params: Promise.resolve({ id: "demo-anilist-16498" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Attack on Titan");
    expect(html).toContain("2013");
    expect(html).toContain("Anime");
    expect(html).toContain("Seasons &amp; Episodes");
    expect(html).toContain("EP 1");
    expect(html).toContain("To You, in 2000 Years");
  });

  it("renders not found state for nonexistent title ID", async () => {
    const page = await TitleDetailPage({
      params: Promise.resolve({ id: "nonexistent-id-99999" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Title Not Found");
    expect(html).toContain("Back to Library");
  });
});
