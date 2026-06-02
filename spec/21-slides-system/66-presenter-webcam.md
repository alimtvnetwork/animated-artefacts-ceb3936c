# Spec 64 — Presenter Webcam Overlay v2 (resize, tray, fullscreen, passthrough nav)

> Status: **Authoritative.** Supersedes the inline contract in
> `mem://features/presenter-webcam-overlay`. v1 (drag + grace-window hide
> + auto-frame) stays valid; this spec adds a Phase-2 surface.
>
> Module: `src/slides/components/usePresenterWebcam.tsx`,
> `src/slides/components/PresenterWebcamOverlay.tsx`,
> `src/slides/components/PresenterWebcamTray.tsx` (new).
>
> Tests: `src/test/presenterWebcamClose.test.tsx` (existing, extended) +
> `src/test/presenterWebcamPhase2.test.tsx` (new).

## 1. Goals

The presenter sometimes needs the camera to be:

1. **Bigger** for a personal segment (rehearsal, testimonial framing) →
   need resize.
2. **Out of the way but instantly recallable** during dense slides →
   need a soft "tray" hide that DOES NOT stop the stream.
3. **Full-bleed** for a one-shot intro/outro → need fullscreen mode.
4. **Still navigable** while fullscreen → need slide-deck nav passthrough
   so `→`/`Enter` advances slides under the camera, even though only the
   camera is visible.

This spec describes those four extensions plus the keyboard-shortcut
re-keying (`I`, `M`, `F` — no `Shift`).

## 2. Sizing model

### 2.1 Stepped sizes (`+` button)

Four canonical 16:9 sizes. The `+` button cycles forward
`S → M → L → XL`; clamps at XL (no wrap). A matching `-` button cycles
backward `XL → L → M → S`. Both are part of the overlay chrome.

| Step | W × H | Use |
|------|-------|-----|
| **S** | 240 × 135 | tight rehearsal corner |
| **M** | 320 × 180 | DEFAULT |
| **L** | 480 × 270 | personal segment |
| **XL** | 720 × 405 | hero camera |

Persisted in `localStorage` under `riseup.webcam.size` as the step ID
(`'S'|'M'|'L'|'XL'`). Read on mount; reset to `M` if missing/corrupt.

### 2.2 Free resize (mouse drag)

A bottom-right resize handle (8 × 8 px chevron, gold tint at 0.6) appears
on hover. Pointer-drag resizes the box, **locked to 16:9** — width is the
master, height = `round(width * 9/16)`. Bounds: `[160, 960]` width,
`[90, 540]` height. Stage-scale aware (same `--stage-scale` divisor as
the drag math).

Resize state lives alongside the stepped state: any free-resize switches
the persisted shape from `{ kind: 'step', id }` to `{ kind: 'free', w, h }`
in `riseup.webcam.size`. The next `+`/`-` press snaps back to the
nearest step (so `+`/`-` still feels predictable after a free resize).

### 2.3 Aspect lock

Always 16:9 (matches the canonical track resolution from `getUserMedia`).
Resize math never violates this. No portrait/square mode.

## 3. Tray (soft-hide) icon

### 3.1 Phase change

Replace the v1 `hidden` opacity-fade with an explicit tray surface:

- `phase === 'tray'` → render `<PresenterWebcamTray />` (NOT the full
  overlay). The MediaStream stays alive (no `getTracks().stop()`).
- The grace timer that auto-stopped the stream after 10s in v1 is
  **removed**. Tray persists indefinitely until the presenter expands
  it, OR clicks the X (which still calls `close()` from spec 64-v1).
- The legacy `phase: 'hidden'` enum value is retired in favor of
  `phase: 'tray'`. Migration is one-shot at module load.

### 3.2 Tray visual

A 40 × 40 rounded square (12 px radius), gold border (`var(--gold)/0.5`),
camera glyph centered (lucide `<Camera />`, 18 px). Fixed position:
mirrors the overlay's `position.x + size.w - 40, position.y` (so the
tray collapses INTO the top-right corner of the box that just hid). On
first hide ever (no overlay yet), default `1920 - 56, 32`.

Live indicator: a 6 × 6 ember dot at `top: 4, right: 4` shows the camera
is still on. Pulses at 1.4 s ease-in-out (`@keyframes camTrayPulse`,
respects `prefers-reduced-motion`).

