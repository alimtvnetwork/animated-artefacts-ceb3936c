---
name: Reduced motion in-app toggle
description: WCAG 2.3.3 / 2.2.2 in-app override — chrome button + ?reduceMotion=1 + localStorage flip <html data-reduce-motion="true">; both JS (motionPreferences.prefersReducedMotion) and CSS (six :root[data-reduce-motion="true"] mirror blocks) honor it. Never duplicate — extend the existing reducedMotionToggle module.
type: feature
---
The deck has THREE motion-flatten triggers that all funnel through `<html>` attributes:

| Trigger | Attribute | Source |
|---|---|---|
| Export / handout | `data-export-mode="true"` | HandoutPage on mount |
| Pixel-snap preview | `data-pixel-snap="true"` | preview alignment overlay |
| **In-app reduced-motion** | `data-reduce-motion="true"` | `src/slides/components/reducedMotionToggle.ts` |

All three are read by `prefersReducedMotion()` in `src/slides/motionPreferences.ts`, which feeds Framer's `flattenVariants` / `flattenTransition`. Pure-CSS animations are flattened by:
- `@media (prefers-reduced-motion: reduce)` — OS pref
- `:root[data-reduce-motion="true"]` — in-app pref (six companion blocks in `src/index.css`, one per existing `@media` block)

When adding new CSS animations that should honor reduced-motion, add BOTH the @media rule AND a `:root[data-reduce-motion="true"]` mirror — never just the @media.

Chrome button lives next to `ContrastDebugToggleButton` in `ControllerBar.tsx`. Icon: `Wind` (lucide). Module API: `setReduceMotion(bool)`, `toggleReduceMotion()`, `isReduceMotionEnabled()`, `useReduceMotion()` hook.

Tests: `src/test/reducedMotionToggle.test.ts` (6 tests).
