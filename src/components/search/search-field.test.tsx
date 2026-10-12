import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchField } from "./search-field";

describe("SearchField Component", () => {
  it("renders search input with default placeholder", () => {
    const html = renderToStaticMarkup(<SearchField value="" onValueChange={vi.fn()} />);

    expect(html).toContain('role="searchbox"');
    expect(html).toContain('placeholder="Search movies, shows, anime..."');
    expect(html).toContain('aria-label="Search titles"');
  });

  it("renders clear button when value is present", () => {
    const html = renderToStaticMarkup(
      <SearchField value="Dune" onValueChange={vi.fn()} onClear={vi.fn()} />,
    );

    expect(html).toContain('aria-label="Clear search input"');
    expect(html).not.toContain("<kbd");
  });

  it("renders loading spinner when isLoading is true", () => {
    const html = renderToStaticMarkup(
      <SearchField value="Dune" onValueChange={vi.fn()} isLoading={true} />,
    );

    expect(html).toContain('data-testid="search-spinner"');
    expect(html).toContain("Searching...");
  });

  it("renders keyboard shortcut indicator when value is empty and not loading", () => {
    const html = renderToStaticMarkup(<SearchField value="" onValueChange={vi.fn()} />);

    expect(html).toContain("<kbd");
    expect(html).toContain("/");
  });
});