### 3.3 Tray hover chrome

On hover (or focus-within), a row of three small buttons fans out to the
LEFT of the tray icon, anchored vertically to the icon center:

1. **Expand** (lucide `<Maximize2 />`) — calls `show()` (returns to
   normal phase `on`).
2. **Fullscreen** (lucide `<Expand />`) — calls `enterFullscreen()`.
3. **Stop** (lucide `<X />`, ember tint) — calls `close()` (kills
   stream).

Buttons are 28 × 28, gold-bordered, gap 6 px. Pointer leaves both icon
and chrome → fan retracts after 220 ms (matches expand timing).

### 3.4 Tray drag

The tray IS draggable (same pointer math as the overlay). Position is
shared with the overlay — moving the tray moves the future-expanded box
to match. Both write to `riseup.webcam.pos`.

## 4. Fullscreen mode

### 4.1 Phase

New phase value: `'fullscreen'`. Distinct from CSS Fullscreen API; we
DON'T call `requestFullscreen()` on the video element. Instead the
overlay paints a fixed-position layer covering the **deck stage**
(`position: fixed; inset: 0; z-index: 70`), hiding slide content from
view but keeping it mounted in the DOM.

Reasoning: the deck must keep responding to navigation, transitions
must keep running, and analytics must keep ticking. CSS Fullscreen API
takes the page out of normal flow and breaks all that.

### 4.2 Layout

`<video>` inside a black backdrop, scaled `object-fit: cover`. Auto-frame
works exactly as it does in normal mode. A 4-button vertical chrome
column docks at the top-right (16 px inset):

- **Exit fullscreen** (lucide `<Minimize2 />`)
- **Auto-frame toggle** (lucide `<Focus />`, when supported)
- **Stop** (lucide `<X />`)

Brand corner, presenter chip, and slide controllers are **hidden**
beneath the layer.

### 4.3 Persistence

`'fullscreen'` is NOT persisted. Refreshing the page returns to the
previous phase (`on` or `tray`). Reasoning: fullscreen is a one-shot
storytelling beat, not a default mode.

## 5. Slide-nav passthrough (fullscreen only)

### 5.1 Forward keys

While `phase === 'fullscreen'`, the overlay listens at
`window` (capture phase) for keyboard events. It maps:

- `ArrowRight` → `goNext()`
- `ArrowDown` → `goNext()`
- `Enter` → `goNext()`
- `' '` (Space) → `goNext()`
- `PageDown` → `goNext()`

…and forwards them to the deck via a new context method
`onPassthroughNav(direction)`, which `SlideDeckPage` registers at
mount. The slide deck advances under the camera. Slide transitions run
invisibly but their `slide-enter`/`slide-exit` analytics still fire, so
the rehearsal log stays accurate.

### 5.2 Backward key

`ArrowLeft` / `PageUp` follows the **action stack**:

- If the most recent action in the stack is `'enter-fullscreen'`, the
  back key exits fullscreen (returns to `phase === 'on'`) and pops the
  action.
- Otherwise it is treated as `goPrev()` and pushed as `'goPrev'`.

The action stack lives in the webcam context (`fullscreenActionStack:
Array<'enter-fullscreen' | 'goNext' | 'goPrev'>`). It resets to empty on
exit.

This realizes the user's request: *"if we go press back button, then it
will back to the webcam again"* — the very first back press right after
entering fullscreen always lands you back on the webcam, regardless of
how many forward presses happened (because forward presses don't push
`'enter-fullscreen'` again).

> **Reading note (E in chat):** the user said "any **right button click**
> should actually go to slides". That phrase is interpreted as the right
> arrow key / Enter, not mouse right-click. Mouse contextmenu is
> untouched.

### 5.3 Other keys

Plain `I`, `M`, `F`, `Escape` still work in fullscreen (see §6).

## 6. Keyboard shortcuts

Single-letter, no `Shift`. **Guarded** — ignored when `event.target` is
inside `<input>` / `<textarea>` / `[contenteditable]` (matches the
existing slide-indicator guard).

