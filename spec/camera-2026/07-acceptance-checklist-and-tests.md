# 07 — Acceptance Checklist & Tests

> The camera is "done" only when every box below is checked and the Vitest suite
> is green. Mirrors the live suite under `src/test/presenterWebcam*.test.tsx`.

## 1. Functional acceptance checklist

### Lifecycle
- [ ] Controller chip / `i` starts the camera → permission prompt → `on`.
- [ ] Denied permission → `denied` phase with a friendly message, no crash.
- [ ] `m` → `tray`; camera light stays ON; `m`/click → back to `on`.
- [ ] X button / `i` from on/tray/stage → `off`; camera light goes OFF (tracks stopped).
- [ ] Provider unmount stops the stream (no orphaned camera light).

### Sizing / zoom
- [ ] `+` zooms in S→M→L→XL; `-` zooms out; stops at bounds.
- [ ] Free-resize handle keeps 16:9, clamps `[160,960]` width.
- [ ] After free-resize, `+`/`-` snap to nearest step then move one.
- [ ] Size, position, minimized, halo, circle all persist across reload. (No plate flag — the rim is always-on CSS.)

### Drag & scale
- [ ] Dragging matches the cursor on a scaled stage (delta ÷ `--stage-scale`).
- [ ] Position clamps within the 1920×1080 stage.

### Fullscreen / stage
- [ ] `P` / button → `fullscreen` (CSS layer); deck still navigable underneath.
- [ ] `←/→/Space/Enter/PageUp/PageDown` in fullscreen move the slides.
- [ ] Back key right after entering fullscreen exits it (doesn't skip a slide).
- [ ] `Esc` / `[` exits fullscreen; `]` runs the cinematic cycle.
- [ ] `1` enters stage-fill; second `1`/`Esc` restores exact size+position+phase.

### Shape & rim (2026-06-05 v3 — PNG plate + transparent mask)
- [ ] `O` cycles rectangle→circle→circle+glow with the WAAPI pop; stream never blanks.
- [ ] Squircle silhouette is the live `<video>` cropped via `mask-image: url(squircle-mask.png)` (circle `50%`, puck `999` fall back to CSS `border-radius`).
- [ ] The interior is **transparent** (mask alpha); the slide shows through the corners. The PNG plate + masked video are the only things inside the curve.
- [ ] Rim + drop shadow come from the `squircle-plate-gold.png` plate composited behind the video (~+14% larger), NOT a CSS border — matches reference image 01.
- [ ] Both PNGs are imported from `src/assets/camera-2026/` (`squircle-plate-gold.png`, `squircle-mask.png`); plate/mask gated to squircle mode via `useSquircle`/`!circleShape`.
- [ ] Plate + mask applied on every video surface: floating `on`, stage-fill, fullscreen, and the denied fallback preview.
- [ ] No raw hex is introduced; the circle/puck CSS fallback rim uses `--gold`/`--ember`/`--background` tokens.
- [ ] Transparent interior reads correctly on light themes (paper-ink) — slide shows through, no dark-on-dark fill body.

### Auto-frame
- [ ] `f` toggles auto-frame only when `FaceDetector` is supported.
- [ ] Face stays roughly centered while the presenter moves; motion is smooth.
- [ ] Unsupported browser: `f` is inert, transform stays mirrored-identity.

### Accessibility / motion
- [ ] Every surface has `role="region"` + `aria-label`.
- [ ] Shortcuts ignored while typing in input/textarea/contentEditable.
- [ ] `prefers-reduced-motion` disables all animations (instant, silent).

## 2. Vitest suite (files to create under `src/test/`)

| Test file | Asserts |
|-----------|---------|
| `presenterWebcamClose.test.tsx` | `close()` stops every track; phase → `off`. |
| `presenterWebcamHaloAndStage.test.tsx` | `h` toggles halo; `1` round-trips stage size+pos+phase. |
| `presenterWebcamVideoStability.test.tsx` | Stream never detaches on shape toggle (no remount). |
| `useAutoFrame.test.ts` | Unsupported → `supported:false`, identity transform; EMA math. |
| `presenterWebcamShortcuts.test.tsx` | Each key fires the right action and respects phase guards + input guard. |
| `presenterWebcamRimContract.test.ts` | v3 plate+mask rim: imports `squircle-plate-gold.png` + `squircle-mask.png`, crops video via `mask-image`, renders `<SquirclePlate>` on ≥3 surfaces, gated by `useSquircle`/`!circleShape`. |

### Example test skeleton

```tsx
import { render, act } from '@testing-library/react';
import { PresenterWebcamProvider, usePresenterWebcam, _SIZE_STEPS_FOR_TEST } from
  '@/slides/components/usePresenterWebcam';

function Probe({ onReady }: { onReady: (ctx: ReturnType<typeof usePresenterWebcam>) => void }) {
  onReady(usePresenterWebcam()); return null;
}

it('grow/shrink walks S→M→L→XL and clamps', () => {
  let ctx!: ReturnType<typeof usePresenterWebcam>;
  render(<PresenterWebcamProvider><Probe onReady={(c) => (ctx = c)} /></PresenterWebcamProvider>);
  act(() => ctx.growSize());            // M → L
  expect(ctx.size.w).toBe(_SIZE_STEPS_FOR_TEST.L.w);
});
```

> Mock `navigator.mediaDevices.getUserMedia` to return a fake `MediaStream` with
> stub `getTracks()` so `close()` track-stop can be asserted.

## 3. Pre-flight before shipping

```bash
bunx tsc -p tsconfig.app.json --noEmit
bun run lint
bun run test
bun run build
```

All four must pass. Then update the cross-referenced specs
(`spec/21-slides-system/64`, `65`) and `mem://features/webcam-halo-and-stage` if
behavior changed.
