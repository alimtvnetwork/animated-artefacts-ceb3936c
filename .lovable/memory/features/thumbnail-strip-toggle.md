---
name: thumbnail-strip-toggle
description: Bottom thumbnail strip toggle lives on the LEFT edge as an icon-only button; hover reveals label/chevron/T-hint at 20% opacity
type: design
---

# Thumbnail strip toggle (v0.153)

The `ThumbnailStrip` toggle is **left-edge, icon-only** by default.
Spec: `spec/slides/60-thumbnail-strip-toggle-left.md`.

- Position: `fixed left-3 bottom-24` (vertically above where the strip
  mounts when open). NOT bottom-center.
- Default: 36×36 round `controller-pill` button with a gold
  `LayoutPanelTop` icon. No text. No chevron. No `T` hint visible.
- Hover/focus: a label region (`Thumbnails` + open/closed chevron + `T`
  hint) reveals to the right of the icon at **`opacity: 0.2`**. Icon
  stays at full opacity. Icon must NOT shift position when the label
  expands — use absolute positioning for the label.
- The strip itself (when `open`) still mounts bottom-center. Only the
  toggle moved.
- Keyboard `T` shortcut unchanged.

If you ever re-introduce a visible "Thumbnails" pill at the bottom-center
of the viewport, that's a regression — see issue history.
