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

---

## Audit findings (plan step 1, 2026-06-06)

Exact tokens that must change for TopRight in `src/slides/controls/ControllerBar.tsx`:

- **L145** wrapper: `fixed bottom-6 right-6 ... flex items-end justify-end pl-4 pt-4`
  → `fixed top-6 right-6 ... flex items-start justify-end pl-4 pb-4` (anchor top, bridge padding flips to bottom).
- **L326** Theme/Share/Deck popover container: `absolute bottom-full mb-3 right-0`
  → `absolute top-full mt-3 right-0` (open downward).
- **L325 comment** references `bottom-full` — update wording.
- **Hamburger panel anchor `recomputeAnchor` (L408-414):**
  `bottom: window.innerHeight - r.top + 8` / `right: window.innerWidth - r.right`
  → switch to `top: r.bottom + 8` and keep `right`. Panel style L502 `{ bottom, right }` → `{ top, right }`.
- **Panel entrance motion L495-497** uses `y: 6` (rises). For a downward panel keep `y: -6` so it settles down into place (optional polish).
- Tooltips use `side="top"` throughout — for a top-anchored pill, flip to `side="bottom"` so tooltips don't collide with the viewport edge.

Presenter/fullscreen parity: ControllerBar is the single component rendered in all contexts, so one change covers deck + fullscreen. `PresenterTopBar.tsx` is separate and already top-anchored — no change needed.
