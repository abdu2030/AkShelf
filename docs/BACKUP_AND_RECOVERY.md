# AkShelf Backup & Disaster Recovery Procedures 🛡️

**Application**: AkShelf (My Watch Tracker)  
**Edition**: v1.0.0-rc.1 / October 2026

---

## 1. Overview & Data Ownership Philosophy

In AkShelf, **you own 100% of your data**. Because viewing habits, personal ratings, and episode completions represent years of personal history, AkShelf incorporates multi-tiered data safety:

1. **Portable Formats**: Human-readable JSON and industry-standard CSV.
2. **Transactional Restore**: Schema-validated importer that guarantees database consistency.
3. **Zero Vendor Lock-in**: Backups contain standard external identifiers (TMDB IDs, AniList IDs) so your data can be migrated anywhere at any time.

---

## 2. Backup Formats & Schema Specification

### 2.1 Full JSON Backup (`akshelf-backup-YYYY-MM-DD.json`)

The JSON backup represents a complete snapshot of your entire account:

```json
{
  "app": "AkShelf",
  "version": "1.0.0-rc.1",
  "schemaVersion": 1,
  "exportedAt": "2026-10-17T12:00:00.000Z",
  "user": {
    "email": "owner@akshelf.local"
  },
  "stats": {
    "totalTitles": 45,
    "totalEpisodes": 128,
    "totalHistory": 180
  },
  "titles": [
    {
      "title": "Frieren: Beyond Journey's End",
      "type": "ANIME",
      "year": 2023,
      "externalSource": "anilist",
      "externalId": "154587",
      "status": "WATCHING",
      "rating": 9.5,
      "startedAt": "2026-09-01T00:00:00.000Z",
      "watchedAt": null
    }
  ],
  "episodes": [
    {
      "externalSource": "anilist",
      "externalId": "154587",
      "titleName": "Frieren: Beyond Journey's End",
      "seasonNumber": 1,
      "episodeNumber": 4,
      "watchedAt": "2026-10-15T18:30:00.000Z"
    }
  ],
  "history": [
    {
      "externalSource": "anilist",
      "externalId": "154587",
      "titleName": "Frieren: Beyond Journey's End",
      "action": "EPISODE_WATCHED",
      "occurredAt": "2026-10-15T18:30:00.000Z"
    }
  ]
}
```

### 2.2 CSV Spreadsheet Export (`akshelf-library-YYYY-MM-DD.csv`)

An RFC 4180-compliant CSV file containing your library titles, status, decimal ratings, and dates:

```csv
Title,Type,Status,Rating,StartedAt,WatchedAt,ReleaseYear,ExternalSource,ExternalId,AddedAt
"Inception",MOVIE,WATCHED,9.5,2026-10-01,2026-10-02,2010,tmdb,27205,2026-10-01
"Frieren: Beyond Journey's End",ANIME,WATCHING,9.5,2026-09-01,,2023,anilist,154587,2026-09-01
```

---

## 3. How to Create Backups

### Method 1: One-Click Web Interface (Recommended)

1. Open AkShelf and go to **Settings** (`/settings`).
2. Scroll to **Your Data & Backups**.
3. Click:
   - **`Export JSON (Full Backup)`** &rarr; Downloads complete JSON snapshot.
   - **`Export CSV (Spreadsheet)`** &rarr; Downloads spreadsheet for Excel or Google Sheets.

### Method 2: Command-Line Interface (CLI)

From your workstation or a scheduled cron job:

```bash
npm run db:export
```

This connects to your database, reads all tracking tables, and saves timestamped files into the local `backups/` directory:

- `backups/akshelf-backup-YYYY-MM-DD.json`
- `backups/akshelf-library-YYYY-MM-DD.csv`

### Method 3: PostgreSQL Native Dump (pg_dump)

For low-level database disaster recovery, use Supabase's direct connection string:

```bash
pg_dump "$DIRECT_URL" --format=custom --file=akshelf-postgres.dump
```

---

## 4. Disaster Recovery & Restoration Procedures

### Scenario A: Restoring from a JSON Backup

If migrating to a new database or recovering after data loss:

1. Validate the backup payload schema using the built-in verifier:
   ```typescript
   import { verifySchemaConsistency } from "@/lib/export/export-service";
   const check = verifySchemaConsistency(backupJson);
   // check.valid === true
   ```
2. Trigger the transactional restore:
   ```typescript
   import { restoreFromJson } from "@/lib/export/export-service";
   const result = await restoreFromJson(ownerUserId, backupJson);
   console.log(`Restored ${result.titlesRestored} titles, ${result.episodesRestored} episodes.`);
   ```
3. All title metadata, user tracking states, seasons, episodes, and history logs will be restored in a single atomic database transaction (`prisma.$transaction`).

### Scenario B: Resetting Database Clean State

If you ever need to purge test data or reset the database cleanly:

```bash
npm run db:clean
```

This wipes all titles, seasons, episodes, and watch history records while safely preserving your owner account credentials.

### Scenario C: PostgreSQL Native Restore

To restore a native `pg_dump` file into Supabase:

```bash
pg_restore --clean --if-exists --no-owner --dbname="$DIRECT_URL" akshelf-postgres.dump
```

---

## 5. Recommended Backup Routine

- **Monthly**: Download a full JSON backup from the **Settings** page and store it in your personal cloud drive (Google Drive, iCloud, Dropbox).
- **Major Milestone**: Run `npm run db:export` after tracking a major binge or logging multiple seasons.
- **Pre-Update**: Always download a fresh backup before applying major database migrations or framework upgrades.
