# 06 — In-deck animation scrubber

- Task: "Add an in-deck animation preview control so I can scrub step enters/exits and see the timing presets in real time."
- Spec refs: `src/slides/controls/AnimationScrubber.tsx`, `src/slides/scrubOverride.ts`, `src/slides/stepTiming.ts`, `src/slides/SlideStage.tsx`, `src/slides/types/StepTimelineSlide.tsx`, `src/slides/hooks/useFocusTimeline.ts`, `src/pages/SlideDeckPage.tsx`.

## Ambiguities resolved by inference

### A. Where does the scrubber live?
- **Decision**: floating top-right overlay (fixed position, `data-print-hide`) that opens on `?scrub=1` or **Shift+S**. Rejected: a separate `/preview` route (would duplicate deck chrome) and a builder-only panel (the user said "in-deck").

### B. How does scrubbing change timing without mutating spec?
- **Decision**: tiny pub-sub store (`src/slides/scrubOverride.ts`) holding `{ presetOverride, playbackSpeed }`. `stepTiming.ts` short-circuits its preset resolution when `presetOverride !== null`. `SlideStage` wraps children in `<MotionConfig>` when speed ≠ 1. Closing the scrubber calls `resetScrubState()` so authored timing is restored. Spec JSON is never touched.

### C. How to "scrub steps" without rebuilding StepTimelineSlide as a controlled component?
- **Decision**: extended the existing `FocusTimelineHandle` with optional `setStep / getStep / getStepCount / replay`. StepTimelineSlide implements them via its existing `setActive` state + a synthesized "drop to -1, retime to 0" replay. The scrubber polls the handle each frame (RAF) so cross-slide swaps surface immediately without event plumbing. Other slide types (FocusTimelineSlide, AdvanceStepSlide) inherit graceful fallback because the handle methods are optional — the scrubber detects `setStep` and disables the strip with a "Not a step slide" placeholder when absent.

### D. Speed override granularity
- **Decision**: chips at 0.25× / 0.5× / 1× / 1.5× / 2× (matching the existing builder AnimationPreviewPanel). Rejected: continuous slider (over-precise for a tuning surface). Speed 1× short-circuits the MotionConfig override so authored per-component transitions still win.

### E. Per-step `revealMode` picker?
- **Deferred**. The user asked for "step enters/exits and timing presets". `revealMode` is per-step JSON config (added in v0.122) — surfacing it live would require either mutating spec.steps[i] or a parallel override map. Logged as a follow-up; the current scrubber covers the explicit ask.

## Action taken (v0.124.0)

- New `src/slides/scrubOverride.ts` — pub-sub store for `presetOverride` + `playbackSpeed`.
- New `src/slides/controls/AnimationScrubber.tsx` — floating panel: step slider + ←/→ + Replay + speed chips + preset chips + clear/close.
- `src/slides/stepTiming.ts` — `readSlideTiming` honours `stepTimingPresetOverride()` first.
- `src/slides/SlideStage.tsx` — wraps body in `<MotionConfig>` driven by `playbackSpeed()`; subscribes to scrub state for re-render.
- `src/slides/types/StepTimelineSlide.tsx` — extended imperative handle with `setStep / getStep / getStepCount / replay`.
- `src/slides/hooks/useFocusTimeline.ts` — extended `FocusTimelineHandle` with the new optional methods.
- `src/pages/SlideDeckPage.tsx` — `?scrub=1` URL flag, **Shift+S** keyboard shortcut, mounts the scrubber, calls `resetScrubState()` on close.
- All 31/31 tests pass; `tsc --noEmit` clean.

## Reversibility

Each layer is independent and removable:
- Drop scrubber UI → delete `AnimationScrubber.tsx`; the imperative handle extensions stay harmless.
- Drop preset override → revert `stepTiming.ts` import + the early-return in `readSlideTiming`.
- Drop speed override → revert `SlideStage.tsx` to the pre-v0.124 imports.

## Deferred follow-ups

- Per-step `revealMode` live picker.
- Per-side `enterOverride` / `exitOverride` chips (would replace the current "preset wins both sides" simplification).
- Persist scrub state in URL so share-links open at a chosen step + speed for design review.
