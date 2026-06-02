# Subsystem: data-table

## Spec Statement
`DataTableSlide` is the narrow-idea-enforced sibling of the existing `TableSlide`. Caps: ≤5 columns, ≤8 rows. Header: display font + `--gold` underline. Body rows: zebra via `--surface-2`. First-cell accent bar via row `accent` (cream/gold/ember). Reveal: header at 0.25s, rows Stagger 35ms. Reduced motion: instant.

## Implementation State
- Existing `TableSlide` (`src/slides/types/TableSlide.tsx`) renders columns + rows + per-row accent bars but does **not** enforce the addendum's density caps and uses a different reveal cadence.
- `DataTableSlide` not registered as a distinct type.

## Gap
- No new `DataTableSlide` type/component.
- Density caps not enforced on existing `TableSlide`.
- 35ms row stagger not implemented.

## Severity
**Blocking** for the stated Phase 3 scope.

## Evidence
- spec: `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md` §2.2 + sample slide 41
- impl: `src/slides/types/TableSlide.tsx`
- test: existing TableSlide covered indirectly

## Remediation
1. Add `DataTableSlide` as new type — share rendering primitives with `TableSlide` but enforce caps in Zod.
2. Add 35ms row-stagger hook keyed off `Stagger` text-anim.
3. Migrate sample slide 41 into `front-end/project/sample/data/slides/`.
4. Decide whether to deprecate uncapped `TableSlide` post-migration (open question for end-of-window review).
