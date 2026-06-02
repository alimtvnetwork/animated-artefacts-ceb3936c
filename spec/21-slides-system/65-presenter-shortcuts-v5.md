# Presenter shortcuts — v5 (2026-05-02)

Plain-English requirements captured from the user. Supersedes scattered notes
in earlier specs. Source of truth for the `SHORTCUTS` table in
`src/slides/controls/KeyboardShortcutsDialog.tsx`.

## 1. TOC sidebar (left slide outline)

- **Open / close**: `Ctrl+1` (Windows/Linux) or `⌘+1` (macOS) toggles it.
- **Close also via `Escape`**: when the sidebar is open, `Esc` closes it
  before any other Esc behaviour (fullscreen exit, jump-buffer cancel, etc.).
- No other shortcut may open or close the sidebar. The previously-defined
  `O` binding has been retired (now used for the webcam circle toggle).
- The sidebar is **pure outline + search**. The hamburger / dropdown menu
  lives in the bottom-right **controller pill**, not in the sidebar.

## 2. Controller hamburger (bottom-right pill)

The hamburger dropdown is the single home for presenter affordances that
used to clutter the controller as standalone chips. Items:

- Overview (`G`)
- Presenter view
- Top Talk Jumper (`J`) — hidden by default, surfaced through this menu
- Reveal hints
- Contrast debug
- Reduce motion
- Keyboard map (opens the shortcuts dialog; also bound to `?`)

## 3. Keyboard shortcuts dialog

- `?` (Shift+/) opens the dialog from anywhere outside form fields.
- `Esc` closes it (Radix Dialog default).
- The dialog is rendered inside `ControllerBar` so the hamburger entry and
  the global `?` listener share state.

## 4. Presenter webcam shortcuts

| Key | Action |
| --- | --- |
| `Shift+I` | Show / hide camera (interactive mode toggle) |
| `Shift+M` | Minimize / restore the camera puck |
| `+` / `-` | Resize the camera (only when on) |
| `H` | Toggle soft halo (default OFF) |
| `1` | Stage-fill — cover the slide stage |
| `O` | Cycle frame shaping: rectangle → circle → circle + glow overlay → rectangle (only when camera on/fullscreen/stage) |
| `P` | Enter webcam fullscreen |
| `[` | Exit fullscreen plain (back to prior size+position) |
| `]` | Cinematic 3-state cycle (see below) |
| `Esc` | Exit fullscreen / stage / dialog |

### Cinematic `]` cycle

Three press states, advancing on each `]` press:

1. **`fullscreen` → `off`** — squish + whoosh over **0.8 s**: the
   fullscreen wrapper scales down to ~0.6, fades to 0, slight rotate; a
   `whoosh` sound plays once (fade_swoosh_v3.mp3).
2. **`off` → `on`** — bouncy fade-in: `show()` is called, the floating
   camera box appears with the existing webcam appear animation
   (bouncy spring, ~280 ms).
3. **`on` → `fullscreen`** — bouncy zoom-in: `enterFullscreen()` runs and
   the fullscreen wrapper scales up from ~0.85 with an overshoot spring.

`prefers-reduced-motion: reduce` collapses every step to instant and
**skips the whoosh sound entirely**. No partial states — either the user
opted into motion (full cinematic) or not (instant + silent).

The cycle is implemented as `usePresenterWebcam.runCinematicCycle()` so
both the keyboard handler and any future UI button share the same path.
A transient flag `cinematicExiting: boolean` is exposed on the context;
the overlay reads it to apply the squish CSS during step 1.

### Frame shaping `O` cycle (v6, 2026-06-02)

`O` is a **3-state shaping cycle** rather than a plain circle/rectangle
toggle. Each press advances:

1. **Rectangle** — `circleShape = false`, `haloVisible = false`.
2. **Circle** — `circleShape = true`, `haloVisible = false`.
3. **Circle + glow overlay** — `circleShape = true`, `haloVisible = true`.
   The third press lights up the glow halo overlay (the "shaping" the
   presenter expects).
4. A fourth press wraps back to **Rectangle** (both flags off).

Only active while the camera phase is `on`, `fullscreen`, or `stage`
(no-op otherwise so it never surprises the presenter or prompts the
camera). Implemented as `usePresenterWebcam.cycleShapeOverlay()`; both
the `O` keyboard handler and the overlay's shape chrome button share
this path. Both flags persist via the existing `riseup.webcam.circle`
and `riseup.webcam.halo` localStorage keys. `H` still independently
toggles the halo.

