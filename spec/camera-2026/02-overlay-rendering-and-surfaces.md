# 02 — Overlay Rendering & Surfaces (`PresenterWebcamOverlay`)

> The VIEW. Reads `usePresenterWebcam()` and renders exactly **one** of four
> surfaces based on `state.phase`. Also owns the keyboard listeners and the
> drag/resize pointer math.
>
> Live file: `src/slides/components/PresenterWebcamOverlay.tsx`.

## 1. The four surfaces

| `state.phase` | Surface |
|---------------|---------|
| `on` | Draggable card with chrome (zoom +/-, fullscreen, focus, minimize, X) + bottom-right resize handle. Honors circle/halo/plate. |
| `tray` | 40×40 floating icon with ember pulse; hover fans out Expand / Fullscreen / Stop. Stream stays live. |
| `fullscreen` | Fixed-position layer over the deck stage with minimal chrome; forwards nav keys to the deck. |
| `stage` | Absolute layer covering the full 1920×1080 stage. |
| anything else (`off`/`requesting`/`denied`) | `null` (the controller button shows status instead). |

## 2. Stage-scale aware pointer math

The stage is CSS-scaled, so divide pointer deltas by `--stage-scale`:

```ts
function readStageScale(): number {
  if (typeof document === 'undefined') return 1;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--stage-scale');
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
```

### Drag (header + tray icon)

```ts
const onDragPointerMove = (e) => {
  const d = dragRef.current; if (!d || d.pointerId !== e.pointerId) return;
  const scale = readStageScale();
  setPosition(d.baseX + (e.clientX - d.startX) / scale,
              d.baseY + (e.clientY - d.startY) / scale);
};
```
Use `setPointerCapture(e.pointerId)` on down, release on up, ignore non-primary
mouse buttons (`if (e.button !== 0 && e.pointerType === 'mouse') return;`).

### Resize (width only, height stays 16:9)

```ts
const onResizePointerMove = (e) => {
  const d = resizeRef.current; if (!d || d.pointerId !== e.pointerId) return;
  const scale = readStageScale();
  const nextW = Math.max(FREE_MIN_W, Math.min(FREE_MAX_W, d.baseW + (e.clientX - d.startX) / scale));
  resizeFree(nextW);                       // hook derives height 16:9
};
```
`e.stopPropagation()` on resize pointer-down so it doesn't also start a drag.

## 3. Binding the MediaStream to `<video>`

The same MediaStream can feed multiple `<video>` nodes (floating + fullscreen).
**Never** move it exclusively from one to another — bind to whichever exist:

```ts
const attachStreamToVideo = useCallback((node: HTMLVideoElement | null) => {
  if (!node) return;
  if (state.stream) {
    if (node.srcObject !== state.stream) node.srcObject = state.stream;
    node.play().catch(() => { /* autoplay blocked — gesture already happened */ });
  } else if (node.srcObject) {
    node.srcObject = null;
  }
}, [state.stream]);
```

Re-bind on every stream change:
```ts
useEffect(() => {
  for (const v of [videoRef.current, fullscreenVideoRef.current]) attachStreamToVideo(v);
}, [attachStreamToVideo]);
```

The video is **mirrored** for a natural selfie view: `transform: scaleX(-1)`
(combined with the auto-frame transform — see file 04).

## 4. Circle / shape pop animation (WAAPI, never remount)

When `circleShape` flips, animate **only the clipping wrapper** with WAAPI so the
live stream never blanks. Do NOT use a React `key` or a conditional `<video>`
tree (that would detach the stream):

