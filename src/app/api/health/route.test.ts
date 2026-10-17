import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET as getHealth } from "./route";
import * as dbHealth from "@/lib/db/health";

vi.mock("@/lib/db/health", () => ({
  checkDatabaseConnection: vi.fn(),
}));

describe("Health Check API (/api/health)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and status ok when database is connected", async () => {
    vi.mocked(dbHealth.checkDatabaseConnection).mockResolvedValueOnce({
      connected: true,
      timestamp: "2026-10-17T10:00:00.000Z",
    });

    const response = await getHealth();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.app).toBe("AkShelf");
    expect(body.version).toBe("1.0.0-rc.1");
    expect(body.services.database.status).toBe("connected");
  });

  it("returns 503 and status degraded when database fails", async () => {
    vi.mocked(dbHealth.checkDatabaseConnection).mockResolvedValueOnce({
      connected: false,
      timestamp: "2026-10-17T10:00:00.000Z",
      error: "Connection refused",
    });

    const response = await getHealth();

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("degraded");
    expect(body.services.database.status).toBe("disconnected");
    expect(body.services.database.message).toBe("Connection refused");
  });
});
