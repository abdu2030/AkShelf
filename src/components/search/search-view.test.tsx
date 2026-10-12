import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchView } from "./search-view";
import { SearchFilterChips } from "./search-filter-chips";
import { RecentSearchesList } from "./recent-searches-list";

// Mock useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("SearchFilterChips Component", () => {
  it("renders All, Movies, TV, and Anime filter chips", () => {
    const html = renderToStaticMarkup(<SearchFilterChips selected="ALL" onSelect={vi.fn()} />);

    expect(html).toContain("All");
    expect(html).toContain("Movies");
    expect(html).toContain("TV");
    expect(html).toContain("Anime");
    expect(html).toContain('aria-checked="true"');
  });

  it("marks selected media type chip with checked aria attribute and active fill", () => {
    const html = renderToStaticMarkup(<SearchFilterChips selected="ANIME" onSelect={vi.fn()} />);

    expect(html).toContain("Anime");
    expect(html).toContain("bg-accent-fill");
  });
});

describe("RecentSearchesList Component", () => {
  it("returns null when searches array is empty", () => {
    const html = renderToStaticMarkup(
      <RecentSearchesList
        searches={[]}
        onSelectSearch={vi.fn()}
        onRemoveSearch={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(html).toBe("");
  });

  it("renders list of recent search chips with clear button", () => {
    const html = renderToStaticMarkup(
      <RecentSearchesList
        searches={["Inception", "Dune"]}
        onSelectSearch={vi.fn()}
        onRemoveSearch={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(html).toContain("Recent searches");
    expect(html).toContain("Clear all");
    expect(html).toContain("Inception");
    expect(html).toContain("Dune");
  });
});

describe("SearchView Component", () => {
  it("renders search input, filter chips, and initial empty state", () => {
    const html = renderToStaticMarkup(<SearchView />);

    expect(html).toContain('role="searchbox"');
    expect(html).toContain("Search for a movie, show or anime");
    expect(html).toContain("All");
    expect(html).toContain("Movies");
    expect(html).toContain("TV");
    expect(html).toContain("Anime");
  });
});
