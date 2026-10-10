import { PrismaClient } from "@prisma/client";
import { demoTitles } from "../src/lib/data/demo-titles";

const prisma = new PrismaClient();

async function syncPosters() {
  console.log("Syncing poster URLs to Supabase database...");
  let updated = 0;
  for (const item of demoTitles) {
    try {
      const res = await prisma.title.updateMany({
        where: {
          externalSource: item.externalSource,
          externalId: item.externalId,
        },
        data: {
          posterUrl: item.posterUrl,
        },
      });
      if (res.count > 0) {
        updated += res.count;
        console.log(`Updated poster for: ${item.title}`);
      }
    } catch (e: unknown) {
      console.error(`Failed to update ${item.title}:`, e instanceof Error ? e.message : String(e));
    }
  }
  console.log(`Finished syncing posters! Updated ${updated} records.`);
  await prisma.$disconnect();
}

syncPosters();
