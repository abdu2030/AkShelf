import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { metadataService } from "@/lib/metadata";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    userTitle: { findMany: vi.fn() },
    userEpisode: { findMany: vi.fn() },
  },
}));

const mockAuth = auth as unknown as {
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
  });
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

  it("finds matching titles from PostgreSQL when user is authenticated", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-123", email: "test@example.com" },
      expires: "2099-01-01",
    });

    vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([
      {
        id: "ut-1",
        userId: "user-123",
        titleId: "title-1",
        status: "WATCHING",
        rating: 8.5,
        title: {
          id: "title-1",
          externalSource: "tmdb",
          externalId: "1399",
          type: "TV",
          title: "Game of Thrones",
          overview: "Seven noble families fight for control.",
          year: 2011,
          posterUrl: "https://image.tmdb.org/t/p/w500/got.jpg",
          backdropUrl: null,
          genres: ["Drama", "Fantasy"],
          seasons: [
            {
              id: "s-1",
              seasonNumber: 1,
              episodeCount: 10,
              episodes: [
                { id: "ep-1", episodeNumber: 1 },
                { id: "ep-2", episodeNumber: 2 },
                { id: "ep-3", episodeNumber: 3 },
              ],
            },
          ],
        },
      },
    ] as unknown as never);

    vi.mocked(prisma.userEpisode.findMany).mockResolvedValueOnce([
      { episodeId: "ep-1" },
      { episodeId: "ep-2" },
    ] as unknown as never);

    const req = new NextRequest("http://localhost:3000/api/search?q=Thrones");
    const response = await GET(req);
    const data = await response.json();

    expect(data.onShelf.length).toBe(1);
    expect(data.onShelf[0].title).toBe("Game of Thrones");
    expect(data.onShelf[0].isOnShelf).toBe(true);
    expect(data.onShelf[0].status).toBe("WATCHING");
    expect(data.onShelf[0].rating).toBe(8.5);
    expect(data.onShelf[0].season).toBe(1);
    expect(data.onShelf[0].episode).toBe(3);
    expect(data.onShelf[0].currentEpisode).toBe(2);
  });
});