| Key | Action | Allowed phases |
|-----|--------|---------------|
| `i` | Toggle visible ↔ tray | `on`, `tray`, `fullscreen` (latter exits to `on` first) |
| `m` | Toggle minimized puck (kept from v1) | `on` |
| `f` | Auto-frame toggle (was `Shift+F`) | `on`, `fullscreen` (when `autoFrame.supported`) |
| `Escape` | Exit fullscreen if in fullscreen; else no-op | `fullscreen` |
| `+` / `=` | Step size up | `on` |
| `-` | Step size down | `on` |

`event.preventDefault()` only when the key was consumed.

## 7. State machine (full)

```
            ┌──────────────────────────────┐
            ▼                              │
off ── show() ──► requesting ──► on ──┬─► tray ─── show() ──► on
                              ▲       │
                              │       └─► fullscreen ──┐
                              │                        │
                              └──── exitFullscreen() ──┘

(close() at any phase) ──► off  (stops stream + resets stack)
(denied) ◄─── show() error path
```

`enterFullscreen()` is allowed from `on` and `tray` (auto-shows the
stream first if it was in tray). `exitFullscreen()` returns to whichever
phase we came from (recorded in `fullscreenReturnPhase`).

## 8. Public context API (Ctx changes)

```ts
interface Ctx {
  // … v1 fields …
  size: { w: number; h: number };          // now derived from stepId | freeSize | tray
  sizeStep: 'S' | 'M' | 'L' | 'XL' | null; // null when freely resized
  setSizeStep: (s: 'S' | 'M' | 'L' | 'XL') => void;
  growSize: () => void;                    // + button
  shrinkSize: () => void;                  // - button
  resizeFree: (w: number, h: number) => void;

  enterFullscreen: () => void;
  exitFullscreen: () => void;
  registerNavHandlers: (h: NavHandlers) => () => void;
  // hide() is now a synonym for "go to tray"
}

interface NavHandlers {
  goNext: () => void;
  goPrev: () => void;
}
```

`SlideDeckPage` calls `registerNavHandlers({ goNext, goPrev })` once on
mount; the cleanup unregisters.

## 9. Persistence keys (localStorage)

| Key | Shape | Notes |
|-----|-------|-------|
| `riseup.webcam.pos` | `{x, y}` | unchanged from v1 |
| `riseup.webcam.size` | `{ kind: 'step', id } \| { kind: 'free', w, h }` | new |
| `riseup.webcam.min` | `'0' \| '1'` | unchanged from v1 |

No migration script — old `riseup.webcam.min` values keep working;
absence of `size` falls back to step `M`. The retired `'hidden'` phase
value never persisted, so nothing to migrate there.

## 10. Accessibility

- Tray icon: `<button aria-label="Open camera (or hover for actions)">`,
  `aria-haspopup="menu"`, `aria-expanded` reflecting hover state.
