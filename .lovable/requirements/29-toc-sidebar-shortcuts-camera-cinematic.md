# Requirements — Left TOC sidebar UX, shortcut consolidation, camera circle + cinematic cycle

**Logged:** 2026-05-02 (Window 2 task 29 / 40)
**Source:** voice message bundling six asks. See ambiguity log
[`29-toc-sidebar-and-shortcut-rebind.md`](../question-and-ambiguity/29-toc-sidebar-and-shortcut-rebind.md).
**Spec changes:** appended §15 to `spec/21-slides-system/64-presenter-webcam.md`.

> This document is the **plain-English brief** the user explicitly asked
> for before any code changes. Every implementation detail here is
> mirrored in spec §15 + memory entries listed below. Read the spec for
> the authoritative contract; read this doc for the *why*.

## What the user wants, in plain English

### 1. Left slides panel (TOC sidebar) behaves like a real drawer
- Pressing **Esc** while the sidebar is open closes it. (Today there is
  no `Esc` handler, so the only way to close it is to click the X.)
- Pressing **`Ctrl+1`** (or **⌘+1** on macOS) toggles the sidebar open
  and closed. The current `O` binding moves off — `O` is reassigned to
  the camera (see §4).

### 2. Sidebar gets a hamburger menu
Inside the sidebar header, add a hamburger button that opens a dropdown
containing the presenter-cleanup affordances that today live scattered
across the bottom controller:
- Overview (G)
- Presenter view (opens new window)
- **Top Talk Jumper** — toggle visibility (and its default flips to
  *hidden*, since the user does not want it visible by default)
- Show contrast debug overlay
- Reduce motion
- **Keyboard map** — opens a popup listing every shortcut

The bottom controller keeps its existing buttons untouched. We are
**adding** a consolidated menu inside the sidebar, not removing
anything from the controller.

### 3. Global keyboard-map popup
- Pressing **`?`** anywhere opens a dialog listing every keyboard
  shortcut (deck nav, camera, sidebar, debug).
- Pressing **`Esc`** while the dialog is open closes it.

### 4. Camera shortcuts — three new bindings
| Key | New meaning |
|-----|-------------|
| **`O`** | Toggle the camera shape between rectangle and **circle**. In circle mode the box becomes a 1:1 square with a circular mask. |
| **`P`** | Enter camera fullscreen (same as clicking Expand). |
| **`[`** | Exit camera fullscreen back to the previous size + position. Plain, no animation. |
| **`]`** | Cinematic 3-state cycle (see §5). |
| `+` / `-` | Resize as today (already implemented). |

Existing camera shortcuts (`i m f h 1`) are unchanged.

### 5. The cinematic `]` cycle
Pressing `]` walks the camera through three states with deliberate,
high-drama motion. The cycle is determined by current phase, not a
counter, so it self-heals if you do other things between presses:

1. **In fullscreen → press `]`** → camera *squishes* down to nothing,
   fades out, with a **whoosh** sound, **0.8 seconds**, then the stream
   stops (camera turns off).
2. **Off → press `]`** → camera *bounces* back into view at its last
   normal size and position, fades in over ~0.45 s with a 3D-steps-style
   bounce. (Quieter whoosh-in.)
3. **On → press `]`** → camera *zooms* into fullscreen with a bouncy
   springy entrance over ~0.55 s. (Whoosh-zoom.)

Then the cycle starts over from step 1 on the next press.

### 6. Reduced motion respects the drama
If the OS or in-app reduce-motion toggle is on, the cycle still works
— but every animation collapses to instant and **no sound plays**. The
user-facing state machine is identical; only the show is muted.

## Why these specific keys?

- `Ctrl+1` for the sidebar leaves the bare `1` free for the existing
  webcam stage-fill (memory-pinned, recently shipped). If the user
  meant the digit `1` alone, we move stage-fill to `Shift+1`.
- `O` makes intuitive sense for "round/circle".
- `P` is a free letter near the camera cluster (`O` `P` `[` `]` form a
  natural row on QWERTY).
- `[` and `]` are right next to `P`, which keeps the whole camera
  surface on one keyboard region.
- `?` is the universal "help" key (used by GitHub, Linear, Vercel).

## What changes in code (next turn — not this turn)

This turn writes spec + memory only. The next turn will edit, in
roughly this order:

1. `src/slides/components/usePresenterWebcam.tsx` — add `shape`
   state, `toggleShape`, `cinematicCycle`, persisted `riseup.webcam.shape`.
2. `src/slides/components/PresenterWebcamOverlay.tsx` — render circle
   variant, new chrome button (Circle icon), bind `O`/`P`/`[`/`]`,
   wire the Web Audio whoosh.
3. `src/slides/controls/SlideTocSidebar.tsx` — hamburger header,
   dropdown menu, `Esc` handler.
4. `src/pages/SlideDeckPage.tsx` — replace `O` binding with `Ctrl+1`,
   add `?` handler, flip `topJumperHidden` default.
5. New `src/slides/controls/KeyboardShortcutsDialog.tsx`.
6. New tests: `src/test/presenterWebcamShapeAndCinematic.test.tsx`,
   `src/test/keyboardShortcutsDialog.test.tsx`.

## Open clarifications (will proceed with these inferences if no reply)

See ambiguity log Q1–Q9. The two that most affect behavior:

- **Q1 — `Ctrl+1` vs `1`** for the sidebar. Going with `Ctrl+1`.
- **Q5/Q6 — `[` vs `]` semantics.** Going with: `[` = quiet exit
  fullscreen, `]` = the dramatic cycle.
- **Q9 — Whoosh asset.** Synthesizing via Web Audio at runtime; no
  shipped audio file.

If any of these is wrong, only spec §15 + this doc need to change
before coding — no code is committed yet.
