# 13 — Slide 4 click reliability + deck hold-autoplay leakage

## Ambiguity
The report says CLICK is still not working and slide 4 goes into auto direction.

## Decision
Treat two runtime issues as in scope:

- Slide 4 must opt out of deck-level hold-to-autoplay; holding Enter cannot schedule repeated `next()` ticks on `StepsChain3DSlide`.
- The 3D chain must fit within the first viewport so all four step card buttons remain visibly and directly clickable, not hidden behind bottom chrome.

## Spec-first note
Updated `spec/21-slides-system/61-steps-chain-3d.md` and `spec/26-slide-definitions/showcase/04-process-3d.md` before runtime changes.
