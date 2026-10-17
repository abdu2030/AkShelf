# AkShelf Production Provisioning & Clean Seed Guide

This document outlines the standard operating procedure for provisioning an initial owner account and seeding clean, zero-pollution database states in production environments (e.g., Vercel, Supabase, Docker, or self-hosted VPS).

---

## 1. Architectural Model & Zero-Pollution Policy

AkShelf is designed as a **single-owner, self-hosted media tracker**.

- **Single Owner Isolation**: All media tracking records (`UserTitle`, `UserEpisode`, `WatchHistory`) belong to one verified owner account.
- **Zero-Pollution Guarantee**: Production deployments must contain **zero mock or demo titles**. The catalog should only contain real titles explicitly searched and added by the owner.
- **Credential Separation**: The owner's password hash is stored in server-side environment variables (`OWNER_PASSWORD_HASH`), while the database stores user identity and tracking metadata (`users.id`, `users.email`, `users.name`).

---

## 2. Step-by-Step Production Setup

### Step 1: Generate a Bcrypt Password Hash

Choose a strong password (minimum 8 characters). Generate a salted bcrypt hash using the built-in offline tool:

```bash
npm run db:provision -- --hash-only "YourStrongPassword123!"
```

**Output:**

```text
🔑 Password Bcrypt Hash Generated Successfully:
----------------------------------------------------------------
Raw Hash:     $2b$10$jCJr/XFkJh8qCKfqN6PVwOOuOOGv0Wj7.OJErh4udH/kyeumvrcly
Escaped Hash: \$2b\$10\$jCJr/XFkJh8qCKfqN6PVwOOuOOGv0Wj7.OJErh4udH/kyeumvrcly  (Recommended for .env.local and Vercel)
----------------------------------------------------------------
```

> [!IMPORTANT]
> Always use the **Escaped Hash** (`\$2b\$...`) in `.env.local` or Vercel Environment Variables. This prevents shell and Node.js dotenv parsers from treating `$` characters as unexpanded environment variables.

---

### Step 2: Configure Production Environment Variables

Add the following keys to your Vercel Project Settings (or production `.env` file):

| Variable              | Description                                 | Example                                                                                |
| :-------------------- | :------------------------------------------ | :------------------------------------------------------------------------------------- |
| `OWNER_EMAIL`         | Owner login email address                   | `owner@akshelf.local` or `admin@yourdomain.com`                                        |
| `OWNER_NAME`          | Owner display name                          | `AkShelf Owner`                                                                        |
| `OWNER_PASSWORD_HASH` | Escaped bcrypt hash (Cost 10+)              | `\$2b\$10\$jCJr/XFkJh8...`                                                             |
| `AUTH_SECRET`         | 32+ byte random string for JWT signing      | Generated via `openssl rand -base64 32`                                                |
| `DATABASE_URL`        | Supabase Transaction Pooler URL (Port 6543) | `postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL`          | Supabase Direct Session URL (Port 5432)     | `postgresql://...@pooler.supabase.com:5432/postgres`                                   |

---

### Step 3: Run Database Migrations

Apply the Prisma schema to your remote database using the direct session connection:

```bash
npm run db:migrate
```

---

### Step 4: Provision Owner Account (Zero-Pollution Seed)

Provision the initial owner account in PostgreSQL without adding any mock titles:

```bash
npm run db:provision
```

Alternatively, you can run Prisma's clean seed command:

```bash
npm run db:seed:clean
```

Both commands are strictly **idempotent**:

1. If the owner account already exists, they verify credentials and update the display name if changed.
2. Existing library items, watch history, and episode logs are **never modified or deleted**.
3. Zero dummy titles or synthetic mock records are inserted.

---

## 3. Provisioning CLI Reference

The CLI utility `scripts/provision-owner.ts` (`npm run db:provision`) supports several operational flags:

```bash
# Display help and options
npm run db:provision -- --help

# Generate a bcrypt hash offline without touching the database
npm run db:provision -- --hash-only "<password>"

# Audit the current database record counts (read-only)
npm run db:provision -- --audit-only

# Provision with custom email and display name
npm run db:provision -- --email "alex@domain.com" --name "Alex"

# Generate hash and provision owner in a single command
npm run db:provision -- --email "alex@domain.com" --password "MySecretPassword123!"
```

---

## 4. Database Seed Modes

AkShelf provides two distinct seed workflows:

| Command                 | Mode                 | Behavior                                                 | Use Case                        |
| :---------------------- | :------------------- | :------------------------------------------------------- | :------------------------------ |
| `npm run db:provision`  | **Clean Production** | Provisions owner user, audits DB, 0 mock titles inserted | Production deployment           |
| `npm run db:seed:clean` | **Clean Production** | Prisma runner passing `--clean` flag                     | CI/CD automated setup           |
| `npm run db:seed`       | **Development Demo** | Provisions owner and seeds ~20 demo movies/shows/anime   | Local feature testing           |
| `npm run db:clean`      | **Dummy Data Wipe**  | Deletes all titles and tracking records, preserves owner | Resetting dev DB to clean state |

---

## 5. Deployment Verification Checklist

Before opening your AkShelf instance to daily use, verify the deployment:

1. **Pre-flight Audit**:

   ```bash
   npm run deploy:check
   ```

   Ensures all environment variables, connection pool, and Prisma schema tables are reachable.

2. **Clean Record Audit**:

   ```bash
   npm run db:provision -- --audit-only
   ```

   Verify that `Catalog Titles` = `0` and `Users` = `1`.

3. **HTTP Health Check**:
   Navigate to `https://<your-domain>/api/health` and verify HTTP 200:

   ```json
   {
     "status": "healthy",
     "version": "1.0.0",
     "database": {
       "status": "connected",
       "latencyMs": 45
     }
   }
   ```

4. **Web UI Login**:
   Navigate to `https://<your-domain>/login`, enter your `OWNER_EMAIL` and password, and confirm seamless authentication into your clean, private library dashboard.
