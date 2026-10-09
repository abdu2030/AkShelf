# AkShelf UI/UX Specification

**October 9, 2026** · _@mekmoh_

---

## 1. Vision and Design Goals

AkShelf should feel like a calm, softly lit glass shelf where every movie, show and anime sits as a poster you can pick up in one tap. This document defines how that shelf looks, moves and behaves, from color tokens to screen layouts, so the build in the 8-week roadmap stays consistent.

### 1.1 The Feeling in Three Words

- **Calm**: Few elements per screen, generous spacing, slow soft motion, muted status colors.
- **Luminous**: Frosted glass panels over a dark aurora backdrop; poster colors bleed softly into the glass.
- **Quick**: Tracking takes seconds, not minutes. Search is always one keypress away (`/`); marking watched is two taps; no page reloads for common actions.

### 1.2 The One Rule Behind Every Glass Decision

> **Glass is a surface, not a filter.** Containers, navigation and overlays are glass. Posters, text, charts and form values stay crisp and opaque on top of that surface. If a piece of content is hard to read, the glass gets more opaque; the content never gets dimmer.

---

## 2. Information Architecture & Navigation

AkShelf has six main destinations and one detail page:

1. **Home (`/`)**: Dashboard with current progress, continue watching, watchlist preview, small stats.
2. **Search (`/search`)**: Search field, filters, search results with instant library status badges.
3. **My Library (`/library`)**: All tracked titles with filters for All, Movies, TV, Anime, Watching, Watched, Plan to Watch.
4. **Watchlist (`/watchlist`)**: Dedicated Plan to Watch queue.
5. **History (`/history`)**: Chronological activity log.
6. **Settings (`/settings`)**: Account, appearance (theme), data export, log out.
7. **Title Details (`/title/[id]`)**: Deep linkable title page with metadata, rating, episode tracker.

Navigation layout across breakpoints:

- **Phone (< 768px)**: Bottom bar with 5 items (Home, Search, Library, Watchlist, History) at 64px height + safe-area inset; Settings accessible via gear icon in the page header.
- **Tablet (768px - 1023px)**: Left rail, 72px wide, icons only with tooltips, active item has 3px accent bar and white 10% fill.
- **Desktop (>= 1024px)**: Left sidebar, 240px wide, inset 12px with `radius-xl`, logo mark + wordmark, six items (Home, Search, My Library, Watchlist, History, Settings) at 44px height, theme switch & account menu at bottom.

---

## 3. Glassmorphism Foundations & Stacking

### 3.1 Depth Levels

- **Level 1 (Base - `.glass-1`)**: Cards, stat tiles, list rows, filter bar, panels.
  - Dark fill: `rgba(255, 255, 255, 0.06)`, Blur: 16px, Border: 1px `rgba(255, 255, 255, 0.12)`, Shadow: `0 4px 16px rgba(0, 0, 0, 0.25)`, Radius: 20px.
- **Level 2 (Raised - `.glass-2`)**: Navigation bar, sidebar, sticky headers, hovered cards, dropdowns.
  - Dark fill: `rgba(255, 255, 255, 0.10)`, Blur: 24px, Border: 1px `rgba(255, 255, 255, 0.16)`, Shadow: `0 8px 28px rgba(0, 0, 0, 0.32)`, Radius: 20px.
- **Level 3 (Overlay - `.glass-3`)**: Dialogs, bottom sheets, popovers, command palette, toasts.
  - Dark fill: `rgba(30, 33, 58, 0.72)`, Blur: 32px, Border: 1px `rgba(255, 255, 255, 0.22)`, Shadow: `0 16px 48px rgba(0, 0, 0, 0.45)`, Radius: 28px.
- **Glass Inset (`.glass-inset`)**: Nested panels inside glass panels.
  - Fill: `rgba(255, 255, 255, 0.06)`, Border: 1px `rgba(255, 255, 255, 0.08)`, Radius: 14px, **No backdrop blur** (prevents blurry mud).

### 3.2 Stacking & Glass Rules

- Maximum 3 stacked glass layers.
- Maximum 6 blurred surfaces visible in viewport at once, plus one overlay.
- Posters, text, charts, and badges are **never** glass.
- **Never animate backdrop-filter or blur radius**; animate only `transform` and `opacity`.

### 3.3 Aurora Backdrop

Fixed behind everything (`position: fixed; inset: 0; z-index: -1`). Static CSS radial gradients with blobs (Indigo, Violet, Teal over deep navy `#0B0D1A` in dark; Indigo, Pink, Sky over `#EEF1FB` in light).

---

## 4. Color System & Tokens

### 4.1 Core Tokens

- `bg-base`: Dark `#0B0D1A`, Light `#EEF1FB`
- `text-primary`: Dark `#F4F6FF`, Light `#12142B`
- `text-secondary`: Dark `#C3C9E2`, Light `#4A5072`
- `text-muted`: Dark `#BCC3DD`, Light `#5F6688`
- `accent`: Dark `#C7D2FE`, Light `#4338CA`
- `accent-fill`: `#4F46E5` (constant for contrast)
- `accent-fill-hover`: `#4338CA`
- `danger-fill`: `#B91C1C`
- `on-fill`: `#FFFFFF`

### 4.2 Status Tokens (Solid tinted badges, never glass)

- **Watched**: Dark dot `#34D399`, bg `rgba(52, 211, 153, 0.22)`, text `#A7F3D0` | Light dot/text `#065F46`, bg `rgba(16, 185, 129, 0.14)`. Icon: `CheckCircle`.
- **Watching**: Dark dot `#38BDF8`, bg `rgba(56, 189, 248, 0.22)`, text `#BAE6FD` | Light dot/text `#075985`, bg `rgba(14, 165, 233, 0.14)`. Icon: `PlayCircle`.
- **Plan to Watch**: Dark dot `#A78BFA`, bg `rgba(167, 139, 250, 0.22)`, text `#DDD6FE` | Light dot/text `#5B21B6`, bg `rgba(139, 92, 246, 0.14)`. Icon: `Bookmark`.
- **On Hold**: Dark dot `#FBBF24`, bg `rgba(251, 191, 36, 0.22)`, text `#FDE68A` | Light dot/text `#78350F`, bg `rgba(245, 158, 11, 0.14)`. Icon: `PauseCircle`.
- **Dropped**: Dark dot `#94A3B8`, bg `rgba(148, 163, 184, 0.22)`, text `#E2E8F0` | Light dot/text `#334155`, bg `rgba(100, 116, 139, 0.14)`. Icon: `MinusCircle`.

---

## 5. Typography

- **Headings & Badges**: `Plus Jakarta Sans` (weights 600, 700).
- **Body & Labels**: `Inter` (weights 400, 500, 600).
- **CJK / Japanese fallback**: `Noto Sans JP` (weights 400, 600).
- Numbers and counters use `font-variant-numeric: tabular-nums`.

---

## 6. Accessibility & Fallbacks

- **Fallback 1 (Blur unsupported)**: Fall back to solid opaque backgrounds (`--solid-1`, `--solid-2`, `--solid-3`).
- **Fallback 2 (Reduced transparency)**: `@media (prefers-reduced-transparency: reduce)` and `[data-transparency="reduced"]`: solid opaque backgrounds, aurora opacity drops to 50%.
- **Fallback 3 (Forced colors)**: `@media (forced-colors: active)`: `Canvas` / `CanvasText`, 1px borders, no blur/shadow.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` and `[data-motion="reduced"]`: remove transforms, stop shimmers, instant state changes.
- Minimum touch target: 44px by 44px.
