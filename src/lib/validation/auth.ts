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

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
