import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { metadataService } from "@/lib/metadata";

describe("GET /api/search", () => {
  it("returns empty arrays when query length is less than 2", async () => {
    const req = new NextRequest("http://localhost:3000/api/search?q=a");
    const response = await GET(req);
    const data = await response.json();

    expect(data).toEqual({ onShelf: [], results: [] });
  });

  it("finds matching titles on user shelf and queries external metadata", async () => {
    vi.spyOn(metadataService, "search").mockResolvedValue([
      {
        id: "tmdb:99999",
        externalSource: "tmdb",
        externalId: "99999",
        type: "MOVIE",
        title: "Inception 2: The Return",
        overview: "Dreaming again.",
        year: 2026,
        posterUrl: "https://image.tmdb.org/t/p/w500/test.jpg",
        genres: ["Action"],
      },
    ]);

    const req = new NextRequest("http://localhost:3000/api/search?q=Inception");
    const response = await GET(req);
    const data = await response.json();

    // Inception should be found in local shelf
    expect(data.onShelf.length).toBeGreaterThan(0);
    expect(data.onShelf[0].title).toBe("Inception");
    expect(data.onShelf[0].isOnShelf).toBe(true);
    expect(data.onShelf[0].status).toBe("WATCHED");

    // External results returned from provider
    expect(data.results.length).toBe(1);
    expect(data.results[0].title).toBe("Inception 2: The Return");
  });

  it("filters search results by media type when provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/search?q=Titan&type=ANIME");
    const response = await GET(req);
    const data = await response.json();

    // All returned onShelf items should have type ANIME
    expect(data.onShelf.every((item: { type: string }) => item.type === "ANIME")).toBe(true);
  });
});
