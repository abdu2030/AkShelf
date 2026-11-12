import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma, WatchStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { metadataService } from "@/lib/metadata/service";
import { revalidatePath } from "next/cache";
import { batchSeasonProgressAction, toggleEpisodeProgressAction } from "./tracking";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { $transaction: vi.fn() } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/metadata/service", () => ({
  metadataService: { getTitleSeasons: vi.fn() },
}));

const oldDate = new Date("2026-10-19T17:38:44.657Z");
const input = {
  titleExternalSource: "anilist" as const,
  titleExternalId: "9919",
  titleName: "Blue Exorcist",
  mediaType: "ANIME" as const,
  seasonNumber: 1,
  watched: true,
};

// This fake stores writes so completion checks read the post-mutation progress.
// It also enforces the user/title scope of every progress read.
function setup(counts = [25], initialStatus: WatchStatus = "WATCHING") {
  const progress = new Map<string, Date>();
  let status = initialStatus;
  let watchedAt: Date | null = initialStatus === "WATCHED" ? oldDate : null;
  const seasons = counts.map((episodeCount, index) => ({
    seasonNumber: index + 1,
    name: `Season ${index + 1}`,
    episodeCount,
  }));
  vi.mocked(metadataService.getTitleSeasons).mockResolvedValue(seasons);
  const tx = {
    title: { upsert: vi.fn().mockResolvedValue({ id: "title" }) },
    season: {
      upsert: vi.fn().mockImplementation(({ where }) => {
        const number = where.titleId_seasonNumber.seasonNumber;
        return { id: String(number), ...seasons[number - 1] };
      }),
    },
    episode: {
      upsert: vi.fn().mockImplementation(({ where }) => {
        const { seasonId, episodeNumber } = where.seasonId_episodeNumber;
        return { id: `${seasonId}:${episodeNumber}` };
      }),
      findMany: vi.fn().mockImplementation(({ where }) =>
        where.episodeNumber.in.map((n: number) => ({
          id: `${where.seasonId}:${n}`,
          episodeNumber: n,
        })),
      ),
      createMany: vi.fn(),
    },
    userEpisode: {
      upsert: vi.fn().mockImplementation(({ where, create, update }) => {
        const key = where.userId_episodeId.episodeId;
        progress.set(
          key,
          progress.has(key) ? (update.watchedAt ?? progress.get(key)) : create.watchedAt,
        );
      }),
      createMany: vi.fn().mockImplementation(({ data }) => {
        for (const row of data)
          if (!progress.has(row.episodeId)) progress.set(row.episodeId, row.watchedAt);
      }),
      deleteMany: vi.fn().mockImplementation(({ where }) => {
        const keys = typeof where.episodeId === "string" ? [where.episodeId] : where.episodeId.in;
        keys.forEach((key: string) => progress.delete(key));
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        expect(where).toEqual({ userId: "owner", episode: { season: { titleId: "title" } } });
        return [...progress.keys()].map((key) => {
          const [seasonNumber, episodeNumber] = key.split(":").map(Number);
          return { episode: { episodeNumber, season: { seasonNumber } } };
        });
      }),
    },
    userTitle: {
      findUnique: vi.fn().mockImplementation(() => ({ status, watchedAt })),
      upsert: vi.fn().mockImplementation(({ update }) => {
        status = update.status;
        watchedAt = update.watchedAt;
      }),
    },
    watchHistory: { create: vi.fn() },
  };
  vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
    callback(tx as unknown as Prisma.TransactionClient),
  );
  return { tx, progress, state: () => ({ status, watchedAt }) };
}

