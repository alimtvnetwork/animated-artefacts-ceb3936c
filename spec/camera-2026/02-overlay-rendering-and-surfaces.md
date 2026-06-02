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

Continue to [`03-shortcuts-and-controls.md`](./03-shortcuts-and-controls.md).
