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
  it("renders movie detail view with synopsis, cast preview, and metadata panel", async () => {
    const page = await TitleDetailPage({
      params: Promise.resolve({ id: "demo-tmdb-27205" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Inception");
    expect(html).toContain("(2010)");
    expect(html).toContain("Movie");
    expect(html).toContain("Watched");
    expect(html).toContain("9.5/10");
    expect(html).toContain("Back to Library");

    // Synopsis
    expect(html).toContain("Synopsis");
    expect(html).toContain("Cobb, a skilled thief");

    // Cast Preview
    expect(html).toContain("Cast &amp; Characters");
    expect(html).toContain("Leonardo DiCaprio");
    expect(html).toContain("Dom Cobb");
    expect(html).toContain("Joseph Gordon-Levitt");

    // Metadata Overview Panel
    expect(html).toContain("About &amp; Overview");
    expect(html).toContain("Christopher Nolan");
    expect(html).toContain("Warner Bros. Pictures");
    expect(html).toContain("148m (2h 28m)");
    expect(html).toContain("View on TMDB");
  });

  it("renders anime detail view with cast, metadata, and episodes breakdown", async () => {
    const page = await TitleDetailPage({
      params: Promise.resolve({ id: "demo-anilist-16498" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Attack on Titan");
    expect(html).toContain("(2013)");
    expect(html).toContain("Anime");
    expect(html).toContain("Synopsis");

    // Cast Preview
    expect(html).toContain("Cast &amp; Characters");
    expect(html).toContain("Yuki Kaji");
    expect(html).toContain("Eren Yeager");

    // Metadata Overview Panel
    expect(html).toContain("About &amp; Overview");
    expect(html).toContain("Tetsurō Araki");
    expect(html).toContain("Wit Studio, MAPPA");
    expect(html).toContain("View on AniList");

    // Episodes breakdown
    expect(html).toContain("Episodes");
    expect(html).toContain('role="progressbar"');
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
