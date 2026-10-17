import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbHealth = await checkDatabaseConnection();
  const isHealthy = dbHealth.connected;

  const payload = {
    status: isHealthy ? "ok" : "degraded",
    app: "AkShelf",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      database: {
        status: dbHealth.connected ? "connected" : "disconnected",
        ...(dbHealth.error ? { message: dbHealth.error } : {}),
      },
    },
  };

  return NextResponse.json(payload, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
