# 12 — StepsChain3D click/keyboard-only navigation

## Ambiguity
The request says slide stage four should be based on click or keyboard action and should not go into "auto direction".

## Decision
Treat slide 4 / `StepsChain3DSlide` as presenter-driven only:

- Remove the internal timer-based step advance.
- Keep explicit card clicks, scrubber clicks, focused-card arrow/Home/End roving, deck/controller Next/Prev via `tryAdvance`, and animation scrubber handles.
- `replay()` resets to step 1 but does not restart any autoplay.

## Spec-first note
Updated the system spec (`spec/21-slides-system/61-steps-chain-3d.md`) and slide-specific spec (`spec/26-slide-definitions/showcase/04-process-3d.md`) before changing runtime code.
