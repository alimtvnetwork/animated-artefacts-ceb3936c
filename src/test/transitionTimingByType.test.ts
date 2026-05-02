/**
 * Tests for v0.168 — per-transition-type timing overrides at deck and
 * slide level (`transitionTimingByType[T]`).
 *
 * Resolver chain (per field, most-specific → least-specific):
 *   1. slide.content.transitionTiming.{field}                (per-slide all)
 *   2. slide.content.transitionTimingByType[T].{field}       (per-slide by type)
 *   3. deck.transitionTimingByType[T].{field}                (deck by type)      ← NEW
 *   4. deck.transitionTiming.{field}                         (deck all)
 *   5. Built-in SLIDE_TRANSITION_CONFIG (550ms, expoOut)
 *
 * Each layer can be undefined and is skipped via `??` in the field merge.
 * Authors target a specific transition family (e.g. "every PushIn slows
 * to 1.1s") without pinning timing on every slide.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveSlideTransitionConfig } from '@/slides/transitions';
import type { TransitionTimingSpec } from '@/slides/types';
import type { SlideTransitionValue } from '@/slides/enums';

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
});

const EXPO_OUT = [0.22, 1, 0.36, 1];
type ByType = Partial<Record<SlideTransitionValue, TransitionTimingSpec>>;

describe('resolveSlideTransitionConfig — deck.transitionTimingByType', () => {
  it('applies the by-type entry only when slide.transition matches its key', () => {
    const deckByType: ByType = { PushIn: { durationMs: 1100 } };

    // Active transition is PushIn → entry applies.
    const r1 = resolveSlideTransitionConfig(undefined, undefined, {
      transition: 'PushIn', deckByType,
    }) as unknown as { duration: number };
    expect(r1.duration).toBe(1.1);

    // Active transition is FadeIn → no matching entry, falls through to built-in.
    const r2 = resolveSlideTransitionConfig(undefined, undefined, {
      transition: 'FadeIn', deckByType,
    }) as unknown as { duration: number };
    expect(r2.duration).toBe(0.55);
  });

  it('wins over deck.transitionTiming for the matched transition only', () => {
    const deck: TransitionTimingSpec = { durationMs: 800 };
    const deckByType: ByType = { FadeIn: { durationMs: 250 } };

    // FadeIn → by-type wins (250ms).
    const r1 = resolveSlideTransitionConfig(undefined, deck, {
      transition: 'FadeIn', deckByType,
    }) as unknown as { duration: number };
    expect(r1.duration).toBe(0.25);

    // PushIn → no by-type entry, deck-wide default wins (800ms).
    const r2 = resolveSlideTransitionConfig(undefined, deck, {
      transition: 'PushIn', deckByType,
    }) as unknown as { duration: number };
    expect(r2.duration).toBe(0.8);
  });

  it('per-field merge: by-type easing + deck-wide duration', () => {
    const deck: TransitionTimingSpec = { durationMs: 700 };
    const deckByType: ByType = { PushIn: { easing: 'circOut' } };

    const r = resolveSlideTransitionConfig(undefined, deck, {
      transition: 'PushIn', deckByType,
    }) as unknown as { duration: number; ease: number[] };
    expect(r.duration).toBe(0.7);                      // from deck-wide
    expect(r.ease).toEqual([0, 0.55, 0.45, 1]);        // from by-type
  });
});

describe('resolveSlideTransitionConfig — slide.content.transitionTimingByType', () => {
  it('per-slide-by-type wins over deck-by-type for the matched transition', () => {
    const deckByType: ByType  = { PushIn: { durationMs: 900 } };
    const slideByType: ByType = { PushIn: { durationMs: 400 } };

    const r = resolveSlideTransitionConfig(undefined, undefined, {
      transition: 'PushIn', deckByType, slideByType,
    }) as unknown as { duration: number };
    expect(r.duration).toBe(0.4);
  });

  it('per-slide all-transitions still wins over per-slide-by-type', () => {
    const slideByType: ByType = { PushIn: { durationMs: 400 } };
    const slideAll: TransitionTimingSpec = { durationMs: 200 };

    const r = resolveSlideTransitionConfig(slideAll, undefined, {
      transition: 'PushIn', slideByType,
    }) as unknown as { duration: number };
    expect(r.duration).toBe(0.2);
  });
});

describe('resolveSlideTransitionConfig — full 5-layer precedence', () => {
  it('stacks all five layers field-by-field for the active transition', () => {
    const deck: TransitionTimingSpec       = { durationMs: 1000, delayMs: 500, easing: 'easeIn' };
    const deckByType: ByType               = { PushIn: { delayMs: 300 } };               // overrides deck delay only
    const slideByType: ByType              = { PushIn: { easing: 'circOut' } };          // overrides easing only
    const slide: TransitionTimingSpec      = { durationMs: 250 };                         // overrides duration only

    const r = resolveSlideTransitionConfig(slide, deck, {
      transition: 'PushIn', deckByType, slideByType,
    }) as unknown as { duration: number; delay: number; ease: number[] };

    expect(r.duration).toBe(0.25);                      // from per-slide all
    expect(r.delay).toBeCloseTo(0.3);                   // from deck-by-type
    expect(r.ease).toEqual([0, 0.55, 0.45, 1]);         // circOut, from per-slide-by-type
  });

  it('non-matching transition skips both *ByType layers entirely', () => {
    const deck: TransitionTimingSpec = { durationMs: 600 };
    const deckByType: ByType  = { PushIn: { durationMs: 1100 } };
    const slideByType: ByType = { PushIn: { durationMs: 200 } };

    // Active transition = SlideIn → both PushIn entries are ignored.
    const r = resolveSlideTransitionConfig(undefined, deck, {
      transition: 'SlideIn', deckByType, slideByType,
    }) as unknown as { duration: number; ease: number[] };
    expect(r.duration).toBe(0.6);
    expect(r.ease).toEqual(EXPO_OUT);
  });
});

describe('resolveSlideTransitionConfig — backward compatibility', () => {
  it('omitting `extras` keeps the legacy 2-level chain working unchanged', () => {
    const slide: TransitionTimingSpec = { durationMs: 300 };
    const deck:  TransitionTimingSpec = { easing: 'circOut' };

    const r = resolveSlideTransitionConfig(slide, deck) as unknown as { duration: number; ease: number[] };
    expect(r.duration).toBe(0.3);
    expect(r.ease).toEqual([0, 0.55, 0.45, 1]);
  });

  it('passing `extras.transition` without any *ByType maps is a no-op', () => {
    const r = resolveSlideTransitionConfig(undefined, { durationMs: 700 }, {
      transition: 'PushIn',
    }) as unknown as { duration: number };
    expect(r.duration).toBe(0.7);
  });
});

describe('resolveSlideTransitionConfig — reduced motion + by-type', () => {
  it('honors reduced-motion regardless of by-type overrides', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }));
    const deckByType: ByType = { PushIn: { durationMs: 1500 } };
    const r = resolveSlideTransitionConfig(undefined, undefined, {
      transition: 'PushIn', deckByType,
    }) as unknown as { duration: number; ease: string };
    // The reduced-motion safe-transition was raised from 0.01s to 0.15s in
    // response to `spec/22-slides-issues/23-motion-feels-robotic-under-reduced-motion.md`
    // — a 10ms (~0.6 frame) crossfade read as a robotic snap. 150ms is the
    // master rule in `motionPreferences.ts` (SAFE_TRANSITION). Linear easing
    // is preserved so no overshoot/spring re-introduces vestibular motion.
    expect(r.duration).toBe(0.15);
    expect(r.ease).toBe('linear');
  });
});
