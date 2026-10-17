/**
 * Database Retry Utility
 *
 * Provides resilient execution of Prisma database operations with automatic
 * exponential backoff retry for transient network and connection pool errors.
 */

export interface DbRetryOptions {
  /** Maximum number of retry attempts after the initial try (default: 2) */
  retries?: number;
  /** Initial delay in milliseconds before the first retry (default: 400) */
  delayMs?: number;
  /** Maximum delay in milliseconds between retries (default: 3000) */
  maxDelayMs?: number;
  /** Diagnostic label for logging (default: "db-query") */
  label?: string;
  /** Optional custom predicate to determine if an error should trigger a retry */
  isRetryable?: (error: unknown) => boolean;
}

const TRANSIENT_PRISMA_ERROR_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // The database server was reached but timed out
  "P1008", // Operations timed out
  "P1017", // Server has closed the connection
  "P2024", // Timed out fetching a new connection from the connection pool
]);

const TRANSIENT_ERROR_PATTERNS = [
  /can't reach database server/i,
  /timed out fetching a new connection/i,
  /connection pool/i,
  /connection closed/i,
  /connection reset/i,
  /connection refused/i,
  /econnreset/i,
  /econnrefused/i,
  /etimedout/i,
  /socket hang up/i,
  /server has closed the connection/i,
];

/**
 * Checks if a given error corresponds to a transient connection or network fault.
 */
export function isTransientDbError(error: unknown): boolean {
  if (!error) return false;

  const errObj = error as { code?: string; message?: string; name?: string };

  if (typeof errObj.code === "string" && TRANSIENT_PRISMA_ERROR_CODES.has(errObj.code)) {
    return true;
  }

  const message = typeof errObj.message === "string" ? errObj.message : String(error);
  return TRANSIENT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Executes a database operation with exponential backoff retry for transient errors.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: DbRetryOptions = {},
): Promise<T> {
  const {
    retries = 2,
    delayMs = 400,
    maxDelayMs = 3000,
    label = "db-query",
    isRetryable = isTransientDbError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error) || attempt === retries) {
        throw error;
      }

      // Calculate exponential backoff with jitter
      const backoff = Math.min(delayMs * Math.pow(2, attempt) + Math.random() * 100, maxDelayMs);

      const errObj = error as { code?: string; message?: string };
      const errDetail = errObj.code ?? (errObj.message ? errObj.message.slice(0, 80) : "unknown");

      console.warn(
        `[DbRetry] Transient DB issue (${errDetail}) in [${label}]. Retrying in ${Math.round(backoff)}ms (attempt ${attempt + 1}/${retries})...`,
      );

      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  throw lastError;
}
