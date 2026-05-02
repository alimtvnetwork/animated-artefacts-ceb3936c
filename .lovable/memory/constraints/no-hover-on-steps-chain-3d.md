---
name: no-hover-on-steps-chain-3d
description: StepsChain3DSlide (slide 4) is click-only. Never add ANY hover effect to step cards — no glow ring, no marker brightening, no lift, no brightness/filter change. Cursor:pointer is the only allowed hover affordance. The click activation animation IS the feedback.
type: constraint
---

# No hover effects on StepsChain3D step cards

The user has rejected hover effects on slide 4 step cards multiple times.

**Forbidden on `.chain3d-card` / `.chain3d-card-visual` / `.chain3d-marker`:**
- `:hover` glow / box-shadow ring
- `:hover` translateZ / translateY lift
- `:hover` brightness / filter change
- `:hover` marker scale or opacity change
- Any JS-driven `hoveredCard` / `onMouseEnter` highlight state

**Allowed:**
- `cursor: pointer` on the card
- Native focus ring on keyboard focus
- The click-driven bouncy zoom / revolver activation animation

**Why:** User explicitly said "There is no need to have hover effect or
anything. Once the click happens, it will do the animation. That's it."
Re-introducing hover triggers an immediate correction.

**Specs:** `spec/21-slides-system/61-steps-chain-3d.md` §Navigation contract,
`front-end/project/showcase/spec/04-process-3d.md` §Interaction.
