# GitHub Rules & Repository Standards

How to build a clean, professional repository for AkShelf from Day 1 to the v1.0 release.

- **Project**: AkShelf - personal movie, TV show & anime tracker
- **Stack**: Next.js, TypeScript, Tailwind, Prisma, PostgreSQL (Supabase)
- **Data**: TMDB + AniList, deployed on Vercel
- **Companion to**: 8-week implementation roadmap (Day 1 - Day 56)
- **Edition**: October 2026

---

## 1. The 10 Golden Rules

1. **Never commit secrets or personal data**. No `.env` files, API keys, database URLs, exports or backups.
2. **`main` is always working**. Nothing reaches `main` except through a pull request that passed CI.
3. **One branch, one purpose**. Branches are short-lived (1–3 days) and deleted after merging.
4. **Write Conventional Commits**. Format: `type(scope): short summary`.
5. **Keep commits and PRs small**. One logical change each.
6. **Link every PR to an issue and a weekly milestone**.
7. **Schema changes ship with a committed Prisma migration**. Never edit a migration that was applied.
8. **Automate quality**. Lint, format, type-check and test locally (hooks) and in CI.
9. **Document as you build**. README, architecture note, decision records, maintenance guide.
10. **Respect the MVP scope**. Ideas from the exclusion list go to the backlog, not to `main`.

---

## 2. Repository Setup on GitHub

### 2.1 Identity

- **Name**: `akshelf`
- **Description**: AkShelf - a private movie, TV and anime tracker built with Next.js, Prisma and PostgreSQL.
- **Topics**: `nextjs`, `typescript`, `prisma`, `postgresql`, `supabase`, `tailwindcss`, `tmdb`, `anilist`, `movie-tracker`, `anime-tracker`
- **Default branch**: `main`

### 2.2 Branch Protection & Merge Settings

- **Merge button**: Allow _squash merging_ only.
- **Delete head branches**: Automatically delete head branches after PR merge.
- **Require status checks to pass**: CI quality checks must pass before merging.
- **Require linear history**.

---

## 3. Branching Strategy

- **Format**: `type/short-description` (e.g., `feat/day-6-layout-shell`, `fix/rating-range`, `db/init-schema`).
- Always branch from an up-to-date `main`.
- Bring branches up to date using rebase before opening PR.
- Never push directly to `main` or force-push to `main`.

---

## 4. Commit Message Rules (Conventional Commits)

Format:

```text
<type>(<scope>): <short summary>

<optional body: what and why, wrapped at about 72 characters>

<optional footer: Closes #12>
```

- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Scopes**: `auth`, `db`, `prisma`, `search`, `tmdb`, `anilist`, `library`, `watchlist`, `history`, `tracking`, `progress`, `stats`, `ui`, `export`, `deps`, `config`, `ci`, `docs`.
- **Max length**: 72 characters for header. Imperative mood ('add', not 'added').

---

## 5. Pull Request Workflow

1. Create a branch from up-to-date `main`.
2. Commit in small steps using Conventional Commits.
3. Run `npm run lint`, `npm run typecheck`, `npm test` locally.
4. Push and open a PR with `.github/PULL_REQUEST_TEMPLATE.md`.
5. Verify green CI checks.
6. Squash-merge on GitHub.
7. Sync local `main` and delete feature branch.

---

## 6. Architecture & Code Quality Invariants

- **Isolate external APIs**: UI never imports directly from `lib/tmdb` or `lib/anilist`. UI receives normalized `MediaResult` objects.
- **Server Actions security**: Every server action checks the session on the server and validates input with Zod before touching the database.
- **Never trust client-supplied user IDs**: Always derive user ID from authenticated session.
- **Database is single source of truth**: UTC timestamps everywhere. Never report success if write failed.
