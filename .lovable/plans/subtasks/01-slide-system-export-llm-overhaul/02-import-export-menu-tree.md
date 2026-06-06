---
Slug: import-export-menu-tree
Status: pending
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
