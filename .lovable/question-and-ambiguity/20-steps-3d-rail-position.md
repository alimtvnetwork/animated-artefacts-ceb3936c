# 20 — StepsChain3D rail position

**Date:** 2026-04-30
**Mode:** No-Questions (20/40)

## User request (verbatim)
> "Uh, for the 3D steps, just remove the line. I think that that would be good.
> Or keep the line in front of the numbers. That would be good. Just put the
> line, uh, in the middle of the numbers. That would make it more better."

## Ambiguity
Three competing options stated in one breath:
1. Remove the rail entirely.
2. Keep the rail but render it in front of the numbers.
3. Move the rail through the center of the numbers ("in the middle").

The final phrase landed on option 3 ("Just put the line in the middle of
the numbers. That would make it more better."), so that's what was
implemented.

## Decision
- `layoutCfg.railLeftPx` changed from `markerSize + railOffset` (right of
  marker) to `markerSize / 2` (marker center axis).
- Rail z translated from `-200px` (deep behind) to `0px` (marker plane)
  with a `-0.5px` X nudge so the 1px line sits exactly on the half-pixel
  marker axis. Opaque marker disks naturally mask the rail where they
  overlap, so visually the line "runs through" the numbers.
- Rail color bumped from `gold/0.35` → `gold/0.55` for legibility against
  the marker fills.
- `rowGapPx` (flex gap between marker and text column) unchanged so text
  spacing is identical to before.

## Reversal hint
If the user later asks for option 1 (remove): delete the rail `<div>` at
`StepsChain3DSlide.tsx:1141`.
If they ask for option 2 (in front of the numbers): change `translateZ(0px)`
to `translateZ(80px)` and bump the rail color to `gold/0.85` so it reads
clearly above the marker disks.
