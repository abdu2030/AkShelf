import { PrismaClient, MediaType, WatchStatus } from "@prisma/client";
import { demoTitles } from "../src/lib/data/demo-titles";

const prisma = new PrismaClient();

async function withRetry<T>(operation: () => Promise<T>, retries = 5, delayMs = 2500): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= retries; i++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (i < retries) {
        console.warn(
          `⚠️ Database connection attempt ${i} failed. Retrying in ${delayMs / 1000}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

async function seed() {
  console.log("🌱 Seeding expanded demo database records (Day 13)...");

  // 1. Create or upsert demo owner user
  const demoUser = await withRetry(() =>
    prisma.user.upsert({
      where: { email: "owner@akshelf.local" },
      update: {},
      create: {
        email: "owner@akshelf.local",
        name: "AkShelf Owner",
      },
    }),
  );

  console.log(`👤 Verified owner user: ${demoUser.email} (${demoUser.id})`);

  let titlesCount = 0;
  let seasonsCount = 0;
  let episodesCount = 0;
  let userEpisodesCount = 0;

  // 2. Seed all realistic titles
  for (const item of demoTitles) {
    const titleRecord = await prisma.title.upsert({
      where: {
        externalSource_externalId: {
          externalSource: item.externalSource,
          externalId: item.externalId,
        },
      },
      update: {
        title: item.title,
        type: item.type as MediaType,
        year: item.year,
        overview: item.overview,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl ?? null,
        genres: item.genres,
      },
      create: {
        externalSource: item.externalSource,
        externalId: item.externalId,
        title: item.title,
        type: item.type as MediaType,
        year: item.year,
        overview: item.overview,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl ?? null,
        genres: item.genres,
        createdAt: new Date(item.addedAt),
      },
    });

    titlesCount++;

    // Seed seasons and episodes if available
    if (item.seasons && item.seasons.length > 0) {
      for (const season of item.seasons) {
        const seasonRecord = await prisma.season.upsert({
          where: {
            titleId_seasonNumber: {
              titleId: titleRecord.id,
              seasonNumber: season.seasonNumber,
            },
          },
          update: {
            name: season.name,
            episodeCount: season.episodeCount,
          },
          create: {
            titleId: titleRecord.id,
            seasonNumber: season.seasonNumber,
            name: season.name,
            episodeCount: season.episodeCount,
          },
        });

        seasonsCount++;

        for (const ep of season.episodes) {
          const episodeRecord = await prisma.episode.upsert({
            where: {
              seasonId_episodeNumber: {
                seasonId: seasonRecord.id,
                episodeNumber: ep.episodeNumber,
              },
            },
            update: {
              name: ep.name,
              runtime: ep.runtime ?? null,
            },
            create: {
              seasonId: seasonRecord.id,
              episodeNumber: ep.episodeNumber,
              name: ep.name,
              runtime: ep.runtime ?? null,
            },
          });

          episodesCount++;

          // Track episode completion if watched
          const isEpWatched =
            item.status === "WATCHED" ||
            (item.currentEpisode !== undefined && ep.episodeNumber <= item.currentEpisode);

          if (isEpWatched) {
            await prisma.userEpisode.upsert({
              where: {
                userId_episodeId: {
                  userId: demoUser.id,
                  episodeId: episodeRecord.id,
                },
              },
              update: {},
              create: {
                userId: demoUser.id,
                episodeId: episodeRecord.id,
                watchedAt: new Date(item.watchedAt ?? item.startedAt ?? item.addedAt),
              },
            });

            userEpisodesCount++;
          }
        }
      }
    }

    // Upsert UserTitle relationship
    await prisma.userTitle.upsert({
      where: {
        userId_titleId: {
          userId: demoUser.id,
          titleId: titleRecord.id,
        },
      },
      update: {
        status: item.status as WatchStatus,
        rating: item.rating ?? null,
        startedAt: item.startedAt ? new Date(item.startedAt) : null,
        watchedAt: item.watchedAt ? new Date(item.watchedAt) : null,
      },
      create: {
        userId: demoUser.id,
        titleId: titleRecord.id,
        status: item.status as WatchStatus,
        rating: item.rating ?? null,
        startedAt: item.startedAt ? new Date(item.startedAt) : null,
        watchedAt: item.watchedAt ? new Date(item.watchedAt) : null,
        createdAt: new Date(item.addedAt),
      },
    });

    // Seed initial watch history action if not already recorded
    const existingHistory = await prisma.watchHistory.findFirst({
      where: {
        userId: demoUser.id,
        titleId: titleRecord.id,
      },
    });

    if (!existingHistory) {
      await prisma.watchHistory.create({
        data: {
          userId: demoUser.id,
          titleId: titleRecord.id,
          action: `added_as_${item.status.toLowerCase()}`,
          occurredAt: new Date(item.addedAt),
        },
      });
    }
  }

  const movieCount = demoTitles.filter((t) => t.type === "MOVIE").length;
  const tvCount = demoTitles.filter((t) => t.type === "TV").length;
  const animeCount = demoTitles.filter((t) => t.type === "ANIME").length;

  console.log(`✅ Database seeding completed successfully!`);
  console.log(`📊 Seed Summary:`);
  console.log(
    `   - Total Titles: ${titlesCount} (${movieCount} Movies, ${tvCount} TV Shows, ${animeCount} Anime)`,
  );
  console.log(`   - Seasons Created: ${seasonsCount}`);
  console.log(`   - Episodes Created: ${episodesCount}`);
  console.log(`   - User Episode Progress Records: ${userEpisodesCount}`);
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
