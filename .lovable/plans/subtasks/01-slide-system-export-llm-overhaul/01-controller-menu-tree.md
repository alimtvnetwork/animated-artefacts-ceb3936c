---
Slug: controller-menu-tree
Status: pending
Created: 2026-06-06
Parent: 01-slide-system-export-llm-overhaul
---

# Controller menu restructure (Debug = one entry)

## Goal
The controller pill keeps its primary chips (prev / N-of-total / next / share / fullscreen). Everything presenter/debug related collapses into ONE "Debug" submenu inside the hamburger dropdown.

## Proposed tree
- Hamburger (Menu icon)
  - Import / Export → (see 02-import-export-menu-tree.md)
  - Debug ▸
    - Overview (G)
    - Presenter view
    - Top Talk Jumper (J)
    - Reveal hints / Click-reveal mode
    - Transition style ▸ / Step motion ▸
    - Contrast debug
    - Reduce motion
    - Keyboard map (/)

## Notes
- Mount dropdown as a SIBLING of the overflow-hidden pill (see mem://features/controller-popovers).
- With TopRight anchor, dropdown opens DOWNWARD (`absolute top-full mt-3`), not upward.
- Supersedes current flat hamburger list (mem://features/controller-hamburger) — update that memory after build.
