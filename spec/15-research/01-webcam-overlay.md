# Research 01 — Webcam overlay on slides

**Status**: research only — no runtime code yet. Awaits user sign-off on
the JSON contract in section 5 before implementation.
**Requested by user**: yes (verbatim ask captured below).
**Estimated effort**: M (one new component + per-slide JSON field +
permission-handling chrome + LLM doc page).

---

## 1. The user's verbatim ask

> "Is there any way to put the camera in the slides? […] add the
> webcam, and […] the webcam will be visible there, and it can come as
> a fade in or blur in. And as you go to moving slide, it could have a
> place where the webcam should be placed. […] the option should be
> there, and we can also zoom in, auto frame it, things like that
> inside the webcam. […] this is a requirement. […] create a research
> folder inside the spec and then write details about it and also
> update the memory. […] I want this feature so that it will come as a
> component feature. So anytime I want or ask AI, they could be able
> to implement it. […] add in the LLM guideline as well, so that LLM
> knows where to put and how to put the webcam from the browser."

### What the user is actually asking for (paraphrase)

A **reusable webcam component** that:

- Captures the local browser camera (`getUserMedia`).
- Renders pinned to a configurable region of the current slide
  (corner / inset / freeform x,y,w,h in stage coordinates).
- Has a tasteful entrance animation: **fade-in** OR **blur-in**.
- Per-slide placement — slide N can pin webcam top-right, slide N+1
  can pin it bottom-left, the camera **smoothly translates** between
  the two positions across the slide change (no flicker, no
  re-acquire).
- Built-in **zoom** (digital crop, e.g. 1.0× → 2.0×) and
  **auto-frame** (face-track crop using either `MediaStreamTrack`
  `pan/tilt/zoom` constraints when available, OR a JS face-detector
  fallback).
- The control is **JSON-authorable per slide** so the user can ask any
  AI: "put the webcam top-right, blur-in, 1.5× zoom" and the AI knows
  the schema.

---

## 2. What the browser actually allows

### 2.1 Camera capture — `getUserMedia`

```js
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width:  { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
    // PTZ constraints — Chrome only, opt-in via permission.
    pan: true, tilt: true, zoom: true,
  },
  audio: false,
});
videoEl.srcObject = stream;
```

**Browser support** (as of 2026):

| Engine | getUserMedia | Permissions API | PTZ constraints | InsertableStreams |
|---|---|---|---|---|
| Chromium 120+ | ✅ | ✅ `permissions.query({name:'camera'})` | ✅ (hardware-dependent) | ✅ |
| Safari 17+ | ✅ | ✅ | ❌ (PTZ silently ignored) | ❌ |
| Firefox 122+ | ✅ | ✅ | ❌ | ❌ |

### 2.2 Permission model

- First-time `getUserMedia` triggers a browser permission prompt.
- Permission persists per origin (HTTPS required — preview + publish
  URLs are HTTPS, fine).
- Permission state queryable without prompting:
  `navigator.permissions.query({ name: 'camera' })` →
  `'granted' | 'prompt' | 'denied'`.
