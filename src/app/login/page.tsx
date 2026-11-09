"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [showPassword, setShowPassword] = useState(false);

  return (
    <main id="main-content" className="w-full max-w-[380px] flex flex-col items-start">
      {/* AkShelf Mark */}
      <div className="mb-6">
        <LogoMark size={52} />
      </div>

      <p className="eyebrow mb-3">Your private archive</p>
      {/* Header */}
      <div className="text-left mb-8">
        <h1 className="page-heading text-ink">Welcome back</h1>
        <p className="text-sm md:text-base text-ink-soft font-medium mt-2 leading-relaxed">
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
            className="w-full h-12 rounded-[12px] px-4 text-base text-ink placeholder:text-ink-muted placeholder:font-normal bg-surface border border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
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
              className="w-full h-12 rounded-[12px] px-4 pr-12 text-base text-ink placeholder:text-ink-muted placeholder:font-normal bg-surface border border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1 text-ink-soft hover:text-ink transition-colors h-11 w-11 flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
            className="flex items-center gap-2.5 p-3.5 rounded-[12px] bg-red-500/15 border border-red-500/30 text-error text-xs sm:text-sm font-medium"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
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
    <div className="login-layout">
      <aside className="login-art" aria-label="AkShelf private archive">
        <p className="text-sm font-semibold tracking-[0.18em]">AK / SHELF</p>
        <div>
          <p className="text-[11px] text-[#dfa16f] tracking-[0.18em] uppercase mb-6">
            A collection that is yours.
          </p>
          <h2 className="editorial text-[clamp(2.8rem,4.5vw,5rem)] max-w-[12ch]">
            Your stories.
            <br />
            Your shelf.
          </h2>
          <div className="archive-still-life" aria-hidden="true">
            <div>
              <span className="text-[10px] tracking-widest">01 / FILM</span>
              <div className="mt-8 w-20 h-20 border border-current rounded-full opacity-50" />
            </div>
            <div>
              <span className="text-[10px] tracking-widest">02 / SERIES</span>
              <div className="editorial text-6xl mt-10">Aa</div>
            </div>
            <div>
              <span className="text-[10px] tracking-widest">03 / ANIME</span>
              <div className="mt-10 border-t border-b border-current h-16 opacity-50" />
            </div>
          </div>
          <p className="text-sm text-[#aeb4b7] max-w-sm leading-relaxed">
            A private place for the films, series and anime that stay with you.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#aeb4b7]">
          Collect the stories. Keep the record.
        </p>
      </aside>
      <div className="login-form-wrap">
        <Suspense
          fallback={
            <div className="w-full max-w-[400px] h-[480px] glass-3 rounded-[18px] animate-pulse" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
