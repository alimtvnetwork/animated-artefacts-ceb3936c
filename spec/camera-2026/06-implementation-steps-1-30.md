# 06 — Implementation Steps 1–30

> The canonical build order. A blind AI can follow these 30 steps top-to-bottom
> to ship the entire presenter camera.
> Each step lists **what**, **where**, and **done-when**. Code for each is in
> files 01–05; this is the spine that sequences them.
>
> **⚠️ SUPERSEDED (2026-06-02 v2):** steps 24–26's **plate/mask** work is
> obsolete. The squircle rim is now **CSS-only** — silhouette via
> `border-radius: 38% / 34%`, rim via a `2px` gold border + layered
> `box-shadow`, transparent interior, NO plate/mask PNG and NO `platePad`. The
> two-plate stack produced a rejected thick opaque ring. See file 05 §8 (v2).
> Read steps 24–26 as "give the squircle its CSS rim", not "render plates".

## Phase A — Skeleton & state (steps 1–8)

1. **Create the context module.** Add `src/slides/components/usePresenterWebcam.tsx`
   with `WebcamCtx`, `PresenterWebcamProvider`, and the `usePresenterWebcam()`
   hook (throws if used outside provider). *Done when:* importing the hook
   compiles. (File 01 §1, §10.)
2. **Define types & constants.** `WebcamPhase`, `SizeStep`, `SIZE_STEPS`,
   `STEP_ORDER`, `FREE_MIN_W/MAX_W`, `ASPECT_H_OVER_W`, `DEFAULT_POS`,
   `SizeConfig`, all storage keys. (File 01 §1–§2.)
3. **localStorage read/write helpers.** SSR-guarded, try/catch, default
   fallbacks: `readStoredPos/Size`, `writeStoredSize`, `clampFreeWidth`,
   `nearestStep`. *Done when:* unit-callable, no throw on corrupt JSON.
4. **State + persisted flags.** `state` (`off`), `position`, `sizeCfg`,
   `minimized`, `haloVisible`, `circleShape`, `cinematicExiting`, plus the refs
   (`fullscreenReturnPhaseRef`, `actionStackRef`, `navHandlersRef`,
   `stageRestoreRef`). (File 01 §6–§7.)
5. **`show()` / `getUserMedia`.** Reuse stream from tray/fullscreen; request with
   `{video:{ideal 1280×720, facingMode:'user'}, audio:false}`; map
   `NotAllowedError`/`NotFoundError` to friendly `denied` messages. (File 01 §4.)
6. **`hide()` vs `close()`.** `hide`→`tray` (stream alive); `close`→stop all
   tracks→`off`. Add `stopStream`, `toggle`, `toggleMinimized`, `clearMinimized`.
   (File 01 §5.)
7. **Size + position actions.** `setPosition` (clamped+persisted), `setSizeStep`,
   `growSize`, `shrinkSize`, `resizeFree`, derived `computedSize` memo. (File 01
   §8, §10.)
8. **Mount the provider.** Wrap the app in `<PresenterWebcamProvider>` in
   `src/App.tsx`. *Done when:* app renders, no context error.

## Phase B — The overlay view (steps 9–16)

9. **Create the overlay.** `src/slides/components/PresenterWebcamOverlay.tsx`;
   read context; early-return `null` for `off`/`requesting`/`denied`.
10. **Stream binding.** `attachStreamToVideo` + `bindFloatingVideo`/
    `bindFullscreenVideo` refs; re-bind effect; never exclusively move the
    stream. (File 02 §3.)
11. **The `on` card.** Draggable header, mirrored `<video objectFit:cover>`,
    bottom-right resize handle, chrome (zoom +/-, fullscreen, focus, minimize,
    X). (File 02 §1.)
12. **Drag math.** Pointer-capture + delta ÷ `--stage-scale` → `setPosition`.
    (File 02 §2.)
13. **Resize math.** Width-only drag, 16:9 derived, clamp `[160,960]`,
    `stopPropagation`. (File 02 §2.)
