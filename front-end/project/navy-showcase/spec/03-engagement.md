# 03 — Engagement

**Type**: `StepTimelineSlide` (v3.3 cinematic, autoplay-capable)

## Purpose
Four-step engagement model rendered as the cinematic step timeline. Demonstrates:
- The v3 motion layer (1.1s expo-out fade-in, breathing badge halo, ambient icon scatter).
- Per-step `revealSlide` on Step 2 → opens slide 50 (same target as the
  Strategy capsule on slide 2). Same destination, two entrypoints.
- Slide-level `sound: { on: "focus", kind: "whoosh" }` — soft cue on every step
  focus change. Honors the global mute pill.

## Animation contract
- `transition: SlideIn` / `textAnimation: SlideUp` — house-style timeline entry.
- `stepAmbient` on the right side carries the data-deck visual motif from slide 1.
- `headerOffsetPx: 8` to keep the eyebrow row below the brand header on this preset.

## Speaker notes
Walk through step-by-step (presenter-paced, Next/Prev or ↑↓/jk). On Step 2,
optionally click the `↗` "Open strategy detail" pill to dive into slide 50,
then return.
