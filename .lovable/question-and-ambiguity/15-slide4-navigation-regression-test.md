# 15 — Slide 4 navigation regression test

**Date:** 2026-04-29
**Status:** Implemented; 4/4 tests pass.

## Request
Add a focused regression test for the slide-4 click/keyboard navigation issue
that also verifies the step does not auto-advance.

## What the test asserts
`src/test/stepsChain3DNavigation.test.tsx`:

1. **No auto-advance** — after `vi.advanceTimersByTime(10_000)` with no input,
   the active card stays at index 0 (spec 61: presenter-driven only).
2. **Click drives step** — clicking each `[data-chain3d-card]` flips
   `data-active="true"` to that card.
3. **Keyboard drives step** — `ArrowRight` / `ArrowLeft` on the chain `role=list`
   move the active step by exactly one in each direction.
4. **Deck/controller `tryAdvance`** — walks one step per call and returns
   `false` only at chain edges (so deck advances to sibling slide).

## Ambiguities resolved silently
- jsdom lacks `Element.prototype.animate` and the WAAPI `ready`/`finished`
  promises consumed by the slide. Stubbed in `beforeEach` to a resolved no-op
  so passive effects mount without throwing.
- `SlideSpec` requires several non-content fields (`slideNumber`,
  `transition`, etc.). Filled with neutral defaults; cast through `unknown`
  to satisfy the strict shape without affecting behavior under test.
