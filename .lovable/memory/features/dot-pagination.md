---
name: dot-pagination
description: Bottom-center NUMBERED dot row showing every linear slide; ON by default; numbers always visible (active = ink-on-gold, inactive = muted foreground); hover reveals a tooltip card with "NN — Eyebrow / Title"; click-to-jump; active pill morphs between slots via layoutId spring.
type: feature
---

## What

A row of numbered pills at `fixed bottom-6 left-1/2`, one per linear slide.
Inactive pills are 20×24 muted circles with the slide number always visible.
Active pill is 32×24 gold with ink-colored number. Hover any pill → a card
appears above the row with the slide's eyebrow + title.

## Files

- `src/slides/controls/DotPagination.tsx` — the component (numbered + tooltip).
- `src/slides/presetSettings.ts` — `showDotPagination: boolean` (default **TRUE** as of v0.26.0).
- `src/pages/SettingsPage.tsx` — toggle UI.
- `src/pages/SlideDeckPage.tsx` — renders `<DotPagination slides={linearSlides} ...>` when the setting is on, hidden during gridOpen.

## Rule

ON by default (v0.26.0). Hidden in fullscreen presenter view, hidden when
grid overview is open, hidden in print/export. Active pill morphs between
slots via `layoutId="dot-pagination-active"` — never fade-swap. Numbers MUST
remain visible at every state (active + inactive + hover).

## Animation contract (v0.26.0)

- **Active pill move**: Framer spring (stiffness 420, damping 30, mass 0.6)
  via `layoutId` — snappy slot-to-slot landing.
- **Active pill glow**: layered `box-shadow` — 12px outer @ gold/0.55 +
  4px inner @ gold/0.8.
- **Number color**: active = `text-ink` (deep ink), inactive = `text-foreground/55`,
  hover = `text-foreground`. Uses `tabular-nums` so widths don't jitter.
- **Tooltip**: above the row, gold/30 border + `bg-background/95 backdrop-blur-md`,
  shows a gold number chip + (eyebrow line + title). 180ms ease in/out scale 0.96→1.
  `pointer-events-none` so it never blocks the click.
- **Reduced motion**: spring drops to `duration: 0.01`. Tooltip still appears (it's
  information, not decoration).

## Overflow trap (v0.36.1) — DO NOT REGRESS

The wrapper around the dot row MUST be `overflow-visible` whenever the dots
fit without scrolling (i.e. `total <= 28`). Setting `overflow-x: auto`
unconditionally **silently clips the hover tooltip**, because per CSS spec
`overflow-x: auto` implicitly forces `overflow-y: hidden`. The tooltip
renders `absolute bottom-full` and gets swallowed.

Rule: only enable `overflow-x-auto` + edge mask when `total > 28`. Otherwise
use `overflow-visible`. If we ever need both scrolling AND a non-clipped
tooltip, the tooltip must move out of the scroll container (portal or
position-fixed using the hovered button's bounding rect).
