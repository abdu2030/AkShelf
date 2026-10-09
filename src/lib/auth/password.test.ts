import { describe, expect, it, beforeEach, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import { verifyPasswordHash, verifyOwnerCredentials } from "./password";

describe("Password verification", () => {
  const originalEnv = process.env;
  const testPassword = "secretPassword42";
  const testHash = bcrypt.hashSync(testPassword, 10);

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("verifyPasswordHash", () => {
    it("returns true for matching password and hash", async () => {
      const result = await verifyPasswordHash(testPassword, testHash);
      expect(result).toBe(true);
    });

    it("returns false for incorrect password", async () => {
      const result = await verifyPasswordHash("wrongPassword", testHash);
      expect(result).toBe(false);
    });

    it("fails fast by throwing if hash is undefined or empty", async () => {
      await expect(verifyPasswordHash(testPassword, undefined)).rejects.toThrow(
        "Missing required environment variable: OWNER_PASSWORD_HASH",
      );
      await expect(verifyPasswordHash(testPassword, "")).rejects.toThrow(
        "Missing required environment variable: OWNER_PASSWORD_HASH",
      );
    });
  });

  describe("verifyOwnerCredentials", () => {
    it("returns true for valid owner email and password", async () => {
      process.env.OWNER_EMAIL = "owner@test.com";
      process.env.OWNER_PASSWORD_HASH = testHash;

      const result = await verifyOwnerCredentials("owner@test.com", testPassword);
      expect(result).toBe(true);
    });

    it("is case-insensitive for email", async () => {
      process.env.OWNER_EMAIL = "Owner@Test.com";
      process.env.OWNER_PASSWORD_HASH = testHash;

      const result = await verifyOwnerCredentials("OWNER@TEST.COM", testPassword);
      expect(result).toBe(true);
    });

    it("returns false for wrong email", async () => {
      process.env.OWNER_EMAIL = "owner@test.com";
      process.env.OWNER_PASSWORD_HASH = testHash;

      const result = await verifyOwnerCredentials("stranger@test.com", testPassword);
      expect(result).toBe(false);
    });

    it("fails fast if OWNER_PASSWORD_HASH is unset", async () => {
      process.env.OWNER_EMAIL = "owner@test.com";
      delete process.env.OWNER_PASSWORD_HASH;

      await expect(verifyOwnerCredentials("owner@test.com", testPassword)).rejects.toThrow(
        "Missing required environment variable: OWNER_PASSWORD_HASH",
      );
    });
  });
});
