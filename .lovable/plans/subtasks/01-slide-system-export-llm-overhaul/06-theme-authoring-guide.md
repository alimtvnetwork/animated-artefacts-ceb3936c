---
Slug: theme-authoring-guide
Status: done (impl 2026-06-06 v1.18.0 — authoritative theme authoring contract aligned to runtime)
Created: 2026-06-06
Parent: 01-slide-system-export-llm-overhaul
---

# Theme / color authoring guide (for LLM)

## Correction note
The original draft below described an older 9-token / 2-theme model. The shipped runtime in `src/slides/themes.ts` now supports 10 built-in themes, optional light/dark appearance, font overrides, external `front-end/themes/*` overlays, imported custom themes, per-deck theme persistence, and a gold-brightness offset. This subtask is complete only after documenting that real behavior.

## Runtime source of truth
- Presets + boot/persist/apply flow: `src/slides/themes.ts`
- Import/export manifest contract: `src/slides/themeManifest.ts`
- Boot order: `src/main.tsx` (`registerCustomThemesOnBoot()` before `applyTheme(getInitialTheme(...))`)
- Preview/showcase surface: `src/pages/ThemePreviewPage.tsx`
- Baseline system spec: `spec/21-slides-system/07-theme-system.md`

## Built-in themes currently shipped
- `noir-gold`
- `bright-gold` (**default**)
- `vscode-dark`
- `dracula`
- `monokai`
- `github-light`
- `paper-ink`
- `macos-sonoma`
- `windows-11`
- `navy-blue`

## Theme object anatomy (runtime `ThemePreset` / portable `SerializableTheme`)
- `id`: string id. Built-ins are the `ThemeId` union; imports may use any string.
- `label`: picker/showcase label.
- `description`: short human-readable mood/usage line.
- `swatch[]`: preview chips shown in picker/showcase.
- `appearance`: `"light" | "dark"` for contrast-aware assets like `BrandLogo`.
- `vars`: CSS custom-property map written to `:root` by `applyTheme()`.
- `fonts?`: optional `{ display?, body?, mono? }` full `font-family` strings.

## Theme token surface (actual runtime behavior)
- Core accent/text/background tokens commonly patched by themes:
  - `--background`, `--foreground`, `--muted-foreground`, `--border`
  - `--primary`, `--primary-foreground`, `--ring`
  - `--gold`, `--gold-glow`, `--ember`, `--cream`, `--ink`
  - `--surface-1`, `--surface-2`, `--surface-3`
  - `--secondary`, `--secondary-foreground`, `--muted`, `--accent`, `--accent-foreground`, `--input`
  - `--gradient-noir`, plus some themes also define `--gradient-gold` / `--gradient-text-gold`
- Some presets also expose capsule/chart overrides such as `--capsule-gold-bg` or `--chart-1`.
- Values are CSS strings. Solid color tokens should be HSL triplets; gradient tokens stay full CSS gradient strings.
- Never hard-code hex in components; components consume semantic tokens from `index.css` / Tailwind.

## "Create a new theme" recipe
1. Pick the target mood and `appearance` (`dark` or `light`).
2. Define the minimum readable token set: `--background`, `--foreground`, `--muted-foreground`, `--border`, `--gold`, `--gold-glow`, `--cream`, `--primary`, `--ring`, `--gradient-noir`.
3. Add light-theme support tokens when needed: `--card`, `--popover`, `--secondary`, `--muted`, `--input`, `--surface-*`, `--ink`, `--primary-foreground`, `--accent`, `--accent-foreground`.
4. If the palette needs typography changes, add `fonts.display`, `fonts.body`, and/or `fonts.mono`.
5. Keep capsule contrast intact; chips must still work via `.capsule-{tone}` classes (see mem://design/light-theme-capsule-fg-rule).
6. Build a manifest with `buildThemeManifest(id)` for export, or install a new manifest via `installThemeManifest()` for import.
7. Imported themes persist in `riseup.themes.custom.v1` and are re-registered on boot by `registerCustomThemesOnBoot()`.

## Background color / theme
- Background mood primarily lives in `--gradient-noir`.
- Flat backgrounds are allowed by supplying a visually-flat gradient or pairing `--background` + surface tokens consistently.
- Light themes must also retune `--cream` / `--ink` semantics so text and capsules stay legible.
- Do not bypass capsule classes with inline brand-token styles; light themes repurpose brand tokens.

## Registration of imported themes
- Imported themes are stored in `riseup.themes.custom.v1` and merged into the in-memory `THEMES` registry by `registerCustomThemesOnBoot()` before initial theme resolution.
- Built-in ids cannot be shadowed. Collisions are resolved by `resolveImportId()` (`-imported`, `-imported-2`, etc.). Re-importing an existing custom id updates it in place.
- Theme choice persists in both the global slot `riseup.theme.v1` and the per-deck map `riseup.theme.byDeck.v1`; `getInitialTheme(deckTheme, deckSlug)` resolves URL override → testMode deck theme → per-deck pin → global slot → default.
- Gold fine-tuning persists separately in `riseup.theme.brightness.v1` and is re-applied after every `applyTheme()`.
- External JSON overlays in `front-end/themes/<id>/colors.json` and `front-end/themes/<id>/themes.json` can refine shipped presets without editing TS.
- When adding a new built-in theme: append it to `THEMES`, update the deck-schema theme enum if required, and update `spec/21-slides-system/07-theme-system.md`.
