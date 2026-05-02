# 25 · Slide 4 detail-panel slide-in: broaden + slow

**Date:** 2026-04-30
**Trigger:** User: "the description section seems like some of the parts are hidden. Could you please broaden this part so that it slides in… from a little bit broadened side of the left… and slow down the animation a little bit."

## Diagnosis

`StepsChain3DSlide` right `<aside>` had `overflow-hidden`, which **clipped** the title/capsules during the entry animation, so the start of each travel was invisible until the content reached the panel edge — that is the "some parts are hidden" symptom.

`@keyframes chain3d-detail-in` started at only `translate3d(-32px, 0, 0)` for **360ms** with `cubic-bezier(0.22, 1, 0.36, 1)` — too short and too tight a travel for the cinematic feel the deck is going for.

## Decision

1. Remove `overflow-hidden` on the `<aside>` — the panel doesn't need to clip; it has no scroll content. Removing it lets the slide-in start fully off the panel's left edge without losing pixels.
2. Broaden the entry: keyframe `from` goes from `-32px` → `-120px`, `rotateY` deepens 6° → 8°, opacity hits 1 by 60% (so the text is visible the entire trip after the broad start).
3. Slow it down: duration 360ms → **620ms**, easing softened to `cubic-bezier(0.16, 1, 0.3, 1)` (smoother out-expo). Applied to capsule-text title, leading capsule pill, and the `meta` chip.
4. Recadenced the cascade so the staggered keyword pills still land **after** the title settles:
   - capsule cascade base delay: 120ms → **260ms**, per-pill stagger 70ms → **90ms**
   - meta chip delay: 120ms → **220ms**

`prefers-reduced-motion` still collapses everything to no-animation.

## Files

- `src/slides/types/StepsChain3DSlide.tsx` — aside `overflow-hidden` removed; 3 inline `chain3d-detail-in` durations updated; cascade timings recadenced; `@keyframes chain3d-detail-in` broadened (-120px / 8°) with 60% opacity hold.

## Why no question

No-questions mode active (25/40). User gave a clear directional ask ("broaden the slide-in from the left, slow it down"); chose conservative numbers (-120px, 620ms) that match the deck's existing cinematic spring vocabulary. If the travel feels too far or too slow, it's a one-line tune.
