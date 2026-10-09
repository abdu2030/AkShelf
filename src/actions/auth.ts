"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { loginSchema } from "@/lib/validation/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/protected",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid owner credentials." };
        default:
          return { error: "Authentication failed. Please try again." };
      }
    }
    // Next.js redirect throws an internal error that must be re-thrown
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
