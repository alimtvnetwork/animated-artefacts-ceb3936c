# 28 · Per-step motion variant rotation (lift / slide / parallax)

**Date:** 2026-04-30
**Trigger:** User: "Increase animation variety across slide steps by alternating between lift, slide-in, and subtle 3D parallax effects per step change while keeping it consistent with reduced-motion settings."

## What shipped

- **`src/slides/utils/stepMotionVariant.ts`** — shared helper. Deterministic `index % 3` rotation over `['lift','slide','parallax']`. Random selection forbidden so re-renders + back-nav stay reproducible.
- **`src/index.css`** — three `@keyframes` (`step-row-lift-in`, `step-row-slide-in`, `step-row-parallax-in`) gated by `.step-row[data-motion-variant="…"][data-state="active"] .step-title`. Each variant overrides ONLY the active transform; font-size + color + opacity follow the existing shared transition list. `prefers-reduced-motion` block extended to `animation: none !important` on all three variants so reduced users see no motion.
- **`StepTimelineSlide.tsx`** (slide 3) — sets `data-motion-variant={stepMotionVariant(i)}` on each `.step-row`.
- **`StepsChain3DSlide.tsx`** (slide 4) — new WAAPI step-variant accent block fires on the becoming-active card BUTTON for **every cause** (click / keyboard / controller / programmatic), 320ms, layered on top of the existing click-variant flourish. Cleared on `.finished` so inline styles don't leak.
- **`.lovable/memory/design/step-row-motion-parity.md`** — new "Variants" section codifying the contract + wiring rules.

## Reduced motion

Single source of truth in the CSS reduced-motion block — `animation: none !important; transform: none !important` on all three `data-motion-variant` selectors, AND the slide-4 WAAPI accent gated by `if (… && !reduced)`.

## Why no question

No-questions mode (28/40). User explicitly named the three variants and asked for reduced-motion consistency — direct mapping.
