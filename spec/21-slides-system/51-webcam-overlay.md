# spec/slides/51 — Webcam overlay (RESEARCH STAGE)

**Status**: PROPOSED — research only. Implementation gated on user
sign-off of the JSON schema in `spec/research/01-webcam-overlay.md`
section 4. Do **not** implement until the user explicitly says "build
the webcam overlay".

**Deep dive**: [spec/research/01-webcam-overlay.md](../research/01-webcam-overlay.md).
**LLM authoring guide (forecast)**: `spec/slides/llm/20-webcam-overlay.md`.

## Contract summary (preview only)

A deck-level singleton overlay component that streams the local
browser camera and pins it to a configurable region of the active
slide. Per-slide JSON opt-in via `SlideContent.webcam: WebcamSpec`.

| Aspect | Decision |
|---|---|
| Scope | Deck-level singleton overlay (not a new SlideType) |
| Activation | Opt-in per slide via `content.webcam` |
| Stream | Acquired ONCE per deck mount, shared across slides |
| Placement | Preset (`top-right` / `top-left` / `bottom-right` / `bottom-left` / `center`) OR freeform `{x,y,w,h}` in stage px |
| Cross-slide motion | Framer Motion `layout` spring on the wrapper; video element never unmounts |
| Entrance (first slide only) | `'fade'` / `'blur'` / `'fade-blur'` / `'none'` |
| Zoom | 1.0–3.0 digital, `transform: scale()` on inner `<video>` |
| Crop | `'cover'` (v1) / `'auto-frame'` (v2, lazy MediaPipe) |
| Decoration | shape (rounded/circle/square), border (gold/cream/none), shadow, mirror |
| Audio | Always off |
| Permission UX | Manual "Camera" toggle in the controller bar; never auto-prompt |
| Cleanup | `track.stop()` on deck unmount + on toggle-off |

## Why this is in /spec/slides/

So that any future AI grepping `spec/slides/NN-*.md` for "webcam"
finds the canonical contract pointer here, instead of inventing a
parallel scheme. The full design lives in `spec/research/01-*.md`
until implementation; once shipped, the runtime details collapse back
into this file and the research doc becomes the historical "why".

## Implementation files (forecast — not yet created)

- `src/slides/components/WebcamOverlay.tsx` — visible component
- `src/slides/webcam.ts` — singleton stream manager (mirrors `sound.ts`)
- `src/slides/types.ts` — extend `SlideContent` with `webcam?: WebcamSpec`
- `src/slides/SlideStage.tsx` — mount overlay at deck root
- `src/builder/ContentFieldEditor.tsx` — `webcam` field renderer
- `src/pages/SettingsPage.tsx` — global camera toggle + device picker
- `.lovable/memory/features/webcam-overlay.md` — memory rule

## Hard rules (locked even before implementation)

1. **One stream per deck.** Never call `getUserMedia` per slide. The
   re-acquire flash is unacceptable.
2. **Slide-level field, not step-level.** Steps inside StepTimeline
   change every few seconds — webcam placement must not.
3. **Opt-in per slide.** Default behaviour is no webcam. Only slides
   with `content.webcam` defined show the overlay.
4. **Audio always off.** Presenter speaks to the room/Zoom directly.
5. **Mirror by default.** Selfie-view matches presenter expectation
   from daily video calls.
6. **No auto-prompt.** Permission is always user-initiated via the
   controller toggle. We may sniff `permissions.query()` to skip the
   button when already granted, but never trigger a prompt without a
   click.
7. **PNG/PDF export must omit the webcam.** Static export is for
   archival; the webcam is a live performance element.
