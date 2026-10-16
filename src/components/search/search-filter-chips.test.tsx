import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchFilterChips } from "./search-filter-chips";

describe("SearchFilterChips (Accessibility & Semantics)", () => {
  it("renders radiogroup with accessible label and roving tabindex", () => {
    const html = renderToStaticMarkup(<SearchFilterChips selected="ALL" onSelect={vi.fn()} />);

    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Filter search results by media type"');

    // Selected item has aria-checked true and tabindex 0
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('tabindex="0"');

    // Unselected items have aria-checked false and tabindex -1
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('tabindex="-1"');
  });

  it("updates selected item when another option is passed", () => {
    const html = renderToStaticMarkup(<SearchFilterChips selected="MOVIE" onSelect={vi.fn()} />);

    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("Movies");
  });
});
