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
Shared `downloadJson.ts` helper added. Remaining `Soon`: Import JSON (single), Export/Import ZIP.
