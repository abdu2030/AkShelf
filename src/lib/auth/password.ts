import bcrypt from "bcryptjs";

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
 * Fails fast if OWNER_PASSWORD_HASH is missing.
 */
export async function verifyOwnerCredentials(email: string, password: string): Promise<boolean> {
  const ownerEmail = process.env.OWNER_EMAIL || "owner@akshelf.local";
  const ownerPasswordHash = process.env.OWNER_PASSWORD_HASH;

  if (email.toLowerCase().trim() !== ownerEmail.toLowerCase().trim()) {
    return false;
  }

  return verifyPasswordHash(password, ownerPasswordHash);
}
