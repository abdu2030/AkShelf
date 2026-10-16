import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LibraryView } from "./library-view";
import { MediaCardProps } from "@/components/title/media-card";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

describe("LibraryView Component", () => {
  const sampleItems: MediaCardProps[] = [
    {
      id: "title-1",
      title: "Attack on Titan",
      mediaType: "ANIME",
      status: "WATCHED",
      rating: 9.5,
      year: 2013,
      addedAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-03-01T00:00:00Z",
    },
    {
      id: "title-2",
      title: "Inception",
      mediaType: "MOVIE",
      status: "WATCHING",
      rating: 8.8,
      year: 2010,
      addedAt: "2026-02-01T00:00:00Z",
      updatedAt: "2026-03-15T00:00:00Z",
    },
  ];

  it("renders library header, title counts, and media grid", () => {
    const html = renderToStaticMarkup(<LibraryView initialItems={sampleItems} />);

    expect(html).toContain("My Library");
    expect(html).toContain('data-testid="library-header"');
    expect(html).toContain('data-testid="library-sort"');
    expect(html).toContain("Attack on Titan");
    expect(html).toContain("Inception");
  });

  it("renders empty state when initial items list is empty", () => {
    const html = renderToStaticMarkup(<LibraryView initialItems={[]} />);

    expect(html).toContain('data-testid="library-empty-state"');
    expect(html).toContain("Nothing on your shelf yet");
  });
});
