# Week 3 Review & Detail Views Architecture Checkpoint (v0.3.0)

**Project**: AkShelf (My Watch Tracker)  
**Milestone**: Week 3 External Metadata, Search UI, Detail Views & Episode Tracking  
**Release Tag**: `v0.3.0`  
**Edition**: October 2026

---

## 1. Executive Summary

Week 3 of the 8-week implementation roadmap delivers the external catalog integration and rich media inspection engine for **AkShelf**. Building upon the personal library architecture established in Week 2 (`v0.2.0`), Week 3 bridges third-party entertainment databases with local user tracking state, creating the complete **Search, Detail, and Episode Progress experience** (`v0.3.0`).

All deliverables for Days 15 through 21 have been architected, coded, verified with 213 automated tests across 36 test suites, and audited against `docs/UI_UX_SPEC.md` and `docs/GITHUB_RULES.md`.

---

## 2. Week 3 Day-by-Day Milestone Audit

| Day        | Milestone Focus                                                      | Deliverables & Technical Feats                                                                                                                                                                                                                                                                                     |   Status    |
| :--------- | :------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------: |
| **Day 15** | **External Metadata Providers Setup**                                | Production-ready TMDB API client (`TmdbClient`) and AniList GraphQL client (`AniListClient`) featuring token bucket rate-limiting (35 req/10s for TMDB, 80 req/60s for AniList), automated retry with exponential backoff & random jitter, timeout guards, and strict environment variable fallbacks.              | ✅ Complete |
| **Day 16** | **Normalized Metadata Translator & Cache Layer**                     | Provider-agnostic metadata normalization engine translating raw TMDB/AniList schemas into standard internal `MediaResult` models. Two-tier in-memory cache layer (`MetadataCache`) with configurable TTL (24h default), LRU eviction, and resilient offline fallbacks.                                             | ✅ Complete |
| **Day 17** | **Global Search UI & Keyboard Navigation**                           | Debounced (300ms) multi-source search interface (`SearchView`) with media filter chips (`All`, `Movies`, `TV`, `Anime`), keyboard navigation (`ArrowDown`, `ArrowUp`, `Enter`, `/`, `Ctrl+K`), instant library status memory badges, and reactive recent searches store.                                           | ✅ Complete |
| **Day 18** | **Title Detail Synopsis, Cast Preview & Metadata Overview**          | Dynamic title detail page (`/title/[id]`) with responsive hero backdrop (`TitleHero`), formatted synopsis, horizontal scrolling cast avatar preview with character role attribution (`CastPreview`), and glass metadata overview panel (`MetadataPanel`).                                                          | ✅ Complete |
| **Day 19** | **Season Selector & Episode Breakdown List**                         | Interactive TV & Anime season navigator (`SeasonEpisodesSection`) featuring horizontal pill selector (`SeasonSelector`), 6px brand-gradient progress bar (`ProgressBar`), prominent "Continue S{x} E{y}" action, next-up episode indicator, and accessible 28px circle checkbox episode rows (`EpisodeRow`).       | ✅ Complete |
| **Day 20** | **Episode Progress Tracking Mutations**                              | Type-safe Server Actions (`toggleEpisodeProgressAction` and `batchSeasonProgressAction`) protected behind single-owner session authentication. Automatic title/season/episode database upsert, `UserEpisode` mutations, `UserTitle` state updates, `WatchHistory` audit logging, and optimistic client UI updates. | ✅ Complete |
| **Day 21** | **Week 3 Review, Integration Tests & Checkpoint Release (`v0.3.0`)** | Rate limiter timer leak resolution, client store stabilization via `useSyncExternalStore` for zero hydration mismatches, 213 passing Vitest tests, version bump to `0.3.0`, and checkpoint release documentation.                                                                                                  | ✅ Complete |

---

## 3. Technical Architecture & Core Invariants

### 3.1 Strict External Provider Isolation & Normalization

As mandated by Rule 6 of `docs/GITHUB_RULES.md`:

- Frontend components never import raw TMDB or AniList libraries directly.
- All catalog queries flow through `src/lib/metadata/service.ts`, returning strictly normalized `MediaResult` models.
- If an external provider experiences transient network errors, AkShelf catches the error gracefully, queries the local shelf/demo cache, and ensures the UI remains fully responsive.

### 3.2 Resilient Multi-Source Integration with Token Bucket Rate Limiting

- **TMDB Integration**: Supports both Bearer read tokens and API keys, strictly managing requests under TMDB's threshold (35 requests per 10-second window).
- **AniList Integration**: Executes targeted GraphQL queries without over-fetching, capped at 80 requests per 60-second window.
- **Timer Management**: Rate limiter schedules operations through a tracked timeout guard that clears immediately upon resolution in a `finally` block, preventing orphan Node.js event-loop timers.

