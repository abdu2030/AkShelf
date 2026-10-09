"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100 selection:bg-indigo-500 selection:text-white">
      <main className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur sm:p-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
          <span>Private Area</span>
          <span className="text-zinc-600">•</span>
          <span>Single-Owner Login</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Welcome to AkShelf
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Sign in to access your private library, watchlist, and tracking history.
        </p>

        {state?.error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {state.error}
          </div>
        )}

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wider text-zinc-400"
            >
              Owner Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="owner@akshelf.local"
              placeholder="owner@akshelf.local"
              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wider text-zinc-400"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••••••"
              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {isPending ? "Signing in..." : "Sign In to Library"}
          </button>
        </form>

        <div className="mt-6 border-t border-zinc-800/80 pt-4 text-center">
          <Link href="/" className="text-xs text-zinc-500 transition hover:text-zinc-300">
            &larr; Back to Public Welcome Page
          </Link>
        </div>
      </main>
    </div>
  );
}
