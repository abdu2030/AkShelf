import { describe, expect, it } from "vitest";
import {
  formatHistoryActionSentence,
  formatDayGroupHeading,
  groupHistoryByDay,
  formatHistoryTime,
} from "./format";
import { HistoryItem } from "./types";

describe("formatHistoryActionSentence", () => {
  it("formats status change actions according to UI spec", () => {
    expect(formatHistoryActionSentence("STATUS_WATCHED")).toBe("Marked as Watched");
    expect(formatHistoryActionSentence("STATUS_WATCHING")).toBe("Moved to Watching");
    expect(formatHistoryActionSentence("STATUS_PLAN_TO_WATCH")).toBe("Added to Plan to Watch");
    expect(formatHistoryActionSentence("STATUS_ON_HOLD")).toBe("Put On Hold");
    expect(formatHistoryActionSentence("STATUS_DROPPED")).toBe("Dropped");
    expect(formatHistoryActionSentence("TITLE_REMOVED")).toBe("Removed from shelf");
    expect(formatHistoryActionSentence("DATES_UPDATED")).toBe("Updated watch dates");
  });

  it("formats rating actions", () => {
    expect(formatHistoryActionSentence("RATED_9")).toBe("Rated 9/10");
    expect(formatHistoryActionSentence("RATED_8.5")).toBe("Rated 8.5/10");
    expect(formatHistoryActionSentence("RATING_CLEARED")).toBe("Cleared rating");
  });

  it("formats episode actions with season and episode numbers", () => {
    expect(
      formatHistoryActionSentence("EPISODE_WATCHED", { seasonNumber: 2, episodeNumber: 4 }),
    ).toBe("Watched S2 E4");

    expect(
      formatHistoryActionSentence("EPISODE_UNWATCHED", { seasonNumber: 1, episodeNumber: 1 }),
    ).toBe("Unmarked S1 E1");

    expect(formatHistoryActionSentence("EPISODE_WATCHED", { episodeNumber: 6 })).toBe(
      "Watched Ep 6",
    );
  });

  it("formats season completion actions", () => {
    expect(formatHistoryActionSentence("SEASON_2_WATCHED")).toBe("Finished season 2");
    expect(formatHistoryActionSentence("SEASON_1_UNWATCHED")).toBe("Unmarked season 1");
  });
});

describe("formatDayGroupHeading & groupHistoryByDay", () => {
  it("formats TODAY and YESTERDAY", () => {
    const now = new Date();
    expect(formatDayGroupHeading(now).dayLabel).toBe("TODAY");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatDayGroupHeading(yesterday).dayLabel).toBe("YESTERDAY");
  });

  it("groups items into days correctly", () => {
    const today = new Date().toISOString();
    const items: HistoryItem[] = [
      {
        id: "1",
        titleId: "t1",
        titleName: "Inception",
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        mediaType: "MOVIE",
        action: "STATUS_WATCHED",
        actionSentence: "Marked as Watched",
        occurredAt: today,
        timeFormatted: "7:10 PM",
      },
      {
        id: "2",
        titleId: "t1",
        titleName: "Inception",
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        mediaType: "MOVIE",
        action: "RATED_9",
        actionSentence: "Rated 9/10",
        occurredAt: today,
        timeFormatted: "7:12 PM",
      },
    ];

    const groups = groupHistoryByDay(items);
    expect(groups.length).toBe(1);
    expect(groups[0].dayLabel).toBe("TODAY");
    expect(groups[0].items.length).toBe(2);
  });
});

describe("formatHistoryTime", () => {
  it("formats date into time string with AM/PM", () => {
    const timeStr = formatHistoryTime(new Date("2026-10-15T19:42:00Z"));
    expect(timeStr).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });
});