### 3.3 Zero-Blur Detail Presentation (Spec Section 10 & 18.2)

- Backdrop posters softly bleed into the obsidian canvas with radial fade gradients.
- Heavy backdrop blurs are restricted to maximum 3 glass surfaces simultaneously (`glass-1`, `glass-2`), preventing GPU throttling on mobile and low-power hardware.
- Text, ratings, status badges, and episode checkboxes remain 100% opaque on top of glass containers.

### 3.4 Episode Progress Mutation Engine & Audit Logging

- **Server-Side Security**: mutations derive `userId` from authenticated session (`auth()`) on the server. Client-supplied user IDs are rejected.
- **Relational Integrity**: Titles, seasons, and episodes are upserted atomically in PostgreSQL transactions (`prisma.$transaction`).
- **State Progression**: Marking an episode as watched automatically transitions a title's watch status from `PLAN_TO_WATCH` to `WATCHING`.
- **Chronological Audit Trail**: Every episode toggle and batch season completion logs a UTC timestamped entry into `WatchHistory`.

### 3.5 Deterministic SSR Hydration via `useSyncExternalStore`

- In accordance with React 19 standards, client-persisted storage (e.g. `recentSearches`) is synchronized through `useSyncExternalStore`.
- The server snapshot always yields `[]`, guaranteeing a 1:1 match with the initial client hydration before seamlessly transitioning to local storage state with zero cascading re-renders.

---

## 4. Accessibility & Design System Compliance

### 4.1 WCAG Contrast Ratios (WCAG AA Requirement $\ge 4.5:1$, AAA $\ge 7:1$)

| Element / Token                  | Dark Theme (`#0b0d1a`)  | Light Theme (`#eef1fb`) | Compliance Status  |
| :------------------------------- | :---------------------: | :---------------------: | :----------------: |
| **Title Detail Heading (`h1`)**  | **16.83:1** (`#ffffff`) | **14.50:1** (`#0e1124`) |  ✅ Passes (AAA)   |
| **Synopsis & Overview Text**     | **15.54:1** (`#dbe2fd`) | **7.79:1** (`#2a3054`)  |  ✅ Passes (AAA)   |
| **Metadata Value Labels**        | **15.54:1** (`#dbe2fd`) | **7.79:1** (`#2a3054`)  |  ✅ Passes (AAA)   |
| **Status Badges & Accent Dots**  |       $\ge 8.2:1$       |       $\ge 6.8:1$       | ✅ Passes (AA/AAA) |
| **Episode Row Checkbox & Title** | **16.83:1** (`#ffffff`) | **14.50:1** (`#0e1124`) |  ✅ Passes (AAA)   |

### 4.2 Keyboard Navigation & Touch Targets

- **Keyboard Navigation**: Global `/` and `Ctrl+K` shortcuts activate search; episode rows support native `Space` and `Enter` key toggling.
- **Touch Targets**: Episode row checkboxes provide an expanded $44 \times 44$px touch hit area around the 28px visible circle.
- **Tabular Numerals**: Runtime durations, season numbers, and episode counters declare `tabular-nums` to eliminate layout jitter.

---

## 5. Verification & Quality Pipeline Results

| Quality Suite                | Command                | Result                                                       |
| :--------------------------- | :--------------------- | :----------------------------------------------------------- |
| **Code Style & Formatting**  | `npm run format:check` | ✅ 100% compliant with Prettier across all files             |
| **Linting**                  | `npm run lint`         | ✅ 0 errors, 0 warnings (ESLint 9 + Next.js core-web-vitals) |
| **Static Type Check**        | `npm run typecheck`    | ✅ 0 TypeScript errors (`tsc --noEmit`)                      |
| **Unit & Integration Tests** | `npm test`             | ✅ **213/213 tests passed across 36 test suites**            |
| **Production Build**         | `npm run build`        | ✅ Next.js 16.4.0 Turbopack build succeeded (12 routes)      |

---

## 6. Transition to Week 4: Watch Tracking, Ratings & History (`v0.4.0`)

With external metadata integration, search, title detail presentation, and episode-level tracking complete in `v0.3.0`, AkShelf advances to **Week 4: Watch Tracking, Ratings & History (`v0.4.0`)**:

- **Day 22**: Title detail status change actions (`Watched`, `Watching`, `Plan to Watch`, `On Hold`, `Dropped`).
- **Day 23**: Rating component (1–10 personal rating scale with 0.5 increments and optional date logging).
- **Day 24**: Chronological Watch History timeline view (`/history`).
- **Day 25**: Dedicated Watchlist view (`/watchlist`) with fast-track transitions.
- **Day 26**: History audit logging enhancements & title progress recalculation.
- **Day 27**: Personal data export engine (complete JSON & CSV local backups).
- **Day 28**: Week 4 review, audit, and checkpoint release `v0.4.0`.
