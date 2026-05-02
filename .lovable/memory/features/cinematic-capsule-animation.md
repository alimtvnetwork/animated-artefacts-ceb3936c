---
name: cinematic-capsule-animation
description: New `cinematicCapsules` text-animation preset — blur→focus + slide-up + spring overshoot. Used on CapsuleListSlide via content.animations.capsules.
type: feature
---

## Sequence

Per-capsule: `opacity 0, y 32px, scale 0.92, filter blur(8px)` →
`opacity 1, y 0, scale 1, filter blur(0)` over 0.55s with spring overshoot
(`stiffness 220, damping 18`).

Container: `staggerChildren 0.09`, `delayChildren 0.25` (waits for title).

## Reduced motion

Drop the blur, shorten to 0.2s opacity fade, reduce stagger to 0.04, no
spring overshoot.

## Files

- `src/slides/textAnimations.ts` — `cinematicCapsules` preset added.
- `src/slides/types/CapsuleListSlide.tsx` — also gets a radial amber
  glow background (no icons) matching TitleSlide v2 vibe but offset to
  `50% 60%` so it sits behind the capsule cluster.

## Rule

Hard-coded blur values are expensive on mobile. The preset's `transition`
already shortens for reduced-motion via media query — never re-enable
blur in components themselves.
