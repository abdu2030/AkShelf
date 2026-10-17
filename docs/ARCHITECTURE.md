# AkShelf System Architecture & Technical Specification 🏛️

**Application**: AkShelf (Personal Watch Tracker)  
**Edition**: v1.0.0-rc.1 / October 2026  
**License**: MIT

---

## 1. High-Level Architectural Vision

AkShelf is designed from first principles as a **private, single-user personal entertainment notebook**. Unlike social cataloging platforms (Letterboxd, Trakt, MyAnimeList), AkShelf prioritizes:

1. **Instant Memory**: Answering _"Did I watch this?"_ and _"What episode am I on?"_ in $< 1$ second.
2. **Separation of Concerns**: External media metadata (synopses, posters, episode names) is fetched from TMDB and AniList, while personal tracking state (status, float ratings, watch timestamps, episode progress) is stored strictly in a private PostgreSQL database.
3. **Frictionless Capture**: Zero mandatory text reviews; marking a movie watched or logging an episode takes 1 click.
4. **Data Ownership**: One-click offline export (JSON / CSV) ensuring complete user sovereignty over personal watch logs.

```
                           [Client Web Browser]
                                     │
                    HTTPS / TLS 1.3  │  (HSTS, CSP, X-Frame-Options)
                                     ▼
                      [Vercel Serverless / Edge]
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
       [Next.js App Router]                    [Route Handlers / API]
     (RSC, Layouts, Skeletons)               (/api/health, /api/export)
                 │                                       │
                 ├───────────────────┬───────────────────┤
                 ▼                   ▼                   ▼
        [Server Actions]      [Auth.js v5]      [Metadata Services]
      (Tracking, Progress)    (Session JWT)     (TMDB v4, AniList)
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     ▼
                            [Prisma ORM Client]
                                     │
           Transaction Pooler        │  Port 6543 (pgbouncer=true)
                                     ▼
                        [Supabase PostgreSQL DB]
                         (Personal Watch Records)
```

---

## 2. Directory Structure & Modular Decomposition

The project follows the standard Next.js App Router conventions with strong domain boundaries:

```
AkShelf/
├── .github/workflows/          # CI/CD automated test workflows
├── docs/                       # Architectural specs, reviews, and operational manuals
├── e2e/                        # Playwright end-to-end browser & cross-device smoke suites
├── prisma/                     # Database schema definition and versioned migrations
├── public/                     # Static media and favicons
├── scripts/                    # Operational tooling (deploy:check, db:clean, db:export)
└── src/
    ├── actions/                # Server Actions (auth, tracking, episodes, history, export)
    ├── app/                    # Next.js App Router pages, layouts, and route handlers
    │   ├── api/                # Health check, search proxy, and backup export endpoints
    │   ├── history/            # Chronological viewing timeline
    │   ├── library/            # Filterable and sortable personal collection
    │   ├── login/              # Owner authentication form
    │   ├── search/             # Global metadata search with instant library status badges
    │   ├── settings/           # Theme preferences and data safety download controls
    │   └── title/[id]/         # Title detail view with season selector and episode checklist
    ├── components/             # Reusable UI component library (glassmorphism design system)
    │   ├── dashboard/          # Continue Watching shelf, stat tiles, recently watched
    │   ├── history/            # Activity rows and day-grouped timeline
    │   ├── layout/             # App shell, navigation header, aurora backdrop, theme provider
    │   ├── library/            # Media card grid, filter chips, and sorting controls
    │   ├── search/             # Debounced search bar, filter tabs, and result cards
    │   ├── title/              # Title hero, status selector, decimal rating, episode checklist
    │   └── ui/                 # Atomic design tokens (button, chip, dialog, toast, empty-state)
    └── lib/                    # Domain logic and infrastructure clients
        ├── anilist/            # GraphQL queries and client with rate limiting
        ├── auth/               # Auth.js configuration, credentials provider, password hashing
        ├── db/                 # Prisma client instance and health checking utilities
        ├── export/             # JSON backup generator, RFC 4180 CSV serializer, restore engine
        ├── history/            # Watch history feed generator and action sentence formatting
        ├── metadata/           # Provider normalization, TMDB/AniList translators, memory cache
        ├── progress/           # Series episode math and next-up continuation algorithms
        ├── security/           # Sanitization routines and credential redaction
        ├── tmdb/               # TMDB REST client with token bucket rate-limiting
        └── utils/              # Sorting, class merging (cn), formatting, and date helpers
```

---

## 3. Relational Schema & Data Model

The PostgreSQL database is managed via Prisma ORM (`prisma/schema.prisma`):

| Model              | Table Name      | Purpose & Cardinality                                                                                                                                                               |
| :----------------- | :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`User`**         | `users`         | Single owner identity record with email, hashed credentials, and timestamps.                                                                                                        |
| **`Title`**        | `titles`        | Normalized external media metadata (movies, TV, anime) keyed by unique `[externalSource, externalId]`.                                                                              |
| **`Season`**       | `seasons`       | TV and anime season groupings keyed by `[titleId, seasonNumber]`.                                                                                                                   |
| **`Episode`**      | `episodes`      | Granular episode metadata keyed by `[seasonId, episodeNumber]`.                                                                                                                     |
| **`UserTitle`**    | `user_titles`   | Core tracking state: user status (`WATCHED`, `WATCHING`, `PLAN_TO_WATCH`, `ON_HOLD`, `DROPPED`), decimal float rating (`1.0–10.0`), and watch dates. Unique on `[userId, titleId]`. |
| **`UserEpisode`**  | `user_episodes` | Episode-level completion progress and watch timestamps. Unique on `[userId, episodeId]`.                                                                                            |
| **`WatchHistory`** | `watch_history` | Append-only chronological audit trail of all status transitions, ratings, and episode completions.                                                                                  |

---

## 4. State Transitions & Mutation Lifecycle

Every mutation in AkShelf executes through type-safe Next.js Server Actions:

```
[User Action] (e.g. Rate 8.7 or Check Episode)
      │
      ▼
[Optimistic Client Update] ──> Instant UI update with zero perceived latency
      │
      ▼
[Server Action Call] (e.g. updateTitleRatingAction)
      │
      ├─► 1. Verify session token (derive userId strictly from server session)
      ├─► 2. Validate input schema using Zod
      ├─► 3. Execute database mutation (Prisma update + WatchHistory audit entry)
      ├─► 4. Revalidate Next.js cache paths (/library, /title/[id], /history, /)
      ▼
[Success Confirmation] ──> Show 6-second floating Toast with Undo rollback
```

---

## 5. Security & Defensive Invariants

1. **Server-Derived Identity**: The client never passes `userId` in any payload. All mutations extract `userId = session.user.id` on the server.
2. **Defensive Headers**: `Content-Security-Policy` limits script/style/image execution to trusted origins (`image.tmdb.org`, `s4.anilist.co`, `supabase.co`). `Strict-Transport-Security` enforces HTTPS for 2 years.
3. **Secret Redaction**: `sanitizeErrorForClient` suppresses raw database connection strings, passwords, and file paths from ever reaching browser logs.
4. **SQL Injection Immunity**: 100% of database queries execute through Prisma's parameterized engine.
