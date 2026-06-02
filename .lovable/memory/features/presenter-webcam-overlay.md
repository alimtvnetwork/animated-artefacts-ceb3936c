---
name: presenter-webcam-overlay
description: Presenter-controlled webcam overlay — single global instance, draggable in stage coords (uses --stage-scale), 4 step sizes (S/M/L/XL) + free 16:9 resize, soft-tray hide (stream stays alive, no grace timer), fullscreen mode w/ slide-nav passthrough, single-key shortcuts i/m/f/+/-/Esc (no Shift). Spec 64. Distinct from research doc 01 (per-slide JSON pinning, deferred).
type: feature
---

## Phase

The recorder lives at v2 (spec 64). v1 (drag + 10s grace hide + auto-frame)
is fully superseded by this surface. The "hidden" phase no longer exists
at runtime — `hide()` puts the camera into the **tray** phase.

## Architecture

- **One** instance per deck, mounted at `SlideDeckPage` root.
- State in React context (`PresenterWebcamProvider` in `App.tsx`),
  exposed via `usePresenterWebcam()`.
- Stream lifecycle: `off → requesting → on ↔ tray ↔ fullscreen → off`.
  `tray ↔ on` reuses the live `MediaStream` instantly. Tray is
  **indefinite** (no auto-stop). Only `close()` (X button) stops the
  stream.
- **NEVER** acquire a stream until first user click. Permission checked
  via `navigator.permissions.query` when available.
- Sizes: 4 canonical steps `S 240×135 / M 320×180 / L 480×270 / XL 720×405`
  + free pointer-drag resize (16:9 locked, `[160, 960]` width). Persist
  in `riseup.webcam.size` as `{kind:'step',id} | {kind:'free',w,h}`.
- Fullscreen is NOT the CSS Fullscreen API — it's a `position:fixed`
  layer over the stage, so the deck keeps responding to nav and
  analytics keep ticking.

## Drag math

Stage uses `FitStage` (CSS scale on 1920×1080 inner). Position lives in
**stage coords**, so pointer deltas divide by the live scale:

```ts
const scale = parseFloat(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--stage-scale') || '1'
);
const dx = (e.clientX - dragStart.clientX) / scale;
const dy = (e.clientY - dragStart.clientY) / scale;
```

NEVER measure DOM rects to recompute scale — read the var. Same math
applies to the resize handle.

## Slide-nav passthrough (fullscreen only)

While `phase === 'fullscreen'` the overlay listens at `window` (capture
phase) and forwards forward keys to the deck:

| Key | Maps to |
|-----|---------|
| `ArrowRight`, `ArrowDown`, `Enter`, `Space`, `PageDown` | `goNext()` |
| `ArrowLeft`, `PageUp` | `goPrev()` IF the action stack's top is not `enter-fullscreen`; otherwise `exitFullscreen()` |
| `Escape` | `exitFullscreen()` |

Action stack semantics: the very first back press right after entering
fullscreen always returns to the webcam (because forward presses don't
push another `enter-fullscreen` token). After any `goNext`, back becomes
deck rewind.

`SlideDeckPage` registers the nav handlers via
`registerNavHandlers({ goNext, goPrev })` once on mount.

## Keyboard shortcuts

Single-letter, no `Shift`. Always guarded — ignored when
`event.target` is inside `<input>` / `<textarea>` / `[contenteditable]`.

| Key | Action |
|-----|--------|
| `i` | Toggle visible ↔ tray |
| `m` | Toggle minimized 96×96 puck |
| `f` | Auto-frame toggle (when supported) |
| `+` / `=` | Step size up |
| `-` | Step size down |
| `Escape` | Exit fullscreen |

## Theming

Border / glow / tray-pulse / chrome buttons all use semantic tokens
(`--gold`, `--ember`, `--cream`, `--card`, `--border`, `--foreground`).
Reduced-motion collapses the tray pulse, hover fan, and resize-handle
hover transitions to instant.

## Forbidden

- Raw hex in the component — semantic tokens only.
- Per-slide JSON authoring of webcam position/zoom/face-tracking (that
  is research doc 01, deferred).
- Audio capture (always `audio: false`).
- Stopping the stream when entering tray — that's the close-button
  contract only.
- Calling `requestFullscreen()` — the layer is `position: fixed`, the
  deck must stay mounted underneath.
- Measuring DOM rects to compute stage scale — read `--stage-scale`.
- `Shift+`-prefixed shortcuts for camera (legacy v1 binding).

## Why it exists

2026-04-30: simpler camera box with grace-window hide.
2026-05-01 (v2): presenter asked for resize + tray icon + fullscreen
mode + single-key shortcuts. Spec promoted to `spec/21-slides-system/66-presenter-webcam.md`.

See [issue 27](../../../spec/22-slides-issues/27-presenter-webcam-overlay.md)
and [spec 64](../../../spec/21-slides-system/66-presenter-webcam.md).
