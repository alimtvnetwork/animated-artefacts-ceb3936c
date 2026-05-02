---
name: transition-timing-by-type
description: Per-transition-type timing override (`transitionTimingByType[T]`) at deck and slide level; slots between deck-default and per-slide in the resolver chain.
type: feature
---

## What
v0.168 added an optional JSON field `transitionTimingByType` that pins
duration / delay / easing for a SPECIFIC transition family (`FadeIn`,
`SlideIn`, `PushIn`, `PushLeft`, `PushRight`) without touching slides that
use other transitions. Lives at both deck and slide level.

## Schema
```ts
transitionTimingByType?: Partial<Record<SlideTransitionValue, TransitionTimingSpec>>;
```
- Available on `DeckSpec` and `SlideContent`.
- Each entry is the same `TransitionTimingSpec` (`durationMs?`, `delayMs?`, `easing?`).
- Only the entry whose key matches `slide.transition` is consulted at render time.

## Precedence (per field, most-specific → least-specific)
1. `slide.content.transitionTiming.{field}`               (per-slide, all transitions)
2. `slide.content.transitionTimingByType[T].{field}`      (per-slide, this transition)
3. `deck.transitionTimingByType[T].{field}`               (deck, this transition)         ← NEW
4. `deck.transitionTiming.{field}`                        (deck-wide)
5. Built-in `SLIDE_TRANSITION_CONFIG` (550ms, expoOut, no delay)

(The Settings-page user override from v0.167 is merged into deck-default
in `mergeDeckTiming()` BEFORE this resolver runs, so it sits at level 4
alongside the deck JSON default.)

## Resolver API
`resolveSlideTransitionConfig(override?, deckDefault?, extras?)` accepts an
optional `extras` object:
```ts
interface ResolveTransitionExtras {
  transition?: SlideTransitionValue;
  slideByType?: Partial<Record<SlideTransitionValue, TransitionTimingSpec>>;
  deckByType?:  Partial<Record<SlideTransitionValue, TransitionTimingSpec>>;
}
```
Old call sites (no `extras`) keep the legacy 2-level chain — backward compatible.

## Wiring
- `SlideStage` accepts `deckTransitionTimingByType` and forwards both maps + `slide.transition` to the resolver.
- `SlideDeckPage` passes `deck.transitionTimingByType` straight through.
- `HandoutPage` skips it (handouts disable animations entirely).

## Tests
- `src/test/transitionTimingByType.test.ts` — 10 tests covering: by-type matches by transition key, deck-by-type beats deck-wide, per-slide-by-type beats deck-by-type, per-slide all beats per-slide-by-type, full 5-layer field-by-field stacking, non-matching transition skips both *ByType layers, backward compat (no `extras`), and reduced-motion still wins.

## Files
- `src/slides/types.ts` — added `transitionTimingByType` to `SlideContent` and `DeckSpec`.
- `src/slides/transitions.ts` — extended resolver with `extras` parameter.
- `src/slides/SlideStage.tsx` — new `deckTransitionTimingByType` prop, forwards both maps + active transition.
- `src/pages/SlideDeckPage.tsx` — passes `deck.transitionTimingByType`.
- `src/pages/HandoutPage.tsx` — comment noting intentional omission.
- `spec/slides/58-transition-timing-by-type.md` — author-facing spec with example.
