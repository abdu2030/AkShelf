import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SeasonSelector } from "./season-selector";

describe("SeasonSelector Component", () => {
  const mockSeasons = [
    { seasonNumber: 1, episodeCount: 24, watchedCount: 24 },
    { seasonNumber: 2, episodeCount: 12, watchedCount: 4 },
    { seasonNumber: 3, episodeCount: 10, watchedCount: 0 },
  ];

  it("renders pill buttons for each season with watched counts", () => {
    const html = renderToStaticMarkup(
      <SeasonSelector seasons={mockSeasons} selectedSeason={2} onSelectSeason={vi.fn()} />,
    );

    expect(html).toContain("S1");
    expect(html).toContain("24/24");
    expect(html).toContain("S2");
    expect(html).toContain("4/12");
    expect(html).toContain("S3");
    expect(html).toContain("0/10");
  });

  it("marks the selected season with aria-selected true and roving tabIndex", () => {
    const html = renderToStaticMarkup(
      <SeasonSelector seasons={mockSeasons} selectedSeason={2} onSelectSeason={vi.fn()} />,
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Season selection"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('tabindex="-1"');
  });

  it("returns null if only 1 season exists (no selector needed)", () => {
    const html = renderToStaticMarkup(
      <SeasonSelector
        seasons={[{ seasonNumber: 1, episodeCount: 12 }]}
        selectedSeason={1}
        onSelectSeason={vi.fn()}
      />,
    );

    expect(html).toBe("");
  });
});
