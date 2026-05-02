# 36 — Phase 3: runtime for the 4 new slide types

**Date:** 2026-05-01
**Status:** Phase 3 done (lite). Mermaid + KaTeX deps deferred.

## What landed
- `src/slides/enums.ts` — 4 new `SlideType` values (count 17 → 21).
- `src/slides/types.ts` — extended `SlideContent` with `number/label/capsule/dataColumns/dataRows/tex/equationHtml/termIds/equationLabels/dbEntities/dbRelationships` plus 4 new spec interfaces.
- `src/slides/contracts.ts` — 4 Zod content schemas (NumberCallout caps `number`, DataTable caps `dataColumns ≤5 + dataRows ≤8`, Equation requires `tex|equationHtml`, DatabaseDiagram caps `dbEntities 2–5 + dbRelationships ≤6`). `SLIDE_CONTRACTS_VERSION` 3 → 4.
- `src/slides/hooks/useCountUp.ts` — rAF-based count-up with `linear / easeOutQuint / spring`, reads `--dur-count-fast/slow` from CSS, reduced-motion snaps.
- 4 new components in `src/slides/types/`: `DatabaseDiagramSlide.tsx` (theme-token SVG, auto-circle layout), `DataTableSlide.tsx` (35ms row stagger), `NumberCalloutSlide.tsx`, `EquationSlide.tsx` (whitespace-token Stagger fallback).
- `src/index.css` — `--dur-count-fast/slow` tokens + reduced-motion override + `.number-callout-value` / `.equation-host` / `.equation-term` (CSS keyframe) / `.data-table-narrow` semantic styles.
- `src/slides/SlideStage.tsx` — dispatch wired.
- `src/builder/fieldSchemas.ts` — 4 new entries + picker order + sensible defaults.
- `src/slides/fixtures.ts` — 4 valid fixtures + missing `StepsChain3DSlide` fixture (parity test now green).
- `front-end/project/sample/data/slides.json` + 4 slide JSONs migrated from `spec/26-slide-definitions/sample/`.
- `spec/21-slides-system/llm/CATALOG.json` — version 1.0.0 → 1.1.0, slideTypes count 17 → 21, 4 entries appended.

## Inferences (no-questions mode)
- **Mermaid not added.** `DatabaseDiagramSlide` ships a hand-rendered, theme-token SVG (auto-circle layout) instead of a 600KB Mermaid peer. Spec addendum 29 §2.1 still records Mermaid as the long-term renderer; this satisfies all CSS-token, reduced-motion, and density-cap rules without bundle bloat. Audit note added.
- **KaTeX not added.** `EquationSlide` falls back to whitespace-token spans with the `.equation-term` keyframe so Stagger plays correctly; `equationHtml` field is reserved for the future build-time prerender step.
- **Spring constants** for count-up: critically-damped envelope `1 - e^(-6t)·(1+6t)` (monotonic, no overshoot, terminates ≤ 1). Documented in `useCountUp.ts`.

## Verification
- `bunx tsc --noEmit` — clean.
- `vitest run contracts/slideFixtures/schema` — 58 passed.

## Remaining
Phase 4 (Major) + Phase 5 (Minor) per `audit/remediation-plan.md`.
