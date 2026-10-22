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

    // Overall series progress badge (Day 34)
    expect(html).toContain("2 / 8 (25%)");

    // Season selector pills
    expect(html).toContain("S1");
    expect(html).toContain("S2");

    // Progress bar for Season 1
    expect(html).toContain("2 / 5 episodes - 40%");
    expect(html).toContain('role="progressbar"');

    // Primary Continue action for next unwatched episode (Episode 3)
    expect(html).toContain("Continue S1 E3");

    // Episode rows
    expect(html).toContain("Episode 1");
    expect(html).toContain("Episode 2");
    expect(html).toContain("Episode 3");
  });

  it("renders spec empty state when seasons array is empty", () => {
    const html = renderToStaticMarkup(
      <SeasonEpisodesSection seasons={[]} onMarkSeriesWatched={() => {}} />,
    );
    expect(html).toContain("No episode details yet");
    expect(html).toContain("You can still mark the whole series as watched.");
    expect(html).toContain("Mark series watched");
  });

  it("renders with external title props and batch season controls", () => {
    const html = renderToStaticMarkup(
      <SeasonEpisodesSection
        seasons={mockSeasons}
        userCurrentSeason={1}
        userCurrentEpisode={2}
        titleExternalSource="tmdb"
        titleExternalId="1399"
        titleName="Game of Thrones"
        mediaType="TV"
      />,
    );

    expect(html).toContain("Mark Season Watched");
    expect(html).toContain("Continue S1 E3");
  });

  it("marks past episodes as watched based on userCurrentEpisode", () => {
    const html = renderToStaticMarkup(
      <SeasonEpisodesSection seasons={mockSeasons} userCurrentSeason={1} userCurrentEpisode={3} />,
    );

    // Episode 1, 2, 3 should have aria-checked="true"
    expect(html).toContain('aria-label="Mark Episode 1 as unwatched"');
    expect(html).toContain('aria-label="Mark Episode 2 as unwatched"');
    expect(html).toContain('aria-label="Mark Episode 3 as unwatched"');

    // Episode 4 should be unwatched
    expect(html).toContain('aria-label="Mark Episode 4 as watched"');
    expect(html).toContain("Continue S1 E4");
  });

  it("advances next-up button to Season 2 Episode 1 when Season 1 is completed (Day 34)", () => {
    const html = renderToStaticMarkup(
      <SeasonEpisodesSection seasons={mockSeasons} userCurrentSeason={1} userCurrentEpisode={5} />,
    );

    // Series progress is 5 / 8 = 63%
    expect(html).toContain("5 / 8 (63%)");

    // Continue button dynamically points to Season 2 Episode 1!
    expect(html).toContain("Continue S2 E1");
  });

  it("renders 'All Episodes Watched' when every episode in series is watched", () => {
    const html = renderToStaticMarkup(
      <SeasonEpisodesSection seasons={mockSeasons} userCurrentSeason={2} userCurrentEpisode={3} />,
    );

    expect(html).toContain("8 / 8 (100%)");
    expect(html).toContain("All Episodes Watched");
  });

  it("persists watched episodes from initialWatchedMap without resetting on re-mount", () => {
    const watchedDbMap: Record<string, boolean> = {
      "1:1": true,
      "1:2": true,
      "1:3": true,
      "1:4": true,
      "1:5": true,
    };

    const html = renderToStaticMarkup(
      <SeasonEpisodesSection
        seasons={mockSeasons}
        initialWatchedMap={watchedDbMap}
        userCurrentSeason={1}
      />,
    );

    // Season 1 is 100% complete
    expect(html).toContain("5 / 5 episodes - 100%");
    expect(html).toContain("5 / 8 (63%)");
    expect(html).toContain("Reset Season");
    expect(html).toContain("Continue S2 E1");

    // All Season 1 episodes reflect watched state
    expect(html).toContain('aria-label="Mark Episode 1 as unwatched"');
    expect(html).toContain('aria-label="Mark Episode 5 as unwatched"');
  });
});
