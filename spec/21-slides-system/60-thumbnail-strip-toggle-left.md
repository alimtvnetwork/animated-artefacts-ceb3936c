# 60 — Thumbnail strip toggle: left-side, icon-only, hover-fade

Supersedes the bottom-center "Thumbnails ⌃ T" pill from `ThumbnailStrip.tsx`.

## Why
The previous toggle sat dead-center along the bottom edge and competed
visually with the controller pill, the brand inset, and the slide content
itself. It also duplicated the `T` keyboard shortcut hint inside the
viewport. Authors reported it as the loudest piece of chrome on the stage.

## New placement & shape

- **Position:** fixed to the **left edge** of the viewport, vertically
  centered against the bottom thumbnail strip rail. `left-3 bottom-24`
  (sits just above where the strip would mount when open).
- **Default state — icon only:**
  - 36×36 round button using the `controller-pill` surface tokens.
  - Single `LayoutPanelTop` icon in gold.
  - No text, no chevron, no `T` hint visible.
- **Hover / focus state — full label revealed at 20% opacity:**
  - Wrapper expands horizontally to reveal `Thumbnails`, the open/closed
    chevron, and the `T` keyboard hint.
  - The expanded label region renders at **`opacity: 0.2`** so it's
    legible to a presenter who's looking for it but stays whisper-quiet
    against the slide.
  - The icon itself remains at full opacity — it's the persistent anchor.
- **Strip itself (when `open`):** unchanged; still mounts horizontally
  centered along the bottom. Only the toggle moves.

## Motion
- 200ms ease for the width morph; respects `prefers-reduced-motion` (no
  width animation, just opacity fade in/out).
- No layout shift on hover — the expanded label uses absolute
  positioning to the right of the icon so the icon never moves.

## Accessibility
- `aria-expanded` reflects strip open/closed.
- `aria-label` always reads "Show/Hide thumbnail strip (T)" so screen
  readers get the full affordance even when the visual label is hidden.
- The 20% opacity applies only to decorative label text; the button
  hit-target and accessible name are unaffected.

## Keyboard
- `T` shortcut unchanged.
