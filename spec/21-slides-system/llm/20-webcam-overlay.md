# LLM authoring guide — Webcam overlay

> **Status: PROPOSED.** This file documents the contract authors will
> use *once* the webcam overlay is implemented. Until the user signs
> off and the implementation loop runs, do **not** emit `content.webcam`
> in any deck JSON — the field is not yet wired and will be ignored.
> See `spec/research/01-webcam-overlay.md` and `spec/slides/51-...md`.

## Quick recipe

> "Show my webcam top-right of slide 3, fade in, slight zoom."

```json
{
  "id": "engagement-process",
  "slideNumber": 3,
  "type": "StepTimelineSlide",
  "content": {
    "title": "Engagement Process",
    "steps": [ ... ],
    "webcam": {
      "placement": "top-right",
      "size": "md",
      "enter": "fade",
      "zoom": 1.2,
      "shape": "rounded",
      "border": "gold"
    }
  }
}
```

## Schema

```ts
interface WebcamSpec {
  placement:
    | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
    | { x: number; y: number; w: number; h: number };  // stage px (1920×1080)
  size?: 'sm' | 'md' | 'lg';            // 240×135 / 360×202 / 480×270
  enter?: 'fade' | 'blur' | 'fade-blur' | 'none';   // first slide only
  zoom?: number;                         // 1.0 – 3.0
  crop?: 'cover' | 'auto-frame';        // default 'cover'; auto-frame is v2
  shape?: 'rounded' | 'circle' | 'square';
  border?: 'none' | 'gold' | 'cream';
  shadow?: boolean;
  mirror?: boolean;                      // default true (selfie view)
}
```

## Placement rules

- **Prefer presets** (`top-right` / `top-left` / `bottom-right` /
  `bottom-left` / `center`) — they auto-respect the brand inset
  (`--brand-inset-x = 218px`) so the cam never collides with the
  Riseup wordmark or the presenter chip.
- **Use freeform `{x,y,w,h}`** only when the author says something
  like "put the cam over the description column" — measure the
  intended position in stage coordinates (1920×1080) using the live
  alignment guide HUD in /builder.
- **Never overlap the brand header** (top 80px) or the controller
  bar (bottom 80px) when picking freeform coords.
- **Per-slide changes auto-animate.** Slide N has `top-right`,
  slide N+1 has `bottom-left` → the cam slides smoothly between the
  two. No manual transition spec needed.

## Entrance

- `'fade'` — opacity 0→1 over 600ms easeOut. Default for talking-head
  slides.
- `'blur'` — `blur(20px)` → 0 over 800ms. Use on title slides for a
  cinematic reveal.
- `'fade-blur'` — both, simultaneously. Most dramatic.
- `'none'` — pop in instantly. Use when the cam was already visible
  on the previous slide and you just want to skip any entrance.

The entrance ONLY runs the first time the camera appears in the deck
(or after a "Camera off → Camera on" toggle). Once visible, slide
changes use a layout spring, not the entrance keyframe.

## Zoom + crop

- `zoom`: digital scale on the inner video, range 1.0–3.0. Anything
  beyond 2.0 starts to look pixelated on a 720p webcam — recommend
  ≤ 1.5 for talking-head, up to 2.0 for product demos.
- `crop: 'cover'` (default): centered crop, works on every browser,
  zero CPU cost. Pick this unless the author specifically asks for
  face-tracking.
- `crop: 'auto-frame'`: lazy-loads MediaPipe face detector and
  re-centers the crop on the detected face. Falls back silently to
  `'cover'` if the model fails to load (offline, ad-blocker) or no
  face is detected for > 2 seconds. Costs ~400KB on first activation.

## Decoration defaults (Riseup style)

```json
{ "shape": "rounded", "border": "gold", "shadow": true, "mirror": true }
```

These match the deck's noir-gold palette. Use `border: 'cream'` for
the bright-gold theme; `'none'` if the cam needs to feel inset rather
than badge-like.

## What NOT to do

- ❌ Don't put `webcam` inside a `step.*` field — webcam is
  slide-level only.
- ❌ Don't set `audio: true` — audio capture is intentionally not
  exposed. Presenter speaks live.
- ❌ Don't try to set `enter` per slide expecting the entrance to
  re-run. Entrance fires once per "first appearance" only.
- ❌ Don't author freeform `{x,y,w,h}` outside the 1920×1080 stage —
  values get clamped and the result is unpredictable.
- ❌ Don't add `webcam` to a TitleSlide that's part of a sequence
  with the cam already on. The slide change handles continuity.

## Pre-flight checklist (before authoring `webcam` in any JSON)

1. Confirm the runtime feature is implemented (look for
   `src/slides/components/WebcamOverlay.tsx`). If the file doesn't
   exist, the field is a no-op.
2. Confirm the user has clicked the "Camera" toggle in the controller
   at least once this session.
3. Use placement presets unless the user explicitly requested
   freeform.
4. Default `mirror: true`, `shape: 'rounded'`, `border: 'gold'`.
