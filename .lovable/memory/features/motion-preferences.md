---
name: motion-preferences
description: Reduced-motion contract — variants/transitions flatten to a 150 ms opacity cross-fade at the JS layer (Framer) to match spec 13 §5, preserving authored variety while honoring OS preference.
type: feature
---
Spec 27 (this milestone). Single source of truth: `src/slides/motionPreferences.ts` exports `prefersReducedMotion()`, `flattenVariants()`, `flattenTransition()`. Resolvers in `transitions.ts` (`getSlideVariants`, `resolveSlideTransitionConfig`) and `textAnimations.ts` (`resolvePreset`, `getContainerVariants`) call these helpers automatically.

Rules:
- Authors keep choosing varied per-slide animations (FadeIn/SlideIn/PushIn/PushLeft/PushRight + per-block bounce/slideUp/cinematicCapsules/titleSlide). No per-slide opt-out is required.
- Under `prefers-reduced-motion: reduce`, transforms (x/y/z, rotate, scale, skew, filter/blur) are STRIPPED at the read site and any spring/long tween collapses to `{ duration: 0.15, ease: 'linear' }` — the 150 ms ceiling defined in `spec/slides/llm/13-motion-system.md` §5 and `spec/slides/42-steps-motion.md` §5.
- Opacity is PRESERVED so the audience still gets a clear "slide changed" cue. 150 ms is long enough to read as a real cross-fade and short enough to fall well below any vestibular threshold.
- Delay is preserved (clamped to ≤50ms) so staggered choreography keeps source order; `staggerChildren` clamps to 30 ms so a row of children cascades visibly across the 150 ms window.
- JSON-authored `transitionTiming.durationMs` (e.g. 1200ms back-overshoot) is also clamped under reduced-motion to 150 ms — this was the gap before v0.118.
- Pure functions, never mutate the frozen `TEXT_ANIMATION_PRESETS` literals.
- Historical note: an earlier 10 ms (`0.01s`) safe duration made the deck feel robotic under Reduce Motion — see `spec/issues/23-motion-feels-robotic-under-reduced-motion.md`.

CSS-only effects (ambient floats, hover lifts, lattice glow) continue to be handled by the existing `@media (prefers-reduced-motion: reduce)` rule in `src/index.css` — both layers stay in sync because both honor the same OS query.

Tests: `src/test/motionPreferences.test.ts` covers both modes for slide variants, presets, container stagger, and per-slide timing overrides. The 150 ms safe duration is referenced as a single `SAFE_RM_DURATION` constant so tests track the spec, not the implementation.
