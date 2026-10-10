# AkShelf 🎬📺✨

> **Personal Movie, TV Show & Anime Tracker**  
> A private, distraction-free personal entertainment notebook built to answer one question with zero friction: _"Did I watch this?"_

[![CI](https://github.com/abdu2030/AkShelf/actions/workflows/ci.yml/badge.svg)](https://github.com/abdu2030/AkShelf/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Week%201-Complete%20v0.1.0-success)](#roadmap-status)

---

## 🎯 The Problem & Product Vision

Over time, you watch hundreds of movies, TV shows, and anime series, but later forget whether you've already seen something, when you watched it, what you thought of it, or what episode you left off on.

AkShelf is designed as a **personal entertainment notebook** with the speed of a modern catalog site:

$$\text{Search Title} \longrightarrow \text{Open Title} \longrightarrow \text{Mark Watched / Track Progress} \longrightarrow \text{Rate} \longrightarrow \text{Done}$$

### Key Highlights

- **Instant Memory ("Did I watch this?")**: When searching, any title already in your library immediately displays a badge (e.g., `Watched - 9/10` or `Watching - S2 E4`) without needing to open the title page.
- **Fast Capture**: Track watch status and rate in 1–2 clicks.
- **Separation of Concerns**: Entertainment metadata is fetched from TMDB and AniList, while your personal ratings and history live securely in your private PostgreSQL database.
- **Single-User Ownership**: No social network overhead, no public profiles, no feeds.

---

## ✨ Features (MVP) & Scope Guardrails

### Included in V1 (MVP)

- **Single-User Authentication**: Private login for the owner via Auth.js.
- **Unified Search**: Search movies/TV shows via TMDB and anime via AniList.
- **Title Details**: Posters, backdrops, release metadata, overviews, and season/episode breakdowns.
- **Watch Statuses**: `Watched`, `Watching`, `Plan to Watch`, `On Hold`, `Dropped`.
- **Personal Ratings**: Clean 1–10 rating scale.
- **Episode Progress**: Granular episode checklist and "Continue Watching" tracking for TV and anime.
- **Personal Library & Watchlist**: Filterable library by media type and watch status.
- **Chronological History & Basic Stats**: Audit trail of tracked actions.
- **Data Backup**: Export full personal data to JSON / CSV.

### Intentionally Excluded from V1

- ❌ Public user registration and multi-user administration
- ❌ Followers, likes, comments, and public activity feeds
- ❌ AI/ML recommendation engines and Elasticsearch
- ❌ Community ratings and rating moderation
- ❌ In-app chat, notifications, and native mobile apps

---

## 🛠️ Technology Stack

| Layer                 | Technology                                | Reason                                                                            |
| :-------------------- | :---------------------------------------- | :-------------------------------------------------------------------------------- |
| **Frontend**          | Next.js (App Router) + React + TypeScript | Unified application for pages, server rendering, client UI, and server logic.     |
| **Styling**           | Tailwind CSS                              | Fast, utility-first styling without maintaining massive stylesheets.              |
| **Components**        | shadcn/ui                                 | Accessible, customizable UI building blocks.                                      |
| **Application Logic** | Next.js Server Actions + Route Handlers   | Keep the MVP in one cohesive codebase instead of splitting backend too early.     |
| **Database**          | PostgreSQL (Supabase)                     | Relational data model for users, titles, seasons, episodes, ratings, and history. |
| **ORM**               | Prisma                                    | Type-safe queries, schema management, and migrations.                             |
| **Authentication**    | Auth.js (NextAuth)                        | Simple, secure private login for the owner.                                       |
| **Validation**        | Zod                                       | Schema validation for server actions and inputs before database mutations.        |
| **Movie/TV Data**     | TMDB API                                  | External catalog data for movies, TV series, cast, and posters.                   |
| **Anime Data**        | AniList API (GraphQL)                     | Anime-specific airing info, studios, and episode metadata.                        |
| **Testing**           | Vitest + Playwright                       | Unit/integration testing and end-to-end browser workflows.                        |
| **Deployment**        | Vercel                                    | Seamless edge deployment and preview environments.                                |

---

## 🏛️ Architecture Overview

AkShelf enforces a strict separation between external entertainment metadata and internal personal data:

- **External APIs (TMDB, AniList)**: Source of truth for titles, posters, descriptions, and episode counts.
- **PostgreSQL Database**: Source of truth for personal actions (status, ratings, episode progress, history).
- **Provider Layer**: UI components never call TMDB or AniList directly; all external responses are normalized into a unified `MediaResult` internal type.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20+ (v24 LTS recommended, pinned via `.nvmrc`)
- **npm**: v10+
- **Git**

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/abdu2030/AkShelf.git
   cd AkShelf
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your values (see table below).

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

| Variable              | Description                                               | Where to get it                                                               |
| :-------------------- | :-------------------------------------------------------- | :---------------------------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string (pooled)                     | Supabase Project Settings &gt; Database                                       |
| `DIRECT_URL`          | PostgreSQL direct connection string for Prisma migrations | Supabase Project Settings &gt; Database                                       |
| `AUTH_SECRET`         | Secret key for session encryption in Auth.js              | Generate via `npx auth secret`                                                |
| `OWNER_EMAIL`         | Single-owner login email address                          | Set your private login email                                                  |
| `OWNER_PASSWORD_HASH` | Bcrypt hash of owner password                             | Generate via `node -e "console.log(require('bcryptjs').hashSync('pwd', 10))"` |
| `TMDB_API_KEY`        | TMDB API Read Access Token or API Key                     | [The Movie Database API](https://www.themoviedb.org/settings/api)             |

> ⚠️ **Never commit `.env.local` or real API keys to version control.** Commit only `.env.example`.

---

## 📜 Available npm Scripts

| Script                 | Command              | Purpose                                     |
| :--------------------- | :------------------- | :------------------------------------------ |
| `npm run dev`          | `next dev`           | Starts local Next.js development server     |
| `npm run build`        | `next build`         | Compiles optimized production build         |
| `npm run start`        | `next start`         | Runs the production build locally           |
| `npm run lint`         | `eslint .`           | Runs ESLint across the codebase             |
| `npm run typecheck`    | `tsc --noEmit`       | Validates TypeScript types                  |
| `npm run format`       | `prettier --write .` | Formats codebase using Prettier             |
| `npm run format:check` | `prettier --check .` | Verifies codebase formatting in CI          |
| `npm test`             | `vitest run`         | Runs unit tests                             |
| `npm run test:e2e`     | `playwright test`    | Runs Playwright browser tests (from Week 7) |
| `npm run db:migrate`   | `prisma migrate dev` | Runs Prisma development migrations          |
| `npm run db:seed`      | `prisma db seed`     | Seeds the database with demo fixtures       |

---

## 📋 8-Week Implementation Roadmap

- [x] **Week 1: Foundation, Planning & Project Setup**
  - [x] **Day 1**: Define scope, acceptance criteria, 6 core user actions, git repo setup.
  - [x] **Day 2**: Next.js + TypeScript + Tailwind stack installation, linting, Prettier, Husky, commitlint & CI.
  - [x] **Day 3**: Supabase/PostgreSQL connection & Prisma setup.
  - [x] **Day 4**: Relational schema design (`User`, `Title`, `Season`, `Episode`, `UserTitle`, `UserEpisode`, `WatchHistory`).
  - [x] **Day 5**: Single-owner Auth.js integration & route protection.
  - [x] **Day 6**: Base layout shell (navigation, responsive containers, core UI components).
  - [x] **Day 7**: Week 1 review, checkpoint release `v0.1.0` ([Review Document](docs/WEEK_1_REVIEW.md)).
- [ ] **Week 2: UI Foundation & Personal Library (`v0.2.0`)**
- [ ] **Week 3: TMDB / AniList Integration & Search (`v0.3.0`)**
- [ ] **Week 4: Watch Tracking, Ratings & History (`v0.4.0`)**
- [ ] **Week 5: TV / Anime Seasons & Episode Progress (`v0.5.0`)**
- [ ] **Week 6: Dashboard, Statistics & UX Polish (`v0.6.0`)**
- [ ] **Week 7: Testing, Security, Performance & Data Safety (`v1.0.0-rc.1`)**
- [ ] **Week 8: Deployment, Documentation & v1.0 Launch (`v1.0.0`)**

---

## 📚 Third-Party Attributions

- This product uses the TMDB API but is not endorsed or certified by TMDB.
- Anime data provided by the AniList GraphQL API.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
