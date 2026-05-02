# 29 — Per-slide transition type selector

**Date:** 2026-04-30
**Mode:** No-questions (29/40)

## Request

> Implement a per-slide transition type selector (fade, slide-in, push, timeline)
> so I can choose the effect for each step or section easily.

## Ambiguities resolved without asking

1. **"Timeline" as a transition type.** The deck's `SlideTransition` enum has
   no `Timeline` variant — `FadeIn`, `SlideIn`, `PushIn`, `PushLeft`,
   `PushRight` are the only registered slide-to-slide transitions. The word
   "timeline" almost certainly refers to `StepTimelineSlide` / step animation
   variants, which are a different system (`stepMotionVariant` from task 28),
   not slide-level transitions. **Decision:** the dropdown exposes the five
   real `SlideTransition` variants under friendly labels (Fade, Slide in,
   Push in, Push left, Push right) and does **not** invent a phantom
   "Timeline" entry. If the user wants per-step variant selection on top of
   per-slide transition types, that's a separate UI surface.

2. **"Each step or section easily."** Two scopes already exist on the
   `TransitionInspector` (deck-wide and per-slide via pinned
   `scopeSlideNumber`). **Decision:** reuse the same scope toggle for the new
   type override — no new scope dimension. "Each section" maps to
   per-slide-pinned scope on a `SectionDividerSlide`.

3. **Where to surface the control.** A new top-level menu would duplicate
   existing chrome. **Decision:** place the `Transition type` dropdown inside
   the existing `TransitionInspector` (already keyboard-shortcut accessible
   via `Shift+I`, opens duration/easing tuning). The dropdown sits between
   the Scope block and the Phase tabs, so it inherits the same scope/persist
   semantics as duration & easing.

4. **"Authored" vs forcing a default.** Forcing FadeIn as the default would
   silently break authored decks the moment the inspector opened. **Decision:**
   the dropdown defaults to `Authored (use slide JSON)` (`transitionType: null`),
   and the resolver only swaps when the user picks a non-null value. `Reset`
   and `Clear` both restore authored behaviour.

## Implementation

- `src/slides/transitionOverride.ts` — added `TRANSITION_TYPE_NAMES`,
  `TransitionTypeName`, a `transitionType` field on `TransitionOverrideState`
  (defaulted to `null`, persisted alongside duration/easing), and a
  `transitionTypeOverride(slideNumber?)` reader that respects the existing
  `inScope()` rule.
- `src/slides/SlideStage.tsx` — calls `transitionTypeOverride(slide.slideNumber)`
  to compute `effectiveTransition = override ?? slide.transition`, feeds it
  to `getSlideVariants` AND to the `transition:` field on both
  `resolveSlideTransitionConfig` calls (enter + exit) so by-type timing maps
  still resolve correctly. Subscribes to `subscribeTransitionOverride` so
  flipping the dropdown re-renders immediately.
- `src/slides/controls/TransitionInspector.tsx` — added a new "Transition
  type" block with a labelled `<select>` (`Authored` + the five variants)
  and a Clear button when an override is active. Help-text mirrors the
  current scope so the user always knows whether the pick applies deck-wide
  or to the pinned slide. `resetTransitionOverrideState` already wipes to
  defaults, which now include `transitionType: null`, so Reset works
  unchanged.

## Files touched

- `src/slides/transitionOverride.ts`
- `src/slides/SlideStage.tsx`
- `src/slides/controls/TransitionInspector.tsx`
- `.lovable/question-and-ambiguity/29-per-slide-transition-type-selector.md`
- `.lovable/question-and-ambiguity/task-counter.md`
