---
name: llm-guide-download
description: Hamburger > "Import / Export" > "Download LLM guide (.md)" bundles the entire spec/21-slides-system/llm/ pack + slide.schema.json + CATALOG.json + the active theme tokens into one self-contained Markdown file an author can paste into any LLM to generate compatible slide JSON.
type: feature
---

## Goal

Give the presenter a single click that produces **one Markdown file** which any
LLM (ChatGPT, Claude, Gemini, …) can ingest standalone and then author new
slides for *this* deck — same theme, same slide types, same JSON contract —
without needing repo access. The file is the portable equivalent of "import /
export via prose."

## Where it lives

`ControllerHamburger` panel (bottom-right pill > Menu icon).

New section, placed **after** "Step motion" and **before** the Debug group:

```
─── Import / Export ───
⬇  Download LLM guide (.md)        — current theme + full spec
📋 Copy LLM guide to clipboard      — same content, no download
```

Both items call `buildLlmGuideMarkdown()` (see implementation). Download uses
`Blob` + `URL.createObjectURL` + a synthetic `<a download>`; copy uses the
async `navigator.clipboard` API with a Sonner toast on success / failure.

## File contents (in order)

The bundler produces a single `.md` with these sections, separated by `---`:

1. **Front-matter preamble** — generated date, deck name, active `themeId`,
   active transition / step-motion overrides (so the LLM matches the look the
   presenter is currently using).
2. **Theme & color tokens** — the active `ThemePreset` (`THEMES[themeId]`)
   serialized as a fenced ```json block plus a human-readable summary
   (background, foreground, gold, ember, cream, capsule colors). This is what
   the user means by "color and theme at the beginning."
3. **Slide JSON schema** — raw contents of `spec/21-slides-system/slide.schema.json`
   inside a fenced ```json block. Treat it as authoritative.
4. **Catalog** — raw contents of `spec/21-slides-system/llm/CATALOG.json`
   inside a fenced ```json block (slide types, transitions, text animations,
   capsule colors, expand animations, step motion variants).
5. **LLM pack** — every file under `spec/21-slides-system/llm/*.md`,
   concatenated in numeric order (`00-README.md` → `28-…`). Each file is
   prefixed with `## File: NN-name.md` so the LLM can keep its bearings.
6. **Authoring footer** — a 3-bullet "what to output" reminder (one slide JSON
   per file, must validate against the schema, keywords-only content rule,
   never invent enum values).

## Implementation files

- `src/slides/llmGuideBundle.ts` — `buildLlmGuideMarkdown(): string`. Uses
  Vite's `import.meta.glob('/spec/21-slides-system/llm/*.md', { query: '?raw', import: 'default', eager: true })`
  + the same trick for the schema and CATALOG. Reads the active theme via
  `document.documentElement.getAttribute('data-theme')` and looks up
  `THEMES[id]`.
- `src/slides/controls/ControllerBar.tsx` — new "Import / Export" group inside
  `ControllerHamburger` with `Download` and `ClipboardCopy` lucide icons.
- File name format: `riseup-llm-slide-guide_{themeId}_{YYYY-MM-DD}.md`.

## Forbidden

- Hard-coding the spec text in the bundler — must always glob from the actual
  spec folder so the file stays in sync.
- Including unrelated specs (`/15-research/`, `/22-slides-issues/`,
  `/26-slide-definitions/` decks) — those are project history, not authoring
  contract. Only `21-slides-system/llm/` + `slide.schema.json` + `CATALOG.json`
  are bundled.
- Bundling the user's actual deck JSON (privacy: the guide is a generic
  authoring kit, not an export of the current deck content).

## Reference

- Existing LLM pack: `spec/21-slides-system/llm/` (28 files + CATALOG.json).
- Schema: `spec/21-slides-system/slide.schema.json`.
- Theme tokens: `src/slides/themes.ts` (`THEMES`, `THEME_IDS`).
- Pairs with: `mem://features/controller-hamburger`.
