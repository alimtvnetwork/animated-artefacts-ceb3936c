---
name: layout-knobs
description: JSON-authored layout/timing knobs for full reproducibility — content.transitionTiming (slide-level), content.capsuleLayout (CapsuleListSlide), content.metricLayout (MetricGridSlide), plus backfilled Step fields (topOffsetPx, enter, exit, cta) and content.stepTiming in slide.schema.json.
type: feature
---

## What
v0.114 added optional JSON knobs so animations and spacing reproduce 1:1 across renderers.

## New fields
- `content.transitionTiming` — `{ durationMs?, delayMs?, easing? }`. Overrides the deck-wide `SLIDE_TRANSITION_CONFIG` (550ms, expo-out). Easing accepts named keys (`expoOut`, `backOut`, etc.) or a 4-tuple cubic-bezier. Resolved by `resolveSlideTransitionConfig()` in `src/slides/transitions.ts`.
- `content.capsuleLayout` — `{ columns?, gapPx?, align? }`. When `columns` is set, the row uses CSS grid; otherwise legacy `flex-wrap`. Default gap 16px, align `start`.
- `content.metricLayout` — `{ columns?, rows?, gapXPx?, gapYPx?, valueSize? }`. Overrides the auto-derived MetricGrid layout. Default gaps 48/56px, value `clamp(4rem, 9vw, 9rem)`.

## Backfilled in slide.schema.json (already in TS types)
- `Step.topOffsetPx` (-160..160), `Step.enter`/`Step.exit` (`{durationMs, delayMs, easing}`), `Step.cta` (`{text, href?, revealSlide?, variant?}`).
- `content.stepTiming` — string preset OR `{ preset?, enter?, exit? }`.

## Defaults
All fields optional; existing slides keep working unchanged. Validators do not require them.

## Files
- Types: `src/slides/types.ts` (`TransitionTimingSpec`, `CapsuleLayoutSpec`, `MetricGridLayoutSpec`).
- Resolver: `src/slides/transitions.ts` (`resolveSlideTransitionConfig`, `NAMED_EASINGS`).
- Renderers: `src/slides/SlideStage.tsx`, `src/slides/types/CapsuleListSlide.tsx`, `src/slides/types/MetricGridSlide.tsx`.
- Schema: `spec/slides/slide.schema.json` (definitions inlined to avoid Ajv discriminator + nested `$ref` issues).
