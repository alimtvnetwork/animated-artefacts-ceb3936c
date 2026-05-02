# 41 — Phase 5 + #32 resolution: ChecklistSlide + TableSlide divergence doc

**Date:** 2026-05-01
**Counter:** crossed 40/40 → **window reset to 0/40** for the next batch.

## What happened

The no-questions window closed at task #40, so I surfaced the longest-pending
ambiguity (#32) for batch clarification per `mem://preferences/no-questions-mode`.

## User decisions

| Question                         | Pick                                              |
| -------------------------------- | ------------------------------------------------- |
| #32 — collapsible + progress     | **New audience slide type (ChecklistSlide)**      |
| M-04 — TableSlide vs DataTable   | **Keep both, document divergence**                |

## Implementation

### ChecklistSlide (resolves #32)
- Spec: `spec/21-slides-system/62-checklist-slide.md`
- Component: `src/slides/types/ChecklistSlide.tsx`
- Type: `SlideType.ChecklistSlide` (enum 21 → 22)
- Contract: zod `ChecklistContent` (2–7 items, optional 120-char detail, optional capsule)
- Density cap: `capItems` added to `densityCheck.ts`
- `SLIDE_CONTRACTS_VERSION`: 4 → 5
- Builder default: 4 sample items
- Sample JSON: `spec/26-slide-definitions/sample/44-checklist.{json,md}`
- Fixture: `SLIDE_FIXTURES.ChecklistSlide` (1 valid, 2 invalid)
- CSS: `.checklist-progress`, `.checklist-row*` in `src/index.css` (uses `--gold`, `--ember`, `--cream`, `--surface-2`)
- Behaviour: click-to-toggle, ↑↓←→ roving tabindex, chevron expand, per-session state, reduced-motion → snap

### TableSlide vs DataTableSlide divergence (M-04)
- Doc: `spec/21-slides-system/63-table-vs-data-table.md`
- Decision: keep both. `DataTableSlide` for narrow-idea (≤5×≤8); `TableSlide`
  for dense reference. No deprecation.

## Catalog

`spec/21-slides-system/llm/CATALOG.json`:
- `version`: 1.1.0 → **1.2.0**
- `slideTypes.count`: 21 → **22**
- New entry: ChecklistSlide.

## Counter

Reset to **0 / 40** with this entry as the new window's #1.
