# 04 — Grid / Overview Mode

A full-screen overview of every active slide in the deck. Use it during a
presentation to jump quickly without paging through, or while authoring to
get a bird's-eye sense of pacing and visual variety.

## How to open / close

| Action          | Trigger                                                   |
|-----------------|-----------------------------------------------------------|
| Open or close   | Press `G` anywhere in the app (except inside an input)    |
| Open            | Click the grid icon in the controller pill (bottom-right) |
| Close           | Press `Esc`, press `G`, or click the close button (top-right of overview) |
| Jump to a slide | Click any thumbnail — overview closes and slide loads     |

While the overview is open, navigation keys (`←` `→` `Space`) are suppressed
so they don't accidentally move the underlying deck.

## What appears

- Only **active linear slides** — slides with `enabled: false` and click-reveal
  slides (`isClickReveal: true`) are excluded. Slide IDs in the grid may
  therefore skip numbers (e.g. 01, 02, 03, 05).
- Each tile shows the **real rendered slide** (same React components as the
  main stage), scaled into a fixed 1920×1080 inner box via CSS transform.
  This guarantees thumbnails match the live render exactly — no preview drift.
- The current slide is highlighted with a gold ring and soft glow.
- Each tile footer shows `NN · slide-name` for quick recognition.

## Layout

- Responsive grid: `repeat(auto-fill, minmax(320px, 1fr))`.
- 24px gap, 40px outer padding.
- Sticky header bar with title, slide count, and shortcut hints.
- Backdrop: `bg-background/95` + `backdrop-blur-2xl` so the live slide is
  faintly visible behind the overview, preserving spatial context.

## Accessibility

- `role="dialog"` + `aria-modal="true"` + `aria-label="Slide overview"`.
- Each thumbnail button has `aria-label="Jump to slide N: slide-name"`.
- Focus-visible ring is gold; focus is not trapped (Tab can leave the dialog).

## Performance note

Thumbnails render the full slide tree. For decks under ~50 slides this is
fine. Beyond that, consider caching a snapshot or rendering only on first
open.
