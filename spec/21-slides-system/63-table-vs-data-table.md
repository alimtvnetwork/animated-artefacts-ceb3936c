# M-04 — TableSlide vs DataTableSlide divergence

**Status:** Resolved 2026-05-01 — keep both; document divergence.
**Audit ref:** `audit/subsystems/18-data-table.md`, `audit/remediation-plan.md` M-04.

## TL;DR

| Slide type        | Use when                                                | Caps                       | Animation                       |
| ----------------- | ------------------------------------------------------- | -------------------------- | ------------------------------- |
| `DataTableSlide`  | **Narrow idea.** A focused comparison the room must read at distance. | ≤5 cols × ≤8 rows (enforced via `densityCheck`) | Header @ 0.25s, rows Stagger 35ms |
| `TableSlide`      | **Reference / dense comparison.** Power-user tables with many columns and rows. | 2–8 cols × 1–12 rows (zod only, no density check) | Single fade-in                 |

Both ship. Authors pick by intent. New decks default to `DataTableSlide`
unless they genuinely need >5 columns or >8 rows of comparison.

## Decision rationale

`DataTableSlide` was added (addendum 29) to enforce the project's "Narrow
Idea Per Slide" rule with hard caps. `TableSlide` predates that rule and
is used by older decks for dense reference comparisons (pricing matrices,
feature parity tables) where the audience expects to scan, not absorb at
a glance.

Removing `TableSlide` would force every dense table to either:

1. Split across multiple slides (loses scanability), or
2. Bend `DataTableSlide` caps with `as any` casts.

Both are worse than keeping the legacy type with a documented role.

## When to pick which

**Use `DataTableSlide`** when:
- The slide is one of many in a presentation flow.
- The presenter narrates the table; the audience watches.
- ≤5 columns and ≤8 rows comfortably fits the idea.

**Use `TableSlide`** when:
- The slide is a reference / handout artifact.
- The audience will scan it themselves (printed, exported, deep-linked).
- The data genuinely needs >5 columns or >8 rows.

## Future direction

No deprecation planned. If the density-cap audit reveals `TableSlide` is
being misused as a `DataTableSlide` workaround, we'll add a
`densityCheck.warnExceeds` opt-in soft cap to `TableSlide` rather than
forcing migration.

## Cross-refs

- Spec: `spec/21-slides-system/59-generic-slide-types.md` (TableSlide)
- Spec: `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md` §2.2 (DataTableSlide)
- Density rule: `src/slides/densityCheck.ts`
- Catalog: `spec/21-slides-system/llm/CATALOG.json`
