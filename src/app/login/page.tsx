"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Film, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="w-full max-w-[400px] glass-3 rounded-[28px] p-8 shadow-2xl flex flex-col items-center">
      {/* AkShelf Mark */}
      <div className="h-12 w-12 rounded-2xl bg-accent-fill flex items-center justify-center text-white shadow-lg mb-6">
        <Film className="h-6 w-6" aria-hidden="true" />
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-ink tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm md:text-base text-ink-soft mt-2 leading-relaxed">
          Your movies, shows and anime, on one shelf.
        </p>
      </div>

      {/* Sign In Form */}
      <form action={formAction} className="w-full space-y-5">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        {/* Email Field */}
        <div className="flex flex-col">
          <label htmlFor="email" className="text-sm font-semibold text-ink mb-2 select-none">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="owner@akshelf.local"
            className="w-full h-12 rounded-[12px] px-4 text-base text-ink placeholder:text-ink-soft/60 bg-white/8 dark:bg-white/8 border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
        </div>

        {/* Password Field with Show/Hide Toggle */}
        <div className="flex flex-col">
          <label htmlFor="password" className="text-sm font-semibold text-ink mb-2 select-none">
            Password
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter password"
              className="w-full h-12 rounded-[12px] px-4 pr-12 text-base text-ink placeholder:text-ink-soft/60 bg-white/8 dark:bg-white/8 border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 text-ink-soft hover:text-ink transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* One generic error message above the button */}
        {state?.error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 p-3.5 rounded-[12px] bg-red-500/15 border border-red-500/30 text-red-200 text-xs sm:text-sm font-medium"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Large primary button */}
        <div className="pt-2">
          <Button type="submit" variant="primary" size="large" fullWidth isLoading={isPending}>
            Sign in
          </Button>
        </div>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-[400px] h-[480px] glass-3 rounded-[28px] animate-pulse" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
