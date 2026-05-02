# 60 — slide telemetry / analytics (Window 2 / task 24)

**Date:** 2026-05-01
**Trigger:** `next analytics`.

## What shipped

Privacy-first local-only telemetry — no network, no SDK.

1. **`src/slides/analytics/recorder.ts`** — pub/sub singleton mirroring the `reducedMotionToggle` pattern: `localStorage` + `?analytics=1` URL flag. Event kinds: `session-start/end`, `slide-enter/exit` (with `dwellMs`), `click-reveal` (with `revealSlug`), `theme-change`. Ring buffer caps at 2000 (drops oldest). `recordEvent` is a no-op when disabled. Pure-function `summarizeDwell` aggregator.

2. **Deck instrumentation** — `SlideDeckPage` fires session-start on mount + session-end on `beforeunload`/unmount + slide-enter/exit on every `[current]` change. `ClickRevealExpandPanel` fires `click-reveal` once per payload open (reads slide off URL since the panel is deck-mounted).

3. **`/analytics` page** — `src/pages/AnalyticsPage.tsx`, lazy-loaded route in `App.tsx`. Master toggle, summary chips (event/slide/reveal/dwell totals), sortable per-slide dwell table (visits/totalDwell/meanDwell/reveals), JSON export, raw event log. Token-themed.

4. **8 new tests** — `src/test/analyticsRecorder.test.ts` covers default-off invariant, enable-flag persistence + URL mirror, recording, clear, ring-buffer cap, summary math (multi-visit, never-exited, sort order). All pass.

## Result

**Full suite: 705 / 705 ✓ across 43 files** (was 697/697 last loop, +8 new analytics tests).

## Ambiguity

None. Privacy-first design was the obvious shape given the project's no-Lovable-branding / no-external-pings constitutional rules in core memory.
