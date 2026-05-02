---
name: step-timeline-v2
description: StepTimelineSlide v2.5 — autoplay OFF by default, icon-only Play/Pause, NO CSS transform:scale anywhere; depth reads through real font-size jumps + opacity ramp + pure-white active title. Step-first deck Next/Prev via tryAdvance, hover/active description side panel with hybrid spring motion, MP3 whoosh on active change.
type: feature
---

When the user says "**steps implementation**" or "step timeline v2" they
mean the upgraded `StepTimelineSlide`. Spec: `spec/slides/17-step-timeline-v2.md`.

## v2.5 — NO CSS SCALE rule (locked, v0.26.0)

The user explicitly forbids `transform: scale()` on this slide because it
blurs glyph anti-aliasing. Depth between steps is read through:

- **Font-size jumps** via CSS clamp tokens in `src/index.css :root`:
  - `--step-title-active`: `clamp(3rem, 5vw, 4.75rem)` — big, bright
  - `--step-title-adjacent`: `clamp(1.75rem, 2.4vw, 2.25rem)`
  - `--step-title-far`:     `clamp(1.25rem, 1.7vw, 1.625rem)`
- **Opacity ramp**: 1 / 0.55 / 0.30
- **Color**: active title forced to `hsl(0 0% 100%)` (pure white), inactive
  fade through `hsl(0 0% 100% / 0.75)` → `0.55`
- **Translate-only slide-in** for active text (`step-text-slide-in-left`
  is now translateX + opacity, NO blur).

Removed (do not bring back without explicit ask):
- `transform: scale(...)` on `.step-row[data-state="*"]`
- `--step-scale-active/-adjacent/-far` tokens
- `.step-row-pop-a/-b` classes + `@keyframes step-revolver-pop`
- The full progress-bar "banner" with the gold pill + filled bar.
  Replaced by a tiny `STEP NN / NN` counter beside the Play/Pause icon.

Header: `showBrandHeader: true` on 03-process so the Riseup logo + presenter
chip appear like every other slide. `brandStrip: false` removes the gold
strip banner the user dislikes.

## Behavioral rules (unchanged)

- Autoplay defaults **OFF**. 28×28 icon-only Play/Pause button. `aria-label`
  swaps "Play autoplay" / "Pause autoplay". `P` toggles.
- **Step-first Next/Prev**: `forwardRef<FocusTimelineHandle>` exposes
  `tryAdvance(dir)`. Returns `false` only at chain edges so the deck
  advances to a sibling. Pre-reveal `forward` snaps to step 0.
- Manual interaction (click + keyboard + tryAdvance) pushes a 6 s `pauseUntil`;
  hover does NOT.
- Description in a SINGLE right-side panel (NOT inline). Two-column grid.
- `hoveredIndex` overrides `active` for the side panel only — chip glow +
  connector still follow `active`.
- Subtitle now ONLY renders on the active row (cleaner inactive lines —
  inactive rows show eyebrow + title only).
- Sound: per-active whoosh trigger preserved (spec 21 + sound-system).

## Side panel (hybrid spring, v2.3 — unchanged)

- `<AnimatePresence mode="wait">` keyed by `hoveredIndex ?? active`.
- Enter `{opacity:0, x:-40, y:14, blur 6px}` → `{opacity:1, x:0, y:0, blur 0}`.
  Exit `{opacity:0, x:24, y:12, blur 4px}`.
- Y on Framer spring (stiffness 360, damping 26, mass 0.7); X / opacity / blur
  on `[0.22, 1, 0.36, 1]` ease (~0.42s).
- Inner stagger: eyebrow (0.05s) → 56×2 gold rule width 0→56 (0.12s) →
  description (0.18s) → capsule (0.26s).
- Sticky on `lg+` (`top-32`).

## Constants

`STEP_INTERVAL_MS=2200`, `PAUSE_MS=6000`, `REVEAL_BASE_DELAY=0.3`,
`REVEAL_STAGGER=0.18`.
