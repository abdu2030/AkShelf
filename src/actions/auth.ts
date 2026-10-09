"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { loginSchema, validateCallbackUrl } from "@/lib/validation/auth";

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
