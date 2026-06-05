# 09 — Build Log: Steps 11–20 (reasoning + time)

> **⚠️ HISTORICAL.** "circle/halo/plate" and any "CSS-only rim" wording below is
> superseded by the **current v3 (2026-06-05)** design: a **PNG plate**
> (`squircle-plate-gold.png`) behind the video + a transparent **`mask-image` crop**
> (`squircle-mask.png`), transparent interior.
> See [`05-backgrounds-and-shapes.md`](./05-backgrounds-and-shapes.md) §8 (v3).


> Checkpoint **B→C** expansion of [`06-implementation-steps-1-30.md`](./06-implementation-steps-1-30.md).
> Follows [`08-build-log-steps-01-10.md`](./08-build-log-steps-01-10.md).
> Each entry = **what · why (reasoning) · est. time · done-when**. Source code in
> files 01–05; this is the sequenced rationale.

## Phase B — The overlay view (steps 11–16)

### 11. The `on` card — **~45 min**
- **What:** Draggable header, mirrored `<video objectFit:cover>`, bottom-right
  resize handle, chrome (zoom +/-, fullscreen, focus, minimize, X).
- **Why:** This is the presenter's default camera. Mirroring matches how people
  expect to see themselves; `cover` prevents letterboxing at any size. Chrome
  lives on the card (not a global toolbar) so it travels with the box and stays
  discoverable on hover. (File 02 §1.)
- **Done when:** card shows mirrored feed; every chrome button fires its action.

### 12. Drag math — **~30 min**
- **What:** Pointer-capture + delta ÷ `--stage-scale` → `setPosition`.
- **Why:** The deck renders inside a CSS-scaled stage, so raw pointer deltas
  over-travel; dividing by `--stage-scale` keeps the camera glued to the cursor at
  any zoom. Pointer-capture guarantees drag continues even if the pointer leaves
  the element. (File 02 §2.)
- **Done when:** box tracks cursor 1:1 at all stage scales; no drift on fast drag.

### 13. Resize math — **~30 min**
- **What:** Width-only drag, 16:9 height derived, clamp `[160, 960]`,
  `stopPropagation`.
- **Why:** Driving only width and deriving height keeps aspect locked so faces
  never distort. Clamping bounds prevents a 4px or full-screen accident.
  `stopPropagation` stops the resize gesture from also triggering a drag. (File 02 §2.)
- **Done when:** resizing keeps 16:9; can't exceed clamp; never starts a drag.

### 14. Tray surface — **~30 min**
- **What:** 40×40 ember-pulse icon at box top-right; hover fan = Expand /
  Fullscreen / Stop.
- **Why:** When minimized the stream stays alive, so the presenter needs an
  always-visible, low-footprint affordance to bring it back. The ember pulse
  signals "still recording" without occupying slide space. (File 02 §5.)
- **Done when:** minimized state shows the pulse; hover reveals all three actions.

### 15. Fullscreen + stage surfaces — **~40 min**
- **What:** Fixed/absolute layers with minimal chrome; honor circle/halo/plate
  flags.
- **Why:** Fullscreen (talking-head) and stage-fill (presenter-over-slide) are
  distinct layouts but must read the *same* flags so shape/halo/plate stay
  consistent as the presenter switches modes mid-talk. Minimal chrome avoids
  covering the speaker. (File 02 §1, File 05.)
- **Done when:** both layers respect circle/halo/plate; chrome stays minimal.

### 16. Mount the overlay — **~10 min**
- **What:** Render `<PresenterWebcamOverlay/>` in `src/pages/SlideDeckPage.tsx`.
- **Why:** Mounting at the deck page (not per-slide) keeps the camera persistent
  across navigation while staying scoped to the presentation route.
- **Done when:** camera persists across slide changes; absent on non-deck routes.

## Phase C — Shortcuts & nav (steps 17–21)

### 17. Core keydown listener — **~35 min**
- **What:** `i/m/f/+/-/Esc/h/1` with modifier + text-input guards.
- **Why:** Single-key shortcuts are fast for live presenting but must never fire
  while typing in an input or when a modifier is held (browser shortcuts). The
  guard is the difference between "pro tool" and "deletes my slide title." (File 03 §2.)
- **Done when:** keys work on the deck; inert inside inputs / with modifiers.

### 18. v5 keys — **~45 min**
- **What:** `O` circle, `P` enter-fullscreen, `[` exit, `]` cinematic cycle
  (`runCinematicCycle`, whoosh sound, 0.8s squish, reduced-motion = instant).
- **Why:** These give the presenter showmanship controls without a mouse. The
  cinematic cycle is one memorable key that sequences fullscreen→off→on→fullscreen
  with audio; gating on reduced-motion keeps it accessible. (File 01 interface, File 03 §1.)
- **Done when:** each key drives its transition; reduced-motion is instant+silent.

### 19. Fullscreen nav passthrough — **~35 min**
- **What:** Capture-phase listener dispatching `riseup:webcam-passthrough`;
  `__riseupWebcamLastAction` flag for back-navigation.
- **Why:** In fullscreen the camera layer sits above the deck and would swallow
  arrow keys. A capture-phase re-dispatch lets the presenter keep advancing slides
  while the camera is fullscreen — essential for talking-head segments. (File 02 §6.)
- **Done when:** arrows advance slides even when the camera is fullscreen.

### 20. Deck wiring — **~25 min**
- **What:** In `SlideDeckPage`, `registerNavHandlers` + listen for
  `riseup:webcam-passthrough` → `goNext`/`goPrev`.
- **Why:** Decouples the camera (which knows the keypress) from the deck (which
  knows how to navigate) via an event contract, so neither imports the other.
- **Done when:** passthrough events move the deck; no circular imports.

## Checkpoint

**Done this batch:** steps 11–20 (rest of Phase B + Phase C through deck wiring).
**Phase B remainder est.:** ~3 h 5 min · **Phase C so far est.:** ~2 h 15 min.

### Remaining items (21–30)
- **Phase C — finish (21):** 21 controller chip + dropdown + `/` dialog
  (`PresenterWebcamButton`, status icon/colors, shared `SHORTCUTS` rows).
- **Phase D — auto-frame (22–24):** 22 `useAutoFrame` (FaceDetector + persist flag)
  · 23 detection loop (320px canvas, 250ms, EMA α=0.18, ease-back) · 24 wire `f`
  toggle + mirror-aware transform.
- **Phase E — backgrounds/shapes/polish (25–30):** 25 squircle shape · 26
  background plate · 27 gold→ember rim + glow · 28 shape pop (WAAPI) · 29 halo +
  reduced-motion + theme audit · 30 tests + acceptance.

Issue `next` to expand **steps 21–30** (final batch) in the same format.
