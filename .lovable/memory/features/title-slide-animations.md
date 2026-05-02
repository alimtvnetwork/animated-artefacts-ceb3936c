---
name: title-slide-animations
description: TitleSlide enter cascade — explicit per-block delays (glow 0.20s, eyebrow 0.25s, title 0.40s, subtitle 0.85s, capsules 1.10s + 0.09s/index). Reduced-motion preserves rhythm via reducedFade preset.
type: feature
---

## Step timeline

The Title Slide enter is a 5-beat cascade driven by **explicit `delay`
values**, not container stagger (stagger breaks under conditional
rendering and reduced-motion swaps).

| Beat | Delay | Block | Default preset |
|---|---|---|---|
| 1 | 0.20s | Glow + ambient icons | opacity wrapper |
| 2 | 0.25s | Eyebrow              | `fadeIn` |
| 3 | 0.40s | Title                | `titleSlide` (scale-spring, no translate) |
| 4 | 0.85s | Subtitle             | `fadeIn` |
| 5 | 1.10s + i*0.09s | Capsule i  | `cinematicCapsules` |

Total enter: ≈1.65s. Exit: 0.55s plain stage transition (no reverse).

## Reduced motion

`useReducedMotion()` swaps every preset for `reducedFade` (0.18s
opacity flip) but the **delay schedule is preserved** — audience still
perceives the cascade rhythm without movement.

## Why explicit delays

Container `staggerChildren` is non-deterministic when `eyebrow` /
`subtitle` / `capsules` are conditionally rendered. Hard-coded delays
guarantee the same beat regardless of which fields the deck supplies.

## Reference

- Spec: `spec/slides/31-title-slide-animations.md`
- Preset: `titleSlide` + `reducedFade` in `src/slides/textAnimations.ts`
- Component: `src/slides/types/TitleSlide.tsx`
