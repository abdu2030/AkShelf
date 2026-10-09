import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validates and sanitizes a redirect callbackUrl to guarantee it is a safe same-site relative path.
 * Disallows external URLs, protocol-relative URLs (//example.com), backslashes, and /login redirect loops.
 * Falls back to "/" if invalid or unsafe.
 */
export function validateCallbackUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") {
    return "/";
  }

  const trimmed = url.trim();

  // Must begin with single forward slash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return "/";
  }

  // Disallow redirecting back to login to prevent loops
  if (trimmed === "/login" || trimmed.startsWith("/login?") || trimmed.startsWith("/login/")) {
    return "/";
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    // Ensure origin is unchanged and no protocol smuggling
    if (parsed.origin !== "http://localhost") {
      return "/";
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/";
  }
}
