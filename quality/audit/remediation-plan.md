# Remediation Plan

Grouped by phase. Each item: `Title` · `Severity` · `Effort` (S/M/L) · `DependsOn`.

## Phase 1 — Blocking (must-fix before next minor release)

| ID | Title | Severity | Effort | Depends |
|---|---|---|---|---|
| B-01 | Implement `DatabaseDiagramSlide` (Mermaid + token theme) | Blocking | M | — |
| B-02 | Implement `DataTableSlide` (caps-enforced sibling of TableSlide) | Blocking | S | — |
| B-03 | Implement `NumberCalloutSlide` + `useCountUp` + `--dur-count-*` tokens | Blocking | M | A-01 |
| B-04 | Implement `EquationSlide` + `scripts/prerender-equations.ts` | Blocking | M | — |
| B-05 | Extend `SlideType` Zod + CATALOG.json count 17→21 | Blocking | S | B-01..B-04 |
| B-06 | Migrate `spec/26-slide-definitions/sample/{40..43}.json` → `front-end/project/sample/data/slides/` | Blocking | S | B-05 |

## Phase 2 — Major (next minor version)

| ID | Title | Severity | Effort | Depends |
|---|---|---|---|---|
| A-01 | Add `--dur-count-fast/slow` tokens + reduced-motion overrides | Major | S | — |
| A-02 | `densityCheck` assertions in `contracts.test.ts` | Major | S | B-05 |
| A-03 | `validateAgainstCatalog(deck)` + dev-mode boot probe | Major | S | — |
| A-04 | CI step: fail if `enums.ts` ↔ `CATALOG.json` drift | Major | S | A-03 |

## Phase 3 — Minor (backlog / polish)

| ID | Title | Severity | Effort | Depends |
|---|---|---|---|---|
| M-01 | Resolve #32 (collapsible sections + progress) surface ambiguity at end of no-questions window | Minor | S | — |
| M-02 | Document per-slide sound override JSON path | Minor | S | — |
| M-03 | `motionVarietyAudit.ts` advisory script | Minor | S | — |
| M-04 | Decide whether to deprecate uncapped `TableSlide` post `DataTableSlide` migration | Minor | S | B-02 |
| M-05 | Extend roving-tabindex pattern to Equation terms + DataTable rows | Minor | S | B-02, B-04 |

## Sequencing notes
- **A-01 first**, then B-03 (count-up depends on tokens).
- **B-01..B-04 independent**, can ship in any order — bundle into one minor release for atomic CATALOG bump (B-05).
- **A-03 / A-04** prevent regression of B-05 going forward.
- **M-01** unblocks once #32 ambiguity is resolved with the user (after no-questions window closes at 40/40).

## Status update (2026-06-06, v1.31.0) — STALE BACKLOG, NEARLY ALL SHIPPED
A code audit found Phase 1 and Phase 2 are fully implemented and tested; do NOT re-plan them.
| ID | Status | Evidence |
|---|---|---|
| B-01 | ✅ done | `src/slides/types/DatabaseDiagramSlide.tsx` |
| B-02 | ✅ done | `src/slides/types/DataTableSlide.tsx` |
| B-03 | ✅ done | `src/slides/hooks/useCountUp.ts` + `NumberCalloutContent` in contracts.ts |
| B-04 | ✅ done | `src/slides/types/EquationSlide.tsx` + `scripts/prerender-equations.ts` |
| B-05 | ✅ done | `src/slides/enums.ts` = 26 types (>21) |
| B-06 | ✅ done | `front-end/project/sample/data/slides/40..43-*.json` |
| A-01 | ✅ done | `--dur-count-fast/slow` in `src/index.css` |
| A-02 | ✅ done | `src/slides/densityCheck.ts` + `src/test/density.test.ts` |
| A-03 | ✅ done | `src/slides/validateAgainstCatalog.ts` + boot probe |
| A-04 | ✅ done | `scripts/check-catalog-drift.ts` in CI (`bun run check:catalog`) |
| M-02 | ✅ done | `spec/21-slides-system/64-per-slide-sound-override.md` |
| M-03 | ✅ done | `scripts/motion-variety-audit.ts` |
| M-05 | ✅ done | roving-tabindex in EquationSlide + DataTableSlide |
| M-01 | ⏳ open | #32 collapsible-sections ambiguity — needs user decision |
| M-04 | ✅ done | DECISION (v1.33.0): keep `TableSlide` uncapped; steer authors to `DataTableSlide` for ≤5×8 via JSDoc `@remarks` in `enums.ts` + `TableSlide.tsx`. Not hard-deprecated. |
