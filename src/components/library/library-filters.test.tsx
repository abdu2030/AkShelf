import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LibraryFilters, LibraryFilterCounts } from "./library-filters";
import { LibraryHeader } from "./library-header";

describe("LibraryFilters", () => {
  const sampleCounts: LibraryFilterCounts = {
    byType: {
      ALL: 24,
      MOVIE: 10,
      TV: 8,
      ANIME: 6,
    },
    byStatus: {
      ALL: 24,
      WATCHING: 4,
      WATCHED: 15,
      PLAN_TO_WATCH: 3,
      ON_HOLD: 1,
      DROPPED: 1,
    },
    total: 24,
  };

  it("renders all media type and status options", () => {
    const html = renderToStaticMarkup(
      <LibraryFilters
        selectedType="ALL"
        onTypeChange={() => {}}
        selectedStatus="ALL"
        onStatusChange={() => {}}
        counts={sampleCounts}
      />,
    );

    expect(html).toContain('data-testid="library-filters"');
    expect(html).toContain('data-testid="filter-type-all"');
    expect(html).toContain('data-testid="filter-type-movie"');
    expect(html).toContain('data-testid="filter-type-tv"');
    expect(html).toContain('data-testid="filter-type-anime"');

    expect(html).toContain('data-testid="filter-status-all"');
    expect(html).toContain('data-testid="filter-status-watching"');
    expect(html).toContain('data-testid="filter-status-watched"');
    expect(html).toContain('data-testid="filter-status-plan_to_watch"');
    expect(html).toContain('data-testid="filter-status-on_hold"');
    expect(html).toContain('data-testid="filter-status-dropped"');
  });

  it("renders counts when provided", () => {
    const html = renderToStaticMarkup(
      <LibraryFilters
        selectedType="ALL"
        onTypeChange={() => {}}
        selectedStatus="ALL"
        onStatusChange={() => {}}
        counts={sampleCounts}
      />,
    );

    expect(html).toContain(">10<"); // 10 movies
    expect(html).toContain(">8<"); // 8 tv shows
    expect(html).toContain(">6<"); // 6 anime
    expect(html).toContain(">4<"); // 4 watching
    expect(html).toContain(">15<"); // 15 watched
  });

  it("marks active media type and status with aria-pressed='true'", () => {
    const html = renderToStaticMarkup(
      <LibraryFilters
        selectedType="ANIME"
        onTypeChange={() => {}}
        selectedStatus="WATCHING"
        onStatusChange={() => {}}
      />,
    );

    expect(html).toMatch(/aria-pressed="true"[^>]*data-testid="filter-type-anime"/);
    expect(html).toMatch(/aria-pressed="true"[^>]*data-testid="filter-status-watching"/);
    expect(html).toMatch(/aria-pressed="false"[^>]*data-testid="filter-type-all"/);
  });

  it("shows Reset filters button when filters are active", () => {
    const html = renderToStaticMarkup(
      <LibraryFilters
        selectedType="MOVIE"
        onTypeChange={() => {}}
        selectedStatus="ALL"
        onStatusChange={() => {}}
      />,
    );

    expect(html).toContain('data-testid="filter-reset-button"');
    expect(html).toContain("Reset filters");
  });

  it("hides Reset filters button when both filters are ALL", () => {
    const html = renderToStaticMarkup(
      <LibraryFilters
        selectedType="ALL"
        onTypeChange={() => {}}
        selectedStatus="ALL"
        onStatusChange={() => {}}
      />,
    );

    expect(html).not.toContain('data-testid="filter-reset-button"');
  });
});

describe("LibraryHeader", () => {
  it("renders default title, subtitle, and total count badge", () => {
    const html = renderToStaticMarkup(
      <LibraryHeader
        totalCount={42}
        selectedType="ALL"
        onTypeChange={() => {}}
        selectedStatus="ALL"
        onStatusChange={() => {}}
      />,
    );

    expect(html).toContain('data-testid="library-header"');
    expect(html).toContain("My Library");
    expect(html).toContain("All tracked titles filtered by status and media type.");
    expect(html).toContain("42 titles");
  });

  it("renders custom title and action buttons", () => {
    const html = renderToStaticMarkup(
      <LibraryHeader
        title="Custom Shelf"
        subtitle="Custom shelf subtitle"
        selectedType="ALL"
        onTypeChange={() => {}}
        selectedStatus="ALL"
        onStatusChange={() => {}}
        actions={<button data-testid="custom-action">Export</button>}
      />,
    );

    expect(html).toContain("Custom Shelf");
    expect(html).toContain("Custom shelf subtitle");
    expect(html).toContain('data-testid="custom-action"');
  });
});
