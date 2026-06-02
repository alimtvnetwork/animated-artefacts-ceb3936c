---
name: keyboard-shortcuts-dialog
description: Global `?` shortcut opens a Radix Dialog listing every keyboard shortcut grouped by surface (Deck nav, Camera, Sidebar, Debug). `Esc` closes. Lives in `src/slides/controls/KeyboardShortcutsDialog.tsx`. Source of truth = a single SHORTCUTS table re-used by the dropdown item in SlideTocSidebar.
type: feature
---

## Trigger
- `?` keypress anywhere (guarded against form-field focus).
- "Keyboard map" item in the SlideTocSidebar hamburger dropdown.

## Behavior
- Opens a Radix `Dialog` with sections: Deck nav, Camera, Sidebar, Debug.
- Each section renders a 2-column table: `<kbd>` chips on the left,
  description on the right.
- `Esc` closes via Radix's built-in dismiss.
- Source of truth: a single exported `SHORTCUTS` array imported by
  both this dialog and the sidebar dropdown — never duplicate the list.

## Forbidden
- Hard-coding shortcut strings in two places.
- Custom modal — use Radix Dialog so `Esc` and focus-trap come for free.
- Showing this dialog over a builder textarea (must respect input-focus
  guard like every other shortcut in the deck).

See spec/21-slides-system/66-presenter-webcam.md §15.6.
