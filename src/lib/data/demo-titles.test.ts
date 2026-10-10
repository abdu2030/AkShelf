import { describe, expect, it } from "vitest";
import { demoTitles, demoLibraryItems } from "./demo-titles";

describe("demoTitles dataset", () => {
  it("contains rich library titles across all 3 media types", () => {
    expect(demoTitles.length).toBeGreaterThanOrEqual(25);

    const movies = demoTitles.filter((t) => t.type === "MOVIE");
    const tvShows = demoTitles.filter((t) => t.type === "TV");
    const anime = demoTitles.filter((t) => t.type === "ANIME");

    expect(movies.length).toBeGreaterThanOrEqual(8);
    expect(tvShows.length).toBeGreaterThanOrEqual(8);
    expect(anime.length).toBeGreaterThanOrEqual(8);
  });

  it("covers all 5 watch statuses with realistic distributions", () => {
    const statuses = new Set(demoTitles.map((t) => t.status));
    expect(statuses.has("WATCHED")).toBe(true);
    expect(statuses.has("WATCHING")).toBe(true);
    expect(statuses.has("PLAN_TO_WATCH")).toBe(true);
    expect(statuses.has("ON_HOLD")).toBe(true);
    expect(statuses.has("DROPPED")).toBe(true);

    const watched = demoTitles.filter((t) => t.status === "WATCHED");
    const watching = demoTitles.filter((t) => t.status === "WATCHING");
    const planToWatch = demoTitles.filter((t) => t.status === "PLAN_TO_WATCH");
    const onHold = demoTitles.filter((t) => t.status === "ON_HOLD");
    const dropped = demoTitles.filter((t) => t.status === "DROPPED");

    expect(watched.length).toBeGreaterThanOrEqual(10);
    expect(watching.length).toBeGreaterThanOrEqual(3);
    expect(planToWatch.length).toBeGreaterThanOrEqual(2);
    expect(onHold.length).toBeGreaterThanOrEqual(2);
    expect(dropped.length).toBeGreaterThanOrEqual(2);
  });

  it("ensures metadata integrity on every title", () => {
    for (const item of demoTitles) {
      expect(item.title.trim().length).toBeGreaterThan(0);
      expect(item.year).toBeGreaterThan(1900);
      expect(item.year).toBeLessThanOrEqual(2030);
      expect(item.posterUrl).toMatch(/^https:\/\//);
      expect(item.genres.length).toBeGreaterThan(0);
      expect(item.overview.trim().length).toBeGreaterThan(10);
      expect(new Date(item.addedAt).getTime()).not.toBeNaN();

      if (item.rating !== null && item.rating !== undefined) {
        expect(item.rating).toBeGreaterThanOrEqual(1);
        expect(item.rating).toBeLessThanOrEqual(10);
      }
    }
  });

  it("provides valid season and episode structures for episodic content", () => {
    const titlesWithSeasons = demoTitles.filter((t) => t.seasons && t.seasons.length > 0);
    expect(titlesWithSeasons.length).toBeGreaterThanOrEqual(5);

    for (const title of titlesWithSeasons) {
      for (const season of title.seasons!) {
        expect(season.seasonNumber).toBeGreaterThan(0);
        expect(season.name.trim().length).toBeGreaterThan(0);
        expect(season.episodeCount).toBeGreaterThan(0);
        expect(season.episodes.length).toBeGreaterThan(0);
      }
    }
  });

  it("maps accurately to demoLibraryItems for media card consumption", () => {
    expect(demoLibraryItems.length).toBe(demoTitles.length);

    for (const item of demoLibraryItems) {
      expect(item.id).toMatch(/^demo-(tmdb|anilist)-/);
      expect(item.title.trim().length).toBeGreaterThan(0);
      expect(item.mediaType).toMatch(/^(MOVIE|TV|ANIME)$/);
      expect(item.status).toMatch(/^(WATCHED|WATCHING|PLAN_TO_WATCH|ON_HOLD|DROPPED)$/);
    }
  });
});
