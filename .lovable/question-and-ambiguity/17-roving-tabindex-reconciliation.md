# 17 — Roving tabindex reconciliation on slide 4

**Date:** 2026-04-29
**Status:** Implemented; 10/10 nav tests pass.

## Request
Fix roving tabindex so keyboard arrow navigation always targets the active
step card correctly on StepsChain3DSlide.

## Defects fixed
1. **Stale focused card after non-keyboard advance.** When a user had focus
   on a chain card and the active index changed via click / scrubber tick /
   deck `tryAdvance`, focus stayed on the now-inactive card while
   `tabIndex=0` jumped to the new active card. The next ArrowRight roved
   from the wrong origin.
2. **Arrow-key hijack from non-card targets.** `handleChainKeyDown` reacted
   to any keydown that bubbled to the chain container, even from a focused
   scrubber tick or right-panel control inside the same subtree.

## Implementation
`src/slides/types/StepsChain3DSlide.tsx`:
- `handleChainKeyDown` now early-returns unless
  `e.target.closest('[data-chain3d-card]')` matches.
- The focus-handoff effect runs not only when `shouldFocusActive` is set,
  but ALSO when keyboard focus is currently on a chain card that is no
  longer the active one. This makes click / controller / scrubber-driven
  step changes always re-converge focus onto the new active card.

## Tests
`src/test/stepsChain3DNavigation.test.tsx` (now 10 tests, all green):
- Updated the existing keyboard tests to dispatch `keyDown` on the focused
  card (realistic input path required by the new guard).
- New: `tabIndex=0` is held by exactly one card, and follows the active
  index after a click.
- New: focusing card[0] then calling `tryAdvance('forward')` moves DOM
  focus to card[1] after the rAF flush, with the tab-stop on card[1] and
  card[0] back at `tabIndex=-1`.
- New: keydown whose target is the chain container (not a card) is
  ignored — active step does not change.

## Ambiguities resolved silently
- Keeping the rAF defer for the focus call so WAAPI transforms paint before
  the focus ring renders (consistent with the original behavior).
