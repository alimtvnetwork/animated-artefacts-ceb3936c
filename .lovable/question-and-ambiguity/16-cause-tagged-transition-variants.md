# 16 — Cause-tagged transition variants on slide 4

**Date:** 2026-04-29
**Status:** Implemented spec-first; 7/7 tests pass.

## Request
Wire the animation/transition behavior so each step change uses the correct
click-driven animation variant on slide stage four (StepsChain3DSlide).

## Spec change first
`spec/21-slides-system/61-steps-chain-3d.md` §3.6 (new) defines four causes —
`click`, `keyboard`, `controller`, `programmatic` — and a per-cause emphasis
table for card overshoot, marker overshoot, and revolver tilt. Spring physics
(damping 14, stiffness 180, mass 1) are unchanged so the deck stays consistent.

| Variant     | Card overshoot | Marker overshoot | Revolver tilt | Press-pulse |
| ----------- | -------------- | ---------------- | ------------- | ----------- |
| click       | +0.06          | 0.30             | 5°            | ON          |
| keyboard    | +0.04          | 0.25             | 4°            | OFF         |
| controller  | +0.04          | 0.25             | 4°            | OFF         |
| programmatic| +0.03          | 0.18             | 3°            | OFF         |

## Implementation
`src/slides/types/StepsChain3DSlide.tsx`:
- Added `causeRef: AdvanceCause` + `setCauseAndAdvance(idx, cause)` so every
  state mutation is tagged.
- `handleCardClick` → `'click'`, `handleScrubberClick` → `'click'`,
  `handleChainKeyDown` → `'keyboard'`, `tryAdvance` → `'controller'`,
  `setStep`/`replay` → `'programmatic'`.
- WAAPI effect consumes `causeRef.current` (then resets to `'programmatic'`)
  and selects a `VARIANT` envelope used for: revolver tilt keyframe, card
  becoming-active overshoot, and marker bubble-up overshoot.
- Inspector override (Shift+I) for marker overshoot still wins over the
  variant when set, so dev tuning is unaffected.

## Tests
`src/test/stepsChain3DNavigation.test.tsx` (now 7 tests, all green):
- Originals: no-auto-advance, click step, keyboard ←/→ step, `tryAdvance`
  edge return values.
- New: capture `Element.animate` calls and assert the chain `rotateX` middle
  keyframe is 5° for click, 4° for keyboard, 4° for `tryAdvance`.

## Ambiguities resolved silently
- The press-pulse on the clicked card was already wired via `data-pulse`
  re-fire in `handleCardClick`; spec entry "ON for click" matches existing
  behavior — no extra DOM change needed.
- Reduced motion stays cause-agnostic (180ms opacity crossfade) per §3.7.
