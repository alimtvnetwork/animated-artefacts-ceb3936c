---
name: step-row-motion-parity
description: Slide 3 (StepTimelineSlide) and slide 4 (StepsChain3DSlide) — and any future step-driven slide type — must share a single typography token set (`--step-title-*` for vertical timelines, `--step-title-3d-*` for 3D rails) and a comparable motion budget on step change. Sizes flow through tokens, not Tailwind utilities; size + lift + swipe pulse animate together on `data-state` change.
type: design
---

## Rule

Step-driven slide types are siblings. They must look and *move* like a
family on step change.

### Typography (token-driven, never Tailwind utilities)

| Slide              | Active step title         | Adjacent / upcoming        | Eyebrow / subtitle              |
|--------------------|---------------------------|----------------------------|---------------------------------|
| Slide 3 (vertical) | `var(--step-title-active)`   | `var(--step-title-adjacent)` / `--step-title-far` | `--step-eyebrow` / body tokens |
| Slide 4 (3D rail)  | `var(--step-title-3d-active)` | `var(--step-title-3d-adjacent)` | `--step-eyebrow-3d` / `--step-subtitle-3d` |

**Forbidden:** any `text-3xl`, `text-base`, `text-[12px]`, etc. on the
step label/title/subtitle inside either slide. New step-driven slide
types added later MUST introduce their own `--step-…-{variant}-…` tokens
sized to their layout density and reuse the same naming so deck-wide
bumps (the v1.1.0 +18%/+30% pass) apply to both automatically.

### Motion (step change)

When `data-state` flips on a step row/card, three properties animate
in concert over the same easing window:

1. `font-size` (700ms ease-out) — title grows from adjacent → active
   smoothly, no snap.
2. `transform: translateY(...) scale(...)` (700ms) — title lifts
   ~2–4px and scales ~1.5% so the eye reads depth/parallax.
3. One-shot gold/ember swipe pulse across the active title baseline
   (mirrors the rail pulse on slide 4) — fires exactly once per
   activation via animation-fill-mode + state-attr-driven keyframe
   restart.

Slide 4's existing rail pulse is the canonical reference for the swipe
color/timing.

### Variants (per-step entrance shape, v1.3+)

Step-driven slides MUST rotate the active-row entrance animation across
three shapes so a 6-step talk doesn't repeat the same motion six times:

| Variant     | Shape                                       | Reads as                  |
|-------------|---------------------------------------------|---------------------------|
| `lift`      | `translateY(6→0) scale(0.985→1.005→1)`      | calm 2D rise (anchor)     |
| `slide`     | `translate3d(-22→0px, 0, 0)`                | horizontal entry          |
| `parallax`  | `perspective(800) translate3d(0,4,-16) rotateY(-6→0deg)` | 3D depth tilt |

Selection is **deterministic by step index** via the shared helper
`src/slides/utils/stepMotionVariant.ts` (default rotation
`['lift','slide','parallax']`, wraps with `index % 3`). Random selection
is forbidden — re-renders, hot reloads, and back-navigation must yield
identical motion so the talk's rhythm is reproducible and reduced-motion
users get a consistent (suppressed) experience.

**Wiring contract:**

- **Slide 3** (`StepTimelineSlide`): set `data-motion-variant={stepMotionVariant(i)}`
  on each `.step-row`. CSS in `src/index.css` under
  `.step-row[data-motion-variant="…"][data-state="active"] .step-title`
  runs the matching `@keyframes step-row-{variant}-in`.
- **Slide 4** (`StepsChain3DSlide`): WAAPI accent on the becoming-active
  card BUTTON, keyed off `stepMotionVariant(active)`, fires for every
  cause (click, keyboard, controller, programmatic) — not gated to click.
  Layered on top of the existing click-variant flourish; both clear inline
  styles on `.finished` so the next transition starts clean.

### Reduced motion

`prefers-reduced-motion: reduce` collapses ALL motion layers (variant
included):
- font-size tween → 0ms (instant snap)
- transform removed
- swipe pulse suppressed
- per-variant entrance keyframes disabled (`animation: none !important`
  in the `.step-row[data-motion-variant=…]` overrides)
- opacity + color crossfade preserved (current behavior)

### Why this exists

2026-04-30: presenter feedback after the v1.1.0 typography pass —
slide 4 step labels still read smaller than slide 3 because slide 4
opted out of the `--step-title-*` tokens (it was authored against raw
Tailwind utilities). Same week: slide 3 step transitions felt flat
because `font-size` was missing from `.step-row`'s transition list, so
the active title size *snapped* while opacity crossfaded over 1.3s.
Both fixed in the same pass.

2026-04-30 (later): user feedback that the lift was visually correct
but six identical lifts in a row read as flat. Variants section added,
backed by the shared `stepMotionVariant` helper so siblings stay in
lockstep without copy-pasting rotation logic.

See [issue 26](../../../spec/22-slides-issues/26-slide3-step-motion-and-slide4-step-typography.md).
