import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { changePasswordAction } from "./auth";

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

describe("changePasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OWNER_EMAIL = "owner@akshelf.local";
    process.env.OWNER_PASSWORD_HASH = bcrypt.hashSync("EnvPassword123!", 10);
  });

  it("returns error when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as any);

    const formData = new FormData();
    formData.set("currentPassword", "EnvPassword123!");
    formData.set("newPassword", "BrandNewPassword123!");
    formData.set("confirmPassword", "BrandNewPassword123!");

    const result = await changePasswordAction(undefined, formData);
    expect(result.error).toBe("You must be signed in to change your password.");
    expect(result.success).toBeFalsy();
  });

  it("returns validation error for mismatched new password", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "u1", email: "owner@akshelf.local" },
    } as any);

    const formData = new FormData();
    formData.set("currentPassword", "EnvPassword123!");
    formData.set("newPassword", "BrandNewPassword123!");
    formData.set("confirmPassword", "DifferentPassword123!");

    const result = await changePasswordAction(undefined, formData);
    expect(result.error).toBe("New passwords do not match.");
  });

  it("returns error when current password does not match", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");

    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "u1", email: "owner@akshelf.local" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "u1",
      email: "owner@akshelf.local",
      passwordHash: null,
    } as any);

    const formData = new FormData();
    formData.set("currentPassword", "WrongCurrentPassword123!");
    formData.set("newPassword", "BrandNewPassword123!");
    formData.set("confirmPassword", "BrandNewPassword123!");

    const result = await changePasswordAction(undefined, formData);
    expect(result.error).toBe("Current password is not correct.");
  });

  it("updates database and returns success on valid credentials", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");

    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "u1", email: "owner@akshelf.local" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "u1",
      email: "owner@akshelf.local",
      passwordHash: null,
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      id: "u1",
      email: "owner@akshelf.local",
      passwordHash: "newHash",
    } as any);

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
