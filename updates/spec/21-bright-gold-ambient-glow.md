# 21 — Bright-gold ambient glow: +20% more golden

**Date:** 2026-05-16
**Scope:** `src/slides/themes.ts` (bright-gold `--gradient-noir`)

## Problem
On the `bright-gold` theme the radial top-glow read **brown/black**, not gold.
Root cause: the gradient hot spot was `hsl(40 40% 10%)` (low saturation, low
lightness) fading into pure noir `hsl(0 0% 5%)` — the saturated gold accents
in the foreground had no warm halo to sit on, so the background looked muddy.

## Change
Re-tuned `bright-gold` → `--gradient-noir` for **+20% more golden**:

| stop | before | after | delta |
|------|--------|-------|-------|
| 0%   | `hsl(40 40% 10%)` | `hsl(42 75% 14%)` | +35pp saturation, +4pp lightness, +2 hue toward gold |
| 60%  | `hsl(0 0% 5%)`    | `hsl(40 30% 6%)`  | +30pp saturation, +1pp lightness, gold hue (was hue-less) |

The surround keeps a faint warm tint instead of dropping to pure noir, so the
ambient field reads as a single gold glow rather than a brown blob on black.

## Acceptance
- `/1` on bright-gold: top-center glow visibly golden, not brown.
- Capsule contrast on `.capsule-gold` / `.capsule-ember` still passes.
- Other themes (noir-gold, vscode-dark, dracula, etc.) untouched.
- Per-deck theme persistence (`riseup.theme.byDeck.v1`) unaffected.

## Files
- `src/slides/themes.ts` — bright-gold `--gradient-noir` retuned.
