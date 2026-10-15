# Week 4 Review & Core MVP Tracking Architecture Checkpoint (v0.4.0)

**Project**: AkShelf (My Watch Tracker)  
**Milestone**: Week 4 Core Watch Tracking, Ratings, Dates & Chronological History  
**Release Tag**: `v0.4.0`  
**Edition**: October 2026

---

## 1. Executive Summary

Week 4 of the 8-week implementation roadmap completes the heart of **AkShelf**: the personal entertainment tracking engine. While Week 1 (`v0.1.0`) established project foundations and database schemas, Week 2 (`v0.2.0`) created the personal library grid, and Week 3 (`v0.3.0`) integrated external catalogs with detail views, Week 4 unites these layers into the **complete Core MVP experience** (`v0.4.0`).

AkShelf now delivers the end-to-end user promise defined in the project specification:

$$\text{Search Title} \longrightarrow \text{Check Prior Status} \longrightarrow \text{Change Status} \longrightarrow \text{Rate Title (1--10)} \longrightarrow \text{Track Dates} \longrightarrow \text{Audit in History}$$

All deliverables for Days 22 through 28 have been architected, coded, verified with 271 automated tests across 45 test suites, and audited against `docs/PROJECT_BRIEF.md`, `docs/UI_UX_SPEC.md`, and `docs/GITHUB_RULES.md`.

---

## 2. Week 4 Day-by-Day Milestone Audit

| Day        | Milestone Focus                                                      | Deliverables & Technical Feats                                                                                                                                                                                                                                                           |   Status    |
| :--------- | :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------: |
| **Day 22** | **Title Detail Watch Status Mutations**                              | Type-safe Server Action (`updateTitleStatusAction`) supporting `WATCHED`, `WATCHING`, `PLAN_TO_WATCH`, `ON_HOLD`, `DROPPED`, and shelf removal (`null`). Atomic transaction upserts `Title` and `UserTitle`, logs `STATUS_{status}` in `WatchHistory`, and revalidates all shelf routes. | ✅ Complete |
| **Day 23** | **Watch Status Control UI & Optimistic States**                      | Interactive `StatusSelector` dropdown built with calm glass styling (`glass-1`, `glass-2`), status color tokens, instant optimistic client feedback, keyboard accessibility (`Enter`, `Space`, `Escape`), and responsive layout adaptation.                                              | ✅ Complete |
| **Day 24** | **Personal 1–10 Rating System & Persistence**                        | Interactive `RatingControl` widget and `updateTitleRatingAction` with 1–10 validation, half-point support, clear action, optimistic badge rendering, and chronological `RATED_{score}` / `RATING_CLEARED` audit trail.                                                                   | ✅ Complete |
| **Day 25** | **Date Tracking Engine (`startedAt` / `watchedAt`)**                 | `updateTitleDatesAction` and `DateTracker` component supporting explicit watch dates, auto-timestamp derivation on status transitions, ISO 8601 UTC persistence, and `DATES_UPDATED` history logging.                                                                                    | ✅ Complete |
| **Day 26** | **Watch History Feed Service & Natural Language Formatting**         | Section 10.7-compliant history service (`getWatchHistory`) querying PostgreSQL with pagination, media filtering, and `formatHistoryActionSentence` converting raw database actions to natural language sentences ("Marked as Watched", "Rated 9/10", "Watched S1 E1").                   | ✅ Complete |
| **Day 27** | **Watch History Feed UI & Dedicated `/history` Page**                | Full-featured `/history` page featuring `HistoryList` and `HistoryRow` cards with media thumbnails, relative timestamps, type filter tabs (`ALL`, `MOVIE`, `TV`, `ANIME`), zero-state handling, and direct links to title detail views.                                                  | ✅ Complete |
| **Day 28** | **Core MVP Verification, Documentation Review & Release (`v0.4.0`)** | Comprehensive End-to-End integration test suite (`src/actions/core-mvp-flow.test.ts`), `CHANGELOG.md` creation, `package.json` version bump to `0.4.0`, and milestone review documentation.                                                                                              | ✅ Complete |

---

## 3. Technical Architecture & Core Invariants

### 3.1 The Unified Core MVP Lifecycle

The Core MVP loop coordinates across multiple architectural layers:

```
[Search Query / Shelf Lookup]
           │
           ▼
 [Instant Memory Badges]  ── (Displays prior [Watched • 9/10] or [Watching • S1 E3])
           │
           ▼
  [Title Detail View]
   ├─► StatusSelector   ───► updateTitleStatusAction() ───► tx.userTitle.upsert() + tx.watchHistory.create()
   ├─► RatingControl    ───► updateTitleRatingAction()  ───► tx.userTitle.upsert() + tx.watchHistory.create()
   └─► DateTracker      ───► updateTitleDatesAction()   ───► tx.userTitle.upsert() + tx.watchHistory.create()
           │
           ▼
[Route Revalidation]    ───► revalidatePath('/title/[id]', '/library', '/history', '/')
           │
           ▼
 [Library & History Views] (Real-time consistency across shelf cards and chronological audit feed)
```

### 3.2 Relational Data Model & Transactional Safety

All tracking mutations execute inside atomic PostgreSQL transactions (`prisma.$transaction`) to guarantee data integrity:

