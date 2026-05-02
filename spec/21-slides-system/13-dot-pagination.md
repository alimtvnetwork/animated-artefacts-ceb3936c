# 13 — Dot Pagination Indicator

A bottom-center row of small dots showing every active slide, with the
current one elongated into a gold pill. Click any dot to jump.

## Why

The audience needs an at-a-glance progress signal that doesn't require
hovering the controller. The persistent `SlideNumberBadge` (e.g. `16/37`)
gives the number; the dot row gives **shape** — how far through the deck
we are, and how much remains.

## When it appears

Off by default. Opt-in via `/settings` (`PresetSettings.showDotPagination`).
When the setting is on:

- Renders on every linear slide (excludes click-reveal sub-slides — those
  live outside the linear flow).
- Hidden in fullscreen presenter view (the presenter has their own UI).
- Hidden when the grid overview is open.
- `data-print-hide="true"` so it stays out of HTML/PDF exports.

## Visual spec

| Property | Value |
|----------|-------|
| Position | `fixed bottom-6 left-1/2 -translate-x-1/2 z-30` |
| Container | flex row, `gap: 8px`, `align-items: center` |
| Inactive dot | `6px × 6px`, `border-radius: 50%`, `bg-foreground/25` |
| Active dot | `24px × 6px`, `border-radius: 9999px`, `bg-gold`, soft `0 0 12px hsl(var(--gold)/0.4)` glow |
| Hover dot | `bg-foreground/55` |
| Cap | If `total > 28`, render the row with `overflow-x-auto` and a fading mask on each edge. **Otherwise the wrapper MUST use `overflow-visible`** so the hover tooltip (which renders `absolute bottom-full`) is not clipped by the scroll container. CSS spec: `overflow-x: auto` implicitly forces `overflow-y: hidden`, which silently swallows the tooltip — never use `overflow-x-auto` unconditionally. |
| Tooltip | Hover/focus reveals a single dark pill above the dot showing `NN. Title` (number in gold, title in white). Renders `absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none`, with a small rotated-square arrow pointing down at the dot. Title text falls back through `content.title → content.eyebrow → slideName → "Slide N"`. |

## Animation

- Active dot **morphs in place** via Framer `layoutId="dot-pagination-active"`,
  using the same easing as the controller (`cubic-bezier(0.22, 1, 0.36, 1)`,
  `0.32s`). The cream/gold pill slides from old slot to new slot rather than
  fading out + in.
- Reduced-motion: drop the morph, instant swap.

## Click behavior

Each dot is a `<button>` with `aria-label="Go to slide N"`. Click jumps to
that slide using the deck's `goTo(n, dir)` with direction inferred from
relative position — same code path as the SlideIndicator number-input.

## Settings storage

Adds `showDotPagination: boolean` (default `false`) to the `PresetSettings`
shape in `src/slides/presetSettings.ts`. No CSS variable needed — the
component reads the setting directly via `useSyncExternalStore`-style
subscription (or simple `useState` + storage event listener).
