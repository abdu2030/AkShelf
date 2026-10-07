# AkShelf (My Watch Tracker) - Project Brief & Specification

**Project Goal**: Build a private, personal web application that lets you quickly answer: *"Did I watch this?"* while maintaining a simple, trustworthy history of what you watched, your ratings, your watchlist, and your progress through TV and anime series.

---

## 1. Scope Definition & Guiding Principles

### 1.1 Single-User Tool
This document intentionally specifies AkShelf as a **single-user personal tool**. 
* One private account for the owner.
* **No public user registration** or social networking in Version 1.
* No public profiles, followers, likes, comments, activity feeds, or community rating moderation.

### 1.2 Core Product Vision
$$\text{Search Title} \longrightarrow \text{Open Title} \longrightarrow \text{Mark Watched / Track Progress} \longrightarrow \text{Rate} \longrightarrow \text{Done}$$

The app feels like a personal entertainment notebook with the ease of a modern catalog site. Its value comes from remembering viewing history reliably without social network overhead.

### 1.3 Guiding Principles
* **Fast Capture**: Marking a title watched should take 1 to 2 clicks after finding it.
* **Personal First**: Database stores your status, rating, notes, and history strictly separated from external metadata.
* **Minimum Viable Complexity**: Every feature must justify its maintenance cost.
* **Progress Over Perfection**: Ship a clean, usable private version before adding advanced features.
* **Data Ownership**: Personal watch history is easily exportable (JSON / CSV) for local backups.
* **Graceful Degradation**: The local library remains fully accessible even if third-party metadata APIs (TMDB/AniList) are temporarily unreachable.

---

## 2. The Six Core User Actions

### 1. Search
* **Behavior**: Global debounced search bar querying external catalogs (TMDB for Movies & TV, AniList for Anime) and checking the local database cache.
* **Instant Memory Badge ("Did I watch this?")**:
  * If a search result already exists in the user's library, the search result card **immediately** displays its status and rating without having to open the title page.
  * Examples: `[Watched • 9/10]`, `[Watching • S2 E4]`, `[Plan to Watch]`.
* **Security**: API keys are kept strictly on the server; clients never call external APIs directly with secrets.

### 2. Open
* **Behavior**: Displays rich title details:
  * Poster and backdrop imagery
  * Title, release year, runtime, genres, and synopsis
  * Media classification (`MOVIE`, `TV`, `ANIME`)
  * For TV/Anime: season selector and episode list breakdown
* **Efficiency**: Detailed season/episode metadata is fetched on demand when opened rather than bulk-fetching upfront.

### 3. Track
* **Recommended Status Set**:
  * `Watched`: Completed the title or selected season/episode.
  * `Watching`: Currently in progress; fast resume from the next episode.
  * `Plan to Watch`: Backlog to watch later.
  * `On Hold`: Started but intentionally paused.
  * `Dropped`: Started and decided not to finish (kept for personal record).
* **Clicking "Watched"**:
  1. For Movies: creates or updates tracking record to `Watched`.
  2. For TV/Anime: allows "Mark series watched" or episode-level progress.
  3. Records action date (`watched_at`) in `WatchHistory`.

### 4. Rate
* **Scale**: Personal rating scale from `1` to `10` (with optional `0.5` increments).
* **Frictionless**: Rating is optional; never forces a written review or note when marking something watched.
* **Persistence**: Persisted to the database in UTC timestamps alongside historical activity.

### 5. Watchlist
* **Dedicated View**: A clean, distraction-free queue showing all `Plan to Watch` titles.
* **Quick Transition**: One click moves a title from `Plan to Watch` to `Watching` or `Watched`.
* **Filtering**: Filterable by type (Movies, TV Shows, Anime).

### 6. Progress
* **Granular Tracking**: For episodic TV and Anime series, remembers the exact last-watched episode.
* **Progress Metrics**: Automatically calculates percentage completed:
  $$\text{Progress} = \frac{\text{Watched Episodes}}{\text{Total Episodes}} \times 100\%$$
* **Continue Watching**: Provides an instant "Continue from next episode" button directly on the dashboard and title details page.

---

## 3. Acceptance Criteria

### Baseline System Acceptance Criteria
- [ ] **A1 (Auth & Privacy)**: All personal data and mutations are protected behind single-user authentication; unauthorized requests are rejected server-side.
- [ ] **A2 (Catalog Search & Badges)**: Searching returns normalized titles; titles existing in the database display an instant library status badge on the card.
- [ ] **A3 (Tracking & State Consistency)**: User can set status (`Watched`, `Watching`, `Plan to Watch`, `On Hold`, `Dropped`), and state persists across reloads.
- [ ] **A4 (Ratings)**: 1–10 rating widget validates bounds (1–10) and persists correctly.
- [ ] **A5 (Episode Tracking)**: Marking an episode watched updates the series progress and highlights the next episode.
- [ ] **A6 (Library & Filtering)**: Library page displays tracked items with filters (`All`, `Movies`, `TV`, `Anime`, `Watching`, `Watched`, `Plan to Watch`) and sorting.
- [ ] **A7 (Watch History)**: Audit timeline logs status changes and episode completions chronologically.
- [ ] **A8 (Data Backup)**: Full export of personal tracking records to JSON or CSV format.

---

## 4. Features Excluded from Version 1 (MVP Guardrails)

The following items are deliberately omitted to preserve velocity and simplicity:
* Public user registration and multi-user administration
* Followers, likes, comments, and public activity feeds
* Public user profiles and public reviews
* Complex AI/ML recommendation engines or embeddings
* Community ratings and moderation tooling
* In-app chat, real-time messaging, or push notification campaigns
* Native mobile applications (PWA considered post-MVP)
* Elasticsearch / OpenSearch infrastructure
* Microservices, message queues, or Kubernetes clusters
* Streaming links or synchronized watch-party functionality

---

## 5. Technology Stack Summary

* **Frontend & Server Logic**: Next.js (App Router, Server Actions, Route Handlers) + React + TypeScript
* **Styling**: Tailwind CSS + shadcn/ui
* **Database & ORM**: PostgreSQL (Supabase) + Prisma ORM
* **Authentication**: Auth.js (NextAuth)
* **Validation**: Zod
* **Metadata Sources**: TMDB API (Movies & TV) + AniList API (Anime GraphQL)
* **Testing**: Vitest + Playwright
* **Deployment**: GitHub + Vercel
