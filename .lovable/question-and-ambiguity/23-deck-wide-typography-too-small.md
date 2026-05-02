# 23 — Deck-wide typography too small after FitStage

**Date:** 2026-04-30
**Trigger:** User reported all slide typography (not just slide 4) reading too small in the preview after the slide-4-only bump in entry #22.
**Directive:** "Increase 15–20% (steps 30%) using font-size percentage values, not CSS transform scaling."

## Root cause (extending entry #22 deck-wide)

`FitStage` letterboxes a fixed 1920×1080 design canvas into the viewport with `transform: scale(<scale>)`. On the user's 999×581 viewport that resolves to ~0.51× scale. Every authored size — semantic clamps (`.slide-title-display`, `.slide-title-content`, `.slide-eyebrow`, `.slide-subtitle`), step-title clamps, and Tailwind `text-*` utilities used inside slide components — gets uniformly shrunk by that factor on screen.

Entry #22 fixed only `StepsChain3DSlide.tsx` (slide 4). All other slide types (TitleSlide, KeywordSlide, CapsuleListSlide, StepTimelineSlide, ImageSlide, etc.) still authored against the 1920 canvas and kept reading small.

## Resolution — honest font-size growth (no transforms)

Three coordinated changes in `src/index.css`, all `font-size` values:

1. **Semantic typography clamps +18%** (titles/subtitles) and **+20%** (eyebrow):
   - `.slide-title-display`: `clamp(2.5,6vw,6rem)` → `clamp(2.95,7.08vw,7.08rem)`
   - `.slide-title-content`: `clamp(2.4,5vw,4.5rem)` → `clamp(2.83,5.9vw,5.31rem)`
   - `.slide-subtitle`: `clamp(1,1.6vw,1.5rem)` → `clamp(1.18,1.89vw,1.77rem)`
   - `.slide-eyebrow`: `0.9rem` → `1.08rem`

2. **Step-title clamps +30%** (per "steps 30% bigger"):
   - `--step-title-active`: `clamp(2.25,4.2vw,3.75rem)` → `clamp(2.93,5.46vw,4.88rem)`
   - `--step-title-adjacent`: `clamp(1.5,2.2vw,2rem)` → `clamp(1.95,2.86vw,2.6rem)`
   - `--step-title-far`: `clamp(1.125,1.6vw,1.5rem)` → `clamp(1.46,2.08vw,1.95rem)`
   - Fullscreen variant: `clamp(2.5,4.6vw,4.5rem)` → `clamp(3.25,5.98vw,5.85rem)`

3. **Tailwind `text-*` utilities scoped under `[data-fit-stage="true"]` +18%** — overrides every Tailwind text size (text-xs through text-9xl) with explicit `font-size` declarations. Scoped to the FitStage subtree so the controller and any non-stage UI keep their original sizes.

## Why this approach

- **No CSS transforms** — only `font-size` declarations. Glyphs render at their true rasterized size for the post-FitStage scale; no sub-pixel anti-aliasing blur.
- **Single source of truth** — semantic classes drive most slide titles already; the Tailwind override layer catches the long tail (capsules, body, helper labels) without touching 17 slide-type components.
- **Reversible** — one CSS file, clear v0.220 markers; can retune the multiplier (1.18 / 1.30) in one place.
- **Scoped** — `[data-fit-stage="true"]` selector means the controller pill, settings panel, and any future non-stage chrome are unaffected.

## Prevention rule (added to memory)

See `.lovable/memory/design/fitstage-type-headroom.md` (extended). New rule: any deck-wide type adjustment must edit the global semantic classes and the `[data-fit-stage="true"]` Tailwind override block in `src/index.css` — never per-slide and never via `transform: scale`.

## Files changed

- `src/index.css` — semantic clamps, step-title clamps, fullscreen variant, new `[data-fit-stage="true"]` override block.