```ts
useEffect(() => {
  if (firstShapeRef.current) { firstShapeRef.current = false; return; }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  shapeFrameRef.current?.animate([
    { transform: 'scale(1)',     boxShadow: '0 0 32px hsl(var(--gold)/0.18), 0 12px 32px hsl(var(--background)/0.6)' },
    { transform: 'scale(0.965)', boxShadow: '0 0 48px hsl(var(--gold)/0.36), 0 12px 32px hsl(var(--background)/0.6)', offset: 0.3 },
    { transform: 'scale(0.985)', boxShadow: '0 0 60px hsl(var(--gold)/0.50), 0 12px 32px hsl(var(--background)/0.6)', offset: 0.5 },
    { transform: 'scale(1.018)', boxShadow: '0 0 44px hsl(var(--gold)/0.30), 0 12px 32px hsl(var(--background)/0.6)', offset: 0.7 },
    { transform: 'scale(1)',     boxShadow: '0 0 32px hsl(var(--gold)/0.18), 0 12px 32px hsl(var(--background)/0.6)' },
  ], { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
}, [circleShape]);
```

Circle frame = `border-radius: 999px`. Squircle frame = CSS mask (file 05).

## 5. Tray surface (soft-hidden)

Positioned at the box's top-right corner, 40×40, ember pulse:

```ts
if (state.phase === 'tray') {
  const trayX = position.x + size.w - 40, trayY = position.y;
  return (
    <div role="region" aria-label="Presenter camera (tray)"
         style={{ position: 'absolute', left: trayX, top: trayY /* … */ }}>
      {/* hover → fan: Expand (show), Fullscreen (enterFullscreen), Stop (close) */}
    </div>
  );
}
```

## 6. Fullscreen nav passthrough (capture phase)

While `fullscreen`/`stage`, intercept forward/back keys in the **capture phase**
so the camera layer beats the deck listener, then dispatch a custom event the
deck handles:

```ts
useEffect(() => {
  if (state.phase !== 'fullscreen' && state.phase !== 'stage') return;
  const onCaptureKey = (e: KeyboardEvent) => {
    const forward = ['ArrowRight','ArrowDown','Enter',' ','PageDown'].includes(e.key);
    const back = ['ArrowLeft','PageUp'].includes(e.key);
    if (!forward && !back) return;
    e.preventDefault(); e.stopPropagation();
    if (forward) {
      pushFullscreenAction('goNext');
      window.dispatchEvent(new CustomEvent('riseup:webcam-passthrough', { detail: { direction: 'next' } }));
    } else {
      const last = (window as any).__riseupWebcamLastAction;
      if (last === 'enter-fullscreen') exitFullscreen();  // back undoes the entry
      else { pushFullscreenAction('goPrev');
             window.dispatchEvent(new CustomEvent('riseup:webcam-passthrough', { detail: { direction: 'prev' } })); }
    }
  };
  window.addEventListener('keydown', onCaptureKey, true);   // true = capture
  return () => window.removeEventListener('keydown', onCaptureKey, true);
}, [state.phase, pushFullscreenAction, exitFullscreen]);
```

`SlideDeckPage` registers nav handlers via `registerNavHandlers` and listens for
`riseup:webcam-passthrough` to call `goNext`/`goPrev`.

## 7. Accessibility

- Each surface has `role="region"` + descriptive `aria-label`.
- The toggle button has `aria-pressed` + `data-state={phase}`.
- All animations gated behind `prefers-reduced-motion`.

## 8. Auto-hide cursor over the camera surfaces

> Goal: while presenting — and **especially right after the presenter moves
> (drags) or resizes the camera** — the OS mouse cursor must disappear so a
> stale arrow/grab pointer never sits on top of the camera. The cursor
> reappears the instant the mouse moves, stays visible for a few seconds,
> then hides again on idle. This repeats indefinitely.

### 8.1 Hook: `useAutoHideCursor`

Live file: `src/slides/components/useAutoHideCursor.ts`.

```ts
const { hidden, hideNow, show, registerActivity } = useAutoHideCursor({ active, delay = 2500 });
```

