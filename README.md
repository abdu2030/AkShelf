# AkShelf 🎬📺✨

> **Your Personal Entertainment Notebook**  
> A private, distraction-free tracker for Movies, TV Shows, and Anime built to answer one question with zero friction: _"Did I watch this?"_

[![CI](https://github.com/abdu2030/AkShelf/actions/workflows/ci.yml/badge.svg)](https://github.com/abdu2030/AkShelf/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/Version-v1.0.0-emerald.svg)](https://github.com/abdu2030/AkShelf/releases)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 🌟 Overview

Most tracking services are bloated with social feeds, follower counts, community arguments, and fragmented accounts—one app for movies (Letterboxd), another for TV shows (Trakt), and another for anime (MyAnimeList).

**AkShelf** brings everything into one unified, private personal dashboard:

- **Search any title** across global film, television, and anime databases in real time.
- **Answer instantly**: When searching, existing library titles show immediate status badges (`Watched • 9.5/10` or `Watching • S2 E4`) before you even click.
- **Total privacy & ownership**: Your data lives in your own database. No public profiles, no feeds, and no social algorithms.
- **Lightning speed**: Track an episode, mark a season as watched, or rate a movie in a single click.

```
Unified Search ───► Instant Status Badge ───► Track / Episode Checklist ───► Done!
```

---

## ✨ Features

### 🔍 Unified Multi-Source Search

- Search across millions of **Movies & TV Series** via **The Movie Database (TMDB)** and **Anime** via the **AniList GraphQL API** from a single search bar.
- Automatic debouncing and token-bucket rate limiting for fluid, responsive search.
- Disambiguation logic that seamlessly distinguishes between TV shows and movies sharing identical external IDs.

### 🏷️ Instant Status Badges

- Search results immediately display your personal library status:
  - 🟢 **Watched** with your score (e.g. `9.5/10`)
  - 🟣 **Watching** with current episode position (e.g. `S2 E4`)
  - 🟡 **Plan to Watch**
  - ⚪ **On Hold** / 🔴 **Dropped**

### 📺 Granular TV & Anime Episode Tracking

- Full season switcher tabs (`S1`, `S2`, `S3`...) with watched counts per season.
- Interactive episode checklists with air dates, runtimes, and episode titles.
- **"Continue Next Up"** button: Automatically calculates and jumps directly to your next unwatched episode across seasons.
- **Batch Season Actions**: Mark an entire season as watched (or reset) with one click, backed by a 6-second undo toast.
- **Episode Progress Retention**: Watched episodes persist accurately in your database and never reset on navigation.

### 🎬 Dedicated Feature Film Tracking

- Movies feature a streamlined one-click **"Mark as Watched"** button and quick date pickers (`startedAt`, `watchedAt`).

### ⭐ Personal 1–10 Rating Scale

- Expressive decimal rating system (e.g. `8.5`, `9.0`, `10`) saved securely to your personal record.

### 📊 Dashboard & Analytics

- **Live Stats**: Instant counts of titles on your shelf (`Total Tracked`, `Watching`, `Watched`, `Plan to Watch`).
- **Continue Watching Shelf**: Quick-resume cards for in-progress series with episode progress bars.
- **Recently Watched**: Chronological feed of your latest completed films and series.
- **Viewing Analytics**: Breakdown by media type, average personal rating, and total episodes watched.

### 📜 Chronological Watch History

- Dedicated `/history` page logging every action: title additions, status changes, ratings, and episode completions with timestamps.

### 💾 100% Data Ownership & Export

- One-click export of your complete library and history to both **JSON** and **CSV** formats directly from Settings.
- Zero vendor lock-in.

### 🎨 Dark Aesthetic & Responsive Design

- Modern obsidian glassmorphism UI with smooth animations.
- Fully responsive across desktop, tablet, and mobile devices (iPhone 14, Pixel 7, iPad, desktop monitors).

---

## 🛠️ Tech Stack

| Layer              | Technology                                                                    | Details                                                  |
| :----------------- | :---------------------------------------------------------------------------- | :------------------------------------------------------- |
| **Framework**      | [Next.js 16](https://nextjs.org/) (App Router + Turbopack)                    | Server Components, Server Actions, Route Handlers        |
| **Language**       | [TypeScript 5](https://www.typescriptlang.org/)                               | Strict type-safety across models, APIs, and UI           |
| **Styling**        | [Tailwind CSS 3.4](https://tailwindcss.com/)                                  | Custom dark glassmorphic design system                   |
| **Database**       | [PostgreSQL](https://www.postgresql.org/) / [Supabase](https://supabase.com/) | Relational database with connection pooling              |
| **ORM**            | [Prisma 6](https://www.prisma.io/)                                            | Type-safe database queries and automated migrations      |
| **Authentication** | [Auth.js (NextAuth v5)](https://authjs.dev/)                                  | Secure single-owner session authentication               |
| **Validation**     | [Zod 3](https://zod.dev/)                                                     | Strict runtime input validation for all actions          |
| **Metadata APIs**  | [TMDB API](https://www.themoviedb.org/) + [AniList API](https://anilist.co/)  | Movie, TV, and Anime external metadata                   |
| **Icons**          | [Lucide React](https://lucide.dev/)                                           | Clean, accessible SVG icons                              |
| **Testing**        | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)         | 590+ unit/integration tests and end-to-end browser tests |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites

- **Node.js**: v20 or higher (v24 LTS recommended)
- **npm** or **pnpm**
- A **PostgreSQL** database (local or cloud like [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Railway](https://railway.com))
- A free **TMDB API Key** (from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api))

### 2. Clone the Repository

```bash
git clone https://github.com/abdu2030/AkShelf.git
cd AkShelf
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Copy the template file to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your configuration values in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/database"

# Authentication
AUTH_SECRET="your-generated-random-32-byte-hex-secret"
OWNER_EMAIL="owner@example.com"
OWNER_PASSWORD_HASH="$2b$10$YourBcryptPasswordHashHere"

# Metadata Providers
TMDB_API_KEY="your-tmdb-api-key-here"
```

> 💡 **Generating Credentials**:
>
> - **`AUTH_SECRET`**: Run `npx auth secret` or `openssl rand -hex 32` in your terminal.
> - **`OWNER_PASSWORD_HASH`**: Run this command to hash your chosen password:
>   ```bash
>   node -e "console.log(require('bcryptjs').hashSync('your-password-here', 10))"
>   ```

### 5. Setup the Database

Push the Prisma schema to your database:

```bash
npx prisma db push
```

_(Optional)_ Provision your initial owner account:

```bash
npm run db:provision
```

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Log in with your configured `OWNER_EMAIL` and password.

---

## 🚢 Deployment

### Deploying to Railway (Recommended)

1. Fork or clone this repository to your GitHub account.
2. Log into [Railway](https://railway.com/) and click **New Project** > **Deploy from GitHub repo**.
3. Add a **PostgreSQL** database service to your project on Railway (or connect your Supabase database).
4. In your web service settings, add your Environment Variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET`
   - `OWNER_EMAIL`
   - `OWNER_PASSWORD_HASH`
   - `TMDB_API_KEY`
5. Railway will build and deploy the Next.js application automatically.
6. Generate a public domain under **Networking** > **Generate Domain**.

### Deploying to Vercel

1. Push your code to GitHub.
2. Import the project into [Vercel](https://vercel.com/).
3. Add your environment variables in the Vercel dashboard under **Project Settings > Environment Variables**.
4. Set the build command to `prisma generate && next build`.
5. Deploy!

---

## 🔑 Environment Variables Reference

| Variable                     | Required | Description                                                    | How to obtain                                                                  |
| :--------------------------- | :------: | :------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| `DATABASE_URL`               | **Yes**  | PostgreSQL connection URL (pooler / transaction connection)    | Supabase, Railway, Neon, or local PostgreSQL                                   |
| `DIRECT_URL`                 | **Yes**  | Direct PostgreSQL connection URL (session mode for migrations) | Database provider settings                                                     |
| `AUTH_SECRET`                | **Yes**  | Secret used to encrypt Auth.js session cookies                 | Run `npx auth secret`                                                          |
| `OWNER_EMAIL`                | **Yes**  | Email address allowed to sign into your personal shelf         | Choose your personal email                                                     |
| `OWNER_PASSWORD_HASH`        | **Yes**  | Bcrypt hash of your login password                             | `node -e "console.log(require('bcryptjs').hashSync('pwd', 10))"`               |
| `TMDB_API_KEY`               | **Yes**  | The Movie Database API Key or Read Access Token                | Free at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |
| `TMDB_API_READ_ACCESS_TOKEN` | Optional | TMDB v4 Bearer access token                                    | Alternative to `TMDB_API_KEY`                                                  |

> 🔒 **Security Notice**: Never commit `.env` or `.env.local` to public repositories. Always keep your credentials in your deployment provider's secret manager.

---

## 💻 Available npm Scripts

```bash
# Development & Build
npm run dev           # Start Next.js development server
npm run build         # Build production bundle with TypeScript checking
npm start             # Start production server locally

# Code Quality & Testing
npm run typecheck     # Typecheck entire codebase with TypeScript (tsc --noEmit)
npm run lint          # Run ESLint across all components and actions
npm run format        # Format codebase with Prettier
npm test              # Run 590+ unit and integration tests via Vitest
npm run test:e2e      # Run browser end-to-end test suite via Playwright
npm run test:smoke    # Run responsive viewport smoke tests

# Database & Utilities
npm run db:migrate    # Run Prisma schema development migrations
npm run db:push       # Synchronize schema directly to database
npm run db:provision  # Verify and provision clean owner account
npm run db:export     # Dump personal library data to JSON and CSV offline backups
```

---

## 📁 Project Structure

```
AkShelf/
├── src/
│   ├── actions/          # Next.js Server Actions (tracking, ratings, seasons, dates)
│   ├── app/              # Next.js App Router pages and API routes
│   │   ├── (auth)/login  # Private authentication login page
│   │   ├── api/          # Internal REST APIs (search, export, health)
│   │   ├── history/      # Chronological audit trail page
│   │   ├── library/      # Filterable personal media shelf
│   │   ├── search/       # Global search interface with instant badges
│   │   ├── settings/     # Owner preferences, backup, and data export
│   │   ├── title/[id]/   # Deep title view (synopsis, cast, season/episode list)
│   │   └── watchlist/    # Dedicated Plan to Watch queue
│   ├── components/       # Modular UI components
│   │   ├── dashboard/    # Shelves, stats tiles, continue watching cards
│   │   ├── layout/       # App shell, navigation bar, footer
│   │   ├── library/      # Filter bars, sorting dropdowns, view controls
│   │   ├── search/       # Search inputs, result rows, filter chips
│   │   ├── title/        # Title hero, season selector, episode rows, ratings
│   │   └── ui/           # Core design system primitives (buttons, badges, dialogs)
│   └── lib/              # Core business logic and service modules
│       ├── auth/         # NextAuth configuration and password verification
│       ├── dashboard/    # Metrics and shelf aggregation services
│       ├── db/           # Prisma client instance and retry wrappers
│       ├── history/      # Audit log formatter and query services
│       ├── library/      # Library query filters and sorting engine
│       ├── metadata/     # TMDB & AniList clients, translators, and rate limiters
│       ├── progress/     # Episode progress calculations and series math
│       └── validation/   # Zod schemas for all mutations and forms
├── prisma/
│   ├── schema.prisma     # Relational database schema
│   └── migrations/       # Migration history
├── docs/                 # Architectural specifications and operator manuals
└── public/               # Static assets, logos, and icons
```

---

## 📖 In-Depth Documentation

For advanced operational guides and deep architectural documentation, check the [`docs/`](docs/) directory:

- 📐 **[System Architecture Guide](docs/ARCHITECTURE.md)**: Network topology, serverless connection pooling, data model, and mutation lifecycles.
- 📘 **[User Manual & Operator Guide](docs/USER_MANUAL.md)**: Complete guide to searching, tracking, decimal ratings, episode checklists, and library filters.
- 🚀 **[Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)**: Step-by-step Supabase connection pooling and hosting setup.
- 🔒 **[Domain & SSL/TLS Guide](docs/DOMAIN_SSL_GUIDE.md)**: DNS setup, custom domains, Let's Encrypt certificates, and security headers.
- 💾 **[Backup & Disaster Recovery](docs/BACKUP_AND_RECOVERY.md)**: Offline JSON/CSV snapshots, transactional restores, and data safety.
- 📱 **[Cross-Device Smoke Testing](docs/SMOKE_TESTING_REPORT.md)**: Viewport testing report across mobile, tablet, and desktop devices.
- 🔍 **[Final Audit Report](docs/FINAL_AUDIT_REPORT.md)**: Full verification matrix and test passes.

---

## ⚖️ Third-Party Attributions

- This product uses the [TMDB API](https://www.themoviedb.org/) for movie and television metadata, but is not endorsed or certified by TMDB.
- Anime metadata and episode details are provided by the [AniList API](https://anilist.co/).

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
