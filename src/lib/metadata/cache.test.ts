import { describe, expect, it, vi } from "vitest";
import { MetadataCache } from "./cache";

describe("MetadataCache", () => {
  it("stores and retrieves items within TTL window", () => {
    const cache = new MetadataCache({ defaultTtlMs: 1000 });
    cache.set("key1", { title: "Inception" });

    expect(cache.has("key1")).toBe(true);
    expect(cache.get("key1")).toEqual({ title: "Inception" });
    expect(cache.size()).toBe(1);
  });

  it("returns undefined and deletes expired items", async () => {
    const cache = new MetadataCache({ defaultTtlMs: 50 });
    cache.set("short-lived", "value", 20); // 20ms TTL

    expect(cache.get("short-lived")).toBe("value");

    await new Promise((resolve) => setTimeout(resolve, 35));

    expect(cache.get("short-lived")).toBeUndefined();
    expect(cache.has("short-lived")).toBe(false);
  });

  it("evicts least recently accessed item when maxEntries is exceeded", () => {
    const cache = new MetadataCache({ maxEntries: 2, defaultTtlMs: 10000 });

    cache.set("first", "1");
    cache.set("second", "2");

    // Access "first" so "second" becomes the least recently accessed
    cache.get("first");

    // Adding third exceeds capacity of 2
    cache.set("third", "3");

    expect(cache.has("first")).toBe(true);
    expect(cache.has("third")).toBe(true);
    expect(cache.has("second")).toBe(false); // evicted
  });

  it("prunes expired entries accurately", async () => {
    const cache = new MetadataCache({ defaultTtlMs: 10000 });
    cache.set("expires-fast", "a", 20);
    cache.set("stays-long", "b", 5000);

    await new Promise((resolve) => setTimeout(resolve, 30));

    const prunedCount = cache.prune();
    expect(prunedCount).toBe(1);
    expect(cache.has("expires-fast")).toBe(false);
    expect(cache.has("stays-long")).toBe(true);
  });

  it("getOrSet executes fetcher once and caches result for subsequent calls", async () => {
    const cache = new MetadataCache({ defaultTtlMs: 10000 });
    const fetcher = vi.fn().mockResolvedValue({ id: 100, name: "Fetched Item" });

    const firstResult = await cache.getOrSet("fetch-key", fetcher);
    expect(firstResult).toEqual({ id: 100, name: "Fetched Item" });
    expect(fetcher).toHaveBeenCalledTimes(1);

    const secondResult = await cache.getOrSet("fetch-key", fetcher);
    expect(secondResult).toEqual({ id: 100, name: "Fetched Item" });
    expect(fetcher).toHaveBeenCalledTimes(1); // fetcher NOT called again
  });

  it("clears all stored items", () => {
    const cache = new MetadataCache();
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.size()).toBe(2);

    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get("a")).toBeUndefined();
  });
});
