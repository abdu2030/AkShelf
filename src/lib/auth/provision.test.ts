import { describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import {
  validateOwnerEmail,
  validatePasswordStrength,
  hashOwnerPassword,
  provisionOwner,
  auditDatabaseState,
} from "./provision";
import type { PrismaClient } from "@prisma/client";

describe("Provisioning utilities", () => {
  describe("validateOwnerEmail", () => {
    it("returns true for standard email formats", () => {
      expect(validateOwnerEmail("owner@akshelf.local")).toBe(true);
      expect(validateOwnerEmail("admin@example.com")).toBe(true);
      expect(validateOwnerEmail("user.name+tag@sub.domain.org")).toBe(true);
    });

    it("returns false for invalid email formats", () => {
      expect(validateOwnerEmail("")).toBe(false);
      expect(validateOwnerEmail("notanemail")).toBe(false);
      expect(validateOwnerEmail("missing@domain")).toBe(false);
      expect(validateOwnerEmail("@nodomain.com")).toBe(false);
      expect(validateOwnerEmail("spaces in@email.com")).toBe(false);
      // @ts-expect-error test non-string input
      expect(validateOwnerEmail(null)).toBe(false);
      // @ts-expect-error test non-string input
      expect(validateOwnerEmail(undefined)).toBe(false);
    });
  });

  describe("validatePasswordStrength", () => {
    it("accepts passwords with 8 or more characters", () => {
      expect(validatePasswordStrength("12345678")).toEqual({ valid: true });
      expect(validatePasswordStrength("superSecretPassword123!")).toEqual({ valid: true });
    });

    it("rejects passwords shorter than 8 characters", () => {
      const result = validatePasswordStrength("short");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 8 characters");
    });

    it("rejects empty or non-string passwords", () => {
      expect(validatePasswordStrength("").valid).toBe(false);
      // @ts-expect-error testing invalid type
      expect(validatePasswordStrength(null).valid).toBe(false);
    });
  });

  describe("hashOwnerPassword", () => {
    it("generates a valid bcrypt hash and properly escaped hash string", async () => {
      const password = "strongMasterPassword42!";
      const { rawHash, escapedHash } = await hashOwnerPassword(password, 6);

      expect(rawHash).toMatch(/^\$2[aby]\$\d{2}\$/);
      expect(escapedHash).toContain("\\$");
      expect(escapedHash).not.toMatch(/(?<!\\)\$/);

      // Verify bcrypt validation succeeds
      const isMatch = await bcrypt.compare(password, rawHash);
      expect(isMatch).toBe(true);
    });

    it("throws an error if password strength validation fails", async () => {
      await expect(hashOwnerPassword("short", 6)).rejects.toThrow("at least 8 characters");
    });
  });

  describe("provisionOwner", () => {
    it("creates a new owner account if not already in database", async () => {
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            id: "user-new-id",
            email: "owner@akshelf.local",
            name: "AkShelf Owner",
          }),
          update: vi.fn(),
        },
      } as unknown as PrismaClient;

      const result = await provisionOwner({
        email: "Owner@akshelf.local ",
        name: "AkShelf Owner",
        prismaClient: mockPrisma,
      });

      expect(result.created).toBe(true);
      expect(result.user.email).toBe("owner@akshelf.local");
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "owner@akshelf.local" },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "owner@akshelf.local",
          name: "AkShelf Owner",
        },
      });
    });

    it("returns existing user without creating a duplicate", async () => {
      const existing = {
        id: "user-existing-id",
        email: "owner@akshelf.local",
        name: "AkShelf Owner",
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(existing),
          create: vi.fn(),
          update: vi.fn(),
        },
      } as unknown as PrismaClient;

      const result = await provisionOwner({
        email: "owner@akshelf.local",
        name: "AkShelf Owner",
        prismaClient: mockPrisma,
      });

      expect(result.created).toBe(false);
      expect(result.user.id).toBe("user-existing-id");
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("updates owner name if a new name is specified", async () => {
      const existing = {
        id: "user-existing-id",
        email: "owner@akshelf.local",
        name: "Old Name",
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(existing),
          create: vi.fn(),
          update: vi.fn().mockResolvedValue({
            ...existing,
            name: "New Owner Name",
          }),
        },
      } as unknown as PrismaClient;

      const result = await provisionOwner({
        email: "owner@akshelf.local",
        name: "New Owner Name",
        prismaClient: mockPrisma,
      });

      expect(result.created).toBe(false);
      expect(result.user.name).toBe("New Owner Name");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-existing-id" },
        data: { name: "New Owner Name" },
      });
    });

    it("throws error for malformed email", async () => {
      const mockPrisma = {} as PrismaClient;
      await expect(
        provisionOwner({
          email: "invalid-email",
          prismaClient: mockPrisma,
        }),
      ).rejects.toThrow('Invalid owner email format: "invalid-email"');
    });
  });

  describe("auditDatabaseState", () => {
    it("reports clean production state when titles and history are 0", async () => {
      const mockPrisma = {
        user: { count: vi.fn().mockResolvedValue(1) },
        title: { count: vi.fn().mockResolvedValue(0) },
        userTitle: { count: vi.fn().mockResolvedValue(0) },
        season: { count: vi.fn().mockResolvedValue(0) },
        episode: { count: vi.fn().mockResolvedValue(0) },
        userEpisode: { count: vi.fn().mockResolvedValue(0) },
        watchHistory: { count: vi.fn().mockResolvedValue(0) },
      } as unknown as PrismaClient;

      const audit = await auditDatabaseState(mockPrisma);

      expect(audit.users).toBe(1);
      expect(audit.titles).toBe(0);
      expect(audit.isCleanProduction).toBe(true);
    });

    it("reports non-clean state if titles or tracking data exist", async () => {
      const mockPrisma = {
        user: { count: vi.fn().mockResolvedValue(1) },
        title: { count: vi.fn().mockResolvedValue(12) },
        userTitle: { count: vi.fn().mockResolvedValue(12) },
        season: { count: vi.fn().mockResolvedValue(4) },
        episode: { count: vi.fn().mockResolvedValue(30) },
        userEpisode: { count: vi.fn().mockResolvedValue(25) },
        watchHistory: { count: vi.fn().mockResolvedValue(14) },
      } as unknown as PrismaClient;

      const audit = await auditDatabaseState(mockPrisma);

      expect(audit.titles).toBe(12);
      expect(audit.isCleanProduction).toBe(false);
    });
  });
});
