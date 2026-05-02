# 42 — Number Callout (sample)

**Type:** `NumberCalloutSlide`
**Seq:** 42
**Narrow idea:** 92% of users return in week one.

## Why it is narrow
Exactly one number. No comparison, no trend line, no benchmark. A second metric would require a `MetricGridSlide` or a follow-up slide.

## Capsules
One: `gold` cohort tag (`Cohort · Apr 2026`) — provenance, not content.

## Animation
- Number: count-up `0 → 92`, easing `easeOutQuint`, duration `--dur-count-slow` (1800ms).
- Transition: `PushIn` (the number arrives with weight).
- Text animation: `FadeIn` for label + capsule.
- Reduced motion: snap to `92%`, no count-up.

## Image refs
None.

## Spec source
- `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md` §2.3
