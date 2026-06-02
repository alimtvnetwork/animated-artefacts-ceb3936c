# 04 — Auto-Frame Face Tracking (`useAutoFrame`)

> The "Center Stage" effect: detect the presenter's face and smoothly
> translate+scale the inner `<video>` so they stay centered while they move.
> Toggled by `f`. Degrades to a no-op when the browser lacks `FaceDetector`.
>
> Live file: `src/slides/components/useAutoFrame.ts`.

## 1. Why & how

Presenters drift while speaking; a static crop loses them. This hook samples the
largest face every ~250ms (browser-native **`FaceDetector`**, Chromium desktop)
and EMA-smooths a translate/scale transform applied to the `<video>`. No
MediaPipe / TF.js — keep the bundle slim; this is polish, not core. When
`FaceDetector` is missing (Firefox/Safari/mobile) `supported` is false, the
transform stays identity, and the `f` toggle is inert.

## 2. Public shape

```ts
export interface AutoFrameResult {
  transform: string;   // CSS transform for the inner <video>, includes the mirror flip
  supported: boolean;  // FaceDetector available
  enabled: boolean;    // user toggled on (persisted)
  tracking: boolean;   // a face seen in the last few ticks
  toggle: () => void;  // persists to localStorage 'riseup.webcam.autoframe'
}
export function useAutoFrame(stream: MediaStream | null, mirrored: boolean): AutoFrameResult;
```

Wire-up in the overlay:
```tsx
const autoFrame = useAutoFrame(state.stream, /* mirrored */ true);
<video style={{ transform: autoFrame.transform }} />
```

## 3. Tuning constants

```ts
const STORAGE_KEY = 'riseup.webcam.autoframe';
const DETECT_INTERVAL_MS = 250;
const EMA_ALPHA = 0.18;                  // smoothing — gimbal, not strobe
const TARGET_FACE_HEIGHT_RATIO = 0.55;   // face ≈ 55% of box height
const MAX_SCALE = 1.6, MIN_SCALE = 1.0;
const LOST_TICKS_BEFORE_RESET = 3;       // ease back to identity if face lost
```

## 4. Detection loop (offscreen, downscaled)

Mount a hidden `<video>` + a small (≤320px wide) scratch `<canvas>`; sample the
hidden video (never the on-screen one — it's CSS-mirrored). Each tick:

1. Draw the frame downscaled to 320px wide.
2. `detector.detect(canvas)`; pick the largest bounding box.
3. Compute normalized face center `cx,cy ∈ [0,1]`; target translate `= 0.5 - c`.
4. Compute zoom so the face fills `TARGET_FACE_HEIGHT_RATIO`:
   `rawScale = 0.55 / max(faceFraction, 0.05)`, clamped to `[1.0, 1.6]`.
5. EMA toward targets (`α=0.18`); on loss > 3 ticks ease back to identity.
6. Compose the transform — **negate tx when mirrored** so it follows the
   on-screen face:

```ts
const txPct = (mirrored ? -s.tx : s.tx) * 100;
const tyPct = s.ty * 100;
const mirrorPart = mirrored ? 'scaleX(-1) ' : '';
setTransform(`${mirrorPart}translate(${txPct.toFixed(2)}%, ${tyPct.toFixed(2)}%) scale(${s.scale.toFixed(3)})`);
```

`detect()` can throw on tab-visibility changes — wrap in try/catch and retry next
tick. Cancel the loop and null `srcObject` on cleanup.

## 5. Feature-detect

```ts
function getFaceDetectorCtor(): FaceDetectorCtor | null {
  if (typeof window === 'undefined') return null;
  const ctor = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector;
  return typeof ctor === 'function' ? ctor : null;
}
```

When disabled/unsupported, reset to `mirrored ? 'scaleX(-1)' : 'none'` and clear
the smoothed refs.

Continue to [`05-backgrounds-and-shapes.md`](./05-backgrounds-and-shapes.md).
