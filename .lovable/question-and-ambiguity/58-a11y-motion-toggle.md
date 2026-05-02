# 58 — a11y motion-toggle (Window 2 / task 22)

**Date:** 2026-05-01
**Trigger:** `next a11y motion-toggle` — UI-level reduced-motion switch (WCAG 2.3.3 + 2.2.2).

## What I shipped

Three-layer override that lets users on locked devices opt into reduced motion without OS-level access:

1. **`src/slides/components/reducedMotionToggle.ts`** — pub/sub module mirroring the `ColorTokenDebugOverlay` pattern. Persists to `localStorage` (`riseup.reduceMotion`), mirrors onto the URL (`?reduceMotion=1`), and writes `<html data-reduce-motion="true">` on init + every change. Exposes `setReduceMotion`, `toggleReduceMotion`, `isReduceMotionEnabled`, `useReduceMotion`, `_resetReduceMotionForTests`.

2. **JS gate (`src/slides/motionPreferences.ts`)** — added a third `<html>` attribute check to `prefersReducedMotion()` alongside the existing `data-export-mode` / `data-pixel-snap` triggers. All three now funnel into the same `flattenVariants` / `flattenTransition` path.

3. **CSS gate (`src/index.css`)** — added a `:root[data-reduce-motion="true"]` companion block alongside each of the six existing `@media (prefers-reduced-motion: reduce)` rules:
   - ambient-float + count-up tokens (line 371)
   - equation-term cascade (line 425)
   - checklist-row chevron + transition (line 545)
   - step-row depth/swipe/variant entrance animations (line 1467)
   - the universal `*, *::before, *::after` clamp + opacity-only carve-outs (line 1587)
   - presenter-cam squiggle (line 2240)

4. **Chrome button** — `ReduceMotionToggleButton` in `ControllerBar.tsx`, sits next to `ContrastDebugToggleButton`. Wind icon, gold ring when active, `aria-pressed` + descriptive `aria-label`. Lucide per-icon plugin (#48) tree-shakes the new `Wind` import.

## Tests

- `src/test/reducedMotionToggle.test.ts` — 6 new tests covering: initial off state, set/clear toggling the html attribute, `prefersReducedMotion()` flipping in lockstep, toggle parity, localStorage persistence, URL mirroring.
- All pass: **18/18 ✓** for the (toggle + motionPreferences) pair.

## Pre-existing failures (not caused by this change)

Full suite reveals two failures that exist on master and are unrelated:
- `transitionTimingByType.test.ts > honors reduced-motion regardless of by-type overrides` — asserts `r.duration === 0.01` but the codebase migrated to `0.15` per `spec/issues/23-motion-feels-robotic-under-reduced-motion.md`. Test drift.
- `brandChromeInheritance.test.ts > default settings stamp the historical 218px sweet-spot` — receives `max(48px, 196px)`. Tokenization drift.

Both are tracked elsewhere; my change does not touch the surfaces they cover.

## Ambiguity

None — WCAG 2.3.3 explicitly calls for an interaction-trigger disable mechanism, and the deck already had matching JS/CSS gates for export and pixel-snap modes. Adding a third gate alongside them was the obvious shape.
