# 60 — ARR Breakdown (click-reveal)

**Type**: `CapsuleListSlide`
**Reached from**: ghost hotspot on slide 6 (ARR cell)

## Purpose
Hotspot-triggered click-reveal child. The ghost hotspot on slide 6 covers the
bottom-right metric cell (`x: 50%, y: 55%, w: 28%, h: 32%`) and routes to this
slide via `revealSlide: 60`. `parentSlide: 6` makes the controller's back arrow
return to /6 cleanly.

## Animation contract
- `transition: PushIn` — same depth pop as /50; consistent reveal language.
- `textAnimation: Stagger` — capsules fade in tier-by-tier, mirroring the
  way you'd narrate the breakdown.

## Speaker notes
Lead with strategy retainers (the biggest tier) and close on advisory (the
smallest, but the easiest on-ramp for someone hesitant to commit).
