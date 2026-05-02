# 01 — Root boot watchdog false blank-root on `/`

## Summary

The preview had two related boot failures on the root route (`/`):

1. a **false-positive** `blank-root` watchdog report while the app was still in a valid boot state, and
2. a **real root-entry stall** where `/` could remain on a startup shell instead of advancing into the slide deck.

## User-visible symptoms

- Full-screen runtime overlay with:
  - `kind: blank-root`
  - `message: #root is still empty after preview boot watchdog timeout.`
- Slides sometimes not visible when opening `/`
- In some boots, the page stayed on a “Preparing presentation” shell instead of reaching slide 1
- Inconsistent diagnostics because boot timing hooks were partially missing

## Evidence

- Runtime error payload reported from `index.html boot watchdog`
- Browser verification showed the slide deck visibly rendered while `blank-root` was still logged
- `src/main.tsx` still called:
  - `previewBoot?.mark("...")`
  - `previewBoot?.markRendered?.()`
- Earlier, `index.html` only exposed:
  - `markMainLoaded`
- Therefore readiness/timing instrumentation had regressed to a partial API
- `src/App.tsx` routed `/` through a dedicated redirect step instead of mounting the deck directly
- After adding a static boot shell to suppress false blank detection, `/` could remain on that shell when the redirect path did not complete promptly

## Root causes

### 1) Boot API regression between `index.html` and `src/main.tsx`

`main.tsx` expected a richer `window.__previewBoot__` contract (`mark`, `markRendered`) but `index.html` had been reduced to only `markMainLoaded`.

Impact:

- first-render readiness was never signaled
- boot timing milestones were not recorded
- the watchdog had less information and no explicit "React painted" completion signal

### 2) Root route (`/`) depended on a redirect hop during boot

`/` did not mount `SlideDeckPage` directly. Instead, boot first entered a redirect-only route and then moved to the canonical `/:slideNumber` path.

This created two failure modes:

- before the visible boot shell existed, the redirect frame could look empty long enough to trip the watchdog
- after the visible boot shell was added, the app could remain on that shell if the redirect path stalled before the deck route committed

Impact:

- `/` was more likely than `/:slideNumber` to trigger false blank-root reports
- the issue reproduced even when the slide deck itself was healthy
- users could get stuck at `/` without ever reaching slide 1

### 3) Blank detection needed to distinguish “boot shell” from “true blank”

The watchdog’s `rootIsEmpty()` heuristic only treated text/media-bearing trees (or nodes explicitly marked with `[data-non-empty]`) as non-empty.

That meant any intentionally visible but minimal boot or route shell had to explicitly declare itself as meaningful UI, otherwise the watchdog would classify it as blank even while the app was legitimately booting.

## Fix implemented

### `index.html`

- restored the full preview boot API:
  - `markMainLoaded()`
  - `mark(name, detail?)`
  - `markRendered(detail?)`
  - `getTimeline()`
- added in-page boot timeline formatting
- logs boot timeline to console when watchdog fires
- shows timeline inside the fallback overlay
- skips watchdog failure if `markRendered()` already ran

### `index.html`

- seeded `#root` with a visible startup shell marked with `data-non-empty="true"`
- this guarantees the watchdog never mistakes the initial document state for an actual blank page while the app bundle is loading

### `src/App.tsx`

- removed the separate `/` redirect component entirely
- `/` now mounts `SlideDeckPage` directly instead of depending on a redirect-only boot hop
- `RouteFallback` is explicitly marked with `data-non-empty="true"` so suspense fallback UI is recognized as valid visible content

### `src/pages/SlideDeckPage.tsx`

- root entry now accepts either `/:slideNumber` or `/?slide=N` as input state
- once the slide is resolved, the page canonicalizes the URL to flat routing (`/N`) while preserving non-`slide` query params
- invalid/missing requested slides still fall back to the first active slide, but canonicalization now happens from inside the already-mounted deck route

## Why this fixes the issue

The app now has three independent protections:

1. **Explicit readiness signaling** — the watchdog stands down once React paints.
2. **Meaningful boot shell** — the initial document is visibly non-empty before React mounts.
3. **Direct root-route mount** — `/` no longer depends on a fragile redirect-only boot step before the deck route exists.

That combination removes both the false-positive blank-root path and the root-entry stall that could leave the shell on-screen.

## Files changed

- `index.html`
- `src/App.tsx`
- `src/pages/SlideDeckPage.tsx`

## Prevention

- Keep `window.__previewBoot__` as a versioned contract whenever boot instrumentation changes
- Prefer direct route mounts over redirect-only entry routes during boot
- Any intentional boot/suspense shell must be tagged as meaningful UI for blank-screen heuristics
- When touching boot diagnostics, verify both:
  - `/:slideNumber`
  - `/`

## Follow-up checks

- Confirm `/` redirects to `/1` without blank-root overlay
- Confirm `/preview-diagnostics` still opens and reports cleanly
- Confirm watchdog overlay includes boot timeline if a real future boot failure occurs