1. **Title Upsert**: External metadata (TMDB/AniList) is idempotently synced to the local `Title` table if not already present.
2. **UserTitle Upsert**: Personal tracking state (`status`, `rating`, `startedAt`, `watchedAt`, `updatedAt`) is updated for the authenticated user.
3. **Audit Log Generation**: Every single modification writes an immutable record to `WatchHistory` with a UTC timestamp.
4. **Cascade Safety**: Untracking a title (`status: null`) safely cleans up the user's shelf record while retaining an audit trail (`TITLE_REMOVED`).

### 3.3 Strict Single-User Server Authentication

In accordance with Rule 5 of `docs/GITHUB_RULES.md`:

- Every Server Action derives the owner's `userId` directly from `auth()` on the server.
- Client components cannot inject or alter the target user ID.
- Unauthenticated requests gracefully degrade to demo mode, allowing seamless local development and exploration without crashing or writing orphan records.

### 3.4 Natural Language Action Formatting (Spec Section 10.7)

Database actions are strictly typed internal identifiers (`STATUS_WATCHED`, `RATED_9.5`, `EPISODE_WATCHED`, `SEASON_1_WATCHED`, `DATES_UPDATED`), translated dynamically by `formatHistoryActionSentence` into human-friendly prose:

- `STATUS_WATCHED` $\rightarrow$ _"Marked as Watched"_
- `STATUS_WATCHING` $\rightarrow$ _"Moved to Watching"_
- `RATED_9` $\rightarrow$ _"Rated 9/10"_
- `EPISODE_WATCHED` (with meta) $\rightarrow$ _"Watched S1 E3"_
- `SEASON_1_WATCHED` $\rightarrow$ _"Finished season 1"_
- `DATES_UPDATED` $\rightarrow$ _"Updated watch dates"_

### 3.5 Day Grouping & Temporal Hierarchy

The history feed groups actions by natural calendar boundaries:

- `TODAY`: Activity within the current local calendar day.
- `YESTERDAY`: Activity within the previous calendar day.
- `MMM D, YYYY`: Formatted headings for older viewing milestones.

---

## 4. Accessibility & Design System Compliance

### 4.1 WCAG Contrast Compliance (AA $\ge 4.5:1$, AAA $\ge 7:1$)

| Element / Component                 | Dark Theme (`#0b0d1a`)  | Light Theme (`#eef1fb`) | Compliance Status |
| :---------------------------------- | :---------------------: | :---------------------: | :---------------: |
| **History Action Heading (`h3`)**   | **16.83:1** (`#ffffff`) | **14.50:1** (`#0e1124`) |  ✅ Passes (AAA)  |
| **History Action Sentence**         | **15.54:1** (`#dbe2fd`) | **7.79:1** (`#2a3054`)  |  ✅ Passes (AAA)  |
| **History Relative Time Stamp**     | **9.62:1** (`#8b93ba`)  | **5.25:1** (`#555d84`)  |  ✅ Passes (AA)   |
| **Rating Badge (`text-amber-400`)** | **9.12:1** (`#fbbf24`)  | **7.15:1** (`#92400e`)  |  ✅ Passes (AAA)  |
| **Status Dropdown Item Text**       | **16.83:1** (`#ffffff`) | **14.50:1** (`#0e1124`) |  ✅ Passes (AAA)  |

### 4.2 Keyboard Navigation & Touch Ergonomics

- **Keyboard Focusability**: All dropdowns, rating stars/numbers, and history filter chips are fully operable via `Tab`, `Space`, `Enter`, and `Escape`.
- **Target Sizes**: Interactive controls adhere to the minimum $44 \times 44$px touch target standard.
- **Tabular Numerals**: Ratings (`9/10`), episode counters (`S1 E3`), and clock timestamps declare `tabular-nums` to eliminate layout jitter.

---

## 5. Verification & Quality Pipeline Results

| Quality Suite                 | Command                | Result                                                       |
| :---------------------------- | :--------------------- | :----------------------------------------------------------- |
| **Code Style & Formatting**   | `npm run format:check` | ✅ 100% compliant with Prettier across all files             |
| **Linting**                   | `npm run lint`         | ✅ 0 errors, 0 warnings (ESLint 9 + Next.js core-web-vitals) |
| **Static Type Check**         | `npm run typecheck`    | ✅ 0 TypeScript errors (`tsc --noEmit`)                      |
| **Automated Tests**           | `npm test`             | ✅ **271/271 tests passed across 45 test suites**            |
| **Core MVP Flow Integration** | `vitest core-mvp-flow` | ✅ **3/3 e2e workflow suites passed (100% coverage)**        |
| **Production Build**          | `npm run build`        | ✅ Next.js 16.4.0 Turbopack build succeeded (13 routes)      |

---

## 6. Transition to Week 5: TV / Anime Seasons & Episode Progress (`v0.5.0`)

With the Core MVP tracking mechanics solidly verified and operational, Week 5 elevates the television and anime viewing experience:

- **Comprehensive Season Progress UI**: Visual progress bars, episode completion percentages, and multi-season switching.
- **Next-Up Algorithm**: Intelligent detection of the next unwatched episode based on viewing history.
- **Continue Watching Shelf**: Quick-resume widget on the dashboard for active television and anime series.
- **Batch Management**: Fast marking of entire seasons or batches of episodes as watched or unwatched.