- When `denied` we **must** show a chrome message ("Camera blocked —
  click the lock icon to re-enable") because we can't re-prompt
  programmatically.

### 2.3 Auto-frame strategies

| Approach | Pros | Cons | Recommendation |
|---|---|---|---|
| **Native PTZ** (`track.applyConstraints({zoom: 2})`) | Hardware crop, no CPU cost | Chromium-only, hardware-dependent | Try first, fall back |
| **CSS `object-fit: cover` + transform-scale** | Works everywhere, zero deps | Not face-tracking, just a centered crop | **Default for v1** |
| **MediaPipe face-detector + canvas crop** | True auto-frame, follows face | +400KB WASM, CPU draw loop | Optional v2 (lazy-loaded) |
| **InsertableStreams** + WebGL crop | GPU, low latency | Chromium-only, complex | Not worth it |

### 2.4 Lifecycle gotchas

- **Single stream, multiple consumers**: only acquire `getUserMedia`
  once per session and share the `MediaStream` across all slides. A
  reacquire on every slide change causes a 200–600ms flash, light
  flicker, and re-prompt on some browsers.
- **Tab background**: most browsers pause `<video>` rendering when the
  tab is hidden; the stream stays alive. No action needed.
- **Cleanup**: must call `track.stop()` on every track when the deck
  unmounts (or on a "Camera off" toggle), otherwise the OS-level
  camera-on indicator stays lit indefinitely.
- **Iframe / preview**: preview pages run inside an iframe. Webcam
  works only if the parent iframe sets
  `allow="camera; microphone"`. The Lovable preview iframe does
  permit camera by default — verify before promising it works in
  preview.

---

## 3. How it lands in this codebase

### 3.1 Files involved (forecast)

| File | Role |
|---|---|
| `src/slides/components/WebcamOverlay.tsx` | NEW. The visible video element + crop wrapper + entrance motion. |
| `src/slides/webcam.ts` | NEW. Singleton stream manager (acquire once, share, stop on unmount). Mirrors `src/slides/sound.ts`. |
| `src/slides/types.ts` | Extend `SlideContent` with `webcam?: WebcamSpec`. Slide-level (not per-step). |
| `src/slides/SlideStage.tsx` | Mount `<WebcamOverlay>` at the deck root once; pass current-slide spec down. |
| `src/builder/ContentFieldEditor.tsx` | New `webcam` field renderer with placement preset buttons. |
| `src/pages/SettingsPage.tsx` | Global "Camera" toggle + device picker + a "Camera permission state" readout. |
| `spec/slides/51-webcam-overlay.md` | Runtime spec (post-implementation). |
| `spec/slides/llm/20-webcam-overlay.md` | LLM authoring guide (post-implementation). |
| `.lovable/memory/features/webcam-overlay.md` | Memory rule. |

**Key architectural decision**: webcam is a **deck-level singleton
overlay**, NOT a slide-type. Reason: every existing slide should be
able to opt in via JSON without a type change. This mirrors how
`AmbientBackground` works — a component overlay opted in per slide.

### 3.2 Why slide-level and not step-level

Steps inside `StepTimelineSlide` change every few seconds during
autoplay; reacquiring the stream or restarting the entrance animation
on every step would be jarring. Webcam placement should change at most
once per slide.

### 3.3 Cross-slide motion

The single shared `<WebcamOverlay>` lives at the deck root and reads
`activeSlide.webcam`. When the slide changes:

1. Compute the new placement rect in stage px (1920×1080).
2. Animate the wrapper's `x/y/width/height` with a Framer Motion
   `layout` transition (`type: 'spring', stiffness: 220, damping: 30`).
3. The `<video>` element itself never unmounts — only its outer
   wrapper morphs. No re-acquire, no flash.

If the next slide has `webcam: undefined`, the overlay fades out
(0.4s) but the stream stays alive in case slide N+2 brings it back.

---

## 4. Proposed JSON schema (draft — needs sign-off)

```ts
interface WebcamSpec {
  /** Where to pin the webcam on this slide. Either a preset OR a
   *  freeform rect in stage coordinates (1920×1080). */
  placement:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'center'
    | { x: number; y: number; w: number; h: number };

  /** Default 320×240 (16:9). Ignored when `placement` is freeform. */
  size?: 'sm' | 'md' | 'lg';   // 240×135 / 360×202 / 480×270

  /** Entrance for the FIRST slide that activates the webcam. Cross-slide
   *  movement always uses a spring layout transition, never re-runs this. */
  enter?: 'fade' | 'blur' | 'fade-blur' | 'none';

  /** Digital zoom 1.0–3.0. Implemented as `transform: scale()` on the
   *  inner <video>; outer rect stays fixed. */
  zoom?: number;

  /** Crop strategy. 'cover' = centered crop (default, works everywhere).
   *  'auto-frame' = face-tracking crop (lazy-loads MediaPipe; falls back
   *  to 'cover' if the model fails to load or no face is detected). */
  crop?: 'cover' | 'auto-frame';

  /** Decoration. */
  shape?: 'rounded' | 'circle' | 'square';   // default 'rounded'
  border?: 'none' | 'gold' | 'cream';        // default 'gold'
  shadow?: boolean;                          // default true

  /** Mirror the video horizontally (selfie-view). Default true — most
   *  presenters expect the mirrored view they see in their daily video
   *  calls. */
  mirror?: boolean;
}
```

### Example author calls

```json
// "Top-right, fade in, slight zoom"
"webcam": { "placement": "top-right", "enter": "fade", "zoom": 1.2 }

// "Big circular cam in the center for the title slide"
"webcam": { "placement": "center", "size": "lg", "shape": "circle", "enter": "blur" }

// "Freeform position over the body grid right edge"
"webcam": { "placement": { "x": 1450, "y": 80, "w": 360, "h": 202 } }
```

---

## 5. Open questions (need user answer before implementation)

1. **Default state**: should the webcam be **off until explicitly
   enabled per slide**, or **on whenever any slide has a `webcam`
   field**? Recommendation: opt-in per slide — quieter default.
2. **Permission UX**: should we show a one-time "Enable camera"
   button in the controller bar, or auto-prompt on the first slide
   that has `webcam`? Recommendation: button, never auto-prompt.
3. **Audio**: leave audio off by default (presenter speaks live to
   the room/Zoom; the deck doesn't need to capture it)?
4. **Offstage devices**: when the user has multiple cameras (laptop
   + USB), do we add a picker in `/settings`?
5. **Auto-frame scope**: ship v1 with `'cover'` only, ship
   `'auto-frame'` in a follow-up loop? Recommendation: yes — keeps
   v1 tight, no MediaPipe dependency.

---

## 6. Recommended path

1. **Loop A** (this loop): research + spec + LLM doc + memory. **Done.**
2. **Loop B**: implement v1 — singleton stream manager,
   `<WebcamOverlay>`, `'cover'` crop only, fade/blur/none entrance,
   placement presets + freeform, builder UI, `/settings` device
   picker, controller "Camera" toggle.
3. **Loop C** (optional): `'auto-frame'` crop via lazy-loaded
   MediaPipe; PTZ constraints when available.

After Loop B the camera works everywhere; after Loop C it follows the
presenter's face. Both loops are independent — Loop C is pure
addition.
