# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-10-15

### Added

- **Core MVP End-to-End Verification Test Suite** (`src/actions/core-mvp-flow.test.ts`): Comprehensive automated test covering the full user flow (Search $\rightarrow$ Status Check $\rightarrow$ Status Transition $\rightarrow$ Rate Title $\rightarrow$ Track Dates $\rightarrow$ Verify Presence & Consistency in Library & History Feed).
- **Watch History Feed Service** (`src/lib/history/service.ts`): Production service querying PostgreSQL `WatchHistory` with pagination, demo fallback, and media type filtering (`ALL`, `MOVIE`, `TV`, `ANIME`).
- **History Action Sentence & Day Grouping Engine** (`src/lib/history/format.ts`): Section 10.7-compliant natural language sentence generator (e.g. "Marked as Watched", "Rated 9/10", "Watched S1 E1", "Updated watch dates") and calendar day grouping (`TODAY`, `YESTERDAY`, `MMM D, YYYY`).
- **History UI Components** (`src/components/history/history-list.tsx`, `history-row.tsx`): Responsive glassmorphic timeline cards with media poster thumbnails, action badges, relative time stamps, and media filter tabs.
- **Dedicated History Page** (`src/app/history/page.tsx`): Standalone view for inspecting personal chronological viewing timeline with empty state and direct title links.
- **Date Tracking Mutation Engine & UI** (`src/actions/tracking.ts`, `src/components/title/date-tracker.tsx`): `updateTitleDatesAction` supporting custom `startedAt` and `watchedAt` timestamps with transactional persistence and audit logging.
- **Personal 1–10 Rating System** (`src/components/title/rating-control.tsx`, `src/actions/tracking.ts`): Type-safe `updateTitleRatingAction` with 1–10 rating bounds, half-point support, clear action, and instant optimistic badge updates.
- **Watch Status Controls & Mutation Engine** (`src/components/title/status-selector.tsx`, `src/actions/tracking.ts`): `updateTitleStatusAction` supporting `WATCHED`, `WATCHING`, `PLAN_TO_WATCH`, `ON_HOLD`, `DROPPED`, and shelf removal (`null`), with optimistic UI feedback and automatic date pre-fills.

### Changed

- Bumped application version to `0.4.0` in `package.json`.
- Updated `README.md` milestone status badge and completed Week 4 roadmap deliverables.
- Enhanced route revalidation across tracking server actions (`/title/[id]`, `/library`, `/watchlist`, `/history`, `/`).
- Enforced automatic timestamp derivation so transitioning to `WATCHED` automatically populates `watchedAt` if previously empty.

### Fixed

- Fixed unauthenticated demo mode fallbacks in tracking actions to allow seamless guest exploration without database errors.
- Secured all tracking actions by deriving `userId` strictly from server session (`auth()`), rejecting client-supplied user parameters.

---

## [0.3.0] - 2026-10-12

### Added

- **External Metadata Providers**: TMDB REST client and AniList GraphQL client with token bucket rate-limiting (35 req/10s for TMDB, 80 req/60s for AniList) and retry backoff.
- **Normalized Metadata Translator & Cache Layer**: Two-tier memory cache (`MetadataCache`) normalizing external catalogs into internal `MediaResult` models.
- **Global Multi-Source Search UI**: Debounced (300ms) search input (`SearchView`) with filter chips, keyboard shortcuts (`/`, `Ctrl+K`), and instant shelf memory badges (`[Watched • 9/10]`).
- **Title Detail View**: Dynamic `/title/[id]` page with responsive hero backdrop (`TitleHero`), formatted synopsis, cast preview (`CastPreview`), and metadata overview panel (`MetadataPanel`).
- **Season & Episode Breakdown**: Interactive season selector (`SeasonSelector`), episode checklist (`EpisodeRow`), next-up indicator, and "Continue S{x} E{y}" action.
- **Episode Progress Mutations**: `toggleEpisodeProgressAction` and `batchSeasonProgressAction` with database transactions and audit logging.

### Changed

- Migrated client-side recent searches store to React 19 `useSyncExternalStore` for zero SSR hydration mismatches.

---

## [0.2.0] - 2026-10-11

### Added

- **Personal Library UI**: Responsive media grid (`MediaGrid`) and media card (`MediaCard`) declaring fixed 2:3 aspect ratios, status badges, and hover state transitions.
- **Multi-Dimensional Filters**: Header filter controls for media types (`ALL`, `MOVIE`, `TV`, `ANIME`) and watch statuses (`WATCHING`, `WATCHED`, `PLAN_TO_WATCH`, `ON_HOLD`, `DROPPED`).
- **Deterministic Sorting Engine**: Library sort selector supporting `DATE_ADDED`, `TITLE`, `RATING`, and `RELEASE_YEAR` in ascending and descending directions.
- **Context-Aware Empty States**: Zero-state screens with single-click filter reset actions.
- **Seeded Demo Catalog**: Expanded 28-title database seed fixture for movies, television series, and anime.

---

## [0.1.0] - 2026-10-10

### Added

- **Project Foundation**: Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS.
- **Quality Tooling**: ESLint 9, Prettier, Husky git hooks, Commitlint, and GitHub Actions CI.
- **Database Architecture**: PostgreSQL schema managed via Prisma ORM (`User`, `Title`, `Season`, `Episode`, `UserTitle`, `UserEpisode`, `WatchHistory`).
- **Single-Owner Authentication**: Auth.js credentials provider with bcrypt password hashing and middleware route protection.
- **Glassmorphic Layout Shell**: Calm, obsidian-dark/light theme tokens, responsive navigation bar, and accessible layout containers.
