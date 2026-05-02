# 59 — Generic slide types + navy-blue theme (v0.169)

## What

Borrowed the *generic* parts of an external "presentation design system" doc
and remapped them onto our token + capsule + theme contract. House style
still wins — Ubuntu/Inter, capsules, BrandHeader, controller chrome, spec-first
authoring all unchanged.

### New theme — `navy-blue`

Editorial navy bg + cyan primary accent + orange secondary accent. First
theme to use **per-theme font overrides**: declares its own Poppins (body)
and JetBrains Mono (code) stack via the new `ThemePreset.fonts` block. Other
themes omit `fonts` and continue using Ubuntu/Inter.

`applyTheme()` writes any declared font into `--preset-display-font` /
`--preset-body-font` / `--preset-mono-font` on `:root`, and *clears* those
properties when switching to a theme that doesn't declare them — so
overrides never bleed across theme switches.

### New utility classes (themed via existing tokens)

- `.slide-card` — generic surface (variants `.is-success`, `.is-danger`, `.is-accent`).
- `.slide-table` — themed header row (`--surface-3`/`--cream`), alt-row
  striping (`--surface-2`), per-row left-edge accent bar via `data-accent` +
  `--row-accent`.
- `.slide-codeblock` — dark `--ink` surface, mono font, `.tok-keyword` /
  `.tok-literal` / `.tok-comment` for hand-colored or shiki-rendered tokens.
- Layout grid presets: `.slide-grid-5-7`, `.slide-grid-4-8`,
  `.slide-grid-2-equal`, `.slide-grid-card-2x3`, `.slide-grid-centered`.

### New slide types

| Type | Required fields | Notes |
|---|---|---|
| `TableSlide` | `title`, `tableColumns`, `tableRows` | Per-row `accent` colour selects from existing capsule palette. |
| `CodeBlockSlide` | `title`, one of `code` / `codeTokens` | `codeSyntax: 'shiki' \| 'manual' \| 'plain'`. Shiki dynamically imported only when used. |
| `BoxDiagramSlide` | `title`, `diagramNodes` | Generic ER-style boxes; nodes positioned by % on a 1600×900 SVG canvas. Edges support `'1'` tick or `'N'` crow's-foot at each endpoint. Optional `diagramExplanation` enables a 4/8 split. |
| `LayoutSlide` | `title`, `layoutSlots` | Generic grid wrapper. Picks one of the 5 presets above; renders slots as `card` / `plain` / `codeblock`. |

All four are registered in `SlideStage`, `SlidePreview`, `GridOverview`,
`contracts.ts`, `fixtures.ts`, `fieldSchemas.ts`, and `enums.ts`.

## Why this shape

- **One primary + one secondary accent** rule from the doc maps cleanly onto
  our existing two-accent token system (`--gold` + `--ember`). No new colour
  tokens needed — `navy-blue` simply remaps `--gold` → cyan, `--ember` → orange.
- **Topic-agnostic** by design — author writes JSON the same way for every
  slide type. Diagrams live as data, not bitmaps.
- **House style wins where it conflicts**: kept Ubuntu for headings, kept
  capsules, kept BrandHeader, kept the spec-first authoring flow. Per-theme
  font overrides give navy-blue its distinct voice without forcing
  Poppins/JetBrains Mono onto noir-gold.

## Out of scope (this milestone)

- PPTX export rendering for the 4 new slide types (current export falls
  through to a header-only slide — non-fatal).
- LLM authoring docs under `spec/slides/llm/` for each new type.
- A worked-example showcase deck demonstrating the navy-blue theme.

These can be added in follow-up tickets without breaking the runtime.
