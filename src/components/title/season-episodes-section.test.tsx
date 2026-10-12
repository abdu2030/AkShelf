import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SeasonEpisodesSection } from "./season-episodes-section";

describe("SeasonEpisodesSection Component", () => {
  const mockSeasons = [
    {
      seasonNumber: 1,
      name: "Season 1",
      episodeCount: 5,
      episodes: [
        { episodeNumber: 1, name: "Episode 1", runtime: 24, airDate: "2023-10-01" },
        { episodeNumber: 2, name: "Episode 2", runtime: 24, airDate: "2023-10-08" },
        { episodeNumber: 3, name: "Episode 3", runtime: 24, airDate: "2023-10-15" },
        { episodeNumber: 4, name: "Episode 4", runtime: 24, airDate: "2023-10-22" },
        { episodeNumber: 5, name: "Episode 5", runtime: 24, airDate: "2023-10-29" },
      ],
    },
    {
      seasonNumber: 2,
      name: "Season 2",
      episodeCount: 3,
      episodes: [
        { episodeNumber: 1, name: "S2 Premiere", runtime: 24 },
        { episodeNumber: 2, name: "S2 Ep 2", runtime: 24 },
        { episodeNumber: 3, name: "S2 Finale", runtime: 24 },
      ],
    },
  ];

  it("renders SeasonSelector, progress bar, continue button, and episode rows", () => {
    const html = renderToStaticMarkup(
      <SeasonEpisodesSection seasons={mockSeasons} userCurrentSeason={1} userCurrentEpisode={2} />,
    );

    // Section title
    expect(html).toContain("Episodes");

    // Season selector pills
    expect(html).toContain("S1");
    expect(html).toContain("S2");

    // Progress bar for Season 1
    expect(html).toContain("Season 1: 2 / 5 episodes");
    expect(html).toContain('role="progressbar"');

    // Primary Continue action for next unwatched episode (Episode 3)
    expect(html).toContain("Continue S1 E3");

    // Episode rows
    expect(html).toContain("Episode 1");
    expect(html).toContain("Episode 2");
    expect(html).toContain("Episode 3");
  });

  it("returns null when seasons array is empty", () => {
    const html = renderToStaticMarkup(<SeasonEpisodesSection seasons={[]} />);
    expect(html).toBe("");
  });
});
