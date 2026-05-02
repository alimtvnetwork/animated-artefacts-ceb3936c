---
name: animation-preview-panel
description: /builder live-preview wrapper with playback speed slider (0.25×–2×), Replay button, and auto-loop toggle. MotionConfig + replayKey approach.
type: feature
---

## What

`/builder` right-column preview now sits inside an `AnimationPreviewPanel`
that adds:

- **Speed slider** 0.25×–2× (with 5 preset buttons: 0.25 · 0.5 · 1 · 1.5 · 2).
- **Replay button** — bumps an internal key so the preview remounts and
  entrance variants run from `initial` again.
- **Loop toggle** — auto-replays every `(1500/speed + 800)ms`.

## How

`<MotionConfig transition={{ duration: 0.55/speed, damping: 18/max(0.5,speed), stiffness: 220*speed }}>`
wraps the `SlidePreview`. Framer-motion merges this transition into every
child animation, scaling duration. The damping/stiffness adjustments make
springs feel naturally slow rather than rubbery at low speeds.

Replay = `setReplayKey(k => k+1)` on the wrapper key.

## Why not a true scrubber

Framer Motion doesn't expose a frame-accurate scrubber for declarative
variants. A real drag-to-time UI would require rebuilding every animation
as a `useAnimation` controller — fragile and bypasses the per-slide specs
the panel is meant to preview faithfully. Speed × Replay × Loop covers
the actual authoring use-case (verify timing before exporting).

## Files

- `src/builder/AnimationPreviewPanel.tsx` — the panel.
- `src/pages/BuilderPage.tsx` — replaced static SlidePreview block with
  `<AnimationPreviewPanel slide={selectedSlide} width={760} />`.

## Rule

Speed never affects the exported deck — it's preview-only. The panel
must NEVER mutate the slide spec.
