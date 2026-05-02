# 59 — fix-drift on two stale assertions (Window 2 / task 23)

**Date:** 2026-05-01
**Trigger:** `next fix-drift` — clean up the two pre-existing test failures uncovered while running the full suite during task 22.

## Failures

Both were tests that lagged production code:

### A) `transitionTimingByType.test.ts` — reduced-motion safe duration

- Asserted `r.duration === 0.01` (10 ms).
- Production constant `SAFE_TRANSITION` in `src/slides/motionPreferences.ts` is `{ duration: 0.15, ease: 'linear' }` per `spec/22-slides-issues/23-motion-feels-robotic-under-reduced-motion.md` — a 10ms crossfade was perceptually a robotic snap.
- The same module has comments documenting the 150 ms master rule. The test simply hadn't been updated when the constant was raised.
- **Fix:** assert `0.15`, with a comment pointing at the issue spec so the next reader doesn't "fix it back".

### B) `brandChromeInheritance.test.ts` — auto-inset default

- Asserted `--brand-inset-x` contains `218` for `DEFAULT_PRESET_SETTINGS`.
- Production default `logoScale` is `0.765` (not `0.85`). `computeAutoBrandInsetX(0.765) = round(218 * 0.765 / 0.85) = round(196.2) = 196`. The CSS variable is correctly emitted as `max(48px, 196px)`.
- The 218 anchor is the `LOGO_INSET_ANCHOR` sweet-spot (only hit when `logoScale === 0.85`), not the default.
- **Fix:** assert `196` and re-write the comment to call out the anchor vs default distinction so a future logoScale tweak surfaces clearly.

## Result

- Both files now pass.
- Full suite: **697 / 697 ✓ across 42 test files** (up from 695/697 with 2 fail).
- No production code touched — these were spec-correct values; only the assertions were stale.

## Ambiguity

None. Both failures were textbook "test-not-impl" drift; the spec/22 issue file and the `LOGO_INSET_ANCHOR` constant unambiguously document the current values.
