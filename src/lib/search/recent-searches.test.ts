import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from "./recent-searches";

describe("Recent Searches Store", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const mockLocalStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => store.set(key, val),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    };

    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("window", {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty array when nothing has been stored", () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it("adds terms and deduplicates case-insensitively, keeping up to 5", () => {
    addRecentSearch("Inception");
    addRecentSearch("Interstellar");
    addRecentSearch("Dune");
    addRecentSearch("Attack on Titan");
    addRecentSearch("Breaking Bad");

    // Adding 6th should drop oldest
    const updated = addRecentSearch("Severance");
    expect(updated).toHaveLength(5);
    expect(updated[0]).toBe("Severance");
    expect(updated).not.toContain("Inception");

    // Re-adding existing moves it to top
    const reAdded = addRecentSearch("dune");
    expect(reAdded[0]).toBe("dune");
    expect(reAdded.filter((t) => t.toLowerCase() === "dune")).toHaveLength(1);
  });

  it("removes a specific term", () => {
    addRecentSearch("Dune");
    addRecentSearch("Inception");

    const afterRemove = removeRecentSearch("Dune");
    expect(afterRemove).toEqual(["Inception"]);
    expect(getRecentSearches()).toEqual(["Inception"]);
  });

  it("clears all terms", () => {
    addRecentSearch("Dune");
    addRecentSearch("Inception");
    expect(getRecentSearches()).toHaveLength(2);

    clearRecentSearches();
    expect(getRecentSearches()).toEqual([]);
  });
});
