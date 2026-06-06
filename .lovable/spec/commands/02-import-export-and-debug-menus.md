# Command — Consolidate import/export + debug into structured menus

**Command (verbatim, paraphrased from request):** "in the settings you have single slide import and single slide export and all slide import, export both… export button that does all these things… color themes can also be downloaded and imported… add PDF export… import/export single, multiple, all… a full zip to import and export… debug will have only one option and inside it other things."

**Scope:** Controller menu(s) — `DeckMenu.tsx`, `ThemeMenu.tsx`, controller hamburger dropdown.

**Required structure:**
- **Import/Export menu** (single parent), with submenus:
  - Slides: Import JSON (single), Import JSON (all/deck), Export JSON (current slide), Export JSON (all/deck).
  - Themes: Import theme (single), Import themes (all), Export theme (single/active), Export themes (all).
  - PDF: Export deck to PDF, Export current slide to PDF.
  - Full bundle: Export ZIP (deck + themes + settings), Import ZIP.
- **Debug menu**: a single entry point that opens one menu containing all debug toggles (contrast, reduce motion, reveal hints, keyboard map, presenter, overview).

**When it applies:** All future controller/menu work.
