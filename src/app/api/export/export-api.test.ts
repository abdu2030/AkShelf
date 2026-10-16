import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET as getJsonExport } from "./json/route";
import { GET as getCsvExport } from "./csv/route";
import { auth } from "@/lib/auth";
import * as exportService from "@/lib/export/export-service";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/export/export-service", () => ({
  generateJsonExport: vi.fn(),
  generateCsvExport: vi.fn(),
}));

describe("Export API Routes (/api/export/json & /api/export/csv)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/export/json", () => {
    it("returns 401 Unauthorized when session is unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);

      const response = await getJsonExport();

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 200 and attached JSON file for authenticated user", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-123" },
      } as never);

      const mockData = {
        app: "AkShelf",
        version: "1.0.0-rc.1",
        schemaVersion: 1,
        exportedAt: "2026-10-16T12:00:00.000Z",
        user: { email: "owner@akshelf.local" },
        stats: { totalTitles: 0, totalEpisodes: 0, totalHistory: 0 },
        titles: [],
        episodes: [],
        history: [],
      };

      vi.mocked(exportService.generateJsonExport).mockResolvedValueOnce(mockData as never);

      const response = await getJsonExport();

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toContain("application/json");
      expect(response.headers.get("Content-Disposition")).toContain(
        'attachment; filename="akshelf-backup-',
      );

      const body = await response.json();
      expect(body.app).toBe("AkShelf");
    });
  });

  describe("GET /api/export/csv", () => {
    it("returns 401 Unauthorized when session is unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);

      const response = await getCsvExport();

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 200 and attached CSV file for authenticated user", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-123" },
      } as never);

      vi.mocked(exportService.generateCsvExport).mockResolvedValueOnce(
        "Title,Type,Status\nInception,MOVIE,WATCHED",
      );

      const response = await getCsvExport();

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toContain("text/csv");
      expect(response.headers.get("Content-Disposition")).toContain(
        'attachment; filename="akshelf-library-',
      );

      const text = await response.text();
      expect(text).toContain("Inception,MOVIE,WATCHED");
    });
  });
});
