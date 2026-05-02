---
name: CodeBlockSlide
description: CodeBlockSlide contract — shiki/manual/plain syntax modes, configurable language, copy button, and per-line emphasis animations
type: feature
---

# CodeBlockSlide

Title + hero code block. Wired through the standard pipeline: `enums.ts` → `contracts.ts` (`CodeContent` with `code|codeTokens` refine) → `types.ts` → `fixtures.ts` → `builder/fieldSchemas.ts` → `SlideStage.tsx`.

## Features
- **Configurable language** — `c.codeLanguage` (any shiki id; defaults to `'plaintext'`).
- **Three highlighting modes** — `codeSyntax`:
  - `'shiki'` (default) — dynamic-import shiki on mount, render `github-dark` HTML, then re-wrap each `<span class="line">` so our emphasis chrome can layer on top without losing shiki's inline token colors.
  - `'manual'` — render `codeTokens` line-by-line; each token's `kind` maps to `.tok-keyword` / `.tok-literal` / `.tok-comment` (deterministic across renderers).
  - `'plain'` — render `code` as-is.
- **Copy button** — top-right anchor on every code block. `navigator.clipboard.writeText`, switches to a `Check` icon for 1.6s on success. Disable with `codeCopyButton: false`. Falls back to "Select to copy" when clipboard is unavailable.
- **Line emphasis** — `codeHighlightLines: number[]` (1-based). Each emphasised line gets a steady gold backdrop (`hsl(var(--gold) / 0.14)` + 3px inset gold edge) and pulses through `0 → 0.32 → 0.14` alpha on slide enter, staggered 250ms in emphasis-sorted order from 0.55s. `useReducedMotion` suppresses the pulse and keeps only the steady highlight.
- **Line numbers gutter** — `codeShowLineNumbers`. Defaults to `true` whenever `codeHighlightLines` is set, otherwise `false` so plain code blocks stay minimal.

## Rules
- Don't promote the per-line pulse animation to a content-schema field — it's locked to a single deck-wide rhythm.
- Manual-mode copy payload is reconstructed from `codeTokens` (joins token `text` per line) — never lift `JSON.stringify(codeTokens)` into the clipboard.
- The shiki path re-parses output by splitting on `<span class="line">`. If shiki ever changes its line-wrapping convention, the regex split in `ShikiBlock` needs an update — the block falls back gracefully (renders the original HTML in a single `.slide-codeblock`) if no `class="line"` markers are found.
- Out-of-range `codeHighlightLines` entries are silently ignored — never throw on bad authoring.
