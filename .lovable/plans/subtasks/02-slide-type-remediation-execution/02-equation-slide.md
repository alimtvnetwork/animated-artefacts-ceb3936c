# Subtask: EquationSlide + prerender

**Slug:** equation-slide
**Parent:** 02-slide-type-remediation-execution
**Status:** pending
**Created:** 2026-06-06

## Goal
Implement `EquationSlide` displaying prerendered math, plus `scripts/prerender-equations.ts` to bake KaTeX HTML at build time (no runtime KaTeX cost).

## Details
- New component `src/slides/types/EquationSlide.tsx`; register in slide-type map and `SlideType` enum.
- `scripts/prerender-equations.ts` walks every deck slide of type `EquationSlide`, renders the `latex` field to static HTML, writes alongside the slide JSON (or a generated cache), and is invoked from preflight/build.
- Component consumes prerendered HTML; if missing, log via `src/lib/errors.ts` and fall back to the raw LaTeX string — no silent catch.
- Token-themed text color/weight via existing semantic classes; reduced-motion = opacity-only entry.
- Roving-tabindex over equation terms wired in M-05 (parent step 18).

## Verification
Sample equation slide renders prerendered output; running the script is idempotent; contract test asserts enum + CATALOG membership.
