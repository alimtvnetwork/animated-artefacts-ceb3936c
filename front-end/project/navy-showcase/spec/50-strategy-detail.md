# 50 — Strategy Detail (click-reveal)

**Type**: `KeywordSlide`
**Reached from**: capsule on slide 2 **or** step 2 on slide 3

## Purpose
Single-target click-reveal child for both **Strategy** entrypoints in this deck.
`isClickReveal: true` keeps the slide outside the linear `1→2→3→4→5→6→7→8` flow;
it only renders when triggered from a `revealSlide: 50` reference.

## Why one slide for two parents
`parentSlide: 2` picks the Pillars capsule as the canonical "back" target so
the controller's back arrow always returns to /2. The /3 step path also works
— click-reveal is a global navigation, not a parent-scoped one — but the back
button homes to /2.

## Animation contract
- `transition: PushIn` — depth pop signals "you went deeper".
- `textAnimation: Bounce` — Keywords settle with a subtle overshoot, matches
  the title slide's energy and tells the audience this is a deliberate dive.
