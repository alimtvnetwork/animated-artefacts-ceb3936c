# 55 — StepsChain3D test suites repaired (12 fails → 0)

**Date:** 2026-05-01
**Trigger:** `next steps-3d-fix`

## Failures + root causes

### 1. `stepsChain3DResponsiveLayout.test.tsx` — 11 fails
Tests encoded the **pre-#20** rail contract (`railLeft = markerSize +
railOffset`, rail past marker right edge) and the **pre-#22** marker max
(96). Renderer had since shifted to:
- **Rail on marker-center axis** (`railLeft = markerSize / 2`, memory rule
  saved at #20).
- **Marker max raised to 120** (memory rule + RCA at #22 — needed for
  FitStage downscale legibility).
- **Default marker 72** (was 56).

The selector `div.absolute.w-px` no longer matched because the rail is now
`<div className="… absolute …" style={{ width: '2px' }}>` (Tailwind class
dropped in favor of an inline style for parity with `railTop`/`railBottom`
declarations).

### 2. `stepsChain3DDepthHierarchy.test.ts` — 1 fail
`expect(RENDERER_SRC).not.toMatch(/\bsetTimeout\s*\(/)` — broad guard from
#12's "no internal auto-direction timer" memory rule. The motion-mode
toggle (`Shift+M` / on-screen button) flashed a 1.6s pill via
`window.setTimeout`. Unrelated to step movement, but the regex is
intentionally **structural** ("no timer functions in this module ever").

## Fixes

### Renderer
- Added `data-testid="chain3d-rail"` + `chain3d-rail` className to the rail
  `<div>` (`StepsChain3DSlide.tsx` line ~1462). Stable hook for both tests
  and the centerline diagnostic overlay.
- Replaced `cycleMotionMode`'s `setTimeout` with an `rAF` deadline loop:
  ```ts
  const deadline = performance.now() + 1600;
  const tick = (now: number) => {
    if (now >= deadline) { setMotionPillVisible(false); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  ```
  Same UX (1.6s pill flash). Aligns with the no-timer ethos for the whole
  module — `setTimeout` is now structurally banned in
  `StepsChain3DSlide.tsx`.

### Tests
Rewrote `stepsChain3DResponsiveLayout.test.tsx` to match the current
contract:
- Rail X = `markerSize / 2` (center axis), trimmed by `markerSize / 2` on
  top + bottom.
- Default marker = **72**, default railLeft = **36**.
- Custom case: marker 80 → railLeft 40.
- Clamp ceiling: marker 9999 → **120** (post-#22), railLeft = **60**.
- Selector switched from `div.absolute.w-px` → `[data-testid="chain3d-rail"]`.
- Invariant simplified: `expect(railLeft).toBe(markerSize / 2)` —
  one-liner that captures the post-#20 contract directly.

## Final state
- `stepsChain3DResponsiveLayout.test.tsx`: **11 / 11 passing**.
- `stepsChain3DDepthHierarchy.test.ts`: **22 / 22 passing**.
- Combined: **33 / 33** (was 21 / 33).
- TypeScript: tsc clean.
- `hardcodedWhiteAudit.test.ts` (#54): still 14/14.

## Why update tests vs. revert renderer
The renderer changes (#20 rail-on-center, #22 marker-size bump) are **memory-
locked design decisions** with documented rationale and visible UI impact.
Tests fell out of sync because they were written against the pre-#20
contract. Test suites are documentation of contracts; they must follow
the contract, not the other way around.
