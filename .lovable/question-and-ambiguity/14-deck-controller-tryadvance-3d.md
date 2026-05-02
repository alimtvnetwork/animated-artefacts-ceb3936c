# 14 — Deck/controller Next/Prev drives StepsChain3D step changes (no timers)

**Date:** 2026-04-29
**Status:** Verified, no code change required.

## Request
"Implement explicit support for deck/controller Next/Prev to drive step changes
on slide stage four without any background timer behavior."

## Audit result
The wiring is already complete end-to-end and matches spec 61:

1. `StepsChain3DSlide` (`src/slides/types/StepsChain3DSlide.tsx`)
   - Defines `tryAdvance(dir: 'forward' | 'backward'): boolean` (lines 515–527)
     that mutates `active` via the same reducer used by card clicks. Returns
     `false` at chain edges so the deck advances to a sibling slide.
   - Exposes it through `useImperativeHandle(ref, () => ({ tryAdvance, ... }))`
     (lines 529–550), satisfying the `FocusTimelineHandle` contract.
   - Sets `shouldFocusActive.current = false` on deck-driven advances so DOM
     focus stays with the controller button.

2. `SlideDeckPage` (`src/pages/SlideDeckPage.tsx` lines 114, 126) calls
   `focusRef.current?.tryAdvance('forward' | 'backward')` first on every
   Next/Prev event from keyboard, controller pill buttons, and deck `next()`
   helper (line 212). Sibling-slide navigation only fires when the slide
   returns `false`.

3. No `setTimeout` / `setInterval` for step movement remains in the slide.
   The autoplay timer was removed in task 12; task 13 disabled deck
   hold-autoplay specifically for slide 4. Tests in
   `src/test/stepsChain3DDepthHierarchy.test.ts` already assert no timers
   are scheduled.

## Ambiguity
None — request matches the existing implementation. No new behavior to add.
