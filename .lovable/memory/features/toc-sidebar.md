---
name: toc-sidebar
description: Left-edge searchable slide outline (`SlideTocSidebar`). Toggle = `Ctrl+1` / `⌘+1` (was `O`, freed for camera circle). `Esc` closes when open. Default closed, persisted under `riseup.tocSidebar`. The hamburger / consolidated presenter menu lives in the **top-right controller**, NOT in this sidebar — see `mem://features/controller-hamburger`.
type: feature
---

## Bindings (v4, 2026-05-02)

| Key | Action |
|-----|--------|
| `Ctrl+1` / `⌘+1` | Toggle open/closed. |
| `Escape` | Close when open. No-op when already closed. |
| Edge-trigger / X button | Same toggle. |

The previous `O` binding is now camera-circle (spec 64 §15).

## What this sidebar does NOT contain

The hamburger dropdown (Overview / Presenter view / Top jumper /
Reveal hints / Contrast debug / Reduce motion / Keyboard map) lives in
the **top-right controller pill**, not here. Earlier plan (#29 Q7)
placed it here; superseded by #30. Sidebar remains a pure slide
outline + search.

## Forbidden
- Adding a hamburger to the sidebar header (it goes in the controller).
- Removing the `Ctrl+1` / `Esc` bindings.
