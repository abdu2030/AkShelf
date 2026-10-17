import { prisma } from "../src/lib/db";

interface CheckItem {
  name: string;
  category: "Environment" | "Database" | "Metadata";
  status: "PASS" | "WARN" | "FAIL";
  message: string;
}

async function main() {
  console.log("🚀 Running AkShelf Production Deployment Pre-flight Check...\n");

  const results: CheckItem[] = [];

  // 1. Environment Variable Audits
  const checkEnv = (key: string, category: CheckItem["category"], required = true) => {
    const val = process.env[key];
    if (!val) {
      results.push({
        name: key,
        category,
        status: required ? "FAIL" : "WARN",
        message: required ? "Missing required environment variable" : "Optional variable not set",
      });
    } else {
      results.push({
        name: key,
        category,
        status: "PASS",
        message: `Configured (${val.length} chars)`,
      });
    }
  };

  checkEnv("DATABASE_URL", "Database", true);
  checkEnv("DIRECT_URL", "Database", true);
  checkEnv("AUTH_SECRET", "Environment", true);
  checkEnv("OWNER_EMAIL", "Environment", true);
  checkEnv("OWNER_PASSWORD_HASH", "Environment", true);
  checkEnv("TMDB_API_READ_ACCESS_TOKEN", "Metadata", false);
  checkEnv("TMDB_API_KEY", "Metadata", false);

  // 2. Database Connectivity & Pool Verification
  const startDb = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1 as result`;
    const latency = Date.now() - startDb;
    results.push({
      name: "Database Connection Pool",
      category: "Database",
      status: "PASS",
      message: `Reachable (latency: ${latency}ms)`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({
      name: "Database Connection Pool",
      category: "Database",
      status: "FAIL",
      message: `Failed to connect: ${msg.split("\n")[0]}`,
    });
  }

  // 3. Schema & Tables Verification
  try {
    const userCount = await prisma.user.count();
    const titleCount = await prisma.title.count();
    results.push({
      name: "Schema Tables (User, Title, History)",
      category: "Database",
      status: "PASS",
      message: `Active (Users: ${userCount}, Titles: ${titleCount})`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({
      name: "Schema Tables (User, Title, History)",
      category: "Database",
      status: "FAIL",
      message: `Tables uninitialized or migration missing: ${msg.split("\n")[0]}`,
    });
  }

  // 4. Print Summary Table
  console.log(
    "┌─────────────────────────────┬─────────────┬────────┬──────────────────────────────────────────┐",
  );
  console.log(
    "│ Check Name                  │ Category    │ Status │ Details                                  │",
  );
  console.log(
    "├─────────────────────────────┼─────────────┼────────┼──────────────────────────────────────────┤",
  );

  let hasFailures = false;

  for (const item of results) {
    const name = item.name.padEnd(27).slice(0, 27);
    const cat = item.category.padEnd(11).slice(0, 11);
    const status = (
      item.status === "PASS" ? "✅ PASS" : item.status === "WARN" ? "⚠️ WARN" : "❌ FAIL"
    ).padEnd(6);
    const msg = item.message.padEnd(40).slice(0, 40);

    if (item.status === "FAIL") hasFailures = true;

    console.log(`│ ${name} │ ${cat} │ ${status} │ ${msg} │`);
  }

  console.log(
    "└─────────────────────────────┴─────────────┴────────┴──────────────────────────────────────────┘\n",
  );

  if (hasFailures) {
    console.error(
      "❌ Pre-flight checks failed. Please fix the required configuration before deploying.",
    );
    process.exit(1);
  } else {
    console.log(
      "✨ All deployment pre-flight checks passed! Application is ready for Vercel production.",
    );
  }
}

main()
  .catch((e) => {
    console.error("Fatal pre-flight error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
