import { prisma } from "../src/lib/db";

async function main() {
  console.log("🧹 Wiping dummy/demo data from database...");

  // 1. Delete user-specific tracking records
  const deletedUserEpisodes = await prisma.userEpisode.deleteMany({});
  console.log(`- Deleted ${deletedUserEpisodes.count} user episode tracking records.`);

  const deletedHistory = await prisma.watchHistory.deleteMany({});
  console.log(`- Deleted ${deletedHistory.count} watch history audit entries.`);

  const deletedUserTitles = await prisma.userTitle.deleteMany({});
  console.log(`- Deleted ${deletedUserTitles.count} user title tracking records.`);

  // 2. Delete metadata records (cascade deletes episodes & seasons with titles)
  const deletedEpisodes = await prisma.episode.deleteMany({});
  console.log(`- Deleted ${deletedEpisodes.count} episode metadata records.`);

  const deletedSeasons = await prisma.season.deleteMany({});
  console.log(`- Deleted ${deletedSeasons.count} season metadata records.`);

  const deletedTitles = await prisma.title.deleteMany({});
  console.log(`- Deleted ${deletedTitles.count} title metadata records.`);

  // 3. Confirm owner account remains intact
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log("\n👤 Verified user accounts intact:");
  for (const u of users) {
    console.log(`  - ${u.email} (${u.id})`);
  }

  console.log("\n✨ Database is now 100% clean and ready for your real watch collection!");
}

main()
  .catch((e) => {
    console.error("❌ Failed to wipe dummy data:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
