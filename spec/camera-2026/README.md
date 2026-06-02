# Camera 2026 — Presenter Webcam Spec Pack

> **Audience:** a *blind* AI agent with **zero prior context**. Read this folder
> top-to-bottom and you will be able to re-implement the entire presenter
> camera (webcam overlay) for the Riseup Asia slide-presentation app — every
> phase, every keyboard shortcut, zoom in / zoom out, drag, resize, fullscreen,
> stage-fill, circle/rectangle frame, face auto-framing, and the new
> **squircle background plates** that make the camera look bigger and richer.

This pack is **self-contained**. It quotes real code from the live
implementation so you can reproduce it without reading `src/`. Where the live
code already exists, file paths are given so you can diff.

---

## What is the "presenter camera"?

While presenting slides, the speaker can overlay their **live webcam** on top of
the deck — like an OBS / Zoom camera bubble — so the audience sees the presenter
and the slides at once. It floats over the 1920×1080 stage, is draggable,
resizable, can go fullscreen or fill the stage, can be a rectangle or a circle,
and can sit on a decorative **squircle background plate** (the images shipped in
[`./assets/`](./assets/)).

It is **presenter-local only**: it is never exported to PPTX, never part of slide
JSON, and never persisted to the deck. It is pure runtime UI driven by
`navigator.mediaDevices.getUserMedia`.

---

## Folder map (read in this order)

| File | What it covers |
|------|----------------|
| [`00-overview-and-architecture.md`](./00-overview-and-architecture.md) | Big picture: components, data flow, mount points, phases diagram. |
| [`01-state-machine-and-hook.md`](./01-state-machine-and-hook.md) | `usePresenterWebcam` context — phases, storage keys, every action with code. |
| [`02-overlay-rendering-and-surfaces.md`](./02-overlay-rendering-and-surfaces.md) | `PresenterWebcamOverlay` — the 4 surfaces, drag/resize math, video binding. |
| [`03-shortcuts-and-controls.md`](./03-shortcuts-and-controls.md) | Full keyboard map (zoom in/out, hide, fullscreen, …) + button + controller. |
| [`04-autoframe-face-tracking.md`](./04-autoframe-face-tracking.md) | `useAutoFrame` — FaceDetector center-stage effect. |
| [`05-backgrounds-and-shapes.md`](./05-backgrounds-and-shapes.md) | **The squircle plates** — how to place backgrounds beside/behind the camera. |
| [`06-implementation-steps-1-30.md`](./06-implementation-steps-1-30.md) | The canonical **30-step** build order, blind-AI ready. |
| [`07-acceptance-checklist-and-tests.md`](./07-acceptance-checklist-and-tests.md) | Done-criteria + the Vitest suite to write. |
| [`08-build-log-steps-01-10.md`](./08-build-log-steps-01-10.md) | Steps **1–10** expanded — reasoning + time estimates per step. |
| [`09-build-log-steps-11-20.md`](./09-build-log-steps-11-20.md) | Steps **11–20** expanded — reasoning + time estimates per step. |
| [`10-build-log-steps-21-30.md`](./10-build-log-steps-21-30.md) | Steps **21–30** expanded + whole-feature ~16 h roll-up. |
| [`assets/`](./assets/) | The 4 reference / background images (see manifest below). |
| [`11-test-execution-steps-T01-T10.md`](./11-test-execution-steps-T01-T10.md) | Test / acceptance execution steps **T01–T10** with reasoning + time. |
| [`12-test-execution-steps-T11-T20.md`](./12-test-execution-steps-T11-T20.md) | Test / hardening / sign-off execution steps **T11–T20** with reasoning + time. |
| [`13-test-execution-steps-T21-T30.md`](./13-test-execution-steps-T21-T30.md) | Regression / release / maintenance execution steps **T21–T30** with reasoning + time. |
| [`14-implementation-steps-I01-I10.md`](./14-implementation-steps-I01-I10.md) | Actual code implementation steps **I01–I10** (files 01–05) with reasoning + time. |

---

## Image manifest (`./assets/`)

The user supplied these. They also live in the project at
[`assets/camera-2026/`](../../assets/camera-2026/) (same filenames). To use them
at runtime, import from `src/assets/` or register a Lovable asset pointer — see
[`05-backgrounds-and-shapes.md`](./05-backgrounds-and-shapes.md) §6.

| File | Role |
|------|------|
| `01-reference-frame-gold-rim.png` | **Reference look only.** A squircle camera frame on a dark slide with a gold→ember (red) glowing rim. This is the visual target the CSS rim reproduces. |
| ~~`02-squircle-mask-black.png`~~ | **No longer used at runtime (2026-06-02 v2).** Was the CSS crop mask; the overlay now crops via `border-radius`. Kept here as a shape reference only. |
| ~~`03-squircle-plate-white-shadow.png`~~ | **REMOVED 2026-06-02.** Was an opaque white fill plate behind the camera; deleted (rejected look, no value). |
| ~~`04-squircle-plate-gold-shadow.png`~~ | **No longer used at runtime (2026-06-02 v2).** Its baked rim + fill read as a thick opaque ring (rejected). The rim is now CSS-only (border + box-shadow). Reference only. |

> **Runtime is now CSS-only.** `src/assets/camera-2026/` is empty — the overlay
> imports **no** plate/mask PNG. The squircle silhouette comes from
> `border-radius: 38% / 34%`, the rim from a `2px` gold border + a layered
> `box-shadow` (ember edge + gold glow + drop shadow), and the interior stays
> transparent. See [`05-backgrounds-and-shapes.md`](./05-backgrounds-and-shapes.md) §8 (v2).
>
> A "squircle" = superellipse, between a circle and a rounded square.

---

## Cross-references (existing system specs)

This pack supersedes and consolidates the scattered camera docs. Keep them in sync:

- `spec/21-slides-system/64-presenter-webcam.md` — original phase/size spec (v2).
- `spec/21-slides-system/65-presenter-shortcuts-v5.md` — v5 shortcut additions (`O`, `P`, `[`, `]`).
- `spec/21-slides-system/51-webcam-overlay.md` — early overlay notes.
- `spec/15-research/01-webcam-overlay.md` — prior-art research.
- Memory: `mem://features/webcam-halo-and-stage`.

## Live code map (for diffing — do not need to read to implement)

```
src/slides/components/usePresenterWebcam.tsx   state machine + React context (688 lines)
src/slides/components/PresenterWebcamOverlay.tsx  the rendered surfaces (1228 lines)
src/slides/components/useAutoFrame.ts          FaceDetector center-stage hook
src/slides/controls/PresenterWebcamButton.tsx  controller chip toggle
src/slides/controls/ControllerBar.tsx          hosts the button + dropdown items
src/slides/controls/KeyboardShortcutsDialog.tsx  the `/` shortcuts table
src/pages/SlideDeckPage.tsx                    mounts <PresenterWebcamOverlay/> + nav passthrough
src/App.tsx                                    wraps the tree in <PresenterWebcamProvider/>
src/test/presenterWebcam*.test.tsx             the test suite
```
