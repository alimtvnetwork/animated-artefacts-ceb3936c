# 62 — Theme JSON import/export

**Date:** 2026-05-02
**Task #:** 35 (Window 2 #32)

## Trigger
Follow-up to #61 (QR github-light + import/export scope). User asked to
implement the theme import/export piece logged as deferred there.

## What shipped
- **Schema** (`src/slides/themeManifest.ts`): `SerializableTheme` mirrors
  the runtime `ThemePreset` fields needed for round-trip — id, label,
  description, swatch[], appearance?, vars (HSL-triplet token map),
  fonts? (display/body/mono CSS family strings). Wrapped in a
  `ThemeManifest` envelope (`manifestVersion: 1`, `exportedAt`, `source?`).
- **Build / parse / download** helpers: `buildThemeManifest(id)`,
  `parseThemeManifest(raw)` (throws on malformed input),
  `downloadThemeManifest(manifest)`.
- **Runtime overlay**: imported themes persist in
  `riseup.themes.custom.v1` localStorage and are merged into the in-memory
  `THEMES` registry via `registerCustomThemesOnBoot()`. Called from
  `main.tsx` BEFORE `applyTheme(getInitialTheme(...))` so a saved custom-id
  selection actually resolves on reload (otherwise `coerceThemeId` would
  fall back to DEFAULT_THEME).
- **Built-in protection**: `BUILTIN_IDS` (snapshot of `Object.keys(THEMES)`
  taken at module load before any imports register) cannot be shadowed.
  Collisions auto-suffix `-imported`, `-imported-2`, … . Re-importing the
  same custom id updates in place (no duplicate suffix).
- **UI** (`src/slides/controls/ThemeMenu.tsx`): Download + Upload icon
  buttons added to the header next to Bug/Close. Picker rows now read
  `Object.keys(THEMES)` (was `THEME_IDS`, the static built-in list) so
  imports surface live. Custom rows get an "Imported" gold capsule and a
  Trash2 remove button (sibling to the picker button — no nested-button
  HTML invariant violation). Removing the active custom theme falls back
  to the first remaining theme.

## Why a separate module (not in `manifest.ts`)
Decks and themes have independent lifecycles:
- A custom theme can outlive any single deck and apply across many.
- "Reset to bundled deck" must NOT wipe imported themes — separate
  storage slot + separate reset button.
- A deck manifest's `deck.theme` is a string id only; the receiver still
  needs the theme installed (built-in or imported separately). Documented
  inline at the top of `themeManifest.ts`.

## What does NOT travel
- Theme presets that depend on assets shipped with the project (e.g.
  per-theme font files at `front-end/themes/<id>/`). The manifest carries
  CSS `font-family` strings only — the receiving project must already
  have those families available (or fall back to system stack).
- Per-theme `data-theme="<id>"` CSS attribute selectors authored in
  `index.css`. Imported themes get their `vars` map applied via the
  inline-style branch in `applyTheme`, so any styling that's gated on
  `[data-theme="github-light"]`-style attribute selectors won't activate
  for an import even if it carries the same id.

## Round-trip with the deck manifest
The deck manifest already stamps `deck.theme = <id>` (since v1). Sharing a
deck that uses a custom theme is a 2-file flow today: send the deck JSON
+ the theme JSON. A future enhancement could embed the theme inside the
deck manifest (`manifest.editor.theme`) — deferred until requested.

## Reversibility
Each layer is independent:
- Drop the boot hook in `main.tsx` → custom themes stop loading; data
  stays in localStorage harmlessly.
- Drop the UI buttons → registry + storage still work; users keep their
  imports but can't manage them via the menu.
- Drop the whole feature → delete `themeManifest.ts`, revert main.tsx +
  ThemeMenu changes; built-in themes unaffected.
