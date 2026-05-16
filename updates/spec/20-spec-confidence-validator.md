# 20 — Spec confidence validator (pre-render gate)

**Date:** 2026-05-16
**Scope:** `src/slides/specConfidence.ts`, `src/slides/loader.ts`, `src/test/specConfidence.test.ts`

## Why
The user asked for confidence that any newly authored slide actually conforms to the schema + animation rules before render. Existing checks (Zod schema, motion-variety, enum sanity) were scattered. This consolidates them into a single pre-render gate that produces a 0–100 score and a banded verdict.

## Change
- New `src/slides/specConfidence.ts` exporting:
  - `auditSpecConfidence(slides) → SpecConfidenceReport` — issues grouped by category, weighted score, band.
  - `assertHighConfidence(slides, min = 80)` — throws below threshold.
- Categories + penalties:
  - `contract` — hard (−10) — Zod `validateSlide` failures.
  - `unknown-enum` — hard (−10) — `transition` / `textAnimation` not in `SlideTransition` / `TextAnimation`.
  - `unknown-field` — soft (−2) — top-level field typos that `.passthrough()` silently absorbs (e.g. `transitions`, `notesText`). Compared against a `KNOWN_SLIDE_FIELDS` allowlist.
  - `motion-variety` — soft (−2) — adjacent linear slides with identical transition + textAnimation (reuses `detectMotionCollisions`).
- Bands: `excellent ≥95`, `good ≥80`, `fair ≥50`, `poor <50`.
- `src/slides/loader.ts` exports `specConfidence` and logs a one-line boot summary:
  `[deck] ✓ spec confidence: 100/100 (excellent) — 42 slide(s), contract:0 enum:0 field:0 motion:0`
- Vitest at `src/test/specConfidence.test.ts` (12 tests) covers clean baseline, each category, scoring math, banding, `assertHighConfidence`, and a parity guard that fails if a new `SlideSpec` field is added without updating `KNOWN_SLIDE_FIELDS`.

## Acceptance
- `bunx vitest run src/test/specConfidence.test.ts` → 12/12 pass.
- Boot logs include the one-line confidence summary for every deck.
- Authoring a new slide with a typo'd field surfaces an `unknown-field` warning + score deduction without breaking the deck.

## Files
- `src/slides/specConfidence.ts` (new)
- `src/slides/loader.ts` (export + boot log)
- `src/test/specConfidence.test.ts` (new)
