# AkShelf User Manual & Operator Guide 📖

**Welcome to AkShelf**: Your private, distraction-free entertainment notebook.  
This guide explains how to track your viewing journey, log episodes, record decimal ratings, and export your personal collection.

---

## 1. Getting Started & Logging In

AkShelf operates in single-owner private mode. Only you have access to your shelf:

1. Open your AkShelf URL (e.g. `https://your-domain.vercel.app` or `http://localhost:3000`).
2. If not authenticated, you will be directed to the **Sign In** screen.
3. Enter your owner email and password, then click **Sign in**.
4. You will arrive at your personal **Dashboard** (`/`).

---

## 2. Searching & Adding Titles

AkShelf integrates with **The Movie Database (TMDB)** for movies and TV shows, and **AniList** for anime.

### Finding a Title

1. Click **Search** in the navigation header or press `/`.
2. Type any title name (e.g., _Frieren_, _Inception_, _Breaking Bad_).
3. Use the filter chips (**All**, **Movies**, **TV Shows**, **Anime**) to narrow down results.

### Instant Memory Badges ("Did I watch this?")

When you search for a title, AkShelf cross-references your database cache in real time:

- **`Watched • ★ 9.5`**: You've seen this title and rated it 9.5/10.
- **`Watching • S2 E4`**: You are in the middle of this series on Season 2, Episode 4.
- **`Plan to Watch`**: This title is saved in your queue.
- **No Badge**: You have never tracked this title yet.

Click on any search result card to open its full **Title Details** page.

---

## 3. Tracking Watch Status & Dates

On any Title Details page, use the **Status Selector** dropdown:

| Status                  | When to Use                          | Automatic Behavior                                                     |
| :---------------------- | :----------------------------------- | :--------------------------------------------------------------------- |
| **`Watched`**           | You completed the movie or series    | Automatically sets completion date to today if empty.                  |
| **`Watching`**          | You are currently watching episodes  | Adds to the _Continue Watching_ shelf on your dashboard.               |
| **`Plan to Watch`**     | Titles you want to see in the future | Appears in your dedicated _Watchlist_ queue.                           |
| **`On Hold`**           | Started, but paused for now          | Retains your exact episode progress without cluttering active shelves. |
| **`Dropped`**           | Decided not to finish                | Preserved in your history so you remember you didn't enjoy it.         |
| **`Remove from shelf`** | Completely remove tracking           | Removes your tracking state while preserving external metadata cache.  |

### Editing Watch Dates

Click the **Watch Dates** accordion under the status dropdown to manually edit:

- **Started date**: The day you began watching.
- **Completed date**: The day you finished the title.

---

## 4. Rating Your Media (Decimal Floats)

AkShelf allows you to rate titles on a **1 to 10** scale, with full decimal precision:

1. **Pill Buttons**: Click any integer pill from **1** to **10** for instant rating.
2. **Decimal Float Input**: Type your exact decimal score in the box alongside the pills (e.g., `8.7`, `9.2`, `7.5`):
   - Supports `0.1` increments with bounds from `1.0` to `10.0`.
   - Press **Enter** or click outside the box to save.
   - The corresponding base pill automatically highlights in gold.
3. **Clear Rating**: Click the **Clear** link or press Escape in the input to remove your rating.

---

## 5. TV & Anime Episode Tracking

For episodic series, AkShelf remembers the exact episode you left off on:

### The Episode Checklist

1. Select the season using the **Season Selector** tabs (e.g., _Season 1_, _Season 2_).
2. Check the box next to any episode to mark it watched.
3. The progress bar updates instantly (e.g., `12 / 24 episodes - 50%`).

### Next-Up & Continue Watching

- The prominent **`Continue S{x} E{y}`** button at the top of the details page and on your Dashboard immediately identifies the next unwatched episode.
- Clicking it marks that episode watched and highlights the subsequent one.
- When all episodes are completed, the button transitions to an **`All Episodes Watched`** badge.

### Batch Season Actions

- **Mark Season Watched**: Click the button in the season header to mark all episodes in that season completed in 1 click.
- **Watch up to Episode N**: Click the context menu on any episode to mark all preceding episodes watched up to that point.
- **Undo Toast**: A floating notification appears for 6 seconds after any episode action, allowing an instant 1-click **Undo** rollback.

---

## 6. Organizing Your Library

The **Library** view (`/library`) displays your complete personal collection:

- **Filter by Status**: `All`, `Watching`, `Watched`, `Plan to Watch`, `On Hold`, `Dropped`.
- **Filter by Format**: `All`, `Movies`, `TV Shows`, `Anime`.
- **Sort By**:
  - `Recently Updated`: Titles you interacted with most recently.
  - `Date Added`: Chronological order of when you added the title.
  - `Title (A–Z)`: Alphanumeric title order.
  - `Rating`: Highest rated to lowest rated.
  - `Release Year`: Newest to oldest release.

---

## 7. Reviewing Watch History

Visit **History** (`/history`) to inspect your personal activity feed:

- Chronologically grouped by day (_Today_, _Yesterday_, _October 15_).
- Natural language audit logs: _"Watched Season 1 Episode 4"_, _"Rated 8.7/10"_, _"Marked as Watched"_.
- Filter history by media format (**All**, **Movies**, **TV**, **Anime**).

---

## 8. Customizing Appearance & Backups

Navigate to **Settings** (`/settings`):

- **Theme**: Choose between **System** (matches OS), **Dark**, or **Light**.
- **Reduce Transparency**: Replaces translucent frosted glass with solid surfaces for maximum contrast.
- **Reduce Motion**: Disables smooth animations and backdrop shimmers.
- **Export JSON**: One-click download of a full structured backup (`akshelf-backup-YYYY-MM-DD.json`).
- **Export CSV**: One-click download of your library formatted for Excel or Google Sheets (`akshelf-library-YYYY-MM-DD.csv`).
