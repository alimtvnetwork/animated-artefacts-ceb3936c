# 00 — Overview & Architecture

> Read first. This file gives you the mental model. The next files give you the
> code.

## 1. What you are building

A floating **live webcam overlay** that sits on top of a slide deck during a
presentation. Think OBS camera bubble. It must:

- Start/stop the camera on demand (`getUserMedia`).
- Float over the 1920×1080 **stage**, draggable to any position.
- Resize: 4 stepped presets (S/M/L/XL) **and** free pointer-drag (16:9 locked).
- **Zoom in / zoom out** the footprint via `+` / `-`.
- Go **fullscreen** (a fixed layer over the deck, NOT the browser Fullscreen API).
- **Stage-fill** (`1`) — cover the whole 1920×1080 stage, round-trip restore.
- Toggle **circle vs rectangle** frame (`O`).
- **Auto-frame** the presenter's face (center-stage effect) (`f`).
- Optional **vignette halo** (`h`) and a **CSS-only gold squircle rim** (border + box-shadow, transparent interior — no plate PNG; 2026-06-02 v2).
- Forward slide-nav keys to the deck while fullscreen so the talk keeps moving.
- Respect `prefers-reduced-motion`.
- Persist every preference to `localStorage`.

## 2. The three pieces

```text
┌──────────────────────────────────────────────────────────────┐
│ <PresenterWebcamProvider>  (React context — the STATE MACHINE)│
│   • holds phase, stream, position, size, halo, circle flags   │
│   • exposes actions: show/hide/close/enterFullscreen/…        │
│   • persists to localStorage                                  │
│                                                               │
│   ┌────────────────────────────────────────────────────────┐ │
│   │ <PresenterWebcamOverlay>  (the VIEW)                    │ │
│   │   • reads context, renders 1 of 4 surfaces by phase     │ │
│   │   • binds MediaStream to <video> elements               │ │
│   │   • owns keyboard shortcuts (i/m/f/+/-/Esc/h/1/O/…)     │ │
│   │   • drag + resize pointer math                          │ │
│   │   • uses useAutoFrame() for the face-tracking transform │ │
│   └────────────────────────────────────────────────────────┘ │
│                                                               │
│   useAutoFrame(stream, mirrored)  (the FACE TRACKER)          │
└──────────────────────────────────────────────────────────────┘
```

- **State machine**: `src/slides/components/usePresenterWebcam.tsx`
- **View**: `src/slides/components/PresenterWebcamOverlay.tsx`
- **Face tracker**: `src/slides/components/useAutoFrame.ts`
- **Chrome toggle**: `src/slides/controls/PresenterWebcamButton.tsx`

## 3. Mount points (where it plugs in)

1. **Provider** wraps the app once, in `src/App.tsx`:
   ```tsx
   <PresenterWebcamProvider>
     {/* …router / deck… */}
   </PresenterWebcamProvider>
   ```
2. **Overlay** is rendered once inside the deck page, `src/pages/SlideDeckPage.tsx`:
   ```tsx
   <PresenterWebcamOverlay />
   ```
3. **Toggle button** lives in the controller bar (`ControllerBar.tsx`).
4. **Nav passthrough**: `SlideDeckPage` listens for the custom event
   `riseup:webcam-passthrough` so fullscreen camera can drive slide nav.

## 4. The phase state machine

```text
                 show()/toggle()
   ┌────────┐  ───────────────────▶ ┌────────────┐ getUserMedia ok ┌──────┐
   │  off   │                        │ requesting │ ───────────────▶│  on  │
   └────────┘ ◀───────────────────  └────────────┘  error           └──────┘
        ▲          close() (X / `i`)        │ denied                   │  ▲
        │                                   ▼                          │  │
        │                              ┌────────┐                      │  │
        │                              │ denied │                      │  │
        │                              └────────┘                      │  │
        │   hide()/`m`  ┌──────┐  show()/toggle()                      │  │
        └───────────────│ tray │◀──────────────────────────────────────  │
                        └──────┘   (stream stays ALIVE in tray)           │
                                                                          │
   on ──enterFullscreen()/`P`──▶ fullscreen ──exitFullscreen()/Esc──▶ on  │
   on ──toggleStage()/`1`──────▶  stage     ──toggleStage()/Esc──────▶ on ┘
```

**Phases** (`WebcamPhase` union):
`'off' | 'requesting' | 'on' | 'tray' | 'fullscreen' | 'stage' | 'denied'`.

Key rules:
- `tray` keeps the MediaStream **alive** (camera light stays on). Only `close()`
  (the X button, or the `i` key) stops tracks → camera light off.
- `fullscreen` and `stage` are **CSS layers**, not the browser Fullscreen API,
  so the deck keeps responding to keyboard nav underneath.
- `stage` captures the exact size+position+phase so the second `1` press
  restores all three atomically.

## 5. Coordinate system

Everything positions inside a **1920×1080 stage** that is CSS-scaled to fit the
viewport via a `--stage-scale` custom property on `:root`. Therefore **all drag
and resize pointer deltas are divided by `--stage-scale`** so motion matches the
cursor. Default camera position is top-right with a 32px inset:
`{ x: 1920 - boxW - 32, y: 32 }`.

## 6. Persistence (localStorage keys)

| Key | Holds |
|-----|-------|
| `riseup.webcam.pos` | `{x,y}` position |
| `riseup.webcam.size` | size config (`{kind:'step',id}` or `{kind:'free',w,h}`) |
| `riseup.webcam.min` | `'1'`/`'0'` minimized puck |
| `riseup.webcam.halo` | `'1'`/`'0'` vignette halo |
| `riseup.webcam.circle` | `'1'`/`'0'` circle frame |
| `riseup.webcam.autoframe` | `'1'`/`'0'` face auto-frame |

Continue to [`01-state-machine-and-hook.md`](./01-state-machine-and-hook.md).
