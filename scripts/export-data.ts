import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/db";
import { generateJsonExport, generateCsvExport } from "../src/lib/export/export-service";

async function main() {
  console.log("📦 Starting AkShelf Data Backup Export...");

  // Find owner user
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    console.error("❌ No user found in database to export.");
    process.exit(1);
  }

  console.log(`👤 Found user: ${user.email} (${user.id})`);

  const backupDir = path.resolve(process.cwd(), "backups");
  await fs.mkdir(backupDir, { recursive: true });

  const dateStr = new Date().toISOString().split("T")[0];

  // 1. Export JSON
  const jsonData = await generateJsonExport(user.id);
  const jsonPath = path.join(backupDir, `akshelf-backup-${dateStr}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2), "utf-8");
  console.log(`✅ Saved full JSON backup to: ${jsonPath}`);
  console.log(
    `   - Titles: ${jsonData.stats.totalTitles}, Episodes: ${jsonData.stats.totalEpisodes}, History: ${jsonData.stats.totalHistory}`,
  );

  // 2. Export CSV
  const csvData = await generateCsvExport(user.id);
  const csvPath = path.join(backupDir, `akshelf-library-${dateStr}.csv`);
  await fs.writeFile(csvPath, csvData, "utf-8");
  console.log(`✅ Saved library CSV export to: ${csvPath}`);

  console.log("\n🎉 Data safety backup export completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Export failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
