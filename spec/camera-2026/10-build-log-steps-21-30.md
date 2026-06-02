# 10 — Build Log: Steps 21–30 (reasoning + time)

> **⚠️ HISTORICAL (pre-v2).** The plate/mask steps below (the `cam-plate` stack,
> `platePad`, the `02-squircle-mask-black.png` crop) were **superseded on
> 2026-06-02**. The shipped rim is **CSS-only** — `border-radius` silhouette +
> gold border + layered `box-shadow`, transparent interior, no plate/mask PNG.
> See [`05-backgrounds-and-shapes.md`](./05-backgrounds-and-shapes.md) §8 (v2).


> Final-batch expansion of [`06-implementation-steps-1-30.md`](./06-implementation-steps-1-30.md).
> Follows [`08-build-log-steps-01-10.md`](./08-build-log-steps-01-10.md) and
> [`09-build-log-steps-11-20.md`](./09-build-log-steps-11-20.md).
> Each entry = **what · why (reasoning) · est. time · done-when**. Source code in
> files 01–05; acceptance in file 07.

## Phase C — Shortcuts & nav (step 21)

### 21. Controller chip + dropdown + `/` dialog — **~45 min**
- **What:** `PresenterWebcamButton` (squiggle icon, status-driven icon/colors),
  dropdown items, shared `SHORTCUTS` rows reused by the `/` keyboard dialog.
- **Why:** The hover-reveal controller is the discoverable home for camera
  control (presenters who don't know the keys still find it). Driving icon/color
  from phase makes state legible at a glance. One `SHORTCUTS` array feeds both the
  dropdown and the `/` dialog so they can never drift. (File 03 §3–§5.)
- **Done when:** chip reflects live phase; dropdown actions fire; `/` dialog lists
  the same rows.

## Phase D — Auto-frame (steps 22–24)

### 22. Create `useAutoFrame` — **~30 min**
- **What:** Feature-detect `FaceDetector`; persist the enable flag.
- **Why:** `FaceDetector` is non-universal, so detection must degrade gracefully —
  no crash where it's missing, just no auto-frame. Persisting the flag respects
  the presenter's last choice across reloads. (File 04 §2, §5.)
- **Done when:** absent `FaceDetector` disables the feature silently; flag persists.

### 23. Detection loop — **~50 min**
- **What:** Offscreen video + 320px canvas, 250ms tick, pick largest face, EMA
  α=0.18, zoom to 0.55 height ratio, ease-back on loss.
- **Why:** A small canvas + 250ms cadence keeps CPU low for a background task.
  EMA smoothing prevents jittery jumps between frames; largest-face avoids locking
  onto the audience; ease-back on loss prevents a hard snap when the face leaves
  frame. (File 04 §4.)
- **Done when:** framing follows the face smoothly; recovers gently after loss.

### 24. Wire `f` toggle + transform — **~25 min**
- **What:** Apply the computed transform onto the `<video>` (mirror-aware), toggled
  by `f`.
- **Why:** The transform must compose with the existing mirror so left/right stay
  correct; routing it through the same `<video>` avoids a second render path. (File 04 §1.)
- **Done when:** `f` toggles auto-frame; transform respects mirroring.

## Phase E — Backgrounds, shapes & polish (steps 25–30)

### 25. Squircle shape — **~30 min**
- **What:** `border-radius: 38% / 34%` (or mask from `02-squircle-mask-black.png`);
  circle `O` overrides with `999px`.
- **Why:** The squircle reads as premium/branded vs a plain rectangle, and the
  `O` circle override gives a talking-head option without a second component.
  Asymmetric radii avoid the "lozenge" look. (File 05 §3.)
- **Done when:** default is squircle; `O` toggles a true circle.

### 26. Background plate — **~30 min**
- **What:** `cam-plate` sized `boxW + 2*platePad` (`platePad = round(boxW*0.07)`),
  behind the video, `z-index:1`, `pointer-events:none`.
- **Why:** A plate separates the camera from busy slides for contrast and brand
  framing. Sizing off `boxW` keeps the inset proportional at every size;
  `pointer-events:none` ensures it never steals drag/resize gestures. (File 05 §2, §5.)
- **Done when:** plate scales with the box; never intercepts pointer events.

### 27. Gold→ember rim + glow + drop shadow — **~40 min**
- **What:** Token-only (`--gold`/`--ember`/`--background`) rim matching
  `01-reference-frame-gold-rim.png`; add `plateVariant: none|neutral|gold`
  persisted in `riseup.webcam.plate`.
- **Why:** Token-only styling keeps the rim correct across all themes (raw hex
  would collapse on light themes per the capsule rule). The persisted variant lets
  presenters dial brand intensity. (File 05 §4.)
- **Done when:** rim matches the reference on dark + light themes; variant persists.

### 28. Shape pop animation — **~30 min**
- **What:** WAAPI on the clipping wrapper only (never remount the `<video>`); skip
  under reduced-motion.
- **Why:** Animating the wrapper (not the video) avoids tearing down the stream
  and re-flashing the camera light. WAAPI keeps it off the React render path.
  Reduced-motion gating is mandatory for accessibility. (File 02 §4.)
- **Done when:** shape changes pop smoothly; video never blanks; inert under
  reduced-motion.

### 29. Halo + reduced-motion + theme audit — **~40 min**
- **What:** `h` vignette; gate every animation behind `prefers-reduced-motion`;
  verify no inline hex; verify light-theme contrast (paper-ink).
- **Why:** This is the consolidation pass — proves every motion respects the OS
  setting and every color survives theme flips, closing the two highest-risk
  regression classes for this feature. (File 05 §7.)
- **Done when:** `h` toggles halo; audit finds zero inline hex; paper-ink passes
  contrast.

### 30. Tests + acceptance — **~50 min**
- **What:** Write the Vitest suite and run the acceptance checklist.
- **Why:** Locks the state machine, persistence, and shortcut guards against
  regression so future edits can't silently break presenter chrome. (File 07.)
- **Done when:** suite is green; every acceptance item checks out.

## Checkpoint — feature complete

**Done this batch:** steps 21–30 (rest of Phase C + Phases D & E).
**Phase D est.:** ~1 h 45 min · **Phase E est.:** ~3 h 40 min.

### Whole-feature roll-up
- **Phase A (1–8):** ~3 h 40 min
- **Phase B (9–16):** ~4 h
- **Phase C (17–21):** ~3 h
- **Phase D (22–24):** ~1 h 45 min
- **Phase E (25–30):** ~3 h 40 min
- **Total est.:** **~16 h** (≈ 2 focused days).

### Remaining items
**None — all 30 steps are now expanded** across files 08, 09, and 10. Next action
is execution: build steps 1→30 top-to-bottom, then run file 07's acceptance suite.
