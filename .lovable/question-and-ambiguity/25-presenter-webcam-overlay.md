# 25 — Presenter webcam overlay (no-questions decisions)

**Date:** 2026-04-30. **Mode:** no-questions (counter 25/40).

Decisions taken without asking:

1. **Scope split.** Existing research doc `spec/15-research/01-webcam-overlay.md`
   covers a much bigger feature (per-slide JSON pinning, PTZ, auto-frame,
   smooth slide-to-slide translation). User's current ask is narrower —
   "button + draggable themed box + fade hide + squiggle". Treated as a
   separate, smaller feature; research doc 01 stays deferred until the
   user asks for it.

2. **One global instance, not per-slide JSON.** Mounted at SlideDeckPage
   root via `PresenterWebcamProvider` context. Toggle button lives in
   `ControllerBar`. No JSON contract, no per-slide opt-in.

3. **Stream lifecycle includes a 10s "hidden" grace window.** Fade-out
   does NOT immediately stop the MediaStream; we keep it alive 10s for
   fast re-toggle (no second permission prompt, no flash). After 10s in
   hidden state, stream is released; next show calls `getUserMedia`
   again (instant on cached `granted` permission).

4. **Drag math reads `--stage-scale`.** FitStage already publishes this
   on `<html>`. We divide pointer deltas by it instead of measuring DOM
   rects. Locked in memory rule.

5. **Default position: top-right of stage, inset 32px.** Matches brand
   chrome inset rhythm. Persisted to `localStorage`.

6. **Squiggle: 3.6s keyframe, fires once every ~6s** via long
   "rest" segments in the keyframe percentages. Stops when camera is on.

7. **No audio.** `getUserMedia` always called with `audio: false`.

8. **No PTZ / face-track / zoom.** Out of scope for this loop. If user
   later asks, we revisit research doc 01.

Spec: `spec/22-slides-issues/27-presenter-webcam-overlay.md`.
Memory: `mem://features/presenter-webcam-overlay`.
