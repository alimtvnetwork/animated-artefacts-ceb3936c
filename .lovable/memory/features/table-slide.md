---
name: TableSlide
description: TableSlide contract — headers, zebra rows, column alignment, per-row accent bar, and v0.179 row-major cell fade-in animation
type: feature
---

# TableSlide

Generic 4–8 row × 2–8 column comparison table. Wired through the standard slide-type pipeline: `enums.ts` → `contracts.ts` (`TableContent`) → `types.ts` (`tableColumns`/`tableRows`/`tableNote`) → `fixtures.ts` → `builder/fieldSchemas.ts` → `SlideStage.tsx`.

## Features
- **Headers** — `tableColumns[].label`. Header row paints `--surface-3` background with `--cream` text in the display font.
- **Zebra rows** — alternating `--surface-2 / 0.55` shading via `.slide-table tbody tr:nth-child(even)` in `index.css`. Automatic; no per-row opt-in.
- **Column alignment** — `tableColumns[].align: 'left' | 'center' | 'right'` flows into both header and body cells. Defaults to `left`.
- **Per-row accent bar** — first cell renders a 4px inset left bar via `data-accent` + `--row-accent` (CSS var derived from `row.accent` lookup in `ACCENT_HSL`). Defaults to `gold`.
- **Cell fade-in animation (v0.179)** — header cells stagger in (35ms each from 0.25s), then body cells fade up in row-major order (35ms each from 0.45s). `useReducedMotion` skips entirely.

## Rules
- Never inline raw colors in cell `style` — always go through `ACCENT_HSL` so themes (e.g. navy-blue) retune naturally.
- Don't promote the cell-fade animation to a content-schema field; it's presentational and locked at the slide level.
- Keep cell delay coefficient at 35ms unless the table grows past 12×8 — bigger tables need a recalculated cap.
