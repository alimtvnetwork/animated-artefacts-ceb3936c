---
name: camera-auto-hide-cursor
description: The OS mouse cursor auto-hides over the presenter camera surfaces (on/stage/fullscreen) after idle and immediately after a drag/resize; reappears on mouse move then re-hides. Implemented via useAutoHideCursor hook.
type: feature
---

## Rule
Over the presenter webcam surfaces the mouse cursor must auto-hide:
- Disappears after ~2.5s of pointer inactivity.
- Disappears **immediately** after the presenter finishes moving (dragging) or
  resizing the camera (`hideNow()` on pointer-up).
- Reappears the instant the mouse moves, stays a few seconds, then re-hides.
- Repeats indefinitely; never stuck hidden or stuck visible.

## Scope
- Active ONLY for phases `on`, `stage`, `fullscreen`.
- NEVER for `tray` / `off` / `requesting` / `denied` (tray icon + status button
  must stay clickable with a normal cursor).
- Only the camera surface roots get `cursor: none` — never `document.body`, so
  the rest of the deck chrome keeps its normal pointer.

## Implementation
- Hook: `src/slides/components/useAutoHideCursor.ts`
  → `{ hidden, hideNow, show } = useAutoHideCursor({ active, delay = 2500 })`.
  Window `pointermove`/`pointerdown`/`wheel` (passive) re-arm the idle timer.
- `PresenterWebcamOverlay`: `cursorActive = phase on|stage|fullscreen`;
  `cursorStyle = hidden ? 'none' : undefined` applied to stage/fullscreen/on
  roots, the drag header (`cursorStyle ?? grab/grabbing`) and resize handle
  (`cursorStyle ?? nwse-resize`). `onDragPointerUp`/`onResizePointerUp` call
  `hideNow()`.
- No reduced-motion gate (cursor just toggles, no animation).

## Spec
Detailed in `spec/camera-2026/02-overlay-rendering-and-surfaces.md` §8 (full
contract) and cross-referenced in `03-shortcuts-and-controls.md` header.

## 2026-06-02 — hover-wake gotcha + squircle plate
- The `on` card outer wrapper is `pointer-events:none`; the inner draggable frame is the real activity source. `registerActivity()` MUST be the first line of `onDragPointerMove` AND `onResizePointerMove`, before the drag/resize guard, or a plain hover never wakes the hidden cursor. `hideNow()` on pointerup hides instantly after a move.
- Decorative squircle "plate" (spec/camera-2026/05 §8): `<img>` of `src/assets/camera-2026/04-squircle-plate-gold-shadow.png` rendered behind the inner frame, grown by `platePad = round(visualWidth*0.07)` per side, `zIndex:0`, `pointer-events:none`. Frame bumped to `zIndex:1`, squircle `borderRadius:'38% / 34%'`. Shown only when `!minimized && !circleShape`.
