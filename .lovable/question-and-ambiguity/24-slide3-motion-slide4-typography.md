# 24 — Slide 3 step motion + slide 4 step typography parity

**Date:** 2026-04-30
**Trigger:** Presenter feedback after v1.1.0 typography pass.

## Verbatim observation
> "Slide 3 text size looks all right. Slide 4 step text looks a little small —
> make it bigger like slide 3. Also slide 3 has very less animation between
> steps; if we could have a little bit of animation like the 3D slide, it
> would feel very nice. Write the spec first, save to memory, then apply."

## Decisions made (no question asked)

1. **Treat as a parity contract, not two separate fixes.** Both slides are
   "step-driven" types and should share typography tokens + a comparable
   motion budget. Codified as `mem://design/step-row-motion-parity`.

2. **Slide 4 typography:** introduce a 3D-rail-specific token family
   (`--step-title-3d-active/-adjacent`, `--step-eyebrow-3d`,
   `--step-subtitle-3d`) sized ~30% smaller than slide 3's vertical
   timeline (the 3D rail shows multiple cards, slide 3 shows one focal
   row). Same authoring grammar so future deck-wide bumps apply to both.
   Replace `text-3xl` / `text-base` / `text-[12px]` with token-driven
   inline `fontSize`.

3. **Slide 3 motion:** add `font-size` + `transform` to `.step-row
   .step-title` transition list (700ms ease-out), plus a one-shot
   gold/ember swipe pulse via `::before` keyframe on the active row.
   Honors `prefers-reduced-motion: reduce` (collapses to current
   instant snap).

4. **Out of scope:** slide 4 marker geometry, slide 3 lattice, the
   v1.1.0 deck-wide bump itself.

## Acceptance (from spec)

- Slide 4 active step's character height within ±10% of slide 3's at
  1280×720 preview.
- Slide 3 step change shows smooth grow + lift + swipe pulse, no size pop.
- Reduced motion: opacity/color crossfade only (current behavior).

Full spec: `spec/22-slides-issues/26-slide3-step-motion-and-slide4-step-typography.md`.
Memory rule: `mem://design/step-row-motion-parity`.
