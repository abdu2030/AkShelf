import { prisma } from "./prisma";

export interface DatabaseHealthResult {
  connected: boolean;
  timestamp: string;
  error?: string;
}

/**
 * Checks whether the PostgreSQL database connection is configured and reachable.
 */
export async function checkDatabaseConnection(): Promise<DatabaseHealthResult> {
  const timestamp = new Date().toISOString();

  if (!process.env.DATABASE_URL) {
    return {
      connected: false,
      timestamp,
      error: "DATABASE_URL environment variable is not configured.",
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1 as result`;
    return {
      connected: true,
      timestamp,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      timestamp,
      error: message,
    };
  }
}
