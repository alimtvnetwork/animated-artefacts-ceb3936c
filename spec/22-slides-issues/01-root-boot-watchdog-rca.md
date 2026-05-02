# 01 — Root boot watchdog false blank-root on `/`

## Summary

The preview sometimes raised `blank-root` on the root route (`/`) even though the bundle was present and the app could render slides after navigation.

## User-visible symptoms

- Full-screen runtime overlay with:
  - `kind: blank-root`
  - `message: #root is still empty after preview boot watchdog timeout.`
- Slides not visible when opening `/`
- Inconsistent diagnostics because boot timing hooks were partially missing

## Evidence

- Runtime error payload reported from `index.html boot watchdog`
- `src/main.tsx` still called:
  - `previewBoot?.mark("...")`
  - `previewBoot?.markRendered?.()`
- But `index.html` only exposed:
  - `markMainLoaded`
- Therefore readiness/timing instrumentation had regressed to a partial API
- `src/App.tsx` routed `/` through `<Navigate />`, which can produce no meaningful DOM for the first frame while redirecting

## Root causes

### 1) Boot API regression between `index.html` and `src/main.tsx`

`main.tsx` expected a richer `window.__previewBoot__` contract (`mark`, `markRendered`) but `index.html` had been reduced to only `markMainLoaded`.

Impact:

- first-render readiness was never signaled
- boot timing milestones were not recorded
- the watchdog had less information and no explicit "React painted" completion signal

### 2) Root route (`/`) used a redirect that can render an empty frame

`/` rendered `RootSlideQueryRedirect`, which returned `<Navigate />`.
`<Navigate />` performs navigation but does not guarantee visible content in the current frame.
During cold boot, this left `#root` effectively empty long enough for the watchdog/fallback heuristics to classify the app as blank.

Impact:

- `/` was more likely than `/:slideNumber` to trigger false blank-root reports
- the issue reproduced even when the slide deck itself was healthy

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

### `src/App.tsx`

- changed `/` boot behavior to avoid a visually empty redirect frame
- `RootSlideQueryRedirect` now:
  - computes the target slide route immediately
  - preserves non-`slide` query params
  - uses `window.location.replace(target)` in an effect
  - renders a visible `RouteFallback` shell while redirecting

## Why this fixes the issue

The app now has two independent protections:

1. **Explicit readiness signaling** — the watchdog stands down once React paints.
2. **Visible root-route fallback** — `/` no longer spends its initial frame rendering effectively nothing.

That combination removes the false-positive path that was producing blank-root on normal cold boot.

## Files changed

- `index.html`
- `src/App.tsx`

## Prevention

- Keep `window.__previewBoot__` as a versioned contract whenever boot instrumentation changes
- Avoid null-render redirects on first-load entry routes
- Prefer a visible shell/fallback on any route that may redirect during boot
- When touching boot diagnostics, verify both:
  - `/:slideNumber`
  - `/`

## Follow-up checks

- Confirm `/` redirects to `/1` without blank-root overlay
- Confirm `/preview-diagnostics` still opens and reports cleanly
- Confirm watchdog overlay includes boot timeline if a real future boot failure occurs
