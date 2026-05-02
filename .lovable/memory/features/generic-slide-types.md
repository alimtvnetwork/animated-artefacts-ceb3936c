---
name: generic-slide-types
description: v0.169 generic slide types (TableSlide, CodeBlockSlide, BoxDiagramSlide, LayoutSlide), the navy-blue theme, per-theme font overrides, and the .slide-card/.slide-table/.slide-codeblock utility classes.
type: feature
---

# Generic slide types + navy-blue theme (v0.169)

Four topic-agnostic slide types added alongside existing house-style ones:

- **TableSlide** — comparison table. Required: `title`, `tableColumns[]`, `tableRows[]`. Per-row `accent` (capsule palette) drives the left-edge bar.
- **CodeBlockSlide** — title + hero code block. Required: `title` + one of `code` / `codeTokens`. `codeSyntax` ∈ `'shiki' | 'manual' | 'plain'` (shiki is dynamic-imported on demand).
- **BoxDiagramSlide** — generic ER-style boxes-with-fields diagram. Required: `title`, `diagramNodes[]`. Optional `diagramEdges[]` with cardinality `['1' | 'N', '1' | 'N']`. Optional `diagramExplanation` enables a 4/8 split.
- **LayoutSlide** — generic grid wrapper. Required: `title`, `layoutSlots[]`. `layout` ∈ `'split-5-7' | 'split-4-8' | 'split-2-equal' | 'card-grid-2x3' | 'centered-hero'`.

## navy-blue theme

First theme to declare `fonts` on its `ThemePreset`:
- display: `Ubuntu, Inter, sans-serif` (kept for house display rhythm)
- body: `Poppins, Inter, ...`
- mono: `"JetBrains Mono", ...`

`applyTheme()` writes these into `--preset-display-font` / `--preset-body-font` / `--preset-mono-font` and clears them when switching away — no bleed.

Palette: navy bg `222 35% 12%`, cyan `--gold = 188 95% 43%` (primary accent role), orange `--ember = 32 95% 50%` (secondary accent role). Other themes still mean "gold" by `--gold`; this theme reuses the variable to play the accent role with cyan.

## Reusable utility classes

In `src/index.css`:
- `.slide-card` (+ `.is-success | .is-danger | .is-accent`)
- `.slide-table` — themed header, alt-row striping; per-row accent via `data-accent` + `--row-accent`
- `.slide-codeblock` — token classes `.tok-keyword | .tok-literal | .tok-comment`; shiki overrides included
- `.slide-grid-5-7`, `.slide-grid-4-8`, `.slide-grid-2-equal`, `.slide-grid-card-2x3`, `.slide-grid-centered`

All themed via existing tokens — no raw hex.

## Authoring rules

- House style still wins. Capsules, BrandHeader, controller chrome, spec-first authoring unchanged.
- New slide types follow the standard registry pattern: `enums.ts` → `types.ts` (schema) → `types/<Name>Slide.tsx` (renderer) → `SlideStage.tsx` + `SlidePreview.tsx` + `GridOverview.tsx` (cases) → `contracts.ts` (zod) → `fixtures.ts` (test fixture) → `fieldSchemas.ts` (builder defaults).

## Out of scope

PPTX export for the 4 new types falls through to a header-only slide (non-fatal). Add bespoke renderers in `exportPptx.ts` when needed.

Spec: `spec/slides/59-generic-slide-types.md`.
