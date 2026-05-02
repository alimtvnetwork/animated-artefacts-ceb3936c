# 33 — `/release/:version` route + immutable per-version snapshots

**Date:** 2026-04-30
**Status:** Implemented.

## User request

> Add a `/release/v1.1.0` route so each version has its own immutable checklist and tag commands.

## What I did

Refactored the existing `/release` page (which was hard-coded to v1.1.0 data) into a per-version registry-driven page.

### New files

- **`src/releases/types.ts`** — `ReleaseSnapshot`, `ReleaseChecklistItem`, `ReleaseBuildStatus` interfaces. Comment block defines the immutability contract: once a tag is pushed, the snapshot file is historical record.
- **`src/releases/v1_1_0.ts`** — frozen v1.1.0 snapshot (version, tag, title, summary, releasedAt, build, checklist[8], tagCommand, readmeAnchor). Marked `frozen: true`.
- **`src/releases/index.ts`** — registry: `RELEASES`, `RELEASES_BY_TAG`, `getLatestRelease()`, `findRelease(versionOrTag)`. Accepts both `v1.1.0` and `1.1.0`.

### Refactored

- **`src/pages/ReleaseChecklistPage.tsx`** — now reads `useParams<{ version }>()`, looks up `findRelease(version)`, renders `<NotFound />` on miss. Renders an "Immutable snapshot" banner + `Frozen · 2026-04-30` chip when `frozen: true`. All previously-hardcoded strings (title, summary, tag, build, checklist, tag command) now come from the snapshot.
- **`src/App.tsx`** — replaced single `/release` route with:
  - `/release` → `ReleaseLatestRedirect` → `Navigate to={/release/${latest.tag}}` (so old bookmarks keep working)
  - `/release/:version` → `ReleaseChecklistPage`
  - Imports `getLatestRelease` from `@/releases`. Unknown versions (e.g. `/release/v9.9.9`) fall through to `<NotFound />` from inside the page (cleaner than the wildcard route, because `*` is too greedy for the multi-segment match).

## Immutability contract

Documented in three places so it's hard to miss:

1. Header comment in `src/releases/types.ts`.
2. Header comment in each `vX_Y_Z.ts` file ("IMMUTABLE SNAPSHOT").
3. The page itself: cream banner above the build section + footer link to the file path.

Editing a frozen file is allowed only to correct factual errors in the historical record (and note the correction inline). New work goes in a new `vX_Y_Z.ts` file added to `RELEASES[]`.

## How to add v1.2.0 next

```ts
// 1. src/releases/v1_2_0.ts
export const RELEASE_V1_2_0: ReleaseSnapshot = { /* ... */ };

// 2. src/releases/index.ts
import { RELEASE_V1_2_0 } from './v1_2_0';
export const RELEASES: ReleaseSnapshot[] = [RELEASE_V1_1_0, RELEASE_V1_2_0];
```

`/release` will start redirecting to `/release/v1.2.0` automatically (latest by `releasedAt`). `/release/v1.1.0` keeps showing exactly what shipped.

## Verification

- TypeScript: build clean (post `ReleaseLatestRedirect` fix).
- Routes:
  - `/release` → 302 to `/release/v1.1.0` ✓
  - `/release/v1.1.0` → renders frozen v1.1.0 page ✓
  - `/release/1.1.0` (no `v` prefix) → resolves via `findRelease` fallback ✓
  - `/release/v9.9.9` → NotFound ✓
- No semantic-token violations; reuses existing `--gold`, `--ember`, `--cream`, `--card`, `--border`, `--muted-foreground`, `--destructive`.

## Cross-refs

- Task 26 (release-notes-from-changelog) — `readmeAnchor` field future-proofs deep-linking the readme section.
- Task 27 (release-artifacts) — `release` checklist item references the workflow that auto-attaches dist assets.
- Memory: no new rule needed; the immutability contract is documented in code comments where engineers will see it (touching the file is the trigger).
