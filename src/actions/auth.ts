"use server";

import { auth, signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { loginSchema, validateCallbackUrl, changePasswordSchema } from "@/lib/validation/auth";
import { verifyPasswordHash } from "@/lib/auth/password";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawCallbackUrl = formData.get("callbackUrl");

  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!parsed.success) {
    return {
      error: "That email or password is not right.",
    };
  }

  const targetUrl = validateCallbackUrl(
    typeof rawCallbackUrl === "string" ? rawCallbackUrl : undefined,
  );

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: targetUrl,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "That email or password is not right." };
    }
    // Next.js redirect throws an internal NEXT_REDIRECT error which must be re-thrown
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export type ChangePasswordState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function changePasswordAction(
  _prevState: ChangePasswordState | undefined,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    return {
      error: "You must be signed in to change your password.",
      success: false,
    };
  }

  const rawCurrentPassword = formData.get("currentPassword");
  const rawNewPassword = formData.get("newPassword");
  const rawConfirmPassword = formData.get("confirmPassword");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: rawCurrentPassword,
    newPassword: rawNewPassword,
    confirmPassword: rawConfirmPassword,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Invalid password details.";
    return {
      error: firstError,
      success: false,
    };
  }

  const { currentPassword, newPassword } = parsed.data;
  const ownerEmail = process.env.OWNER_EMAIL || "owner@akshelf.local";
  const userEmail = session.user.email || ownerEmail;

  // Retrieve user record to find existing database password_hash
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  const activeHash = user?.passwordHash || process.env.OWNER_PASSWORD_HASH;

  try {
    const isCurrentValid = await verifyPasswordHash(currentPassword, activeHash);
    if (!isCurrentValid) {
      return {
        error: "Current password is not correct.",
        success: false,
      };
    }
  } catch {
    return {
      error: "Current password is not correct.",
      success: false,
    };
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
  } else {
    await prisma.user.upsert({
      where: { email: userEmail },
      update: { passwordHash: newHash },
      create: {
        email: userEmail,
        name: "AkShelf Owner",
        passwordHash: newHash,
      },
    });
  }

  return {
    success: true,
    message: "Password updated successfully.",
  };
}
