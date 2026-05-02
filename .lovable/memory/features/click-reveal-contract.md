---
name: click-reveal-contract
description: Generic per-element opt-in click-reveal — capsules, step rows, hotspots → navigate or inline expand
type: feature
---
Spec 26. A single contract `ClickRevealTrigger` (`revealSlide?: number; expand?: CapsuleExpandSpec; revealLabel?: string`) is mixed into `CapsuleSpec` (existing), `StepSpec`, and `HotspotSpec`. Activation is opt-in per element — no implicit clickability. When both fields are set, `expand` wins.

Inline-expand dialog is owned by `SlideStage` via `<ClickRevealExpandPanel>`; slides receive `onOpenExpand` and forward to their triggers. This avoids per-slide dialog reimplementation.

`StepTimelineSlide` UX: first click focuses the row (existing behavior). Opt-in rows render an `↗` glyph next to the title and the right detail panel auto-renders an "Open details" / "Open step page" pill that fires the reveal/expand. The reveal-hints controller toggle now also pulses opted-in step rows (`.step-row--reveal-hint`).

Reveal-target slides still need `isClickReveal: true` + `parentSlide` per spec 21. Hotspots with only `expand` no longer require `revealSlide` — type relaxed.