describe("episode and season completion persistence", () => {
  it("keeps a combined ongoing anime Watching when only a partial streaming list is known", async () => {
    setup([2]);
    vi.mocked(metadataService.getTitleSeasons).mockResolvedValue([
      { seasonNumber: 1, name: "Season 1", episodeCount: 2, episodeCountKnown: false },
    ]);
    const result = await batchSeasonProgressAction({
      ...input,
      episodeNumbers: [1, 2],
      allSeasonsWatched: true,
    });
    expect(result).toMatchObject({ success: true, status: "WATCHING" });
  });
  beforeEach(() => {
    vi.resetAllMocks();
    (auth as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue({
      user: { id: "owner" },
    });
  });

  it.each([
    ["9919", 25],
    ["158931", 12],
    ["21861", 12],
  ] as const)("marks Blue Exorcist entry %s WATCHED after its entire season", async (id, count) => {
    const db = setup([count]);
    const result = await batchSeasonProgressAction({
      ...input,
      titleExternalId: id,
      episodeNumbers: Array.from({ length: count }, (_, i) => i + 1),
    });
    expect(result).toMatchObject({ success: true, status: "WATCHED" });
    expect(db.state()).toEqual({ status: "WATCHED", watchedAt: expect.any(Date) });
    expect(db.progress.size).toBe(count);
  });

  it("completes on the final individual episode and revalidates database title URLs", async () => {
    const db = setup([3]);
    db.progress.set("1:1", oldDate);
    db.progress.set("1:2", oldDate);
    const result = await toggleEpisodeProgressAction({ ...input, episodeNumber: 3 });
    expect(result).toMatchObject({
      success: true,
      status: "WATCHED",
      previousStatus: "WATCHING",
      statusTransitioned: true,
    });
    expect(db.state().status).toBe("WATCHED");
    expect(revalidatePath).toHaveBeenCalledWith("/title/db-title");
    expect(revalidatePath).toHaveBeenCalledWith("/watchlist");
  });

  it("keeps a TV show WATCHING when another season has not been loaded or watched", async () => {
    const db = setup([3, 2]);
    const result = await batchSeasonProgressAction({
      ...input,
      titleExternalSource: "tmdb",
      mediaType: "TV",
      episodeNumbers: [1, 2, 3],
      allSeasonsWatched: true,
    });
    expect(result).toMatchObject({ success: true, status: "WATCHING" });
    expect(db.state().watchedAt).toBeNull();
    const finished = await batchSeasonProgressAction({
      ...input,
      titleExternalSource: "tmdb",
      mediaType: "TV",
      seasonNumber: 2,
      episodeNumbers: [1, 2],
    });
    expect(finished.status).toBe("WATCHED");
  });

  it("does not shrink a season or complete it when marking only its first episodes", async () => {
    const db = setup([25]);
    const result = await batchSeasonProgressAction({ ...input, episodeNumbers: [1, 2, 3] });
    expect(result).toMatchObject({ success: true, status: "WATCHING" });
    expect(db.tx.season.upsert.mock.calls[0][0]).toMatchObject({
      update: {},
      create: { episodeCount: 25 },
    });
  });

  it("does not substitute extra episodes for missing required episodes", async () => {
    const db = setup([3]);
    db.progress.set("0:1", oldDate);
    db.progress.set("1:1", oldDate);
    db.progress.set("1:99", oldDate);
    expect((await toggleEpisodeProgressAction({ ...input, episodeNumber: 2 })).status).toBe(
      "WATCHING",
    );
  });

  it.each(["episode", "season"])(
    "preserves completion and original dates when re-marking a %s",
    async (kind) => {
      const db = setup([3], "WATCHED");
      db.progress.set("1:1", oldDate);
      const result =
        kind === "episode"
          ? await toggleEpisodeProgressAction({ ...input, episodeNumber: 1 })
          : await batchSeasonProgressAction({ ...input, episodeNumbers: [1, 2, 3] });
      expect(result.status).toBe("WATCHED");
      expect(db.state().watchedAt).toEqual(oldDate);
      expect(db.progress.get("1:1")).toEqual(oldDate);
    },
  );

  it("reopens a completed title when unwatching an episode, then returns to planned when empty", async () => {
    const db = setup([2], "WATCHED");
    db.progress.set("1:1", oldDate);
    db.progress.set("1:2", oldDate);
    expect(
      (await toggleEpisodeProgressAction({ ...input, episodeNumber: 2, watched: false })).status,
    ).toBe("WATCHING");
    expect(db.state().watchedAt).toBeNull();
    expect(
      (await batchSeasonProgressAction({ ...input, episodeNumbers: [1], watched: false })).status,
    ).toBe("PLAN_TO_WATCH");
  });

  it("honors an undo status and clears the automatic completion date", async () => {
    const db = setup([2]);
    db.progress.set("1:1", oldDate);
    await toggleEpisodeProgressAction({ ...input, episodeNumber: 2 });
    const result = await toggleEpisodeProgressAction({
      ...input,
      episodeNumber: 2,
      watched: false,
      revertStatus: "ON_HOLD",
    });
    expect(result.status).toBe("ON_HOLD");
    expect(db.state().watchedAt).toBeNull();
  });

  it.each([{ seasons: [] }, { seasons: [{ seasonNumber: 1, name: "Unknown", episodeCount: 0 }] }])(
    "does not auto-complete without known season totals",
    async ({ seasons }) => {
      setup([1]);
      vi.mocked(metadataService.getTitleSeasons).mockResolvedValue(seasons);
      expect((await toggleEpisodeProgressAction({ ...input, episodeNumber: 1 })).status).toBe(
        "WATCHING",
      );
    },
  );

  it("records progress conservatively when the metadata provider is unavailable", async () => {
    const db = setup([1]);
    vi.mocked(metadataService.getTitleSeasons).mockRejectedValue(new Error("Provider unavailable"));
    expect(await toggleEpisodeProgressAction({ ...input, episodeNumber: 1 })).toMatchObject({
      success: true,
      status: "WATCHING",
    });
    expect(db.progress.has("1:1")).toBe(true);
  });
});
