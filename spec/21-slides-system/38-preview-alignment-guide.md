# spec/slides/38 — Preview alignment guide overlay

**Status**: shipped in v0.74.0
**Companion to**: spec 35 (live alignment guide)

## Summary

Extends the alignment-guide debug toggle so it ALSO renders inside every
`SlidePreview` thumbnail (BuilderPage, SettingsPage, GridOverview), not
just the live deck. The author can verify "header-anchored" body grid
positioning across every slide before exporting, without having to open
each one in fullscreen.

## What's drawn

Three vertical guides anchored inside the preview's 1920×1080 stage:

| Color  | Element              | Selector                                        |
|--------|----------------------|--------------------------------------------------|
| Gold   | Logo edge            | `header img[alt="Riseup Asia LLC"]`              |
| Cream  | Body grid edge       | `.step-timeline-content`                         |
| Ember  | Timeline rail (gold) | `.step-timeline-content [data-timeline-rail]`    |

Plus a HUD pinned to the stage's top-right corner showing all three
x-positions (in unscaled stage px) and the delta between logo + body grid,
with a green checkmark when |Δ| ≤ 1px.

## Why a separate component from `AlignmentGuideOverlay`

The deck-wide overlay uses `position: fixed` and queries the entire
viewport, which is correct for live presenting but wrong inside a
`transform: scale()` thumbnail — `getBoundingClientRect()` returns
post-scale coordinates, so the lines would be at the wrong x.

`SlidePreviewAlignmentOverlay` measures within the stage element itself
and divides by the scale ratio, so guide x-positions land at the SAME
unscaled stage coordinates as the slide's own content — pixel-perfect
regardless of whether the tile is 320px wide or 760px wide.

## Activation

Single source of truth: `getPresetSettings().showAlignmentGuide` (the
existing checkbox in `/settings`). When ON, every `SlidePreview` mount
renders the overlay; when OFF, it returns `null`. Subscribes via
`useSyncExternalStore(subscribePresetSettings)` so the toggle is live.

## Implementation notes

- `SlidePreview` now keeps a `ref` on the unscaled 1920px stage div and
  passes it to `<SlidePreviewAlignmentOverlay stageRef={...} />`.
- Overlay re-measures on `resize` and on a `MutationObserver` watching
  the stage subtree (catches StepTimeline state changes — wide-stage
  toggle, active-step swap, etc.).
- The timeline rail target was tagged with `data-timeline-rail="true"`
  in `StepTimelineSlide.tsx` (line 559) so the overlay can find it
  without depending on Tailwind class signatures.
- Pure presentational (`pointer-events-none`); cannot interfere with
  preview hover/click/autoplay behavior.

## Verification

1. `/settings` → toggle "Alignment guide" ON.
2. Open BuilderPage `/builder` — every preview tile shows the gold +
   cream + ember dashed lines and the HUD.
3. Pick a StepTimelineSlide preview; rail line should sit ~14px right of
   the body-grid line (matching the `left-[14px]` rail offset in the
   slide component).
4. Toggle OFF; all overlays unmount within one frame.
5. Resize the BuilderPage panel — guide x-positions stay locked to the
   actual rendered slide elements (proof that the scale-divide is
   correct).
