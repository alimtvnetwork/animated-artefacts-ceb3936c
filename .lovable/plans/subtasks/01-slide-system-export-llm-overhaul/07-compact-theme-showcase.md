---
Slug: compact-theme-showcase
Status: done (impl 2026-06-06 v1.19.0 — ThemeSwatchGrid.tsx dense 4-col grid; ThemeMenu delegates list)
Created: 2026-06-06
Parent: 01-slide-system-export-llm-overhaul
---

# Compact theme/color showcase (issue 01)

## Problem
Current `ThemeMenu` swatch rows + labels are too large.

## Target design
- Dense swatch GRID (e.g. 4–5 per row) of small theme tiles instead of full-width rows.
- Each tile: mini gradient + accent dot, label on hover/tooltip, active checkmark overlay.
- Header row: Download (export active) + Upload (import) icon buttons + "Export all" / "Import all".
- Custom imported themes show a small "Imported" tag + trash on hover.

## Constraints
- Live-applies on click (unchanged behavior).
- Keep keyboard accessible; respect reduced motion.
- File: `src/slides/controls/ThemeMenu.tsx`.
