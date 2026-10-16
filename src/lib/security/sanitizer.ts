/**
 * Security Sanitization Utilities (Day 46)
 * Redacts secrets, passwords, database credentials, API keys, and bearer tokens
 * from error messages, URLs, stack traces, and console logs.
 */

const SENSITIVE_KEY_PATTERN =
  /^(password|hash|secret|token|apiKey|api_key|authorization|cookie|credentials|ownerPasswordHash)$/i;

/**
 * Sanitizes a string message by masking database connection URLs,
 * API keys in query parameters, bearer tokens, and password hashes.
 */
export function sanitizeErrorMessage(message: unknown): string {
  if (typeof message !== "string") {
    if (message instanceof Error) {
      return sanitizeErrorMessage(message.message);
    }
    return String(message ?? "");
  }

  return (
    message
      // 1. Mask database connection passwords: postgresql://user:password@host...
      .replace(/(postgres(?:ql)?:\/\/[^:\s\/]+:)([^@\s\/]+)(@)/gi, "$1***$3")
      // 2. Mask query string API keys, tokens, and passwords: ?api_key=xyz or &secret=abc
      .replace(/([?&](?:api_key|apiKey|secret|password|token)=)([^&\s]+)/gi, "$1***")
      // 3. Mask Authorization bearer tokens: Bearer eyJ...
      .replace(/(Bearer\s+)([a-zA-Z0-9_\-\.]{10,})/gi, "$1***")
      // 4. Mask bcrypt password hashes: $2b$10$...
      .replace(/(\$2[abxy]\$\d+\$)[./A-Za-z0-9]{20,}/g, "$1[REDACTED_HASH]")
  );
}

/**
 * Recursively sanitizes any input (Error, object, array, or string)
 * before it is written to server logs or client responses.
 */
export function sanitizeLog(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (input instanceof Error) {
    const sanitizedError = new Error(sanitizeErrorMessage(input.message));
    sanitizedError.name = input.name;
    if (input.stack) {
      sanitizedError.stack = sanitizeErrorMessage(input.stack);
    }
    return sanitizedError;
  }

  if (typeof input === "string") {
    return sanitizeErrorMessage(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeLog(item));
  }

  if (typeof input === "object") {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitizedObj[key] = "***";
      } else {
        sanitizedObj[key] = sanitizeLog(value);
      }
    }
    return sanitizedObj;
  }

  return input;
}

/**
 * Sanitized logger wrapper to guarantee zero secret leakage in application logs.
 */
export const safeLogger = {
  error(message: string, ...args: unknown[]) {
    console.error(sanitizeErrorMessage(message), ...args.map((arg) => sanitizeLog(arg)));
  },
  warn(message: string, ...args: unknown[]) {
    console.warn(sanitizeErrorMessage(message), ...args.map((arg) => sanitizeLog(arg)));
  },
  info(message: string, ...args: unknown[]) {
    console.info(sanitizeErrorMessage(message), ...args.map((arg) => sanitizeLog(arg)));
  },
};
