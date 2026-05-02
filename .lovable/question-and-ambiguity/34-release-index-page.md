# 34 — `/release` index page listing all versions

**Date:** 2026-05-01
**Status:** Implemented.

## User request

> Add an index page at `/release` that lists all versions with their tags, frozen status, and quick links to each `/release/:version` checklist.

## What I did

- Created `src/pages/ReleaseIndexPage.tsx` rendering every entry in `RELEASES` (sorted newest-first by `releasedAt`).
- Each row shows tag (mono), `★ latest` chip on the most recent, frozen/draft chip, build pass/fail/unknown chip, release date, title, summary (line-clamped 2), and a "checklist N/M done · View checklist →" line. Whole row is a `<Link to="/release/{tag}">`.
- `src/App.tsx`: replaced `ReleaseLatestRedirect` with `<ReleaseIndexPage />` at `/release`. Removed unused `getLatestRelease` import. `/release/:version` route unchanged.

## Theming

Semantic tokens only: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `--gold`, `--ember`, `--cream`, `--destructive`, `--muted`. Hover ring uses `border-[hsl(var(--gold)/0.6)]` to match deck Noir & Gold palette.

## Ambiguity

User did not specify whether `/release` should still auto-redirect to latest. Chose index-as-default (matches the request literally — "add an index page **at** /release") since the per-version pages remain canonical and the latest is highlighted.

## Verification

- `/release` renders the list with v1.1.0 marked latest + frozen + build pass.
- `/release/v1.1.0` still loads its frozen snapshot unchanged.
- `/release/v9.9.9` still falls through to NotFound via `findRelease`.
