import bcrypt from "bcryptjs";
import { prisma as defaultPrisma } from "@/lib/db";
import type { PrismaClient } from "@prisma/client";

export interface ProvisionOwnerOptions {
  email: string;
  name?: string;
  prismaClient?: PrismaClient;
}

export interface ProvisionOwnerResult {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  created: boolean;
}

export interface DatabaseAuditResult {
  users: number;
  titles: number;
  userTitles: number;
  seasons: number;
  episodes: number;
  userEpisodes: number;
  watchHistory: number;
  isCleanProduction: boolean;
}

/**
 * Validates whether an email string adheres to basic standard email format.
 */
export function validateOwnerEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Validates the minimum security strength of the owner password.
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password cannot be empty." };
  }
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  return { valid: true };
}

/**
 * Generates a bcrypt password hash suitable for production configuration.
 * Returns both raw bcrypt hash and a shell/dotenv-escaped version (with \$).
 */
export async function hashOwnerPassword(
  password: string,
  rounds = 10,
): Promise<{ rawHash: string; escapedHash: string }> {
  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    throw new Error(strength.error);
  }

  const rawHash = await bcrypt.hash(password, rounds);
  // Escapes $ to \$ for .env files to prevent variable expansion in Unix/Windows shells
  const escapedHash = rawHash.replace(/\$/g, "\\$");

  return { rawHash, escapedHash };
}

/**
 * Safely and idempotently provisions or updates the owner account in the database.
 * Does not overwrite existing library data or titles.
 */
export async function provisionOwner(
  options: ProvisionOwnerOptions,
): Promise<ProvisionOwnerResult> {
  const { email, name = "AkShelf Owner", prismaClient = defaultPrisma } = options;

  if (!validateOwnerEmail(email)) {
    throw new Error(`Invalid owner email format: "${email}"`);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prismaClient.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    let updatedUser = existingUser;
    if (name && existingUser.name !== name) {
      updatedUser = await prismaClient.user.update({
        where: { id: existingUser.id },
        data: { name },
      });
    }
    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
      created: false,
    };
  }

  const newUser = await prismaClient.user.create({
    data: {
      email: normalizedEmail,
      name,
    },
  });

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    },
    created: true,
  };
}

/**
 * Performs a read-only audit of the database state to ensure zero-pollution in production.
 */
export async function auditDatabaseState(
  prismaClient: PrismaClient = defaultPrisma,
): Promise<DatabaseAuditResult> {
  const [users, titles, userTitles, seasons, episodes, userEpisodes, watchHistory] =
    await Promise.all([
      prismaClient.user.count(),
      prismaClient.title.count(),
      prismaClient.userTitle.count(),
      prismaClient.season.count(),
      prismaClient.episode.count(),
      prismaClient.userEpisode.count(),
      prismaClient.watchHistory.count(),
    ]);

  return {
    users,
    titles,
    userTitles,
    seasons,
    episodes,
    userEpisodes,
    watchHistory,
    isCleanProduction: titles === 0 && userTitles === 0 && watchHistory === 0,
  };
}
