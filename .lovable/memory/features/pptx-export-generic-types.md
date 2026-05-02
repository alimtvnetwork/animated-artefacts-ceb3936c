---
name: PPTX export — generic slide types
description: v0.182 PPTX export now renders Table/CodeBlock/BoxDiagram/ERDiagram/LayoutSlide natively instead of falling back to header-only.
type: feature
---

# PPTX export coverage (v0.182)

`src/slides/exportPptx.ts` previously only rendered the original 9 slide types and dropped through to a header-only fallback for the v0.169+ generic types. That left `TableSlide`, `CodeBlockSlide`, `BoxDiagramSlide`, `ERDiagramSlide`, and `LayoutSlide` exporting as blank slides with just the title.

v0.182 adds editable native renderers for all five — translated into Noir & Gold even when the React side uses `navy-blue` (per-theme palette translation in PPTX is out of scope; goal is a cohesive editable handout).

## Renderers

- **`renderTable`** — header row + zebra body + per-row first-column accent bar (resolves `accent` via `capsuleFill`). Caps at 12 rows × 8 cols. Honors `tableNote`. Width hints (`width: "20%"`) are parsed as proportional weights.
- **`renderCodeBlock`** — dark surface, language badge top-right, monospace body line-by-line so `codeHighlightLines` can paint a backdrop and `codeShowLineNumbers` can render a gutter. Shiki is dropped (no wasm in export pipeline). Falls back to joining `codeTokens` when `code` is absent.
- **`renderDiagram`** — handles both `BoxDiagramSlide` and `ERDiagramSlide`. Reads `entities`/`relationships` first, falls back to `diagramNodes`/`diagramEdges`. Optional 4/8 split when `diagramExplanation` is set. Edges → straight `line` shape with `flipH/flipV` for direction; cardinality rendered as `[1]`/`[N]` text markers (real crow's-foot SVG isn't pptx-native). Field rows respect `pk`/`fk` colors (gold/ember in the export palette).
- **`renderLayout`** — resolves all 9 `LayoutGridPreset` values to cell rects, then renders each `LayoutSlotSpec` as `card` (rounded inkSoft + variant border), `plain` (raw text), or `codeblock` (mini code surface). Variant borders: success → green, danger → ember, accent → gold.

## Dispatcher

`renderSlide` switch now routes:
```ts
case SlideType.TableSlide:        return renderTable(...);
case SlideType.CodeBlockSlide:    return renderCodeBlock(...);
case SlideType.BoxDiagramSlide:
case SlideType.ERDiagramSlide:    return renderDiagram(...);
case SlideType.LayoutSlide:       return renderLayout(...);
```

## What's intentionally dropped

- Shiki syntax coloring (use a screenshot if pixel-perfect coloring matters).
- Crow's-foot SVG glyphs (replaced with `[1]`/`[N]` text markers).
- Per-theme palette swap (everything renders in Noir & Gold).
- Animations (PPTX is static; final state is rendered).
