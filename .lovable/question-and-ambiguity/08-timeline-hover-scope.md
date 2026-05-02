# Q08 — Timeline-style hover: per-step or generalized?

**Date:** 2026-04-28
**Task:** Implement a timeline-style hover where hovering step 2 highlights its connecting path and fades in the step label capsule.

## The ambiguity

User said "hovering **step 2**" — could mean:
1. Apply the behaviour ONLY to step 2 (literal reading).
2. Apply to every step; step 2 was just used as a concrete example.

## Inference applied

Chose **option 2: every step**. Reasons:
- Singling out step 2 with hover behaviour but not steps 1/3/4 would be incoherent visually and inaccessible.
- The phrase "timeline-style hover" describes a *pattern*, not a per-row override.
- Existing code already drives the right-panel `focusedIndex` from `hoveredIndex` for every step — extending the same hover signal to the connector + capsule keeps the system consistent.

## Implementation
- **Connector**: added a second `motion.div` rail in cream/55 with a soft glow that fills to `hoveredIndex` independently of `active`. Hidden when nothing is hovered or when hover === active (avoid double-paint). Uses the same height formula as the active rail.
- **Capsule**: wrapped `<Capsule>` in a `motion.span` that animates `opacity 0→1` + `y: 4→0` whenever `isActive || isHovered`. Always mounted to prevent layout shift. `data-capsule-state` exposes idle/hover/active for any future styling hooks.
- Both honour `useReducedMotion()` — they snap instead of animating when the user prefers less motion.

## File changed
- `src/slides/types/StepTimelineSlide.tsx` — added `isHovered` derivation, hover-rail motion.div, capsule motion.span wrapper.

## Reviewable later
If the user truly meant only step 2, the gating becomes `isHovered && i === 1`. Trivial change; flag for review at the end of the no-questions window.