- Hover chrome buttons: each has descriptive `aria-label` ("Expand
  camera", "Fullscreen camera", "Stop camera").
- Resize handle: `aria-label="Resize camera"`, focusable, supports
  arrow keys (`Right`/`Down` grow, `Left`/`Up` shrink) for keyboard
  resize at 32 px / 18 px increments.
- Fullscreen layer: `role="region"` `aria-label="Camera fullscreen"`.
- Reduced-motion: tray pulse, fan-out, and resize-handle hover
  collapse to instant transitions.

## 11. Test plan

`src/test/presenterWebcamPhase2.test.tsx` (new):

1. `growSize` / `shrinkSize` step through S→M→L→XL; clamp at ends.
2. `resizeFree(800, 200)` clamps height to 16:9 (= 450) and persists
   `{ kind: 'free' }`.
3. `hide()` → `phase === 'tray'`, stream still alive (tracks not
   stopped), tray icon rendered.
4. `enterFullscreen()` from `on` → `phase === 'fullscreen'`,
   `fullscreenReturnPhase === 'on'`.
5. `enterFullscreen()` from `tray` → auto-shows then enters; return
   phase = `'tray'`.
6. Action stack: `enterFullscreen → goNext → goPrev` ⇒ stack ends
   `[enter, goNext, goPrev]`; `←` after `enter` only ⇒ exits fullscreen.
7. Keyboard: `i` toggles tray ↔ on; `i` while fullscreen exits to on
   then trays.
8. Keyboard guard: `i` while focus is in an `<input>` is ignored.
9. Persistence: free resize round-trips through localStorage.
10. Existing close-button hard-stop test still passes (regression
    guard from spec 64-v1).

## 12. Out of scope

- Audio capture (still video-only).
- Picture-in-Picture API (would require user-gesture chaining we don't
  have on `i` shortcut path).
- Multiple cameras / device picker (single default user-facing camera).
- Recording the stream.

## 13. Spec diff vs. v1

| Area | v1 | v2 |
|------|----|----|
| Hide grace | 10 s timer → auto-stop | indefinite tray, stream stays alive |
| Hide visual | opacity 0 fade | tray icon w/ ember pulse + hover chrome |
| Size | fixed 320×180 + 96×96 minimized puck | 4 steps + free resize, puck retained |
| Fullscreen | not supported | new phase, slide-nav passthrough |
| Shortcuts | `Shift+F` (auto-frame), `Shift+M` (minimize) | `i` `m` `f` `+` `-` `Escape` |
| Public API | `toggle`, `show`, `hide`, `close`, `toggleMinimized`, `setPosition` | + `growSize`, `shrinkSize`, `setSizeStep`, `resizeFree`, `enterFullscreen`, `exitFullscreen`, `registerNavHandlers` |

---

## 14. v3 — Halo cleanup + Stage-fill toggle (`1`) + Glow toggle (`h`)

> Status: **Authoritative addendum** to v2. Adds two presenter shortcuts
> and replaces the always-on blurred-video halo with an opt-in soft
> vignette feather. v2's tray, free-resize, fullscreen-passthrough
> contracts are unchanged.

### 14.1 Goals

1. **Halo blends.** The v1/v2 halo (a second `<video>` blurred to
   `28px` at 70% opacity behind the sharp box) reads as a cloudy patch
   on top of the slide instead of a glow rooted to the camera. Replace
   with a soft vignette feather that fades the box edge into the slide
   background — and make it **opt-in** rather than always-on.
2. **One-key stage-fill.** Pressing `1` blows the camera up to fill the
   stage area (1920×1080) — covering all slide content but staying
   inside the deck. When the browser is in real fullscreen, the stage
   IS the screen, so "stage" naturally fills the screen too. Pressing
   `1` again restores the **exact** prior size + position.
3. **Other shortcuts unchanged.** `i` `m` `f` `+` `-` `Esc` retain
   their v2 meanings. `1` and `h` are added; nothing is removed.

### 14.2 Halo — visual variant

| Property | v2 (always-on) | v3 (opt-in, default OFF) |
|----------|----------------|---------------------------|
| Source   | second `<video>` blurred 28px | none — pure CSS |
| Effect   | blurred mirror of the camera | radial transparency feather around the sharp box |
| Default  | always rendered | hidden until toggled |
| Toggle   | n/a | `h` key + `Sparkles` chrome button |
| Persist  | n/a | `localStorage['riseup.webcam.halo']` ('1' | '0') |

Implementation: a single absolutely-positioned `<div>` sibling to the
sharp box, sized `box + 2 × HALO_FEATHER` (HALO_FEATHER = 24 px), with
`background: radial-gradient(ellipse at center, hsl(var(--gold) / 0.18) 0%, hsl(var(--gold) / 0.08) 45%, transparent 75%)`.
A `mask-image: radial-gradient(...)` softens the edge so it bleeds into
the slide bg without a hard rim. Pointer-events: none. No video, no
filter, no blur — purely tonal.

Reduced motion: no animation on the halo (it's static), so no special
case is required. Reduced motion still suppresses the existing tray-dot
pulse via the `camTrayPulse` keyframe rule.

### 14.3 Stage-fill phase (the `1` shortcut)

A new phase `'stage'` is added to `WebcamPhase`, joining
`off | requesting | on | tray | fullscreen | stage | denied`.

| Aspect | `'fullscreen'` (v2) | `'stage'` (v3) |
|--------|---------------------|------------------|
| Layer  | `position: fixed; inset: 0` over the viewport | `position: absolute; inset: 0` inside the FitStage |
| Covers | the whole browser tab | the 1920×1080 stage box (and therefore the deck content under it) |
| Real-fullscreen interaction | already filling screen | when deck is in real fullscreen, the stage IS the screen — same effect |
| Triggered by | `Expand` chrome button or existing API | `1` key only |
| Restores to | prior phase via v2's `fullscreenReturnPhase` ref | exact prior `phase + size + position`, see §14.4 |

Both phases continue to forward forward-keys to the deck via
`pushFullscreenAction` + the registered `NavHandlers`.

### 14.4 `toggleStage()` round-trip

```ts
type StageRestore =
  | { fromPhase: 'on'; size: SizeConfig; position: { x: number; y: number } }
  | { fromPhase: 'tray'; size: SizeConfig; position: { x: number; y: number } };

// On enter:
//   stageRestoreRef.current = { fromPhase: prev.phase, size: sizeCfg, position }
//   setState({ phase: 'stage', stream: prev.stream, error: null })
//
// On exit (second `1` press):
//   const r = stageRestoreRef.current
//   setSizeCfg(r.size)            // restores S/M/L/XL or free w,h
//   setPositionState(r.position)  // restores x,y
//   setState({ phase: r.fromPhase, ... })
//   stageRestoreRef.current = null
```

Persistence: stage phase itself is **not** persisted (always boots in
`off`). Halo visibility IS persisted across reloads.

### 14.5 Shortcuts table (v3 final)

| Key | When | Action |
|-----|------|--------|
| `i` | any | hide ↔ show (v2) |
| `m` | `on` | minimize ↔ restore (v2) |
| `f` | `on`/`fullscreen` | auto-frame toggle (v2) |
| `+` `-` | `on` | step size up/down (v2) |
| `Esc` | `fullscreen`/`stage` | exit to prior phase |
| `h` | any | toggle halo visibility |
| **`1`** | `on` or `stage` | toggle stage-fill (round-trips size+pos) |

`1` is ignored when phase is `tray`/`off`/`requesting`/`denied` — no
auto-permission, no surprise camera prompt. Same input-focus guard as
the other shortcuts (skip if `INPUT`/`TEXTAREA`/`contentEditable`).

### 14.6 Chrome button

A new button is inserted between **Focus** and **Expand** in the top
chrome of the `'on'` surface:

- Icon: `Sparkles` from `lucide-react`.
- `aria-label`: `"Glow halo (h)"`.
- `title`: `"Glow halo — h"`.
- `aria-pressed`: tied to `haloVisible`.
- Active style: same gold-active treatment as the auto-frame button
  (`background: hsl(var(--gold) / 0.45)`).

### 14.7 Public API additions

```ts
interface Ctx {
  // …v2 fields…
  haloVisible: boolean;
  toggleHalo: () => void;
  /** Stage-fill toggle. Round-trips size + position on exit. */
  toggleStage: () => void;
}
```

`enterFullscreen` / `exitFullscreen` from v2 stay; `'stage'` does not
collapse into them because the layer model differs (absolute vs fixed).

### 14.8 Tests (additions)

`src/test/presenterWebcamHaloAndStage.test.tsx`:

1. `haloVisible` defaults to `false`; survives reload via localStorage.
2. `toggleHalo()` flips and writes the storage key; `h` keypress mirrors
   the API call; guards against `<input>` focus.
3. `toggleStage()` from `on` → enters `stage`, reads back the same
   `stream`; from `stage` → restores the exact `size` + `position` that
   were active on entry.
4. `1` keypress is ignored when phase ∈ {`off`, `tray`, `requesting`,
   `denied`}; same input-focus guard as v2 keys.
5. `Escape` while in `stage` exits via the same code path as `Esc` in
   `fullscreen` (clears action stack, returns to prior phase).
6. Reduced motion: halo render is static (no animation property); test
   asserts no `transition`/`animation` CSS is applied to the halo node.
7. v2 regressions: `i`/`m`/`f`/`+`/`-`/`Esc` still behave per §11 of v2.

### 14.9 Diff vs. v2

| Area | v2 | v3 |
|------|----|----|
| Halo | always-on blurred mirror | opt-in vignette feather, persisted, off by default |
| Phases | `off / requesting / on / tray / fullscreen / denied` | + `stage` |
| Shortcuts | `i m f + - Esc` | + `h` (halo), `1` (stage) |
| Chrome buttons | `- + Focus Expand Minimize Hide X` | + **Sparkles** between Focus and Expand |
| Public API | v2 surface | + `haloVisible`, `toggleHalo`, `toggleStage` |
| Persistence keys | `riseup.webcam.pos`, `…min`, `…size` | + `riseup.webcam.halo` |

## 15. v4 — Shortcut rebind + circle shape + cinematic `]` cycle

> Status: **Authoritative for v4.** Source: user message 2026-05-02
> bundling left-TOC sidebar UX, global shortcut consolidation, camera
> circle mask, and a cinematic 3-state `]` cycle.
> Open clarifications logged at
> `.lovable/question-and-ambiguity/29-toc-sidebar-and-shortcut-rebind.md`.

### 15.1 Shortcut surface (full v4 table)

Single-letter shortcuts on the camera (no Shift unless noted). All
guarded against `<input>`/`<textarea>`/contenteditable focus.

| Key | Action | Notes |
|-----|--------|-------|
| `i` | Show ↔ tray (soft hide) | unchanged from v2 |
| `m` | Minimize ↔ restore puck | unchanged |
| `f` | Auto-frame toggle | unchanged |
| `+` / `=` | Step size up + un-minimize | unchanged |
| `-` | Step size down + un-minimize | unchanged |
| `h` | Halo vignette toggle | v3, unchanged |
| `1` | Stage-fill (covers 1920×1080 stage) | v3, unchanged. Memory rule preserved. |
| **`O`** | **NEW — toggle circle shape** (rect ↔ circle) | aspect snaps to 1:1; persisted. |
| **`P`** | **NEW — enter camera fullscreen** | identical to clicking the Expand button. |
| **`[`** | **NEW — exit camera fullscreen, restore prior size+position** | no animation; same code path as Esc but camera-scoped. |
| **`]`** | **NEW — cinematic 3-state cycle** | see §15.4. |
| `Escape` | Exit fullscreen / stage / shortcuts dialog | unchanged for camera; also closes TOC sidebar (see §15.6). |

Removed bindings: none. The `O` binding currently used by
`SlideTocSidebar` moves to **`Ctrl+1` / `⌘+1`** (deck-level, see §15.6).

### 15.2 Camera circle shape

**State.** New `shape: 'rect' | 'circle'` on the webcam context.
Persisted as `riseup.webcam.shape` (default `'rect'`).

**Geometry.** When `shape === 'circle'`:
- The on-surface box renders a **square** of side `min(w, h)` where
  `{w,h}` is the current step/free size (so XL goes to `405×405`, M to
  `180×180`, etc.). This avoids cropping the user's face out of frame.
- `border-radius: 50%`, `overflow: hidden`. Object-fit stays `cover`.
- Resize handle hidden in circle mode (free-resize disabled because
  the 16:9 lock conflicts with a circular mask).
- Fullscreen + stage modes ignore the shape (camera always rectangular
  full-bleed; circle is a "talking head" surface mode only).

**Toggle.** `O` shortcut + a new chrome button (between Focus and
Sparkles) using `lucide-react` `Circle` icon. `aria-pressed` reflects
state. Persisted on every change.

### 15.3 `P` — Camera fullscreen shortcut

Pure alias for `enterFullscreen()`. Idempotent: if already in
`fullscreen` or `stage`, no-op. If camera is `off`/`denied`,
auto-prompts (same flow as clicking Expand from `off`).

### 15.4 `]` — Cinematic 3-state cycle

A single key that walks the camera through three phases with
designer-grade motion. Order is **deterministic by current phase**, not
by a counter — so the cycle self-heals if the user takes other actions
between presses.

| Current phase | `]` action | Animation | Duration | Sound |
|---------------|------------|-----------|----------|-------|
| `fullscreen` | → `off` (squish-disappear) | scale 1 → 0.04 + opacity 1 → 0 + slight rotate(-3°), spring overshoot at scale 0.92 | **0.8 s** | whoosh-out (Web Audio synth, see §15.5) |
| `off` / `denied` | → `on` (bouncy fade-in at last size+pos) | scale 0.6 → 1.08 → 1, opacity 0 → 1, easing `cubic-bezier(.34,1.56,.64,1)` | 0.45 s | whoosh-in (quieter, half-volume) |
| `on` / `tray` | → `fullscreen` (bouncy zoom) | scale 0.95 → 1.04 → 1 on the fullscreen layer; backdrop fades 0 → 1 | 0.55 s | whoosh-zoom |
| `stage` / `requesting` | no-op | — | — | — |

Reduced motion (`prefers-reduced-motion: reduce` OR the in-app reduce
toggle): collapse all three to instant phase swaps **and skip sounds**
entirely. The user-facing cycle still works — only the drama is muted.

State coupling: when `]` triggers `fullscreen → off`, the stream **is
stopped** (hard close, same as the X button). The next `]` therefore
re-acquires permission silently if already granted; if denied,
fall-through to the standard error toast.

### 15.5 Whoosh sound

Generated at runtime via Web Audio (no asset file shipped). 200 ms
exponential frequency sweep + lowpass + gain envelope:

```ts
function whoosh(kind: 'out' | 'in' | 'zoom') {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = kind === 'in' ? 800 : 1200;
  osc.type = 'sawtooth';
  const start = kind === 'out' ? 600 : 200;
  const end = kind === 'out' ? 80 : kind === 'zoom' ? 900 : 500;
  osc.frequency.setValueAtTime(start, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(end, ctx.currentTime + 0.18);
  const peak = kind === 'in' ? 0.06 : kind === 'zoom' ? 0.10 : 0.14;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
  osc.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.25);
}
```

Skipped silently if `AudioContext` is unavailable, `prefers-reduced-motion`
is set, or the user has the in-app reduce-motion toggle on.

### 15.6 Deck-level changes (cross-reference)

These items live outside the webcam module but are listed here because
they share the keyboard surface:

- **TOC sidebar** (`SlideTocSidebar`):
  - Remove `O` binding (now camera-circle).
  - Add `Ctrl+1` / `⌘+1` toggle.
  - `Escape` closes when sidebar is open (currently no Esc handler).
  - Hamburger button in sidebar header opens a dropdown with: Overview
    (`G`), Presenter view, Top jumper toggle (`J`), Contrast debug,
    Reduced motion, **Keyboard map** (`?`).
- **Top Talk Jumper**: default flipped from visible → **hidden**. The
  `J` toggle still flips the saved preference; users who previously set
  the localStorage key keep their choice.
- **Keyboard map dialog**: `?` opens a Radix Dialog listing every
  shortcut grouped by surface (Deck nav, Camera, Sidebar, Debug). `Esc`
  closes. Memory `mem://features/keyboard-shortcuts-dialog`.

### 15.7 Tests (additions)

`src/test/presenterWebcamShapeAndCinematic.test.tsx` (new):

1. `shape` defaults to `'rect'`; `O` shortcut flips to `'circle'`;
   persisted under `riseup.webcam.shape`.
2. In circle mode, the rendered surface is `min(w,h)` square with
   `border-radius: 50%`.
3. `P` from `on` enters `fullscreen`; idempotent from `fullscreen`.
4. `[` from `fullscreen` returns to prior `on` state with size+pos
   intact (no animation assertions — visual).
5. `]` cycle: `fullscreen → off → on → fullscreen` across three
   keypresses; stream is stopped at the `fullscreen → off` step.
6. Reduced motion: `]` cycle still mutates phase but the whoosh
   function is **not** invoked (mock asserts zero calls).
7. Input-focus guards: `O`/`P`/`[`/`]` ignored when typing in the
   builder.

### 15.8 Diff vs. v3

| Area | v3 | v4 |
|------|----|----|
| Shortcuts | `i m f + - h 1 Esc` | + `O` (circle), `P` (fullscreen), `[` (exit FS), `]` (cinematic) |
| Phases | `off / requesting / on / tray / fullscreen / stage / denied` | unchanged |
| Surface modes | rectangle only | + circle (1:1, persisted) |
| Sound | none | Web Audio whooshes on `]` cycle (reduced-motion skips) |
| Persistence keys | `…pos / min / size / halo` | + `riseup.webcam.shape` |
| Public API | v3 surface | + `shape`, `toggleShape`, `cinematicCycle` |
