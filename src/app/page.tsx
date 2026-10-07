export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100 selection:bg-indigo-500 selection:text-white">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur sm:p-12">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
          <span>Week 1</span>
          <span className="text-zinc-600">•</span>
          <span>Foundation & Tooling Ready</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">AkShelf</h1>
        <p className="mt-2 text-lg text-zinc-400">Personal Movie, TV Show & Anime Tracker</p>

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
            <h3 className="text-sm font-semibold text-white">Guiding Principle</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Personal actions stored privately; external metadata fetched on demand.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-800/80 pt-6">
          <p className="text-xs text-zinc-500">
            Day 2 Complete • Tooling, linting, formatting, testing, and CI configured.
          </p>
        </div>
      </main>
    </div>
  );
}