14. **Tray surface.** 40×40 ember-pulse icon at box top-right; hover fan =
    Expand / Fullscreen / Stop. (File 02 §5.)
15. **Fullscreen + stage surfaces.** Fixed/absolute layers with minimal chrome;
    honor circle/halo/plate flags.
16. **Mount the overlay.** Render `<PresenterWebcamOverlay/>` in
    `src/pages/SlideDeckPage.tsx`.

## Phase C — Shortcuts & nav (steps 17–21)

17. **Core keydown listener.** `i/m/f/+/-/Esc/h/1`, modifier + text-input
    guards. (File 03 §2.)
18. **v5 keys.** `O` circle, `P` enter-fullscreen, `[` exit, `]` cinematic cycle
    (`runCinematicCycle`, whoosh sound, 0.8s squish, reduced-motion instant).
    (File 01 §interface, File 03 §1.)
19. **Fullscreen nav passthrough.** Capture-phase listener dispatching
    `riseup:webcam-passthrough`; `__riseupWebcamLastAction` flag for back. (File
    02 §6.)
20. **Deck wiring.** In `SlideDeckPage`, `registerNavHandlers` + listen for
    `riseup:webcam-passthrough` → `goNext`/`goPrev`.
21. **Controller chip + dropdown + `/` dialog.** `PresenterWebcamButton`
    (squiggle, status icon/colors), dropdown items, shared `SHORTCUTS` rows.
    (File 03 §3–§5.)

## Phase D — Auto-frame (steps 22–24)

22. **Create `useAutoFrame`.** Feature-detect `FaceDetector`; persist enable
    flag. (File 04 §2, §5.)
23. **Detection loop.** Offscreen video + 320px canvas, 250ms tick, largest
    face, EMA α=0.18, zoom to 0.55 height ratio, ease-back on loss. (File 04 §4.)
24. **Wire `f` toggle + transform** onto the `<video>` (mirror-aware). (File 04 §1.)

## Phase E — Backgrounds, shapes & polish (steps 25–30)

25. **Squircle shape (v2).** Use `border-radius: 38% / 34%` for the squircle
    silhouette; circle `O` overrides with `50%`, minimized puck with `999px`.
    ~~Apply `02-squircle-mask-black.png` as `mask-image`~~ — **DROPPED in v2**: no
    PNG mask; the border-radius alone defines the curve so the rim border isn't
    clipped. (File 05 §8.)
26. ~~**Background shade stack.** Render TWO plates behind the video…~~
    **REMOVED in v2.** No plate, no `platePad`, no white/gold PNG behind the
    video. Instead the inner frame gets the entire rim in CSS: a `2px` gold
    border + layered `box-shadow` (ember edge + gold glow + drop shadow) over a
    **transparent** interior, so only the live video shows inside the curve. The
    old two-plate stack read as a thick opaque ring (rejected). (File 05 §8 v2.)
27. **Gold→ember rim + shadow look.** Match `01-reference-frame-gold-rim.png`
    using the stacked PNG shade assets plus tokenized frame border/glow
    (`--gold` / `--background`). `plateVariant: none|neutral|gold` remains
    optional future work; the shipped path is the white+gold two-layer stack.
    (File 05 §4, §8.)
28. **Shape pop animation.** WAAPI on the clipping wrapper only (never remount
    the `<video>`); skip under reduced-motion. (File 02 §4.)
29. **Halo + reduced-motion + theme audit.** `h` vignette; gate every animation
    behind `prefers-reduced-motion`; verify no inline hex; verify light-theme
    contrast (paper-ink). (File 05 §7.)
30. **Tests + acceptance.** Write the Vitest suite and run the acceptance
    checklist. (File 07.)

## Checkpoint protocol

Big work proceeds on user-issued `next` checkpoints. At the end of each phase
(A–E) list remaining steps and pause for `next`.

Continue to [`07-acceptance-checklist-and-tests.md`](./07-acceptance-checklist-and-tests.md).
