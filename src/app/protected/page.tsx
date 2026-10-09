import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/actions/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProtectedAreaPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch real database status for the authenticated user
  const [trackedCount, userRecord] = await Promise.all([
    prisma.userTitle.count({
      where: { userId: session.user.id },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, createdAt: true },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100 selection:bg-indigo-500 selection:text-white">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur sm:p-12">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span>Authenticated</span>
            <span className="text-zinc-600">•</span>
            <span>Private Area</span>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              Sign Out
            </button>
          </form>
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Welcome back, {session.user.name || "Owner"}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          This page is protected by Auth.js and requires an authenticated session.
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Session Profile
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-zinc-500">Email:</span>
                <p className="font-mono text-zinc-200 mt-0.5">{session.user.email}</p>
              </div>
              <div>
                <span className="text-zinc-500">User ID:</span>
                <p className="font-mono text-zinc-200 mt-0.5 truncate">{session.user.id}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Database State (PostgreSQL)
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-zinc-500">Owner Exists in DB:</span>
                <p className="font-medium text-emerald-400 mt-0.5">
                  {userRecord ? "✅ Verified" : "❌ Not found"}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Tracked Titles in Library:</span>
                <p className="font-medium text-indigo-400 mt-0.5">
                  {trackedCount} item{trackedCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/80 pt-6">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition">
            &larr; View Home Screen
          </Link>

          <span className="text-xs text-zinc-600">
            Day 5 Complete • Auth.js integration verified
          </span>
        </div>
      </main>
    </div>
  );
}
