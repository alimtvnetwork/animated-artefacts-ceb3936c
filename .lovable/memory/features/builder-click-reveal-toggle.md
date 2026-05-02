---
name: builder-click-reveal-toggle
description: Per-element editor toggle for capsules/steps/hotspots click-reveal opt-in
type: feature
---
v0.151.0 — `src/builder/ClickRevealToggle.tsx` is the single editor primitive for the generic `ClickRevealTrigger` contract (spec 26).

Wired into:
- `ContentFieldEditor` capsule renderer → writes `CapsuleSpec.clickRevealSlide` (legacy field name kept for back-compat with `Capsule.tsx`).
- `ContentFieldEditor` step renderer → writes `StepSpec.revealSlide` (modern ClickRevealTrigger field).
- `HotspotCanvasEditor` side panel → writes `HotspotSpec.revealSlide`, replacing the previous "— None —" dropdown option with an explicit on/off Switch.

`ContentFieldEditor` now takes `allSlides` + `currentSlideNumber` props (optional, defaults preserve old callers). `BuilderPage` threads them in. Target options are built via `buildSlideOptions()` which excludes the current slide and tags hidden ClickRevealSlides with "(hidden)" so authors know what they're picking.

Toggle UX: switch ON seeds `value` with the first available target slide (instant working preview). Switch OFF writes `undefined`. When there are zero candidate slides (1-slide deck), the switch is disabled with an explanatory hint.
