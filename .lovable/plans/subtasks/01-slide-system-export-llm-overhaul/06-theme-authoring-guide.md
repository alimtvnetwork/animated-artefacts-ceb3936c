---
Slug: theme-authoring-guide
Status: pending
Created: 2026-06-06
Parent: 01-slide-system-export-llm-overhaul
---

# Theme / color authoring guide (for LLM)

## Token list (patched by applyTheme)
`--gold`, `--gold-glow`, `--cream`, `--primary`, `--ring`, `--foreground`, `--muted-foreground`, `--border`, `--gradient-noir`. All values are HSL triplets. Never hard-code hex in components.

## Theme JSON anatomy (SerializableTheme)
- `id`, `label`, `description`
- `swatch[]` (preview chips)
- `appearance` ("dark" | "light")
- `vars` (token → HSL triplet map)
- `fonts` (optional full font-family strings)

## "Create a new theme" recipe
1. Pick appearance + accent + text/cream.
2. Convert each color to HSL triplet.
3. Fill `vars` for all 9 tokens + `--gradient-noir` for background.
4. Add `swatch[]` for the picker.
5. Export via buildThemeManifest → import elsewhere; persists in `riseup.themes.custom.v1`.

## Background color / theme
Background lives in `--gradient-noir` (and surface tokens). Document how to set a flat vs gradient background and keep capsule contrast (see mem://design/light-theme-capsule-fg-rule).

## Registration of imported themes
- Merged into in-memory THEMES via `registerCustomThemesOnBoot()`.
- Built-in ids cannot be shadowed (auto-suffix `-imported`).
- Add new built-in: append to THEMES, add id to deck.schema.json enum, update `spec/21-slides-system/07-theme-system.md`.
