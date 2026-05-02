# 29 — Left TOC sidebar UX + global shortcut rebind + camera circle/fullscreen drama

**Logged:** 2026-05-02 · **Window 2 task:** 29 / 40

## Task context

Single user message bundling six interlocking changes:

1. Left slide TOC sidebar — `Esc` should close it; `Ctrl+1` should toggle it; remove the current `O` binding.
2. Hamburger menu inside the left TOC: collapse Overview, Presenter view, Top Talk Jumper toggle, Contrast debug, Reduced motion into a single dropdown. Talk Jumper should be **hidden by default** (it isn't currently).
3. New "Keyboard map" item in that dropdown + global `?` opens a shortcut popup; `Esc` closes it.
4. Webcam shortcut rebind: `O` = camera circle/round mask toggle; `P` = camera fullscreen; `[` = exit fullscreen back to previous size+position. Today: `i` show/hide, `m` minimize, `1` stage-fill, `Esc` exits stage/fullscreen.
5. `+` / `-` on camera should still resize (already done).
6. New cinematic transitions for `]` (close-square-bracket) on the camera: in fullscreen, `]` plays a 0.8 s squish-fade + bounce + whoosh and the camera disappears (off). Pressing `]` again pops it back at normal size with a bouncy fade-in. Pressing again expands to fullscreen with a bouncy zoom. Inspiration: 3D-steps bounce.

User explicitly said: *"First write the requirement, plain English, update the memory, update the previous spec."* So this turn is documentation-only.

## Specific questions

**Q1 — Sidebar toggle binding.** User said *"Control one should bring it back or hide it."* Did they mean **`Ctrl+1`** (modifier + digit) or the digit **`1`** alone? Today `1` is bound to webcam stage-fill. Inferred: **`Ctrl+1`** (so `1` stays free for the existing webcam behavior they have not asked to remove). Also bind on **macOS `⌘+1`** for parity.

**Q2 — Disposition of `O`.** They want `O` to mean "camera circle". Today `O` toggles the TOC sidebar. We free `O` (TOC moves to `Ctrl+1`) and assign to camera circle.

**Q3 — Disposition of `1` (stage-fill).** They didn't mention slide-stage-fill. Inferred: **keep `1` as stage-fill** (recently shipped, memory-pinned). If Q1 turns out to mean digit-`1`, this conflicts and stage-fill must move (proposed: `Shift+1`).

**Q4 — Camera "circle" semantics.** Inferred: a CSS `border-radius: 50%` mask on the on-surface video; aspect snaps to 1:1 (uses min(w,h)); persisted under `riseup.webcam.shape` (`'rect' | 'circle'`). Toggled by `O` and a new chrome button.

**Q5 — `]` cinematic transition in fullscreen.** User wants:
- 1st `]` (camera in fullscreen): squish-to-small + fade-out + whoosh, **0.8 s**, then camera goes to **off** (stream stopped).
- 2nd `]`: camera fades-in at last normal size+position with a 3D-steps-style bounce (no whoosh, or quieter whoosh — unclear).
- 3rd `]`: bouncy zoom into fullscreen.
Inferred state machine: `fullscreen → off (with squish whoosh)` → `off → on (bouncy fade-in)` → `on → fullscreen (bouncy zoom)`. Subsequent `]` cycles repeat from step 1. Whoosh sound only on the squish step. Reduced-motion collapses every variant to instant + no sound.

**Q6 — `[` vs `]`.** User mid-message says *"square bracket open to put it back to where it was from the full screen"* (so `[` = exit fullscreen → restore previous size+position, no animation drama). At the end of the message they describe the same dramatic cycle on **`]`** (close-square-bracket). Inferred: `[` = plain "exit camera fullscreen" (like Esc but camera-scoped); `]` = the dramatic 3-state cycle from Q5.

**Q7 — Where the dropdown lives.** Inferred: a hamburger button in the **header of the existing `SlideTocSidebar`** (top-right of the sidebar drawer), opening a Radix `DropdownMenu` containing the five items (Overview, Presenter, Top jumper, Contrast debug, Reduced motion, Keyboard map). The current full-row buttons in the bottom controller stay as-is — we don't remove them, we just **add** the consolidated menu inside the TOC.

**Q8 — Top Talk Jumper "hidden by default".** Today `topJumperHidden` defaults to `false` (visible). User wants the opposite. Inferred: change default to `true` (chip hidden) — existing users who explicitly set the localStorage key keep their choice.

**Q9 — Whoosh sound asset.** No asset path given. Inferred: reuse the existing 3D-steps whoosh if any; otherwise generate a tiny synth via Web Audio at runtime (no asset file). Will check `src/assets/` for existing whoosh first.

## Inferred decisions (all reversible)

- TOC: `Esc` closes when open; `Ctrl+1` / `⌘+1` toggles. Remove `O` binding from TOC.
- Hamburger in TOC header opens dropdown with: Overview, Presenter view, Top jumper toggle, Contrast debug, Reduced motion, **Keyboard map**.
- `?` opens KeyboardShortcutsDialog (Radix Dialog), `Esc` closes it.
- `O` → toggle camera circle shape (rect ↔ circle); persisted.
- `P` → enter camera fullscreen (calls existing `enterFullscreen`).
- `[` → exit camera fullscreen back to previous size+pos (calls `exitFullscreen`).
- `]` → cinematic cycle: `fullscreen→off` (0.8 s squish + whoosh + fade) → `off→on` (bouncy fade-in, ~0.45 s) → `on→fullscreen` (bouncy zoom, ~0.55 s).
- Top jumper default flipped to **hidden**.
- Stage-fill `1` shortcut **stays** (memory rule preserved).

## Impact

- Spec 64 gets a §15 (shortcut rebind + circle shape + cinematic `]`).
- Memory `mem://features/webcam-halo-and-stage` updated to reflect new shortcut surface.
- New memory `mem://features/keyboard-shortcuts-dialog` for the `?` panel.
- Memory `mem://features/toc-sidebar` for the hamburger + Ctrl+1 binding.
- No code touched this turn — user asked for spec/memory first.

## Suggested clarification on review

Confirm Q1 (`Ctrl+1` vs `1`), Q5/Q6 (`[` vs `]` semantics), Q9 (whoosh asset). If any are wrong, only the spec sections need updating before implementation.

## Timestamp
2026-05-02