| Field | Type | Meaning |
|-------|------|---------|
| `active` | `boolean` | When `false` the hook is inert and the cursor is always visible. |
| `delay` | `number` (ms) | Idle time before the cursor hides. Default **2500ms** (“a few seconds”). |
| `hidden` | `boolean` | `true` ⇒ consumer applies `cursor: none` to the surface root. |
| `hideNow()` | `() => void` | Force an immediate hide (no wait). Call right after a drag/resize gesture ends. |
| `show()` | `() => void` | Force visible and re-arm the idle timer. |
| `registerActivity()` | `() => void` | Surface-scoped activity signal; show cursor and re-arm the idle timer. |

Behaviour contract:

1. On mount (while `active`) the idle timer is armed immediately, so an
   untouched surface hides its cursor on its own after `delay`.
2. The hook exposes `registerActivity()`. The overlay must call it from the
   **camera surface itself** on `pointermove`, `pointerdown`, and `wheel`, so
   cursor wake-ups are scoped to actual camera interaction — unrelated mouse
   movement elsewhere on the deck must not make the camera cursor visible.
3. When the timer fires with no further movement, `hidden = true`.
4. `hideNow()` clears the timer and sets `hidden = true` synchronously.
5. When `active` flips to `false`, the timer is cleared and `hidden` resets to
   `false` (cursor visible) so non-camera phases are never affected.
6. No animation is involved (the cursor simply toggles), so there is nothing
   to gate behind `prefers-reduced-motion`.
7. The hook listens on `window` but **never** mutates `document.body` cursor —
   only the camera surface roots get `cursor: none`, so the rest of the deck
   chrome keeps its normal pointer.

### 8.2 Wiring in `PresenterWebcamOverlay`

```ts
const cursorActive =
  state.phase === 'on' || state.phase === 'stage' || state.phase === 'fullscreen';
const autoHideCursor = useAutoHideCursor({ active: cursorActive });
const cursorStyle = autoHideCursor.hidden ? ('none' as const) : undefined;
```

- `cursorActive` is **true only** for the live `on` card and the `stage` /
  `fullscreen` layers. It is **false** for `tray` / `off` / `requesting` /
  `denied` so the small tray icon and status button stay normally clickable.
- Attach `autoHideCursor.registerActivity` directly to the active camera roots:
  - `onPointerMove`
  - `onPointerDown`
  - `onWheel`

  This contract is intentional: the cursor should reappear only when the user
  moves or interacts **over the camera surface**, not when they move the mouse
  over controller chrome, slide content, or empty stage space.
- `cursorStyle` is applied to every camera surface root:
  - `stage` root `style.cursor`
  - `fullscreen` root `style.cursor`
  - `on` outer wrapper `style.cursor`
  - the `on` drag header → `cursor: cursorStyle ?? (dragging ? 'grabbing' : 'grab')`
  - the resize handle → `cursor: cursorStyle ?? 'nwse-resize'`

  Using `cursorStyle ?? <normal>` guarantees that when hidden, `none` overrides
  the element's own grab/resize cursor; when visible, the normal cursor returns.

### 8.3 Hide immediately after moving the camera

After a **drag** (`onDragPointerUp`) or **resize** (`onResizePointerUp`)
gesture completes, call `autoHideCursor.hideNow()` so the cursor vanishes the
moment the presenter finishes moving the camera — it does not linger for the
full idle delay. It reappears on the next mouse move (step 8.1.2) and then
re-hides on idle.

### 8.4 Acceptance

- Move the camera, release → cursor disappears immediately.
- Move the pointer over the camera again → cursor reappears, stays ~2.5s, then
  hides again.
- Move the pointer somewhere else in the deck (outside the camera surface) →
  the hidden camera cursor stays hidden.
- Repeat indefinitely; never gets stuck hidden or stuck visible.
- Tray icon, status button, and the rest of the deck chrome keep a normal
  cursor at all times.

Continue to [`03-shortcuts-and-controls.md`](./03-shortcuts-and-controls.md).
