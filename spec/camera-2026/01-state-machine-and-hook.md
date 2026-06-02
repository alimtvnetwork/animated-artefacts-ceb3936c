# 01 — State Machine & Hook (`usePresenterWebcam`)

> The single source of truth. A React **context provider** holds all camera
> state and exposes actions. The overlay is a thin view over this. Build this
> file first — nothing else works without it.
>
> Live file: `src/slides/components/usePresenterWebcam.tsx`.

## 1. Types

```ts
export type WebcamPhase =
  | 'off' | 'requesting' | 'on' | 'tray' | 'fullscreen' | 'stage' | 'denied';

export type SizeStep = 'S' | 'M' | 'L' | 'XL';

const SIZE_STEPS: Record<SizeStep, { w: number; h: number }> = {
  S: { w: 240, h: 135 },
  M: { w: 320, h: 180 },
  L: { w: 480, h: 270 },
  XL: { w: 720, h: 405 },
};
const STEP_ORDER: SizeStep[] = ['S', 'M', 'L', 'XL'];

const FREE_MIN_W = 160;
const FREE_MAX_W = 960;
const ASPECT_H_OVER_W = 9 / 16;          // 16:9 locked

const DEFAULT_POS = { x: 1920 - SIZE_STEPS.M.w - 32, y: 32 }; // top-right, 32px inset

type SizeConfig =
  | { kind: 'step'; id: SizeStep }
  | { kind: 'free'; w: number; h: number };
const DEFAULT_SIZE: SizeConfig = { kind: 'step', id: 'M' };

export interface WebcamState {
  phase: WebcamPhase;
  stream: MediaStream | null;
  error: string | null;
}
```

## 2. Storage keys & helpers

```ts
const POS_KEY    = 'riseup.webcam.pos';
const MIN_KEY    = 'riseup.webcam.min';
const SIZE_KEY   = 'riseup.webcam.size';
const HALO_KEY   = 'riseup.webcam.halo';
const CIRCLE_KEY = 'riseup.webcam.circle';
const MINI_W = 96, MINI_H = 96;          // minimized puck size
```

Each read helper is SSR-safe (`typeof window === 'undefined'` guard), wrapped in
`try/catch`, and falls back to the default on corrupt JSON. Each write helper
swallows quota errors (in-memory state still wins). Example:

```ts
function readStoredPos(): { x: number; y: number } {
  if (typeof window === 'undefined') return DEFAULT_POS;
  try {
    const raw = window.localStorage.getItem(POS_KEY);
    if (!raw) return DEFAULT_POS;
    const p = JSON.parse(raw) as { x?: number; y?: number };
    if (typeof p.x === 'number' && typeof p.y === 'number') return { x: p.x, y: p.y };
  } catch { /* corrupt — fall through */ }
  return DEFAULT_POS;
}
```

## 3. The context interface (every action)

```ts
interface Ctx {
  state: WebcamState;
  position: { x: number; y: number };
  size: { w: number; h: number };           // the LIVE painted size
  sizeStep: SizeStep | null;                // null when free-resized
  minimized: boolean;

  toggle: () => Promise<void>;              // button: on→hide, tray→show, else show
  show: () => Promise<void>;                // acquire / re-show
  hide: () => void;                         // soft → tray (stream alive)
  close: () => void;                        // hard stop → off (kills tracks)
  toggleMinimized: () => void;              // 96×96 puck

  setPosition: (x: number, y: number) => void;
  setSizeStep: (s: SizeStep) => void;
  growSize: () => void;                     // `+` zoom in
  shrinkSize: () => void;                   // `-` zoom out
  resizeFree: (w: number, h?: number) => void;

  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => void;
  pushFullscreenAction: (a: FullscreenAction) => void;
  registerNavHandlers: (h: NavHandlers) => () => void;

  haloVisible: boolean;  toggleHalo: () => void;       // `h`
  toggleStage: () => void;                              // `1`
  circleShape: boolean;  toggleCircleShape: () => void; // `O`
  cinematicExiting: boolean;  runCinematicCycle: () => void; // `]`
}
```

## 4. Acquiring the stream — `show()`

The heart of "turn the camera on". Re-shows from `tray`/`fullscreen` reuse the
existing stream (no second permission prompt); otherwise it requests.

```ts
const show = useCallback(async () => {
  if (state.phase === 'tray' && state.stream) {
    setState({ phase: 'on', stream: state.stream, error: null }); return;
  }
  if (state.phase === 'fullscreen' && state.stream) {
    setState({ phase: 'on', stream: state.stream, error: null }); return;
  }
  if (state.phase === 'on' || state.phase === 'requesting') return;

  setState({ phase: 'requesting', stream: null, error: null });
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false,
    });
    setState({ phase: 'on', stream, error: null });
  } catch (e) {
    const err = e as Error;
    const reason =
      err.name === 'NotAllowedError' ? 'Camera permission denied. Enable it in your browser site settings.'
      : err.name === 'NotFoundError' ? 'No camera found on this device.'
      : err.message || 'Could not start camera.';
    setState({ phase: 'denied', stream: null, error: reason });
  }
}, [state.phase, state.stream]);
```

> **Audio is always false** — this is a video bubble, not a recorder.

## 5. hide vs close (the critical distinction)

