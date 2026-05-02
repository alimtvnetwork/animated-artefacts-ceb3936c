# 02 — Pillars

**Type**: `CapsuleListSlide`

## Purpose
Three-pillar overview that **demonstrates both click-reveal modes in a single slide**:

| Capsule  | Mode                       | Behavior |
|----------|----------------------------|----------|
| Strategy | `revealSlide: 50`          | Navigate to slide 50 (parent: 2) |
| Data     | `expand: {…}`              | Inline expanding-card panel |
| Delivery | `expand: {…}`              | Inline expanding-card panel |

## Animation contract
- `transition: PushLeft` — punchy lateral entry from slide 1.
- `textAnimation: Stagger` — capsules fade up in sequence.
- `animations.capsules: "cinematicCapsules"` — blur→focus + spring overshoot.
- Strategy capsule shows the `↗` reveal icon + auto "Open" pill in the detail panel
  (per the v0.117 click-reveal contract).

## Speaker notes
Hover Strategy first to surface the verb ("Frame the bet"), then click — that
opens slide 50 inline. Back, then click Data to show the in-place expand. Both
patterns ship in the same component; only the JSON differs.
