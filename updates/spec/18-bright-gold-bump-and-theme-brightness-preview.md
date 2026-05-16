# 18 — Bright-gold bump + theme brightness preview + live gold HSL readout

**Date:** 2026-05-16
**Scope:** `src/slides/themes.ts`, `src/slides/controls/ThemeMenu.tsx`, `src/index.css`

## Change
- Brightened the `bright-gold` theme's `--gold` and `--gold-glow` by ~15% (lightness bump on the HSL triplet). Capsules/rings/glows in `src/index.css` were re-tuned so the brighter gold still has clean contrast on the `#0D0D0D` noir background.
- Added a **brightness preview slider** to `ThemeMenu` so the user can fine-tune `--gold` lightness in a ±15% range before saving. `brightnessDraft` writes a transient `--gold` / `--gold-glow` to `document.documentElement`; Save persists, Cancel reverts.
- Added a **live HSL readout** in the ThemeMenu brightness panel: a `useEffect` reads `--gold` and `--gold-glow` from `getComputedStyle(document.documentElement)` via `requestAnimationFrame`, re-runs on `brightnessDraft` / `brightnessSaved` / `active` changes, and renders a 2-column swatch+HSL grid using chrome tokens.

## Acceptance
- `/1` controller → palette → bright-gold → brightness slider visibly shifts gold accents in real time, HSL readout updates.
- Capsules (`.capsule-gold`, `.capsule-ember`) still pass contrast on `#0D0D0D`.
- Re-opening the deck restores the per-deck pinned theme (existing per-deck persistence).

## Files
- `src/slides/themes.ts` — bright-gold lightness +15% on `--gold` / `--gold-glow`.
- `src/slides/controls/ThemeMenu.tsx` — brightness slider + Save/Cancel + live HSL readout.
- `src/index.css` — capsule/ring/glow tuning for the brighter gold.
