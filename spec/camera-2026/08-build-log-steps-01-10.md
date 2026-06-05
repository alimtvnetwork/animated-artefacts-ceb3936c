# 08 — Build Log: Steps 1–10 (reasoning + time)

> **⚠️ HISTORICAL.** Any "background plate" or "CSS-only rim" wording below is
> superseded by the **current v3 (2026-06-05)** design: the squircle rim is a
> **PNG plate** (`squircle-plate-gold.png`) behind the video + a transparent
> **`mask-image` crop** (`squircle-mask.png`), transparent interior.
> See [`05-backgrounds-and-shapes.md`](./05-backgrounds-and-shapes.md) §8 (v3).


> Checkpoint **A→B** expansion of [`06-implementation-steps-1-30.md`](./06-implementation-steps-1-30.md).
> Each entry = **what · why (reasoning) · est. time · done-when**. A blind AI can
> execute these in order. Times assume one focused engineer, no context-switching.
> Source-of-truth code lives in files 01–05; this is the sequenced rationale.

## Phase A — Skeleton & state (steps 1–8)

### 1. Create the context module — **~25 min**
- **What:** `src/slides/components/usePresenterWebcam.tsx` exporting `WebcamCtx`,
  `PresenterWebcamProvider`, `usePresenterWebcam()` (throws outside provider).
- **Why:** A single React context is the only place webcam state can live so the
  overlay, shortcuts, and controller chip all read/write the *same* stream and
  phase. Throwing outside the provider catches mis-mounts at dev time instead of
  silently rendering a dead camera.
- **Done when:** importing the hook compiles; calling it without a provider throws.

### 2. Define types & constants — **~20 min**
- **What:** `WebcamPhase`, `SizeStep`, `SIZE_STEPS`, `STEP_ORDER`,
  `FREE_MIN_W/MAX_W`, `ASPECT_H_OVER_W`, `DEFAULT_POS`, `SizeConfig`, storage keys.
- **Why:** Locking the phase union and size ladder *first* makes every later
  reducer/handler exhaustive and type-checked. Centralizing storage keys avoids
  the classic "two keys, one feature" persistence bug.
- **Done when:** types compile; `SIZE_STEPS`/`STEP_ORDER` are the only size source.

### 3. localStorage read/write helpers — **~30 min**
- **What:** SSR-guarded, try/catch helpers: `readStoredPos/Size`,
  `writeStoredSize`, `clampFreeWidth`, `nearestStep`.
- **Why:** A presenter reopening the deck must get their last camera size/position
  back, but corrupt or absent JSON must never crash the deck. Clamping on read
  protects against stale values saved before a constant changed.
- **Done when:** unit-callable; corrupt JSON returns defaults, never throws.

### 4. State + persisted flags — **~35 min**
- **What:** `state` (init `off`), `position`, `sizeCfg`, `minimized`,
  `haloVisible`, `circleShape`, `cinematicExiting`, plus refs
  (`fullscreenReturnPhaseRef`, `actionStackRef`, `navHandlersRef`,
  `stageRestoreRef`).
- **Why:** Splitting *rendered* state (triggers re-render) from *refs* (mutable,
  no re-render) keeps drag/resize at 60fps and lets the cinematic cycle remember
  where to return without thrashing React. The action stack enables `Esc` unwind.
- **Done when:** provider holds state; refs initialized; no render on ref writes.

### 5. `show()` / getUserMedia — **~40 min**
- **What:** Reuse an existing stream from tray/fullscreen; otherwise request
  `{video:{ideal 1280×720, facingMode:'user'}, audio:false}`; map
  `NotAllowedError`/`NotFoundError` → friendly `denied` copy.
- **Why:** Re-requesting when a live stream already exists re-flashes the camera
  light and annoys presenters — reuse is the correct default. Audio off avoids an
  unexpected mic indicator. Friendly error mapping turns a raw DOMException into
  actionable UI.
- **Done when:** first call lights the camera; second call with a live stream
  reuses it; denial routes to `denied` phase with readable text.

### 6. `hide()` vs `close()` — **~25 min**
- **What:** `hide`→`tray` (stream stays alive); `close`→stop all tracks→`off`.
  Add `stopStream`, `toggle`, `toggleMinimized`, `clearMinimized`.
- **Why:** These are *semantically different*: minimize must keep frames flowing
  for instant restore, while close must fully release the device so the camera
  light goes dark (privacy). Conflating them is the #1 webcam UX bug.
- **Done when:** tray keeps the light on; close turns it off and frees tracks.

### 7. Size + position actions — **~35 min**
- **What:** `setPosition` (clamped+persisted), `setSizeStep`, `growSize`,
  `shrinkSize`, `resizeFree`, derived `computedSize` memo.
- **Why:** Routing all geometry through clamped+persisted actions means keyboard
  (`+`/`-`), drag, and the size ladder can never desync or push the camera
  off-screen. `computedSize` as a memo keeps the 16:9 derivation in one place.
- **Done when:** keyboard and drag both mutate the same persisted geometry; box
  never leaves the viewport.

### 8. Mount the provider — **~10 min**
- **What:** Wrap the app in `<PresenterWebcamProvider>` in `src/App.tsx`.
- **Why:** The provider must sit above every route so the camera survives slide
  navigation (it's presenter chrome, not slide content).
- **Done when:** app renders; no "used outside provider" error anywhere.

## Phase B (start) — The overlay view (steps 9–10)

### 9. Create the overlay — **~25 min**
- **What:** `src/slides/components/PresenterWebcamOverlay.tsx`; read context;
  early-return `null` for `off`/`requesting`/`denied`.
- **Why:** Keeping render gating at the top means zero DOM/cost when the camera
  is off — important since the overlay mounts on every slide. Separating view from
  the state hook keeps each file under the 100-line rule.
- **Done when:** overlay renders nothing in `off`; mounts a node once `on`.

### 10. Stream binding — **~30 min**
- **What:** `attachStreamToVideo` + `bindFloatingVideo`/`bindFullscreenVideo`
  refs; re-bind effect; never *exclusively* move the stream between elements.
- **Why:** A single `MediaStream` can feed multiple `<video>` elements
  simultaneously; "moving" it tears down playback and flashes the camera. Binding
  via refs lets float↔fullscreen transitions stay seamless.
- **Done when:** switching float↔fullscreen never blanks the video or re-prompts.

## Checkpoint

**Done this batch:** steps 1–10 (all of Phase A + Phase B start).
**Phase A total est.:** ~3 h 40 min · **Steps 9–10 est.:** ~55 min.

### Remaining items (11–30)
- **Phase B — overlay (11–16):** 11 on-card chrome · 12 drag math · 13 resize math
  · 14 tray surface · 15 fullscreen+stage surfaces · 16 mount overlay.
- **Phase C — shortcuts & nav (17–21):** 17 core keydown · 18 v5 keys
  (`O`/`P`/`[`/`]`) · 19 fullscreen nav passthrough · 20 deck wiring · 21
  controller chip + dropdown + `/` dialog.
- **Phase D — auto-frame (22–24):** 22 `useAutoFrame` · 23 detection loop · 24
  wire `f` + transform.
- **Phase E — backgrounds/shapes/polish (25–30):** 25 squircle shape · 26
  background plate · 27 gold→ember rim · 28 shape pop · 29 halo + reduced-motion +
  theme audit · 30 tests + acceptance.

Issue `next` to expand **steps 11–20** in the same format.
