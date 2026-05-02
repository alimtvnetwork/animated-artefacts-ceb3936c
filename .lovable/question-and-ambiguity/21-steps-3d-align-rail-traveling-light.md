# 21 — StepsChain3D: align with logo + rail behind numbers + traveling light

**Date:** 2026-04-30
**Mode:** No-Questions (21/40)

## User request (verbatim)
> "In the 3D slide, 3D steps, the steps and header and others needs to move
> align with the logo just like the slide three. … For the line, for the
> steps line, put the lines in the below of the numbers and make it a little
> bit of transparent so that it feels very nice. And it should only be
> visible in between the numbers. The numbers will have the more priority.
> So when color or the number gets highlighted, that should be visible, not
> the line actually. … There should be a light going when we move from one
> step to the another."

## Root cause analysis

### 1. Header / steps not aligned with logo
- **Slide 3 (`StepTimelineSlide.tsx`)** wraps its body in
  `step-timeline-content` with
  `marginLeft: var(--body-grid-margin-left)` +
  `paddingTop: var(--brand-inset-y, 116px)`. This anchors the eyebrow,
  title, AND the step markers to the BrandHeader logo's left/top sight
  line via the same CSS vars the brand chrome uses.
- **Slide 4 (`StepsChain3DSlide.tsx`)** uses raw Tailwind
  `absolute inset-0 px-24 pt-28 pb-20 grid grid-cols-12 gap-12`. This
  centers content on the canvas using fixed pixel padding instead of
  inheriting `--brand-inset-x` / `--brand-inset-y`. Result: when the
  brand chrome moves (logoScale, logoOffsetY, settings slider), slide 3
  follows and slide 4 doesn't — the logo and the "Engagement Process"
  title sit on different X axes.

### 2. Rail visible across the numeric markers
- Current rail: `bg-[hsl(var(--gold)/0.55)]` at `translateZ(0px)` —
  same plane as markers. Opaque marker disks DO mask it where they
  overlap, but at 0.55 opacity the line still reads strongly between
  markers, competing with the gold marker glow when the active marker
  lights up.
- User wants the rail to feel like a faint thread that the numbers
  punch through — line should sit BEHIND the markers (z < marker z),
  be more transparent (~0.20–0.25), and never compete with the active
  marker's halo.

### 3. No traveling-light cue between steps
- Currently when `active` changes, only the marker bubble + right panel
  animate. There's no visual along the rail that connects the previous
  active marker to the new one — so the eye has nothing to follow
  between steps.

## Decision / fix

### Fix 1 — Anchor to brand chrome (mirror slide 3)
- Replace the slide-4 root from
  `absolute inset-0 px-24 pt-28 pb-20 grid grid-cols-12 gap-12`
  with a flex column that uses
  `paddingTop: var(--brand-inset-y, 116px)` and
  `paddingLeft / paddingRight: var(--brand-inset-x, …)` so the eyebrow,
  title, chain, and right panel all share the logo's sight line.
- Inner two-column layout stays a 7/5 split but inside the new
  brand-anchored container, not as a global 12-col grid against the
  raw slide edges.

### Fix 2 — Rail behind numbers, faint, between-only
- Push rail `translateZ(-40px)` (clearly behind the marker plane at
  z=0). Opaque marker disks now sit IN FRONT, so the rail naturally
  disappears under each number.
- Drop opacity from `0.55` → `0.22` so the line reads as a subtle
  thread in the gaps, never as a UI rail.
- Keep the half-pixel X centering and the markerSize/2 top/bottom trim
  unchanged — geometry was correct, only depth + alpha change.

### Fix 3 — Traveling light pulse on step change
- Add a sibling absolutely-positioned `<div>` on the rail axis: a
  short vertical gold gradient (`24px` tall, gold→transparent at both
  ends, `box-shadow` glow) that animates `top` from the previous
  active marker's center Y to the new active marker's center Y over
  ~520ms with a spring/ease-out curve.
- Sits at `translateZ(-20px)` — above the dim rail, still behind the
  markers, so as it passes under each marker the marker masks it
  briefly (looks like the light is "threading through" the numbers).
- Disabled (no animation, no element) under
  `prefers-reduced-motion: reduce`.

## Reversal hint
- To restore the centered raw-edge layout: revert root `<div>` className.
- To bring the rail forward again: change `translateZ(-40px)` back to
  `0px` and bump opacity to `0.55`.
- To remove the traveling light: delete the `<TravelingPulse>` element
  and its supporting state.
