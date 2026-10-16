import { describe, expect, it, vi } from "vitest";
import fs from "fs";
import path from "path";
import { safeLogger, sanitizeErrorMessage, sanitizeLog } from "./sanitizer";

describe("Secrets, Environment & Logging Sanitization Audit Suite (Day 46)", () => {
  describe("1. Environment & Secret Exposure Audit", () => {
    it("confirms no NEXT_PUBLIC_ variables contain sensitive secret keywords in codebase", () => {
      const srcDir = path.resolve(process.cwd(), "src");

      function scanFiles(dir: string): string[] {
        let results: string[] = [];
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat && stat.isDirectory()) {
            results = results.concat(scanFiles(filePath));
          } else if (/\.(ts|tsx|js|mjs)$/.test(file) && !file.includes(".test.")) {
            results.push(filePath);
          }
        }
        return results;
      }

      const files = scanFiles(srcDir);
      const sensitiveKeywords = [
        "NEXT_PUBLIC_SECRET",
        "NEXT_PUBLIC_DATABASE",
        "NEXT_PUBLIC_PASSWORD",
        "NEXT_PUBLIC_HASH",
        "NEXT_PUBLIC_TOKEN",
        "NEXT_PUBLIC_API_KEY",
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        for (const keyword of sensitiveKeywords) {
          expect(content).not.toContain(keyword);
        }
      }
    });

    it("verifies .env.example defines required template keys with zero live secrets", () => {
      const envExamplePath = path.resolve(process.cwd(), ".env.example");
      expect(fs.existsSync(envExamplePath)).toBe(true);

      const content = fs.readFileSync(envExamplePath, "utf8");

      // Verify all required template keys are present
      expect(content).toContain("DATABASE_URL=");
      expect(content).toContain("DIRECT_URL=");
      expect(content).toContain("AUTH_SECRET=");
      expect(content).toContain("OWNER_EMAIL=");
      expect(content).toContain("OWNER_PASSWORD_HASH=");
      expect(content).toContain("TMDB_API_KEY=");
      expect(content).toContain("TMDB_API_READ_ACCESS_TOKEN=");

      // Verify no live passwords or secrets are committed in .env.example
      expect(content).not.toMatch(/DATABASE_URL=[^\s#]+/);
      expect(content).not.toMatch(/AUTH_SECRET=[a-zA-Z0-9_-]{16,}/);
      expect(content).not.toMatch(/TMDB_API_KEY=[a-zA-Z0-9_-]{10,}/);
    });

    it("verifies client components never import server database or TMDB clients directly", () => {
      const componentsDir = path.resolve(process.cwd(), "src/components");

      function scanComponents(dir: string): string[] {
        let results: string[] = [];
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat && stat.isDirectory()) {
            results = results.concat(scanComponents(filePath));
          } else if (/\.(ts|tsx)$/.test(file) && !file.includes(".test.")) {
            results.push(filePath);
          }
        }
        return results;
      }

      const componentFiles = scanComponents(componentsDir);

      for (const file of componentFiles) {
        const content = fs.readFileSync(file, "utf8");

        // Client components must never directly import database models or server secrets
        expect(content).not.toMatch(/from ["']@\/lib\/db["']/);
        expect(content).not.toMatch(/from ["']@\/lib\/tmdb\/client["']/);
        expect(content).not.toMatch(/process\.env\.DATABASE_URL/);
        expect(content).not.toMatch(/process\.env\.OWNER_PASSWORD_HASH/);
        expect(content).not.toMatch(/process\.env\.AUTH_SECRET/);
      }
    });
  });

  describe("2. Error Message & Credential Masking (sanitizeErrorMessage)", () => {
    it("redacts credentials from PostgreSQL and Supabase connection strings", () => {
      const sensitiveError =
        "Can't reach database server at postgresql://postgres:MySecretPassword123!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require";

      const sanitized = sanitizeErrorMessage(sensitiveError);

      expect(sanitized).not.toContain("MySecretPassword123!");
      expect(sanitized).toBe(
        "Can't reach database server at postgresql://postgres:***@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require",
      );
    });

    it("redacts API keys and tokens from query parameters in URLs", () => {
      const errorWithUrl =
        "Network request failed for https://api.themoviedb.org/3/movie/550?api_key=a1b2c3d4e5f6g7h8i9j0&language=en-US";

      const sanitized = sanitizeErrorMessage(errorWithUrl);

      expect(sanitized).not.toContain("a1b2c3d4e5f6g7h8i9j0");
      expect(sanitized).toBe(
        "Network request failed for https://api.themoviedb.org/3/movie/550?api_key=***&language=en-US",
      );
    });

    it("redacts Authorization Bearer tokens", () => {
      const authHeaderError =
        "Unauthorized upstream request: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive_payload";

      const sanitized = sanitizeErrorMessage(authHeaderError);

      expect(sanitized).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive_payload");
      expect(sanitized).toBe("Unauthorized upstream request: Authorization: Bearer ***");
    });

    it("redacts bcrypt password hashes from logs and error strings", () => {
      const hashError =
        "Failed comparison against stored hash: $2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW in authentication provider";

      const sanitized = sanitizeErrorMessage(hashError);

      expect(sanitized).not.toContain("EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW");
      expect(sanitized).toBe(
        "Failed comparison against stored hash: $2b$10$[REDACTED_HASH] in authentication provider",
      );
    });

    it("leaves safe user-facing and application error messages unmodified", () => {
      const safeMessages = [
        "Connection reset",
        "Database status mutation failed",
        "Invalid rating input: Rating must be between 1 and 10",
        "Title not found",
        "That email or password is not right.",
      ];

      for (const msg of safeMessages) {
        expect(sanitizeErrorMessage(msg)).toBe(msg);
      }
    });
  });

  describe("3. Object & Deep Log Sanitization (sanitizeLog)", () => {
    it("sanitizes Error objects including message and stack trace", () => {
      const rawError = new Error(
        "Failed connect to postgresql://postgres:SuperSecret123@localhost:5432/mydb",
      );

      const sanitized = sanitizeLog(rawError) as Error;

      expect(sanitized).toBeInstanceOf(Error);
      expect(sanitized.message).not.toContain("SuperSecret123");
      expect(sanitized.message).toContain("postgresql://postgres:***@localhost:5432/mydb");
      if (sanitized.stack) {
        expect(sanitized.stack).not.toContain("SuperSecret123");
      }
    });

    it("masks sensitive keys in nested objects and arrays", () => {
      const payload = {
        title: "Dune: Part Two",
        user: {
          email: "owner@akshelf.local",
          password: "my-plain-password-123",
          apiKey: "tmdb_secret_key_abc",
          nested: {
            token: "jwt_bearer_token_xyz",
            normalField: "visible",
          },
        },
        items: [{ name: "Item 1", credentials: "sensitive_creds" }, "Safe string item"],
      };

      const sanitized = sanitizeLog(payload) as typeof payload;

      expect(sanitized.user.email).toBe("owner@akshelf.local");
      expect(sanitized.user.password).toBe("***");
      expect(sanitized.user.apiKey).toBe("***");
      expect(sanitized.user.nested.token).toBe("***");
      expect(sanitized.user.nested.normalField).toBe("visible");
      expect((sanitized.items[0] as { credentials: string }).credentials).toBe("***");
      expect(sanitized.items[1]).toBe("Safe string item");
    });

    it("handles primitives, null, and undefined safely", () => {
      expect(sanitizeLog(null)).toBeNull();
      expect(sanitizeLog(undefined)).toBeUndefined();
      expect(sanitizeLog(12345)).toBe(12345);
      expect(sanitizeLog(true)).toBe(true);
    });
  });

  describe("4. Safe Logger Wrapper (safeLogger)", () => {
    it("intercepts console.error and sanitizes secrets before printing", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      safeLogger.error("Database failure on postgresql://admin:dbpassword99@server:5432/akshelf", {
        password: "userPassword123",
        action: "TRACKING_STATUS",
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const [loggedMsg, loggedArg] = consoleSpy.mock.calls[0];

      expect(loggedMsg).not.toContain("dbpassword99");
      expect(loggedMsg).toContain("postgresql://admin:***@server:5432/akshelf");
      expect(loggedArg).toEqual({
        password: "***",
        action: "TRACKING_STATUS",
      });

      consoleSpy.mockRestore();
    });

    it("intercepts console.warn and sanitizes sensitive query strings", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      safeLogger.warn("Upstream warning from /search?api_key=my_private_key&query=avatar");

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const [loggedMsg] = consoleSpy.mock.calls[0];

      expect(loggedMsg).not.toContain("my_private_key");
      expect(loggedMsg).toContain("/search?api_key=***&query=avatar");

      consoleSpy.mockRestore();
    });
  });
});
