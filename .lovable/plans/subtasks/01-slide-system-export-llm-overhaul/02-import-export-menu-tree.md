---
Slug: import-export-menu-tree
Status: done (impl 2026-06-06 v1.14.0 — structured ImportExportSubmenu)
Created: 2026-06-06
Parent: 01-slide-system-export-llm-overhaul
---

# Import / Export menu tree

Single top-level node "Import / Export" with grouped submenus.

## Slides
- Import slide JSON (single)        → file picker, validate vs slide.schema.json, insert at index
- Import deck JSON (all slides)     → manifest parse, replace/merge
- Export current slide JSON         → single-slide envelope, stripDefaults
- Export deck JSON (all slides)     → deck manifest

## Themes
- Import theme (single)             → themeManifest.parseThemeManifest
- Import themes (all)               → array of theme manifests
- Export active theme               → buildThemeManifest(active)
- Export all themes                 → bundle of THEMES + custom

## PDF
- Export deck to PDF                → all slides, one page each (see 03-pdf-export.md)
- Export current slide to PDF       → single page

## Full bundle (ZIP)
- Export ZIP                        → deck + slides + themes + settings + manifest.json index
- Import ZIP                        → unzip, validate parts, atomic apply

## Rules
- All exports are authoring-only; never mutate bundled deck JSON.
- Labels standardized in step 43 of parent plan.
- Each handler wraps work in try/catch and logs via src/lib/errors.ts.

## Implementation note (2026-06-06)
- Implemented in `src/slides/controls/ImportExportSubmenu.tsx` and wired from
  `src/slides/controls/ControllerBar.tsx`.
- Current working rows reuse existing flows: deck JSON import/export → `DeckMenu`,
  theme import/export → `ThemeMenu`, deck PDF → `runExport('pdf-rgb')`, authoring
  guide download/copy → `llmGuideBundle`.
- Still-planned rows are rendered as explicit `Soon` entries with logging + toast
  feedback, so the menu tree exists now without silently pretending unfinished
  paths are complete.

## Update — v1.20.0 (2026-06-06)
Three previously-`Soon` rows are now live:
- **Export JSON (current slide)** → `slideJson.exportSlideJson` (versioned envelope).
- **Export themes (all)** → `themeBulk.exportAllThemes` (built-ins + customs bundle).
- **Import themes (all)** → `themeBulk.parseThemeBundle` + `installAllThemes` (skips built-ins).
Shared `downloadJson.ts` helper added.

## Update — v1.22.0 (2026-06-06)
- **Import JSON (single)** → `slideJsonImport.planSingleSlideImport` + `ImportExportSubmenu` file picker.
- Import flow: parse single-slide envelope → validate slide with `validateSlide()` → insert **after current slide** → persist a rebuilt deck manifest to `riseup.deck.imported.v1` → reload.
- Link safety: later `slideNumber`s shift forward by 1, and `parentSlide` / `clickRevealSlide` / `revealSlide` references are shifted with them so hidden-detail routing stays intact.
- Remaining `Soon`: Export ZIP, Import ZIP.

## Update — v1.23.0 (2026-06-06)
- **Export ZIP / Import ZIP** are now live via new `src/slides/zipBundle.ts` (uses `fflate`). No `Soon` rows remain in the menu tree.
- Export packs `deck.json` (DeckManifest) + `themes.json` (ThemeBundle) + `bundle.json` (meta) → `riseup-bundle-<slug>-<date>.zip`.
- Import unzips, validates BOTH parts (`parseManifest` + `parseThemeBundle`) before any write, installs custom themes, persists the manifest to `riseup.deck.imported.v1`, then reloads — atomic apply.
- Removed the now-unused `planned()` helper + `SOON_BADGE` from `ImportExportSubmenu`. Round-trip + negative tests added to `contracts.test.ts`.
