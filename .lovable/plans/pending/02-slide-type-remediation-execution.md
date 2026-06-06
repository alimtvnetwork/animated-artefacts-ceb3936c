# Slide-type remediation execution (Phase 1–3)

**Slug:** slide-type-remediation-execution
**Steps:** 20
**Status:** pending
**Created:** 2026-06-06

## Context
Execute the open remediation backlog in `quality/audit/remediation-plan.md`: implement the four missing slide types (`DatabaseDiagramSlide`, `DataTableSlide`, `NumberCalloutSlide`, `EquationSlide`), extend the `SlideType` enum 17→21, migrate the deferred sample slides, then ship the Phase-2 guards and Phase-3 polish. Key files: `src/slides/**` (slide registry/components, `contracts.ts`/Zod enums, CATALOG.json), `front-end/project/sample/data/slides/`, `src/test/contracts.test.ts`, `.github/workflows/ci.yml`. Sequencing per the plan: A-01 → B-03; B-01..B-04 independent; B-05 atomic CATALOG bump; A-03/A-04 lock it in.

Coding task — must follow `.lovable/coding-guidelines.md`, `spec/coding-guidelines/**` if present, and any error-management folder under `spec/`; every catch logs via `src/lib/errors.ts`, no silent catch.

## Steps
1. Add `--dur-count-fast` / `--dur-count-slow` count-up duration tokens to `index.css` with `prefers-reduced-motion` overrides (A-01).
2. Implement `useCountUp` hook honoring the new tokens and reduced-motion (drives B-03).
3. Implement `NumberCalloutSlide` component + register in the slide-type map, using `useCountUp` (B-03).
4. Implement `DatabaseDiagramSlide` (Mermaid + semantic token theme). See ./subtasks/02-slide-type-remediation-execution/01-database-diagram-slide.md (B-01).
5. Implement `DataTableSlide` as the caps-enforced sibling of `TableSlide` (density budget enforced) (B-02).
6. Implement `EquationSlide` component (prerendered KaTeX output, token-themed). See ./subtasks/02-slide-type-remediation-execution/02-equation-slide.md (B-04).
7. Add `scripts/prerender-equations.ts` and wire it into the build/preflight pipeline (B-04).
8. Extend the `SlideType` Zod enum + `contracts.ts` to include the four new types (B-05).
9. Bump CATALOG.json slide-type count 17→21 with one entry per new type (B-05).
10. Migrate `spec/26-slide-definitions/sample/{40..43}.json` into `front-end/project/sample/data/slides/` and register in the deck manifest (B-06).
11. Add `densityCheck` assertions for `DataTableSlide`/`NumberCalloutSlide` to `src/test/contracts.test.ts` (A-02).
12. Implement `validateAgainstCatalog(deck)` + a dev-mode boot probe that warns on enum↔catalog mismatch (A-03).
13. Add a CI step in `.github/workflows/ci.yml` failing on `enums.ts` ↔ `CATALOG.json` drift (A-04).
14. Resolve issue #32 (collapsible sections + progress) surface ambiguity and record the decision in the relevant spec (M-01).
15. Document the per-slide sound-override JSON path in the sound spec (M-02).
16. Add `scripts/motionVarietyAudit.ts` advisory script (non-blocking report) (M-03).
17. Decide and document whether to deprecate the uncapped `TableSlide` post-`DataTableSlide` (M-04).
18. Extend the roving-tabindex pattern to Equation terms + DataTable rows (M-05).
19. Run the full suite + `bun run build`; capture before→after green signal for all new tests.
20. Bump minor version, add changelog/release notes, pin version in root readme, update project memory (slide-types catalog), then `mv` this file to `.lovable/plans/completed/02-slide-type-remediation-execution.md` flipping Status to completed.

## Verification
Each B-step verified by a rendered sample slide in the `sample` deck + a passing contract/density test; B-05 by enum count 21 and CATALOG parity test; A-03/A-04 by a deliberately-drifted fixture failing CI; final state by `bunx vitest run` fully green and a clean `bun run build`, plus visual QA of slides 40–43.

## Appended from prior pending tasks
- `01-slide-system-export-llm-overhaul.md` (pending) — controller top-right + import/export + LLM/theme guide overhaul (spec-only plan, separate track, left in `pending/`).
