---
name: er-diagram-slide
description: v0.177 — `ERDiagramSlide` opinionated ER variant of BoxDiagramSlide. Forks the same SVG renderer but paints with a navy-blue palette (cyan PK, amber FK, blue connectors). Accepts `entities`/`relationships` (preferred) or `diagramNodes`/`diagramEdges` (compat).
type: feature
---
v0.177.0.

# Why
`BoxDiagramSlide` is generic across ER / arch / state diagrams and inherits
the gold/ember deck palette. Real ER diagrams have a strong domain
convention (navy boxes, cyan PK, orange FK, blue lines) — meeting it
without per-field overrides needs a dedicated type.

# Wiring touched
- `enums.ts` — new `ERDiagramSlide` enum value.
- `types.ts` — `SlideContent` gains optional `entities` + `relationships`.
- `contracts.ts` — new `ERDiagramContent` zod schema with refine that
  accepts either naming style and enforces 2–20 entities. Bumped
  `SLIDE_CONTRACTS_VERSION` 1 → 2.
- `fixtures.ts` — valid fixture for spec-parity tests.
- `builder/fieldSchemas.ts` — `FieldKey` extended with `entities` /
  `relationships` / `diagramExplanation`. New `ERDiagramSlide` schema
  + picker entry.
- `SlideStage.tsx` — dispatch case.
- `front-end/slide-template/ERDiagramSlide.{json,md}` — author template.

# Palette (inlined as constants in the .tsx, NOT CSS tokens)
SVG paints by attribute (`fill`/`stroke`), not via CSS variables, so
keeping the palette as a typed `NAVY` const inside the component file is
both simpler and self-contained — a future "light navy" variant ships
as a one-file change.

| Role          | Color     |
|---------------|-----------|
| Surface       | `#0f1d3a` |
| Header        | `#1a2d5c` |
| PK accent     | `#22d3ee` |
| FK accent     | `#f59e0b` |
| Edge / glyph  | `#60a5fa` |

# Migration from BoxDiagramSlide
1. Change `slideType` to `ERDiagramSlide`.
2. Optionally rename `diagramNodes` → `entities`, `diagramEdges` →
   `relationships`. Both naming styles work; ER-style wins when both
   are present.
3. Drop any per-field color overrides — the palette is automatic.

# Verified
- `bunx tsc --noEmit` clean.
- `bun run lint` 0 errors.
- `bunx vitest run` 217/217 (spec-parity covers the new fixture).
