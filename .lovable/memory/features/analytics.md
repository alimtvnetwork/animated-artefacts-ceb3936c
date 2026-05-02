---
name: Analytics local telemetry
description: Privacy-first in-browser ring buffer at `src/slides/analytics/recorder.ts` records slide-enter/exit/click-reveal/session events to localStorage; never phones home. Opt-in via `?analytics=1` or `/analytics` toggle. Review at `/analytics`.
type: feature
---
The deck records local-only rehearsal telemetry. Architecture mirrors the proven `ColorTokenDebugOverlay` / `reducedMotionToggle` pattern: pub/sub singleton + localStorage + `?analytics=1` URL flag.

**Module:** `src/slides/analytics/recorder.ts`
**Page:** `src/pages/AnalyticsPage.tsx` mounted at `/analytics` (lazy-loaded).

**Event kinds:** `session-start`, `session-end`, `slide-enter`, `slide-exit` (carries `dwellMs`), `click-reveal` (carries `revealSlug`), `theme-change`.

**Wiring:**
- `SlideDeckPage` fires session-start/end (mount/beforeunload) and slide-enter/exit per `[current]` effect.
- `ClickRevealExpandPanel` fires `click-reveal` once per `payload` open.

**Privacy invariants — never break:**
- Disabled by default. `recordEvent` is a no-op when off.
- No network calls anywhere in the analytics module — review surfaces are local-only.
- Ring buffer capped at 2000 events (drops oldest), keys: `riseup.analytics.events`, `riseup.analytics.enabled`.
- Export is a client-side JSON download blob — never auto-uploaded.

When adding new event kinds: extend `AnalyticsEventKind` union + `AnalyticsEvent.data` shape + summarizer if it should affect dwell rollups. Keep events flat/serializable — no Date objects, no functions.

Tests: `src/test/analyticsRecorder.test.ts` (8 tests).
