---
name: hero-fullscreen
description: Fullscreen polish rules — left-edge alignment with logo, blurred/gray upcoming steps, 1s active slide-in, softer glow, more visible homepage icons, slightly muted gold.
type: design
---

## Spec
`spec/slides/30-fullscreen-layout-polish.md` (v0.36.0).

## Layout (StepTimelineSlide in fullscreen)

- Outer column padding **`px-10`** — matches BrandHeader logo edge.
  Never `px-12` or larger; the logo sight line breaks otherwise.
- Title block: **`mb-12`** below it before the two-column body. This
  gap is intentional — do not collapse it.
- Two-column grid: **`[0.58fr_0.42fr]`** with **`gap-10 xl:gap-14`**.
  Right column gets **`lg:pl-4`** so the description starts just
  inside the timeline's gold rule.

## Step state visuals

| State    | filter blur | color           | opacity |
|----------|-------------|-----------------|---------|
| active   | 0           | white           | 1.00    |
| adjacent | 1.2px       | hsl(0 0% 78%)   | 0.55    |
| far      | 2.5px       | hsl(0 0% 62%)   | 0.30    |

Blur is a CSS filter on `.step-row[data-state]`. Reduced motion KEEPS
the blur (static cue) but skips the transition.

## Animation

`--step-text-duration: 1000ms` (down from 1500). Right description
column matches with `x: { duration: 1.0 }` so chain row + description
land together. Easing fixed at `cubic-bezier(0.19, 1, 0.22, 1)`.

## Glow (AmbientBackground)

Inner stop alpha 0.55, mid 0.25 (was 0.85 / 0.45). Hue 28 65% 10%
(was 28 75% 11%). The halo is a hint of warmth, not a spotlight.

## Homepage icons

`count=18, opacity=0.10, parallax=24`. NEVER drop opacity below 0.08
on the homepage — at 0.05 they're invisible on a projector.

## Gold token

`--gold: 40 88% 50%` (was `40 96% 48%`). Slightly less saturated.
Use this token everywhere — never a literal hex. Keep `--gold-glow`
at `42 100% 62%` (the highlight is the only place that should pop).

## Why these are locked

These were dictated by the user after seeing the fullscreen render —
violating any of them regresses to the previous state and they will
notice immediately.