```ts
// SOFT hide → tray. Stream STAYS ALIVE indefinitely (camera light on).
const hide = useCallback(() => {
  setState((prev) =>
    prev.phase !== 'on' || !prev.stream ? prev
    : { phase: 'tray', stream: prev.stream, error: null });
}, []);

// HARD stop — kills every track → camera light OFF. Used by X button and `i`.
const stopStream = (s: MediaStream | null) => s?.getTracks().forEach((t) => t.stop());
const close = useCallback(() => {
  actionStackRef.current = [];
  setState((prev) => { stopStream(prev.stream); return { phase: 'off', stream: null, error: null }; });
}, []);
```

## 6. Fullscreen (CSS layer, not the Fullscreen API)

```ts
const fullscreenReturnPhaseRef = useRef<'on' | 'tray'>('on');

const enterFullscreen = useCallback(async () => {
  if (state.phase === 'off' || state.phase === 'denied') await show();
  setState((prev) => {
    if (prev.phase !== 'on' && prev.phase !== 'tray') return prev;
    fullscreenReturnPhaseRef.current = prev.phase === 'tray' ? 'tray' : 'on';
    actionStackRef.current = ['enter-fullscreen'];
    return { phase: 'fullscreen', stream: prev.stream, error: null };
  });
}, [show, state.phase]);

const exitFullscreen = useCallback(() => {
  setState((prev) => {
    if (prev.phase === 'stage') { /* restore via stageRestoreRef — see §7 */ }
    if (prev.phase !== 'fullscreen') return prev;
    return { phase: fullscreenReturnPhaseRef.current, stream: prev.stream, error: null };
  });
}, []);
```

## 7. Stage-fill (`1`) — atomic round-trip restore

`stage` covers the whole 1920×1080 stage. Entering captures size+position+phase;
exiting restores all three at once:

```ts
const stageRestoreRef = useRef<{
  fromPhase: 'on' | 'tray'; sizeCfg: SizeConfig; position: { x: number; y: number };
} | null>(null);

const toggleStage = useCallback(() => {
  setState((prev) => {
    if (prev.phase === 'stage') {
      const r = stageRestoreRef.current; actionStackRef.current = [];
      if (r) { setSizeCfg(r.sizeCfg); setPositionState(r.position); stageRestoreRef.current = null;
               return { phase: r.fromPhase, stream: prev.stream, error: null }; }
      return { phase: 'on', stream: prev.stream, error: null };
    }
    if (prev.phase !== 'on') return prev;          // §14.5: no surprise prompts
    stageRestoreRef.current = { fromPhase: 'on', sizeCfg, position };
    actionStackRef.current = ['enter-fullscreen'];
    return { phase: 'stage', stream: prev.stream, error: null };
  });
}, [sizeCfg, position]);
```

## 8. Zoom in / out — `growSize` / `shrinkSize`

`+`/`-` step through `S→M→L→XL`. If free-resized, snap to the nearest step then
move one step. Both call `clearMinimized()` first so the puck restores before
sizing. Persist via `writeStoredSize`.

```ts
const growSize = useCallback(() => {
  clearMinimized();
  setSizeCfg((prev) => {
    const w = prev.kind === 'step' ? SIZE_STEPS[prev.id].w : prev.w;
    const base = prev.kind === 'step' ? prev.id : nearestStep(w);
    const idx = STEP_ORDER.indexOf(base);
    const next: SizeConfig = { kind: 'step', id: STEP_ORDER[Math.min(STEP_ORDER.length - 1, idx + 1)] };
    writeStoredSize(next); return next;
  });
}, [clearMinimized]);
```

`shrinkSize` is the mirror (`Math.max(0, idx - 1)`).

## 9. Circle / halo / position / free-resize

- `toggleCircleShape()` flips `circleShape`, persists `CIRCLE_KEY`, shows a sonner
  toast (`id:'webcam-shape'`). Pure visual flag, no phase guard.
- `toggleHalo()` flips `haloVisible`, persists `HALO_KEY`.
- `setPosition(x,y)` clamps to `[0, 1920-M.w] × [0, 1080-M.h]`, persists `POS_KEY`.
- `resizeFree(w)` clamps width `[160,960]`, derives `h = round(w*9/16)`, persists.

## 10. Derived painted size + provider value

```ts
const computedSize = useMemo(() => {
  if (minimized) return { w: MINI_W, h: MINI_H };   // puck always wins
  if (sizeCfg.kind === 'step') return SIZE_STEPS[sizeCfg.id];
  return { w: sizeCfg.w, h: sizeCfg.h };
}, [minimized, sizeCfg]);
```

Wrap everything in a `useMemo<Ctx>` and provide it. Export the hook with a
guard:

```ts
export function usePresenterWebcam(): Ctx {
  const ctx = useContext(WebcamCtx);
  if (!ctx) throw new Error('usePresenterWebcam must be used inside <PresenterWebcamProvider>');
  return ctx;
}
```

Also export test-only constants: `_SIZE_STEPS_FOR_TEST`, `_STEP_ORDER_FOR_TEST`,
`_SIZE_KEY_FOR_TEST`.

## 11. Cleanup

On provider unmount, stop the stream:

```ts
useEffect(() => () => stopStream(state.stream), []); // unmount only
```

Continue to [`02-overlay-rendering-and-surfaces.md`](./02-overlay-rendering-and-surfaces.md).
