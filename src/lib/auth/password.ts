import bcrypt from "bcryptjs";
import { prisma as defaultPrisma } from "@/lib/db";

export interface VerifyOwnerCredentialsOptions {
  prismaClient?: {
    user: {
      findUnique: (args: {
        where: { email: string };
      }) => Promise<{ id: string; email: string; passwordHash: string | null } | null>;
    };
  };
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 * Unescapes any \$ backslashes if loaded from .env without expansion,
 * and fails fast by throwing an Error if the hash is missing or empty.
 */
export async function verifyPasswordHash(
  password: string,
  hash: string | undefined | null,
): Promise<boolean> {
  if (!hash || hash.trim() === "") {
    throw new Error("Missing required environment variable: OWNER_PASSWORD_HASH");
  }

  // Normalize hash in case literal backslashes were preserved
  const normalizedHash = hash.replace(/\\([$])/g, "$1").trim();

  return bcrypt.compare(password, normalizedHash);
}

/**
 * Validates provided credentials against the single-owner configuration.
 * Checks the database password_hash first if present; falls back to OWNER_PASSWORD_HASH.
 * Fails fast if neither is configured.
 */
export async function verifyOwnerCredentials(
  email: string,
  password: string,
  options?: VerifyOwnerCredentialsOptions,
): Promise<boolean> {
  const ownerEmail = process.env.OWNER_EMAIL || "owner@akshelf.local";

  if (email.toLowerCase().trim() !== ownerEmail.toLowerCase().trim()) {
    return false;
  }

  const client = options?.prismaClient ?? defaultPrisma;

  let dbUserPasswordHash: string | null = null;
  try {
    const user = await client.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (
      user &&
      "passwordHash" in user &&
      typeof user.passwordHash === "string" &&
      user.passwordHash.trim() !== ""
    ) {
      dbUserPasswordHash = user.passwordHash;
    }
  } catch (error) {
    // If DB is temporarily unavailable during initial connect, fall back to env hash
    console.warn(
      "[Auth] Failed to check database password_hash, falling back to env hash:",
      error,
    );
  }

  const activeHash = dbUserPasswordHash || process.env.OWNER_PASSWORD_HASH;
  return verifyPasswordHash(password, activeHash);
}
