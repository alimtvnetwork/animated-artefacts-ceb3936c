# 42 — Phase 5 cleanup: M-02 / M-03 / M-05

**Date:** 2026-05-01
**Window:** 2 (entries 02–04)
**Outcome:** Implemented. No surface ambiguity remained — each item had a single concrete target.

## M-02 — Per-slide sound override JSON path

- Authors and the LLM CATALOG had two plausible readings of "where does sound go" (`slides[i].sound` vs `slides[i].content.sound`). Spec 21 implied the top-level path but never said it canonically.
- Resolution: new doc `spec/21-slides-system/64-per-slide-sound-override.md` — fixes path, precedence chain (slide.sound.mute → slide.sound → slide-type defaults → manifest defaults → system), step-level path, and the table of invalid paths.
- No runtime change.

## M-03 — Motion variety advisory

- New script `scripts/motion-variety-audit.ts`. Walks `front-end/project/<slug>/data/slides/*.json`. Warns (never fails) when a deck of ≥4 slides uses a single `transition` or `textAnimation` value on >60% of slides.
- Advisory only — not wired into CI yet (separate decision).

## M-05 — Roving tabindex on Equation terms + DataTable rows

- New hook `src/slides/hooks/useRovingTabindex.ts`: shared flat-list keyboard nav (Arrow keys + Home/End, single Tab stop).
- Wired into `EquationSlide` (term spans, with `role="group"` + `aria-roledescription`) and `DataTableSlide` (table rows).
- ChecklistSlide already had its own roving impl from spec 62 — left untouched.

## Files

- created `spec/21-slides-system/64-per-slide-sound-override.md`
- created `scripts/motion-variety-audit.ts`
- created `src/slides/hooks/useRovingTabindex.ts`
- edited `src/slides/types/EquationSlide.tsx`
- edited `src/slides/types/DataTableSlide.tsx`
