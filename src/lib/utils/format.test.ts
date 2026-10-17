import { describe, expect, it } from "vitest";
import {
  calculateProgressPercentage,
  formatRating,
  formatMediaType,
  formatEpisodePosition,
  formatDate,
  toDateInputValue,
} from "./format";

describe("formatRating", () => {
  it("formats integer ratings without unnecessary decimals", () => {
    expect(formatRating(8)).toBe("8/10");
    expect(formatRating(10)).toBe("10/10");
  });

  it("formats decimal ratings with single decimal precision", () => {
    expect(formatRating(7.5)).toBe("7.5/10");
  });

  it("handles null or undefined ratings gracefully", () => {
    expect(formatRating(null)).toBe("Unrated");
    expect(formatRating(undefined)).toBe("Unrated");
  });
});

describe("calculateProgressPercentage", () => {
  it("calculates accurate percentage rounded to nearest integer", () => {
    expect(calculateProgressPercentage(3, 12)).toBe(25);
    expect(calculateProgressPercentage(1, 3)).toBe(33);
    expect(calculateProgressPercentage(12, 12)).toBe(100);
  });

  it("handles edge cases and zero total episodes", () => {
    expect(calculateProgressPercentage(0, 0)).toBe(0);
    expect(calculateProgressPercentage(5, 0)).toBe(0);
    expect(calculateProgressPercentage(15, 10)).toBe(100);
  });
});

describe("formatMediaType", () => {
  it("formats media types to user-friendly titles", () => {
    expect(formatMediaType("MOVIE")).toBe("Movie");
    expect(formatMediaType("TV")).toBe("TV Show");
    expect(formatMediaType("ANIME")).toBe("Anime");
  });
});

describe("formatEpisodePosition", () => {
  it("formats season and episode combined", () => {
    expect(formatEpisodePosition(1, 4)).toBe("S1 E4");
    expect(formatEpisodePosition(2, 12)).toBe("S2 E12");
  });

  it("formats standalone episode", () => {
    expect(formatEpisodePosition(null, 4)).toBe("Ep 4");
    expect(formatEpisodePosition(undefined, 8)).toBe("Ep 8");
  });

  it("handles empty values gracefully", () => {
    expect(formatEpisodePosition(null, null)).toBe("");
  });

  it("returns empty string when episode is 0 or negative", () => {
    expect(formatEpisodePosition(null, 0)).toBe("");
    expect(formatEpisodePosition(1, 0)).toBe("");
    expect(formatEpisodePosition(0, 0)).toBe("");
    expect(formatEpisodePosition(null, -1)).toBe("");
  });
});

describe("formatDate", () => {
  it("returns Today for current date", () => {
    const today = new Date();
    expect(formatDate(today)).toBe("Today");
    expect(formatDate(today.toISOString())).toBe("Today");
  });

  it("returns Yesterday for date 1 day ago", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatDate(yesterday)).toBe("Yesterday");
  });

  it("formats older date with abbreviated month and year", () => {
    const pastDate = new Date("2024-05-15T12:00:00Z");
    expect(formatDate(pastDate)).toContain("May 15, 2024");
  });

  it("handles null, undefined, or invalid strings gracefully", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("not-a-date")).toBe("");
  });
});

describe("toDateInputValue", () => {
  it("formats date into YYYY-MM-DD string", () => {
    const date = new Date("2026-10-15T10:00:00Z");
    expect(toDateInputValue(date)).toBe("2026-10-15");
  });

  it("returns empty string for null or invalid date", () => {
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue(undefined)).toBe("");
    expect(toDateInputValue("invalid")).toBe("");
  });
});
