# Storage model — where imported items live, how they're read & saved

> Source of truth for the "where do you keep imported items, how do you
> feed/read/save them?" question. Verified against the actual exported keys in
> code on 2026-06-06 (v1.15.0+). Where this differs from the planning table in
> `.lovable/plans/subtasks/01-slide-system-export-llm-overhaul/04-storage-model.md`,
> THIS file wins — the plan invented `riseup.deck.v1` / `riseup.settings.v1`
> keys that never shipped.

## Storage locations (real keys)

| Item | localStorage key | Defined in | Read on boot | Write on change |
|------|------------------|-----------|--------------|-----------------|
| Active theme (global) | `riseup.theme.v1` | `src/slides/themes.ts` | `main.tsx` before `createRoot` (`getInitialTheme`) | `setTheme()` |
| Per-deck theme pin | `riseup.theme.byDeck.v1` | `src/slides/themes.ts` | `getInitialTheme(deckTheme, deckSlug)` | `setTheme()` |
| Imported custom themes | `riseup.themes.custom.v1` (`CUSTOM_THEMES_STORAGE_KEY`) | `src/slides/themeManifest.ts` | `registerCustomThemesOnBoot()` before `applyTheme` | on theme import / remove |
| Imported deck manifest | `riseup.deck.imported.v1` (`IMPORTED_MANIFEST_KEY`) | `src/slides/loader.ts` | deck loader, falls back to bundled `import.meta.glob` | on deck / slide import |
| Builder draft deck | `riseup.deck.draft.v1` (`DRAFT_DECK_KEY`) | `src/builder/draftDeck.ts` | `useDraftDeck()` on mount | autosave on edit |
| Preset/handout settings | `riseup.presetSettings.v1` (`STORAGE_KEY`) | `src/slides/presetSettings.ts` | settings store init | on toggle change |

There is **no** `riseup.deck.v1` and **no** `riseup.settings.v1`. Runtime deck
overrides use `riseup.deck.imported.v1`; settings use
`riseup.presetSettings.v1`.

## Read flow (boot order in `src/main.tsx`)

1. `registerCustomThemesOnBoot()` → merge imported themes into in-memory `THEMES`.
2. `applyTheme(getInitialTheme(deckTheme, deckSlug))` — priority: URL `?theme=`
   → testMode+deckTheme → per-deck pin (`riseup.theme.byDeck.v1`) → global slot
   (`riseup.theme.v1`) → `DEFAULT`.
3. Deck loader (`src/slides/loader.ts`): if `riseup.deck.imported.v1` is present
   use it, else the bundled `front-end/project/*/data` globs.

## Save flow

- **Theme import:** merge → persist `riseup.themes.custom.v1` → broadcast over
  `riseup-deck-sync` (`{ type: 'theme', id }`).
- **Deck / slide import:** parse → validate against the manifest/slide schema →
  persist `riseup.deck.imported.v1` → broadcast so other windows reload.
- **Settings change:** persist `riseup.presetSettings.v1`; `subscribePresetSettings`
  pushes live updates (e.g. the handout footer) without a refresh.

## Cross-window sync

`BroadcastChannel('riseup-deck-sync')` (`src/slides/sync.ts`). `SyncMessage`
is a discriminated union (`slide` / `nav` / `request-state` / `theme`); the
exhaustive `handleSyncMessage` table fails the build if a variant is added but
not handled.

## Reset / safety

- "Reset to bundled" clears `riseup.deck.imported.v1` so the bundled deck
  returns. Bundled JSON under `front-end/project/` is **never** overwritten.
- Theme/deck blobs carry a `manifestVersion` for future migration; preset
  settings carry a one-shot migration flag
  (`riseup.presetSettings.bodyAlignment.v0.68`).
