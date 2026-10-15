import { describe, expect, it, vi, beforeEach } from "vitest";
import { getWatchHistory } from "./service";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    watchHistory: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const mockAuth = auth as unknown as {
  mockResolvedValueOnce: (value: unknown) => void;
};

describe("getWatchHistory Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns demo history items when user is unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await getWatchHistory();

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.items[0]).toHaveProperty("titleName");
    expect(result.items[0]).toHaveProperty("actionSentence");
  });

  it("filters demo history items by media type", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await getWatchHistory({ typeFilter: "MOVIE" });

    expect(result.items.every((i) => i.mediaType === "MOVIE")).toBe(true);
  });

  it("queries prisma database when user is authenticated", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-123" },
      expires: "2099-01-01",
    });

    const mockDate = new Date("2026-10-15T15:00:00Z");
    const mockDbEntries = [
      {
        id: "wh-1",
        titleId: "title-1",
        action: "STATUS_WATCHED",
        occurredAt: mockDate,
        title: {
          id: "title-1",
          title: "Inception",
          externalSource: "tmdb",
          externalId: "27205",
          type: "MOVIE",
          posterUrl: "https://image.tmdb.org/t/p/w500/test.jpg",
        },
        episode: null,
      },
    ];

    vi.mocked(prisma.watchHistory.findMany).mockResolvedValueOnce(
      mockDbEntries as unknown as Awaited<ReturnType<typeof prisma.watchHistory.findMany>>,
    );
    vi.mocked(prisma.watchHistory.count).mockResolvedValueOnce(1);

    const result = await getWatchHistory();

    expect(result.items.length).toBe(1);
    expect(result.items[0].titleName).toBe("Inception");
    expect(result.items[0].actionSentence).toBe("Marked as Watched");
    expect(result.totalCount).toBe(1);
  });
});
