# Subsystem: animation-system

## Spec Statement
5 transitions (FadeIn, SlideIn, PushIn, PushLeft, PushRight), 4 text animations (FadeIn, Bounce, SlideUp, Stagger), 3 step motion variants (lift, slide, parallax). Resolver chain: slide.transitionTiming → slide.transitionTimingByType → deck.transitionTimingByType → deck.transitionTiming → preset (550ms expoOut). Addendum 29 adds `CountUp` easing union (linear / easeOutQuint / spring) + `--dur-count-fast` (900ms) / `--dur-count-slow` (1800ms) tokens. Variety required across decks. Reduced motion collapses every variant to a 150ms opacity fade.

## Implementation State
`transitions.ts`, `transitionPresets.ts`, `transitionOverride.ts`, `textAnimations.ts`, `motionPreferences.ts`, `motionCollisions.ts`. Tests: `motionPreferences.test.ts`, `motionCollisions.test.ts`, `textAnimationOverrides.test.ts`, `transitionTimingByType.test.ts`, `deckTransitionTiming.test.ts`, `stepRevealOrder.test.ts`. Step variants (#28) wired through `data-motion-variant`. Per-slide transition-type override (#29) shipped.

## Gap
- No `useCountUp` hook, no count-up easings, no `--dur-count-*` tokens in `index.css`.
- Variety enforcement is by convention (no lint).

## Severity
**Major** (count-up is the missing piece for `NumberCalloutSlide`).

## Evidence
- spec: `spec/21-slides-system/llm/CATALOG.json`, `29-narrow-idea-and-new-slide-types.md` §2.3
- impl: `src/slides/transitions.ts`, `src/slides/textAnimations.ts`, `src/slides/motionPreferences.ts`
- test: `src/test/motion*.test.ts`, `src/test/transitionTimingByType.test.ts`

## Remediation
1. Add `--dur-count-fast/slow` to `:root` and `[data-reduced-motion='true']` (snap = 0).
2. Implement `useCountUp({from, to, duration, easing})` with `prefers-reduced-motion` early-snap.
3. Add `motionVarietyAudit.ts` script (optional, advisory).
