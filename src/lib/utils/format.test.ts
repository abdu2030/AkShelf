import { describe, expect, it } from "vitest";
import {
  calculateProgressPercentage,
  formatRating,
  formatMediaType,
  formatEpisodePosition,
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
});
