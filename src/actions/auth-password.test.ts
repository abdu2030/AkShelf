import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { changePasswordAction } from "./auth";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import type { User } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockAuth = auth as unknown as {
  mockResolvedValueOnce: (value: unknown) => void;
};

describe("changePasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OWNER_EMAIL = "owner@akshelf.local";
    process.env.OWNER_PASSWORD_HASH = bcrypt.hashSync("EnvPassword123!", 10);
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const formData = new FormData();
    formData.set("currentPassword", "EnvPassword123!");
    formData.set("newPassword", "BrandNewPassword123!");
    formData.set("confirmPassword", "BrandNewPassword123!");

    const result = await changePasswordAction(undefined, formData);
    expect(result.error).toBe("You must be signed in to change your password.");
    expect(result.success).toBeFalsy();
  });

  it("returns validation error for mismatched new password", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u1", email: "owner@akshelf.local" },
    } as unknown as Session);

    const formData = new FormData();
    formData.set("currentPassword", "EnvPassword123!");
    formData.set("newPassword", "BrandNewPassword123!");
    formData.set("confirmPassword", "DifferentPassword123!");

    const result = await changePasswordAction(undefined, formData);
    expect(result.error).toBe("New passwords do not match.");
  });

  it("returns error when current password does not match", async () => {
    const { prisma } = await import("@/lib/db");

    mockAuth.mockResolvedValueOnce({
      user: { id: "u1", email: "owner@akshelf.local" },
    } as unknown as Session);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "u1",
      email: "owner@akshelf.local",
      passwordHash: null,
    } as unknown as User);

    const formData = new FormData();
    formData.set("currentPassword", "WrongCurrentPassword123!");
    formData.set("newPassword", "BrandNewPassword123!");
    formData.set("confirmPassword", "BrandNewPassword123!");

    const result = await changePasswordAction(undefined, formData);
    expect(result.error).toBe("Current password is not correct.");
  });

  it("updates database and returns success on valid credentials", async () => {
    const { prisma } = await import("@/lib/db");

    mockAuth.mockResolvedValueOnce({
      user: { id: "u1", email: "owner@akshelf.local" },
    } as unknown as Session);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "u1",
      email: "owner@akshelf.local",
      passwordHash: null,
    } as unknown as User);

    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      id: "u1",
      email: "owner@akshelf.local",
      passwordHash: "newHash",
    } as unknown as User);

    const formData = new FormData();
    formData.set("currentPassword", "EnvPassword123!");
    formData.set("newPassword", "BrandNewPassword123!");
    formData.set("confirmPassword", "BrandNewPassword123!");

    const result = await changePasswordAction(undefined, formData);
    expect(result.success).toBe(true);
    expect(result.message).toBe("Password updated successfully.");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          passwordHash: expect.any(String),
        }),
      }),
    );
  });
});
