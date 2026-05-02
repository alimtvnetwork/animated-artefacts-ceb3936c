# 43 — Equation (sample)

**Type:** `EquationSlide`
**Seq:** 43
**Narrow idea:** Compound growth in one line.

## Why it is narrow
One equation. Variable definitions appear as two flanking labels — not a derivation. A derivation would be a step timeline of single-equation slides.

## Capsules
Two flanking labels: `cream` (`P = principal`) and `ember` (`t = years`). The base `r` is intentionally narrated, not labeled — narrow by design.

## Animation
- Transition: `FadeIn`.
- Text animation: `Stagger` — terms `A`, `P`, `factor`, `exp` fade in 80ms apart, total ≤ 0.6s.
- Reduced motion: all terms visible at once, no stagger.

## Image refs
None. KaTeX HTML is pre-rendered at build time via `scripts/prerender-equations.ts` (Phase 3).

## Spec source
- `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md` §2.4
