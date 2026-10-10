import { checkDatabaseConnection } from "../src/lib/db/health";

async function main() {
  console.log("Checking database connection to PostgreSQL (Supabase)...");
  let result = await checkDatabaseConnection();

  if (!result.connected) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.warn(`Attempt ${attempt} failed. Retrying in 2s...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      result = await checkDatabaseConnection();
      if (result.connected) break;
    }
  }

  if (result.connected) {
    console.log("✅ Successfully connected to PostgreSQL database!");
    process.exit(0);
  } else {
    console.error("❌ Database connection check failed:");
    console.error(`Reason: ${result.error}`);
    console.error("\nPlease configure valid DATABASE_URL in .env.local to connect to Supabase.");
    process.exit(1);
  }
}

main();
