# Sample deck — new slide-type specs

**Status:** Phase 1 (spec only). Runtime arrives in Phase 3 of `plan.md`.

This deck demonstrates one slide each for the four new slide types introduced by `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md`.

| Seq | File | Type | Narrow idea |
|---|---|---|---|
| 40 | `40-database-erd` | `DatabaseDiagramSlide` | Three entities link the order graph. |
| 41 | `41-data-table`   | `DataTableSlide`       | Three plans, three price points. |
| 42 | `42-number-callout` | `NumberCalloutSlide` | 92 % of users return in week one. |
| 43 | `43-equation`     | `EquationSlide`        | Compound growth in one line. |

Each slide has a `.json` (source of truth) and `.md` (companion). Density caps and narrow-idea statements are encoded in `narrowIdea` + `densityCheck` fields and will be asserted by `src/test/contracts.test.ts` once the runtime exists.

Migration target (Phase 3): `front-end/project/sample/data/slides/`.
