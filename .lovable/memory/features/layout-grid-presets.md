---
name: Layout grid presets + deck-wide gridPreset
description: 9 grid presets (incl. 12-column + 3-panel) shared by LayoutSlide and any slide via SlideStage wrapper; spacing tokens centralised at :root for deck-wide retune
type: design
---

# Layout grid presets (v0.181)

Two ways to apply a grid:

1. **`LayoutSlide.content.layout`** — the original v0.169 use. Renders `layoutSlots[]` inside the chosen `.slide-grid-*` preset.
2. **`SlideContent.gridPreset`** — opt-in on ANY slide type. `SlideStage` wraps the body in `<div className="slide-grid-wrapper {presetClass}" data-grid-preset="…">`. Skipped on `LayoutSlide` to avoid double grids.

## Available presets (`LayoutGridPreset`)

| id | columns | use |
|---|---|---|
| `split-5-7` | 5fr / 7fr | explanation + visual |
| `split-4-8` | 4fr / 8fr | short prose + big diagram |
| `split-3-9` | 3fr / 9fr | sidebar + main canvas |
| `split-2-equal` | 1fr / 1fr | pros/cons, before/after |
| `3-panel` | 1fr × 3 | comparison triplets |
| `12-column` | repeat(12, 1fr) | designer grid; children use `grid-column: span N` |
| `card-grid-2x3` | 1fr / 1fr | 2-col card flow |
| `card-grid-3x3` | 1fr × 3 | 3-col card flow |
| `centered-hero` | flex centered | single column hero |

## Shared spacing tokens (`:root` in `src/index.css`)

```css
--slide-grid-gutter:    2.5rem;
--slide-grid-padding-x: 6rem;
--slide-grid-padding-y: 5rem;
```

Every `.slide-grid-*` preset reads these vars. To retune deck-wide, override the three vars (per deck, per theme, or via a future presetSettings panel) — every preset stays in lockstep automatically. Card grids subtract 0.5rem to retain the historical tighter card spacing.

## Rules
- Don't hardcode `gap` / `padding` values in slide markup. Read `var(--slide-grid-*)` if you need the same rhythm outside the wrapper.
- Don't add a new preset without also adding it to **both** lookup maps: `GRID_CLASS` in `LayoutSlide.tsx` (for LayoutSlide consumers) AND `GRID_PRESET_CLASS` in `SlideStage.tsx` (for the deck-wide wrapper). Tied together at compile time via `Record<LayoutGridPreset, string>` so missing entries break tsc.
- `LayoutSlide` is intentionally excluded from the stage-level wrapper — it owns its own grid via `content.layout`. Don't change this.
- The `.slide-grid-wrapper` shell uses `min-height: 100%` so absolute-positioned scenes (TitleSlide, etc.) keep working. Don't switch to `height: 100%`.
