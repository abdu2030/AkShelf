import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  batchSeasonProgressAction,
  fetchSeasonEpisodesAction,
  syncSeasonEpisodesAction,
  syncTitleSeasonsAction,
  toggleEpisodeProgressAction,
  updateTitleDatesAction,
  updateTitleRatingAction,
  updateTitleStatusAction,
} from "./tracking";
import { loginAction } from "./auth";
import { fetchMoreHistoryAction } from "./history";
import { auth, signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { metadataService } from "@/lib/metadata/service";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/metadata/service", () => ({
  metadataService: {
    getTvSeason: vi.fn(),
    getAnimeDetails: vi.fn(),
    search: vi.fn(),
  },
}));

vi.mock("@/lib/season/storage", () => ({
  ensureSeasonRecord: vi.fn().mockResolvedValue({ id: "season-1" }),
  persistTitleSeasons: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/episode/storage", () => ({
  persistSeasonEpisodes: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(),
    title: { upsert: vi.fn() },
    season: { upsert: vi.fn() },
    episode: { upsert: vi.fn() },
    userEpisode: { upsert: vi.fn(), deleteMany: vi.fn() },
    userTitle: { upsert: vi.fn(), findMany: vi.fn() },
    watchHistory: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockAuth = auth as unknown as {
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};
const mockSignIn = vi.mocked(signIn);

describe("Security Validation & Permission Boundaries Suite (Day 45)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Unauthorized Server Action Defense (Zero Database Mutation)", () => {
    it("updateTitleStatusAction rejects unauthorized database mutations when unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>);

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        status: "WATCHED",
        titleName: "Fight Club",
        mediaType: "MOVIE",
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.status).toBe("WATCHED");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("updateTitleRatingAction rejects unauthorized database mutations when unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>);

      const result = await updateTitleRatingAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        rating: 9,
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.rating).toBe(9);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("updateTitleDatesAction rejects unauthorized database mutations when unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>);

      const result = await updateTitleDatesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        startedAt: "2026-01-01",
        watchedAt: "2026-01-02",
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("toggleEpisodeProgressAction rejects unauthorized database mutations when unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>);

      const result = await toggleEpisodeProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodeNumber: 1,
        watched: true,
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.watched).toBe(true);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("batchSeasonProgressAction rejects unauthorized database mutations when unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>);

      const result = await batchSeasonProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodeNumbers: [1, 2, 3, 4],
        watched: true,
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.count).toBe(4);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("syncTitleSeasonsAction simulates metadata in memory without database writes when unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>);

      const result = await syncTitleSeasonsAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasons: [{ seasonNumber: 1, name: "Season 1", episodeCount: 10 }],
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.seasons).toHaveLength(1);
      expect(prisma.season.upsert).not.toHaveBeenCalled();
    });

    it("syncSeasonEpisodesAction simulates episode sync in memory without database writes when unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>);

      const result = await syncSeasonEpisodesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodes: [{ episodeNumber: 1, name: "Winter Is Coming" }],
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.episodes).toHaveLength(1);
      expect(prisma.episode.upsert).not.toHaveBeenCalled();
    });

    it("fetchSeasonEpisodesAction fetches provider metadata without writing to database when unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>);
      vi.mocked(metadataService.getTvSeason).mockResolvedValueOnce({
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 1,
        episodes: [{ episodeNumber: 1, name: "Pilot" }],
      });

      const result = await fetchSeasonEpisodesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.episodes).toHaveLength(1);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("fetchMoreHistoryAction falls back to demo history without querying real database when unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>);

      const result = await fetchMoreHistoryAction({ limit: 10, offset: 0 });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0].id).toContain("demo-hist");
      expect(prisma.watchHistory.findMany).not.toHaveBeenCalled();
    });
  });

  describe("2. Parameter Tampering & IDOR Resistance (Identity Derived Exclusively from Session)", () => {
    it("binds updates strictly to the authenticated user ID even if client payload contains forged userId", async () => {
      const authenticatedUserId = "legitimate-owner-uuid-001";
      mockAuth.mockResolvedValueOnce({
        user: { id: authenticatedUserId, email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      let capturedUserId: string | null = null;
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const mockTx = {
          title: {
            upsert: vi.fn().mockResolvedValue({ id: "title-db-1" }),
          },
          userTitle: {
            findUnique: vi.fn().mockResolvedValue(null),
            upsert: vi.fn().mockImplementation(async (args) => {
              capturedUserId = args.create.userId;
              return { id: "ut-1", ...args.create };
            }),
          },
          watchHistory: {
            create: vi.fn().mockResolvedValue({ id: "hist-1" }),
          },
        };
        return callback(mockTx as unknown as Parameters<typeof callback>[0]);
      });

      // Attacker passes an unauthorized victim userId in raw payload
      const maliciousPayload = {
        titleExternalSource: "tmdb" as const,
        titleExternalId: "550",
        status: "WATCHED" as const,
        userId: "victim-account-id-999", // Attempted IDOR injection
      };

      const result = await updateTitleStatusAction(maliciousPayload);

      expect(result.success).toBe(true);
      expect(capturedUserId).toBe(authenticatedUserId);
      expect(capturedUserId).not.toBe("victim-account-id-999");
    });

    it("enforces multi-user isolation so User A cannot tamper with User B tracking state", async () => {
      const userAliceId = "user-alice-111";
      mockAuth.mockResolvedValueOnce({
        user: { id: userAliceId, email: "alice@akshelf.local" },
        expires: "2099-01-01",
      });

      let whereClauseChecked: Record<string, unknown> | null = null;
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const mockTx = {
          title: {
            upsert: vi.fn().mockResolvedValue({ id: "title-db-2" }),
          },
          userTitle: {
            upsert: vi.fn().mockImplementation(async (args) => {
              whereClauseChecked = args.where;
              return { id: "ut-alice" };
            }),
          },
          watchHistory: {
            create: vi.fn().mockResolvedValue({ id: "hist-alice" }),
          },
        };
        return callback(mockTx as unknown as Parameters<typeof callback>[0]);
      });

      await updateTitleRatingAction({
        titleExternalSource: "tmdb",
        titleExternalId: "603",
        rating: 10,
      });

      expect(whereClauseChecked).toEqual({
        userId_titleId: {
          userId: userAliceId,
          titleId: "title-db-2",
        },
      });
    });
  });

  describe("3. Input Validation Fuzzing & Injection Defense", () => {
    it("rejects SQL injection attempts in titleExternalSource", async () => {
      const maliciousSource = "' OR '1'='1' --" as unknown as "tmdb";

      const result = await updateTitleStatusAction({
        titleExternalSource: maliciousSource,
        titleExternalId: "123",
        status: "WATCHED",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid status update input");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejects malicious rating boundaries (< 1, > 10, NaN, Infinity)", async () => {
      const invalidRatings = [0, -1, 10.5, 11, 999, NaN, Infinity];

      for (const rating of invalidRatings) {
        const result = await updateTitleRatingAction({
          titleExternalSource: "tmdb",
          titleExternalId: "550",
          rating: rating as unknown as number,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid rating input");
      }

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejects XSS and malicious status injections", async () => {
      const maliciousStatus = "<script>alert('pwned')</script>" as unknown as "WATCHED";

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        status: maliciousStatus,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid status update input");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejects malformed date injection strings", async () => {
      const malformedDates = ["invalid-date", "2024/01/01", "DROP TABLE users;", "2026-99-99"];

      for (const badDate of malformedDates) {
        const result = await updateTitleDatesAction({
          titleExternalSource: "tmdb",
          titleExternalId: "550",
          startedAt: badDate,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid date input");
      }

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejects negative season and zero episode numbers", async () => {
      const resSeason = await toggleEpisodeProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: -1,
        episodeNumber: 1,
        watched: true,
      });
      expect(resSeason.success).toBe(false);
      expect(resSeason.error).toContain("Invalid episode tracking input");

      const resEpisode = await toggleEpisodeProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodeNumber: 0,
        watched: true,
      });
      expect(resEpisode.success).toBe(false);
      expect(resEpisode.error).toContain("Invalid episode tracking input");
    });

    it("rejects batch updates with empty episode arrays", async () => {
      const result = await batchSeasonProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodeNumbers: [],
        watched: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid batch season input");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("4. Authentication Flow Security & Open Redirect Defense", () => {
    it("sanitizes open redirect attacks in login callbackUrl to safe root path", async () => {
      const maliciousUrls = [
        "https://evil.com/phishing",
        "http://attacker.site",
        "//evil.com",
        "//attacker.com/steal-creds",
        "/\\evil.com",
        "javascript:alert(document.domain)",
        "data:text/html,<script>alert(1)</script>",
        "/login",
        "/login?callbackUrl=/dashboard",
      ];

      for (const target of maliciousUrls) {
        const formData = new FormData();
        formData.append("email", "owner@akshelf.local");
        formData.append("password", "validPassword123");
        formData.append("callbackUrl", target);

        mockSignIn.mockResolvedValueOnce(undefined as unknown as never);

        await loginAction(undefined, formData);

        expect(mockSignIn).toHaveBeenCalledWith(
          "credentials",
          expect.objectContaining({
            redirectTo: "/",
          }),
        );
      }
    });

    it("preserves safe same-origin callback URLs", async () => {
      const safePaths = ["/library", "/watchlist", "/history", "/title/tmdb-550", "/search?q=dune"];

      for (const path of safePaths) {
        const formData = new FormData();
        formData.append("email", "owner@akshelf.local");
        formData.append("password", "validPassword123");
        formData.append("callbackUrl", path);

        mockSignIn.mockResolvedValueOnce(undefined as unknown as never);

        await loginAction(undefined, formData);

        expect(mockSignIn).toHaveBeenCalledWith(
          "credentials",
          expect.objectContaining({
            redirectTo: path,
          }),
        );
      }
    });

    it("returns opaque generic error on invalid credentials to prevent account enumeration", async () => {
      const formData = new FormData();
      formData.append("email", "nonexistent-user@random.com");
      formData.append("password", "wrong-password");

      mockSignIn.mockRejectedValueOnce(new AuthError("CredentialsSignin"));

      const state = await loginAction(undefined, formData);

      // Must be generic error message rather than "User not found"
      expect(state.error).toBe("That email or password is not right.");
    });
  });
});
