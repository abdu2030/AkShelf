# AkShelf 🎬📺✨

> **Personal Movie, TV Show & Anime Tracking System**  
> Fast, private, and effortless personal entertainment tracking to answer the question: *"Did I watch this?"*

[![Repository](https://img.shields.io/badge/GitHub-abdu2030%2FAkShelf-blue?logo=github)](https://github.com/abdu2030/AkShelf.git)
[![Status](https://img.shields.io/badge/Week%201-Day%201%20Complete-success)](#roadmap-status)

---

## 🎯 What is AkShelf?

Over time, you watch hundreds of movies, TV shows, and anime series, but later forget whether you've already seen something, how you rated it, or what episode you left off on.

**AkShelf** solves this with zero friction:
* **Instant Memory ("Did I watch this?")**: Immediate status badge directly on search cards (`Watched - 9/10`, `Watching - S2 E4`).
* **Fast Capture**: Track, rate, and update progress in 1–2 clicks.
* **Separation of Concerns**: Entertainment metadata is fetched from TMDB and AniList, while your personal ratings and history live securely in your private PostgreSQL database.
* **Single-Owner Privacy**: No social feeds, no public profiles, no clutter.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) + React + TypeScript | Unified frontend and server actions |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, responsive component library |
| **Database** | PostgreSQL (Supabase) | Relational data persistence for tracking & history |
| **ORM** | Prisma | Type-safe database queries and migrations |
| **Authentication** | Auth.js (NextAuth) | Single-user secure access control |
| **Validation** | Zod | Server-side form and action validation |
| **Metadata APIs** | TMDB REST + AniList GraphQL | Movie, TV show, and anime catalog details |
| **Testing** | Vitest + Playwright | Unit and end-to-end browser testing |
| **Deployment** | Vercel | Seamless edge deployment |

---

## 📋 8-Week Implementation Roadmap

- [x] **Week 1: Foundation, Planning & Project Setup**
  - [x] **Day 1**: Define scope, acceptance criteria, 6 core user actions, git repo setup.
  - [ ] **Day 2**: Next.js + TypeScript + Tailwind stack installation, linting & clean tooling.
  - [ ] **Day 3**: Supabase/PostgreSQL connection & Prisma setup.
  - [ ] **Day 4**: Relational schema design (`User`, `Title`, `Season`, `Episode`, `UserTitle`, `UserEpisode`, `WatchHistory`).
  - [ ] **Day 5**: Single-owner Auth.js integration & route protection.
  - [ ] **Day 6**: Base layout shell (navigation, responsive containers, core UI components).
  - [ ] **Day 7**: Week 1 review, checkpoint release & baseline commit.
- [ ] **Week 2: UI Foundation & Personal Library**
- [ ] **Week 3: TMDB / AniList Integration & Search**
- [ ] **Week 4: Watch Tracking, Ratings & History**
- [ ] **Week 5: TV / Anime Seasons & Episode Progress**
- [ ] **Week 6: Dashboard, Statistics & UX Polish**
- [ ] **Week 7: Testing, Security, Performance & Data Safety**
- [ ] **Week 8: Deployment, Documentation & v1.0 Launch**

---

## 📖 Documentation

* [Project Brief & Acceptance Criteria](docs/PROJECT_BRIEF.md)

---

## 🚀 Getting Started (Development Setup)

Prerequisites:
* Node.js v20+ (recommended v24 LTS)
* npm or pnpm
* Git

```bash
# Clone the repository
git clone https://github.com/abdu2030/AkShelf.git
cd AkShelf

# Dependencies installation (starting Day 2)
npm install

# Run development server
npm run dev
```

---

## 📄 License
Private Personal Project.
