# 01 — Title

**Type**: `TitleSlide`
**Theme target**: `navy-blue`

## Purpose
Cold-open the navy-blue showcase. Establish brand (Riseup Asia LLC), version, and
confidentiality without saying anything yet — the ambient icon scatter does the
talking. White-on-navy headline + cyan/orange capsule pair are the navy-blue
theme's fingerprint.

## Animation contract
- `transition: FadeIn` — gentle entry, 1.0s.
- `textAnimation: Bounce` — title settles with a soft overshoot.
- `titleAmbient.glow: true` + `floatIndexes` on 6 icons → constant drift, GPU-cheap.
- Brand-accent icons (vscode/github/jetbrains/figma) keep their native colors so
  the navy bg reads as a stage, not a scrim.

## Speaker notes
Hold for 3 seconds before talking. The icons sell the data-deck positioning
before the first word.
