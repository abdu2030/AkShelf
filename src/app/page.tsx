import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100 selection:bg-indigo-500 selection:text-white">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur sm:p-12">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
            <span>Week 1</span>
            <span className="text-zinc-600">•</span>
            <span>Auth &amp; Foundation Active</span>
          </div>

          {session?.user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">{session.user.email}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Sign In (Owner)
            </Link>
          )}
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">AkShelf</h1>
        <p className="mt-2 text-lg text-zinc-400">Personal Movie, TV Show &amp; Anime Tracker</p>

        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          Designed to answer one question with zero friction:{" "}
          <strong className="text-indigo-300">&ldquo;Did I watch this?&rdquo;</strong> Fast capture,
          personal ratings, episode progress, and private watch history.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4">
            <h3 className="text-sm font-semibold text-white">Stack</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Next.js 16, TypeScript, Tailwind CSS, Prisma, PostgreSQL &amp; Auth.js
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4">
            <h3 className="text-sm font-semibold text-white">Private Authentication</h3>
            <p className="mt-1 text-xs text-zinc-400">
              {session?.user
                ? "Authenticated as single owner"
                : "Protected routes require owner login"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-zinc-800/80 pt-6">
          <Link
            href="/protected"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
          >
            Access Protected Area &rarr;
          </Link>
          <p className="text-xs text-zinc-500">Day 5 Complete • Auth.js integration</p>
        </div>
      </main>
    </div>
  );
}
