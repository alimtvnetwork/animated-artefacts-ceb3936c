# Spec 35 — Live Alignment Guide Overlay

Status: locked (v0.67.0)
Related: spec 32 (centered composition), spec 34 (body grid alignment toggle).

## Problem

After spec 34 added the `header-anchored` body alignment, there was no
quick way to verify — at every viewport width, in fullscreen, after a
slide swap — that the body grid's left edge actually lined up with the
BrandHeader logo. Eyeballing it from a screenshot is unreliable, and the
mismatch is the first thing the user notices.

## Solution

A live, full-viewport debug overlay (`AlignmentGuideOverlay`) that
draws:

1. **Gold dashed vertical line** at the BrandHeader logo's left x.
2. **Cream dashed vertical line** at the body grid's left x.
3. **HUD readout** in the top-right corner showing `logo.x`, `body.x`,
   and the delta `Δ`. The HUD border + indicator dot are gold when
   `|Δ| ≤ 1px` (aligned), ember otherwise.

Mounted globally in `App.tsx` so it follows the user across every
route. `pointer-events-none` and `aria-hidden`, so it can never
interfere with interaction.

## Implementation

### Setting

`PresetSettings.showAlignmentGuide: boolean` (default `false`).
Persisted in `riseup.presetSettings.v1` like every other preset knob.

### Component

`src/slides/components/AlignmentGuideOverlay.tsx`:

- Subscribes via `useSyncExternalStore(subscribePresetSettings)` so
  flipping the toggle mounts/unmounts immediately, no reload.
- Probes the DOM with `getBoundingClientRect()` on:
  - mount,
  - `window.resize`,
  - `window.scroll`,
  - any `MutationObserver` change to `document.body` (catches slide
    swaps, fullscreen toggles, dynamic class changes).
- Probe scheduling is `requestAnimationFrame`-throttled.

### Targets

- **Logo selector**: `header img[alt="Riseup Asia LLC"]`. Stable
  because the alt text is the brand name (locked rule).
- **Body grid selectors**: array, currently `['.step-timeline-content']`.
  When other body grids opt into spec 34, append their stable class to
  the array — no other change needed.

### Settings UI

Checkbox under `/settings` → "Alignment guide (debug)". Helper text
spells out that it's a debug tool to turn off before presenting.

## Constraints (locked)

- MUST default to `false` so a real audience never sees the overlay
  by accident.
- MUST be `pointer-events-none` and `aria-hidden`.
- MUST NOT mutate any state outside its own React tree (no DOM
  manipulation outside the overlay, no localStorage writes beyond
  the preset toggle).
- MUST tolerate the absence of either target (logo OR body grid) and
  still render the line + readout for whichever it found.

## Verification

1. `/settings` → enable "Alignment guide (debug)".
2. Visit `/3` (StepTimeline). Two dashed vertical lines appear.
3. Toggle `Body grid alignment` → `header-anchored`. The cream line
   should snap onto the gold line; HUD shows `Δ: 0px ✓` (gold
   border).
4. Resize the window from 1280px → 2560px. The lines should track
   their respective elements; the delta should remain 0 in
   `header-anchored` mode and grow proportionally in `centered` mode.
5. Press F (fullscreen). Lines stay in sync with the live elements.
6. Disable the setting → overlay vanishes immediately, no reload.
