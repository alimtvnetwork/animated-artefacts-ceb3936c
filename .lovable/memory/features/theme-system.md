---
name: theme-system
description: Live theme switcher (8 presets — Noir-Gold, Bright-Gold, VS Code Dark+, Dracula, Monokai, GitHub Light, macOS Sonoma, Windows 11), CSS variable overrides, manifest round-trip
type: feature
---

## 8 themes ship today

**Brand presets**
- **`noir-gold`** — Original. Gold `#C9A84C`, cream `#F0D78C`. Restrained, editorial.
- **`bright-gold`** — Updated default. Gold `#ffd166` (+15% L, 2026-05-16), cream `#fff1d6`. Vivid, high-contrast. Ambient `--gradient-noir` retuned 2026-05-16 to `hsl(42 75% 14%) → hsl(40 30% 6%)` for +20% more golden glow (was brown/black). See `updates/spec/21`.

**IDE / OS-inspired skins** (added v0.125.0)
- **`vscode-dark`** — VS Code Dark+. Azure `#007acc` on `#1e1e1e`, `#d4d4d4` text.
- **`dracula`** — draculatheme.com. Purple `#bd93f9` + pink `#ff79c6` on `#282a36`.
- **`monokai`** — Sublime classic. Green `#a6e22e` + orange `#fd971f` on `#272822`.
- **`github-light`** — Clean light mode. Blue `#0969da` ink `#1f2328` on white.
- **`macos-sonoma`** — System blue `#007aff` + orange `#ff9f0a` on indigo gradient.
- **`windows-11`** — Fluent accent `#60cdff` on mica neutral `#202020`.

All themes share Ubuntu/Inter fonts and capsule shapes. Only the brand-color HSL triplets and gradient differ.

## Architecture

- `src/slides/themes.ts` — `THEMES` registry, `applyTheme(id)`, `setTheme(id)`, `getStoredTheme()`, `coerceThemeId()`. Default = `bright-gold`.
- `applyTheme(id)` writes `data-theme` on `<html>` and patches `--gold`, `--gold-glow`, `--cream`, `--primary`, `--ring`, `--foreground`, `--muted-foreground`, `--border`, `--gradient-noir` on `:root`.
- `src/main.tsx` calls `applyTheme(getStoredTheme())` BEFORE `createRoot` so the first paint is correct (no flash on hard refresh).
- `setTheme(id)` also broadcasts `{ type: 'theme', id }` over `BroadcastChannel('riseup-deck-sync')` so the presenter window re-applies live.
- `PresenterPage` calls `applyTheme(getStoredTheme())` on mount AND listens for `theme` messages — keeps presenter chrome in lockstep with the audience deck.
- `localStorage` key: `riseup.theme.v1`.

## Picker UI

- `src/slides/controls/ThemeMenu.tsx` — palette icon button in the controller pill (between share and fullscreen). Popover shows swatch row + label + active checkmark. Live-applies on click.

## Manifest round-trip

- `buildManifest(deck, slides, themeId?)` stamps the active theme into `deck.theme`.
- `manifestTheme(m)` reads it (with `coerceThemeId` fallback).
- `DeckMenu.handleFile()` calls `setTheme(manifestTheme(m))` before reload, so imports already render in the right palette.
- Schema: `deck.schema.json` restricts `theme` to `"noir-gold" | "bright-gold"`.

## Theme import/export (single-theme JSON)

- `src/slides/themeManifest.ts` — `buildThemeManifest(id)` / `parseThemeManifest(raw)` / `downloadThemeManifest(m)`. Manifest envelope: `{ manifestVersion: 1, exportedAt, source?, theme: SerializableTheme }`.
- `SerializableTheme` mirrors `ThemePreset` (id, label, description, swatch[], appearance?, vars, fonts?). Tokens travel as HSL triplets, fonts as full `font-family` strings.
- Imported themes persist in `localStorage["riseup.themes.custom.v1"]` and are merged into the in-memory `THEMES` registry by `registerCustomThemesOnBoot()`, called from `main.tsx` BEFORE `applyTheme(getInitialTheme(...))`.
- Built-in ids cannot be shadowed — collisions auto-suffix `-imported`, `-imported-2`, … . Re-importing the same custom id updates in place.
- UI: `ThemeMenu` header gains Download / Upload icon buttons. Custom rows show a gold "Imported" capsule + Trash2 remove button. Removing the active custom theme falls back to the first remaining theme.
- Sharing a deck that uses a custom theme is a 2-file flow: send the deck JSON + the theme JSON. Embedding a theme inside a deck manifest (`editor.theme`) is deferred until requested.

## Hard rule

NEVER hard-code `#f3a502` or `#C9A84C` in components. Always `hsl(var(--gold))`. Hard-coded brand colors break theme switching silently. Same for `--cream`, `--primary`, etc.

## Adding a new theme

1. Append to `THEMES` in `src/slides/themes.ts`.
2. Add id to `theme` enum in `spec/slides/deck.schema.json`.
3. Update `spec/21-slides-system/07-theme-system.md` table.
