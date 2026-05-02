# Spec 34 — Body Grid Alignment Toggle

Status: locked (v0.66.0; default changed in v0.68.0; header edge corrected in v0.69.0; body offset nudge in v0.70.0)
Related: spec 32 (StepTimeline v3.3 Centered Composition), spec 33 (interaction layer).

## Problem

The body grid (`.step-timeline-content`, and any future body grid that
opts in) is rendered as a centered 1440px master container — `width:75%;
max-width:1440px; margin-inline:auto`. On viewports wider than ~1920px,
this means the body sits noticeably to the right of the BrandHeader logo
(which lives at the true viewport edge with `px-6 lg:px-8`). The
mismatch breaks the vertical sight line some compositions want between
the logo and the body's left rail.

## Solution

A new global preset toggle: `bodyAlignment: 'centered' | 'header-anchored'`.

- **centered** — legacy centered behaviour. `margin-inline: auto`.
- **header-anchored** (default from v0.68.0; nudged in v0.70.0) —
  `margin-left: clamp(0.625rem, calc(1vw + 2px), 1.125rem); margin-right: auto`.
  Sits ~2-3px inboard of the BrandHeader logo edge (`px-2 sm:px-3 lg:px-4`)
  so the body grid reads as deliberately offset rather than fighting the
  header rail. The 1440px `max-width` cap stays in place so very wide
  screens don't stretch the body grid into an unreadable column.

## Implementation

### CSS variables (stamped on `<html>`)

`applyPresetSettings()` in `src/slides/presetSettings.ts` writes:

```css
--body-grid-margin-left:  auto | clamp(0.5rem, 1vw, 1rem);
--body-grid-margin-right: auto;
```

### Consumers

1. **Inline style on `.step-timeline-content`**
   (`src/slides/types/StepTimelineSlide.tsx`):
   ```tsx
   style={{
     marginLeft:  'var(--body-grid-margin-left, auto)',
     marginRight: 'var(--body-grid-margin-right, auto)',
   }}
   ```
   Replaces the previous `mx-auto` Tailwind class.

2. **Fullscreen / wide-stage rule** (`src/index.css`):
   ```css
   .step-timeline-root[data-wide-stage="true"] .step-timeline-content {
     margin-left:  var(--body-grid-margin-left, auto) !important;
     margin-right: var(--body-grid-margin-right, auto) !important;
   }
   ```
   Ensures the toggle also applies in fullscreen / projection mode.

### Settings UI

`/settings` exposes a `SelectField` labelled "Body grid alignment" with
two options. The choice persists in
`localStorage["riseup.presetSettings.v1"]` like every other preset
knob; switching is instant — no reload, no remount.

## Constraints (locked)

- The default is `header-anchored` from v0.68.0 because Slide 3 must align
  the body title/timeline with the RiseupAsia logo by default. `centered`
  remains available as an explicit setting.
- The toggle MUST NOT affect the BrandHeader, BrandStrip, controller
  pill, dot pagination, or any other deck-level chrome — those remain
  full-viewport-edge as established in spec 32 / v0.64.
- The 1440px `max-width` cap MUST stay in place in both modes. The
  toggle only changes the horizontal anchor, not the column width.
- Future body grids (e.g. CapsuleListSlide layout, FocusTimelineSlide)
  that want to participate MUST read the same two CSS vars rather than
  introducing a parallel system.

## Verification

1. `/settings` → "Body grid alignment" → flip to "Header-anchored".
2. Open `/3` (StepTimeline). The "HOW WE WORK" / "Engagement Process"
   block should now sit directly under the RiseupAsia logo with the same
   left x.
3. Resize the window from 1280px → 2560px. The body's left edge must
   stay at ~8-16px from the viewport (matching the logo) and must NOT
   drift toward the centre.
4. Press F (fullscreen) — the alignment must hold.
5. Flip back to "Centered" — the body returns to the middle, the logo
   stays put.

## v0.71 — Body grid nudge slider

A new `bodyGridNudge` setting (0–8px, integer) is added on top of the base
clamp when in `header-anchored` mode. Exposed in `/settings` as a slider
labelled "Body grid nudge" (disabled when alignment is `centered`).

CSS-var math:
```
--body-grid-margin-left: calc(clamp(0.625rem, calc(1vw + 2px), 1.125rem) + Npx)
```

Use case: pixel-perfect dial-in of the timeline rail position relative to
the BrandHeader logo without editing CSS. Default 0 = base clamp only.

## v0.72 — Responsive nudge

The `bodyGridNudge` value is now treated as a **desktop-equivalent** offset
and scales linearly with viewport width:

```
--body-grid-margin-left:
  calc( clamp(0.625rem, calc(1vw + 2px), 1.125rem)
      + clamp(N*0.3px, (N/12.8)vw, N*1px) )
```

| Breakpoint   | Effective nudge (slider = 5px) |
|--------------|--------------------------------|
| ≤640px       | ~1.5px (30%)                   |
| 768px tablet | ~3.0px (60%)                   |
| 1024px       | ~4.0px (80%)                   |
| ≥1280px desk | 5.0px (100%)                   |

**Why**: a fixed 5px offset reads as crisp on a 1920px desktop but feels like
a misalignment bug on a 390px phone where the logo + body content live within
the same ~360px column. Scaling the nudge with viewport keeps the visual
relationship consistent across all breakpoints.

The slider still stores a single integer (0–8) — no per-breakpoint config to
manage. The vw math does the rest.
