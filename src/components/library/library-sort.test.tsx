import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LibrarySort } from "./library-sort";
import { LibraryFilters } from "./library-filters";
import { LibraryHeader } from "./library-header";
import { sortOptions } from "@/lib/utils/sort";

describe("LibrarySort", () => {
  it("renders sort container and all available sort options", () => {
    const html = renderToStaticMarkup(
      <LibrarySort
        sortField="DATE_ADDED"
        onSortFieldChange={() => {}}
        sortDirection="desc"
        onSortDirectionChange={() => {}}
      />,
    );

    expect(html).toContain('data-testid="library-sort"');
    expect(html).toContain('data-testid="sort-field-select"');
    expect(html).toContain('data-testid="sort-direction-button"');

    // All sort option labels must be rendered
    for (const opt of sortOptions) {
      expect(html).toContain(opt.label);
      expect(html).toContain(`value="${opt.field}"`);
    }
  });

  it("renders correct accessible labels for descending direction", () => {
    const html = renderToStaticMarkup(
      <LibrarySort
        sortField="TITLE"
        onSortFieldChange={() => {}}
        sortDirection="desc"
        onSortDirectionChange={() => {}}
      />,
    );

    expect(html).toContain('aria-label="Sort descending (switch to ascending)"');
    expect(html).toContain('title="Descending order"');
  });

  it("renders correct accessible labels for ascending direction", () => {
    const html = renderToStaticMarkup(
      <LibrarySort
        sortField="TITLE"
        onSortFieldChange={() => {}}
        sortDirection="asc"
        onSortDirectionChange={() => {}}
      />,
    );

    expect(html).toContain('aria-label="Sort ascending (switch to descending)"');
    expect(html).toContain('title="Ascending order"');
  });

  it("renders within LibraryFilters when sorting props are provided", () => {
    const html = renderToStaticMarkup(
      <LibraryFilters
        selectedType="ALL"
        onTypeChange={() => {}}
        selectedStatus="ALL"
        onStatusChange={() => {}}
        sortField="RATING"
        onSortFieldChange={() => {}}
        sortDirection="desc"
        onSortDirectionChange={() => {}}
      />,
    );

    expect(html).toContain('data-testid="library-sort"');
    expect(html).toContain('data-testid="sort-field-select"');
  });

  it("renders within LibraryHeader when sorting props are provided", () => {
    const html = renderToStaticMarkup(
      <LibraryHeader
        selectedType="ALL"
        onTypeChange={() => {}}
        selectedStatus="ALL"
        onStatusChange={() => {}}
        sortField="RELEASE_YEAR"
        onSortFieldChange={() => {}}
        sortDirection="asc"
        onSortDirectionChange={() => {}}
      />,
    );

    expect(html).toContain('data-testid="library-header"');
    expect(html).toContain('data-testid="library-sort"');
  });
});
