import { PrismaClient, MediaType, WatchStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding demo database records...");

  // 1. Create or upsert demo owner user
  const demoUser = await prisma.user.upsert({
    where: { email: "owner@akshelf.local" },
    update: {},
    create: {
      email: "owner@akshelf.local",
      name: "AkShelf Owner",
    },
  });

  // 2. Demo Movie: Inception
  const inception = await prisma.title.upsert({
    where: {
      externalSource_externalId: {
        externalSource: "tmdb",
        externalId: "27205",
      },
    },
    update: {},
    create: {
      externalSource: "tmdb",
      externalId: "27205",
      title: "Inception",
      type: MediaType.MOVIE,
      year: 2010,
      overview:
        "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets.",
      posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
      genres: ["Action", "Science Fiction", "Adventure"],
    },
  });

  // 3. Demo TV Show: Breaking Bad
  const breakingBad = await prisma.title.upsert({
    where: {
      externalSource_externalId: {
        externalSource: "tmdb",
        externalId: "1396",
      },
    },
    update: {},
    create: {
      externalSource: "tmdb",
      externalId: "1396",
      title: "Breaking Bad",
      type: MediaType.TV,
      year: 2008,
      overview:
        "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
      posterUrl: "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
      genres: ["Drama", "Crime"],
    },
  });

  // Season 1 for Breaking Bad
  const bbSeason1 = await prisma.season.upsert({
    where: {
      titleId_seasonNumber: {
        titleId: breakingBad.id,
        seasonNumber: 1,
      },
    },
    update: {},
    create: {
      titleId: breakingBad.id,
      seasonNumber: 1,
      name: "Season 1",
      episodeCount: 7,
    },
  });

  // Episode 1 for Breaking Bad
  const bbEp1 = await prisma.episode.upsert({
    where: {
      seasonId_episodeNumber: {
        seasonId: bbSeason1.id,
        episodeNumber: 1,
      },
    },
    update: {},
    create: {
      seasonId: bbSeason1.id,
      episodeNumber: 1,
      name: "Pilot",
      runtime: 58,
    },
  });

  // 4. Demo Anime: Attack on Titan
  const aot = await prisma.title.upsert({
    where: {
      externalSource_externalId: {
        externalSource: "anilist",
        externalId: "16498",
      },
    },
    update: {},
    create: {
      externalSource: "anilist",
      externalId: "16498",
      title: "Attack on Titan",
      type: MediaType.ANIME,
      year: 2013,
      overview: "Humanity was almost wiped out by monstrous humanoid creatures called Titans.",
      posterUrl:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73peebRJWhFw.jpg",
      genres: ["Action", "Fantasy", "Drama"],
    },
  });

  // 5. Tracked relationships for Demo User
  // Inception -> Watched with 9.5 rating
  await prisma.userTitle.upsert({
    where: {
      userId_titleId: {
        userId: demoUser.id,
        titleId: inception.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      titleId: inception.id,
      status: WatchStatus.WATCHED,
      rating: 9.5,
      watchedAt: new Date(),
    },
  });

  // Breaking Bad -> Watching (Episode 1 watched)
  await prisma.userTitle.upsert({
    where: {
      userId_titleId: {
        userId: demoUser.id,
        titleId: breakingBad.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      titleId: breakingBad.id,
      status: WatchStatus.WATCHING,
      startedAt: new Date(),
    },
  });

  await prisma.userEpisode.upsert({
    where: {
      userId_episodeId: {
        userId: demoUser.id,
        episodeId: bbEp1.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      episodeId: bbEp1.id,
    },
  });

  // Attack on Titan -> Plan to Watch
  await prisma.userTitle.upsert({
    where: {
      userId_titleId: {
        userId: demoUser.id,
        titleId: aot.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      titleId: aot.id,
      status: WatchStatus.PLAN_TO_WATCH,
    },
  });

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
