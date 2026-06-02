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
