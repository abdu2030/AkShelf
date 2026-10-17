# AkShelf Production Deployment Guide 🚀

**Target Architecture**: Next.js (Vercel Serverless) + PostgreSQL (Supabase with Connection Pooling)  
**Edition**: v1.0.0 / October 2026

---

## 1. Architecture & Production Invariants

AkShelf is designed as a single-owner, high-performance entertainment notebook. In production, it runs on:

- **Compute & CDN**: [Vercel](https://vercel.com/) (Next.js 16 App Router, Turbopack, Server Actions, Route Handlers).
- **Primary Database**: [Supabase](https://supabase.com/) managed PostgreSQL.
- **Connection Strategy**: Supabase Transaction Pooler (Port `6543`) with `pgbouncer=true` for serverless lambdas + Direct Connection (Port `5432`) for Prisma CLI migrations.
- **Authentication**: Auth.js (NextAuth) v5 with server-only JWT encryption and single-owner credentials.
- **Metadata Integration**: TMDB v4 Bearer Read Access Token (Server-only) + AniList GraphQL API (Direct).

---

## 2. Prerequisites

Before starting deployment, ensure you have:

1. **A GitHub repository** containing your AkShelf code.
2. **A Supabase account** ([supabase.com](https://supabase.com)).
3. **A Vercel account** ([vercel.com](https://vercel.com)).
4. **A TMDB API Read Access Token** from [The Movie Database API Settings](https://www.themoviedb.org/settings/api).

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Configure Supabase Database & Connection Pooling

1. Log into your Supabase Dashboard and click **New Project**.
2. Choose a project name (e.g. `akshelf-prod`), a strong database password, and select the AWS region closest to your Vercel deployment region (e.g. `us-east-1` for Vercel `iad1`).
3. Once the database is provisioned, go to **Project Settings** &rarr; **Database**:
   - Scroll down to **Connection parameters** &rarr; **Connection pooling**.
   - Note the **Transaction pooler** string (Port `6543`).
   - Note the **Direct connection** string (Port `5432`).
4. Format your connection strings:
   ```env
   # Pooled connection for Next.js application queries (Transaction mode)
   DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

   # Direct connection for Prisma CLI migrations
   DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

---

### Step 2: Apply Database Migrations in Production

Run Prisma migration deploy against your production database using `DIRECT_URL`:

```bash
# Set your production direct URL and run migrations
npx prisma migrate deploy
```

This applies all versioned migrations (`prisma/migrations/*`) and ensures the relational schema (`users`, `titles`, `seasons`, `episodes`, `user_titles`, `user_episodes`, `watch_history`) is created identically to your development environment.

---

### Step 3: Generate Production Secrets

Generate a cryptographically secure 32-byte secret for session signing:

```bash
# On Linux/macOS/Git Bash:
openssl rand -base64 32

# Or via Auth.js CLI:
npx auth secret
```

Generate the owner password bcrypt hash:

```bash
# Hash your chosen strong owner password (cost factor 10):
node -e "const b=require('bcryptjs'); console.log(b.hashSync('YourStrongPasswordHere', 10));"
```

> [!IMPORTANT]
> When pasting `OWNER_PASSWORD_HASH` into environment files or command lines, make sure `$` signs are escaped as `\$` (e.g. `\$2b\$10\$...`) to prevent shell variable expansion.

---

### Step 4: Configure Vercel Project

1. In the Vercel Dashboard, click **Add New...** &rarr; **Project**.
2. Select your `AkShelf` GitHub repository and click **Import**.
3. In **Project Settings**:
   - **Framework Preset**: Next.js (automatically detected via `vercel.json`).
   - **Root Directory**: `./`
   - **Build Command**: `next build` (or leave default).
   - **Install Command**: `npm ci`
4. Expand **Environment Variables** and add the following keys for **Production**:

| Variable Name                | Environment | Description                                                                             |
| :--------------------------- | :---------: | :-------------------------------------------------------------------------------------- |
| `DATABASE_URL`               | Production  | Supabase pooled connection string (port 6543 with `?pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL`                 | Production  | Supabase direct connection string (port 5432)                                           |
| `AUTH_SECRET`                | Production  | 32-byte random secret string                                                            |
| `NEXTAUTH_URL`               | Production  | Your canonical production domain (e.g. `https://akshelf.vercel.app`)                    |
| `OWNER_EMAIL`                | Production  | Owner account email (e.g. `owner@akshelf.local`)                                        |
| `OWNER_PASSWORD_HASH`        | Production  | Bcrypt hash of owner password                                                           |
| `TMDB_API_READ_ACCESS_TOKEN` | Production  | TMDB v4 Bearer Read Access Token                                                        |
| `TMDB_API_KEY`               | Production  | TMDB v3 API Key (optional fallback)                                                     |

5. Click **Deploy**. Vercel will build the project and output your live production URL.

---

### Step 5: Post-Deployment Smoke Test & Verification

1. **Verify Health Endpoint**:
   Visit `https://your-domain.vercel.app/api/health` in your browser.
   You should receive an HTTP `200 OK` response:

   ```json
   {
     "status": "ok",
     "app": "AkShelf",
     "version": "1.0.0",
     "services": {
       "database": {
         "status": "connected"
       }
     }
   }
   ```

2. **Verify Single-Owner Login**:
   - Open `https://your-domain.vercel.app/login`.
   - Enter your `OWNER_EMAIL` and password.
   - Verify that you are redirected to the clean dashboard (`/`).

3. **Verify Search & Tracking**:
   - Open `/search`, search for a real movie or TV show, and click to view details.
   - Set status to **Watching** or **Watched**, rate with a decimal float (e.g. `8.5`), and check your **Library** (`/library`) and **History** (`/history`).

---

### Step 6: Backup & Data Safety Routine

To maintain 100% data ownership:

- **Web UI Backups**: Navigate to **Settings** (`/settings`) &rarr; **Your Data & Backups** and download:
  - `Export JSON (Full Backup)`: Complete snapshot of all tracked titles, ratings, episode progress, and history.
  - `Export CSV (Spreadsheet)`: Tabular library file compatible with Excel or Google Sheets.
- **Automated CLI Backups**: Run `npm run db:export` anytime from your local workstation to generate timestamped backup files in `backups/`.
