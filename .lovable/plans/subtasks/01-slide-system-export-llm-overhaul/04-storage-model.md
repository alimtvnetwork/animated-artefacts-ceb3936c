---
Slug: storage-model
Status: done (impl 2026-06-06 v1.16.0 — authoritative doc at spec/21-slides-system/architecture/storage-model.md; real keys corrected)
Created: 2026-06-06
Parent: 01-slide-system-export-llm-overhaul
---

# Storage model for imported items (where/read/save)

Answers the user's "where do you keep imported items, how do you feed/read/save them?"

## Storage locations
| Item | Key / location | Read on boot | Write on change |
|------|----------------|--------------|-----------------|
| Active theme (global) | `localStorage["riseup.theme.v1"]` | `main.tsx` before createRoot | `setTheme()` |
| Per-deck theme pin | `localStorage["riseup.theme.byDeck.v1"]` | `getInitialTheme()` | `setTheme()` |
| Imported custom themes | `localStorage["riseup.themes.custom.v1"]` | `registerCustomThemesOnBoot()` before applyTheme | on theme import/remove |
| Imported deck (override) | `localStorage["riseup.deck.imported.v1"]` (`IMPORTED_MANIFEST_KEY`) | deck loader, falls back to bundled `import.meta.glob` | on deck/slide import |
| Builder draft deck | `localStorage["riseup.deck.draft.v1"]` (`DRAFT_DECK_KEY`) | `useDraftDeck()` on mount | autosave on edit |
| Settings (toggles) | `localStorage["riseup.presetSettings.v1"]` (`STORAGE_KEY`) | settings store init | on toggle change |

> CORRECTION (2026-06-06): the original draft listed `riseup.deck.v1` and
> `riseup.settings.v1`. Those never shipped — real keys are
> `riseup.deck.imported.v1` and `riseup.presetSettings.v1`. Authoritative copy:
> `spec/21-slides-system/architecture/storage-model.md`.

## Read flow (boot order in main.tsx)
1. registerCustomThemesOnBoot() → merge into in-memory THEMES
2. applyTheme(getInitialTheme(deckTheme, deckSlug))
3. deck loader: imported deck override (if present) else bundled glob

## Save flow
- Single-slide import: load imported/bundled deck into memory → insert/replace slide → persist to `riseup.deck.v1` → broadcast `riseup-deck-sync`.
- Theme import: merge → persist `riseup.themes.custom.v1` → broadcast theme.
- ZIP import: parse all parts → validate → apply each (slides, themes, settings) atomically → persist → single broadcast.

## Reset / safety
- "Reset" clears `riseup.deck.v1` so bundled deck returns. Bundled JSON is never overwritten.
- All persisted blobs carry `manifestVersion` for future migration.
