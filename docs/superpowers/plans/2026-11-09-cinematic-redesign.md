# Cinematic Redesign Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Apply the supplied 66-page cinematic design system to all existing AkShelf routes.

**Architecture:** Keep the existing App Router, authenticated services, actions and normalized view models. Replace presentation at the component boundary, with shared opaque materials and small client boundaries for image fallback and interactive controls.

**Tech Stack:** Existing Next.js, React, TypeScript, Tailwind and Lucide. No new runtime dependencies.

**Spec:** User-supplied `C:/Users/Admin/Downloads/AkShelf_Cinematic_Redesign_Expanded_Design_System.pdf`, especially pages 12–21, 23–44, 46–50 and 52–59.

## Global constraints

- Dark canvas #0B0E12; surfaces #171B21 / #252A30; ivory #F0EEE8; accent #DFA16F with #2B1B14 ink.
- Light parchment #F4F0E8 and graphite #182027. Equal theme support.
- Preserve routes, owner-only authorization, schema, providers, mutations, decimal ratings, dates, episode undo and exports.
- No invented metadata, streaming controls, recommendations or public signup.
- Two-column phone poster grids, 44px controls, visible keyboard focus, reduced motion and opaque fallbacks.
- User requested proceeding with the supplied direction. Work in the supplied clean checkout; deliver reviewable local edits without deployment or database changes.

## Structure and implementation

- [x] Foundation: `globals.css`, `layout.tsx`, `app-shell.tsx`, `page-header.tsx`, UI primitives. Opaque materials, quiet rail, semantic borders, type hierarchy, responsive navigation, static fallback artwork.
- [x] Frequent journeys: `app/page.tsx`, dashboard components, search components, library components. Home order: header → personal spotlight → watching → recent → counts → collection DNA. Preserve real query/result and filter data. Add regression tests for spotlight selection and honest next-up fallback.
- [x] Deep tracking: title hero, media cards, episode surfaces, watchlist. Poster-led story stage → existing controls → ledger. Ensure personal/provider scores distinguishable, no dead quick actions, readable missing-image treatment.
- [x] Secondary surfaces: login, settings, history, loading/empty states. Static archive composition beside secure login; grouped settings; chronological journal.
- [x] Verification: typecheck, lint, full Vitest, production build, available browser/e2e checks; desktop/mobile and light/dark screenshots. Record actual results and blocked dependencies.

## Review focus

- Missing/failed artwork must leave titles and controls usable.
- Unknown episodes must not imply a fabricated S01 E01 or 0% known progress.
- Search failures must distinguish failure from no matches and retain query.
- Long titles and 360px screens must not overflow or hide actions.
- Theme and motion preferences must preserve contrast and function.

## Execution ledger

- Source inspected: clean repository matching the supplied remote. Baseline test command initially blocked by sandbox directory traversal; retried with escalation.
- Ruling: preserve existing domain contracts. Any discovered display defects will receive narrowly scoped regression coverage; no schema or action API changes.
- Ruling: use system Georgia for selective editorial headings, retaining Inter for utility text; avoids an extra downloaded font and keeps fallback intentional.

- Completed implementation and available verification. See `docs/CINEMATIC_REDESIGN_REVIEW.md` for results, screenshots and database-dependent acceptance checks that remain unverified.
