/**
 * Tests for v0.147 — deck-level `transitionTiming` default merged into
 * `resolveSlideTransitionConfig()`.
 *
 * Contract:
 *   1. No deck, no slide override → built-in default (550ms, expoOut tuple).
 *   2. Deck-only override → applied to every field it sets.
 *   3. Slide override always wins over deck override, FIELD BY FIELD —
 *      a slide that only pins `easing` still picks up deck `durationMs`.
 *   4. Named easings resolve consistently from both sources.
 *   5. Invalid easings fall through to the next level in the chain.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveSlideTransitionConfig } from '@/slides/transitions';
import type { TransitionTimingSpec } from '@/slides/types';

// Force prefersReducedMotion → false so we test the timing chain itself.
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
});

const EXPO_OUT = [0.22, 1, 0.36, 1];

describe('resolveSlideTransitionConfig — built-in default', () => {
  it('falls back to 0.55s expoOut when nothing is provided', () => {
    const r = resolveSlideTransitionConfig() as unknown as { duration: number; ease: number[] };
    expect(r.duration).toBe(0.55);
    expect(r.ease).toEqual(EXPO_OUT);
  });
});

describe('resolveSlideTransitionConfig — deck default', () => {
  it('applies deck-level durationMs when slide is silent', () => {
    const deck: TransitionTimingSpec = { durationMs: 800 };
    const r = resolveSlideTransitionConfig(undefined, deck) as unknown as { duration: number; ease: number[] };
    expect(r.duration).toBe(0.8);
    expect(r.ease).toEqual(EXPO_OUT);
  });

  it('applies deck-level easing string when slide is silent', () => {
    const deck: TransitionTimingSpec = { easing: 'circOut' };
    const r = resolveSlideTransitionConfig(undefined, deck) as unknown as { ease: number[] };
    expect(r.ease).toEqual([0, 0.55, 0.45, 1]);
  });

  it('applies deck-level delayMs when slide is silent', () => {
    const deck: TransitionTimingSpec = { delayMs: 200 };
    const r = resolveSlideTransitionConfig(undefined, deck) as unknown as { delay: number };
    expect(r.delay).toBeCloseTo(0.2);
  });

  it('omits delay when neither slide nor deck sets it', () => {
    const r = resolveSlideTransitionConfig(undefined, { durationMs: 700 }) as unknown as { delay?: number };
    expect(r.delay).toBeUndefined();
  });
});

describe('resolveSlideTransitionConfig — slide overrides deck (per-field)', () => {
  it('slide.durationMs wins; slide picks up deck.easing', () => {
    const deck: TransitionTimingSpec = { durationMs: 800, easing: 'circOut' };
    const slide: TransitionTimingSpec = { durationMs: 300 };
    const r = resolveSlideTransitionConfig(slide, deck) as unknown as { duration: number; ease: number[] };
    expect(r.duration).toBe(0.3);
    expect(r.ease).toEqual([0, 0.55, 0.45, 1]); // deck's circOut
  });

  it('slide.easing wins; slide picks up deck.durationMs', () => {
    const deck: TransitionTimingSpec = { durationMs: 1200, easing: 'circOut' };
    const slide: TransitionTimingSpec = { easing: 'expoOut' };
    const r = resolveSlideTransitionConfig(slide, deck) as unknown as { duration: number; ease: number[] };
    expect(r.duration).toBe(1.2);
    expect(r.ease).toEqual([0.16, 1, 0.3, 1]); // expoOut tuple
  });

  it('slide.delayMs wins over deck.delayMs', () => {
    const deck: TransitionTimingSpec = { delayMs: 500 };
    const slide: TransitionTimingSpec = { delayMs: 100 };
    const r = resolveSlideTransitionConfig(slide, deck) as unknown as { delay: number };
    expect(r.delay).toBeCloseTo(0.1);
  });

  it('full slide override ignores deck entirely', () => {
    const deck: TransitionTimingSpec = { durationMs: 800, delayMs: 200, easing: 'circOut' };
    const slide: TransitionTimingSpec = { durationMs: 400, delayMs: 50, easing: [0.5, 0, 0.5, 1] };
    const r = resolveSlideTransitionConfig(slide, deck) as unknown as { duration: number; delay: number; ease: number[] };
    expect(r.duration).toBe(0.4);
    expect(r.delay).toBeCloseTo(0.05);
    expect(r.ease).toEqual([0.5, 0, 0.5, 1]);
  });
});

describe('resolveSlideTransitionConfig — clamping', () => {
  it('clamps deck durationMs above 4000', () => {
    const r = resolveSlideTransitionConfig(undefined, { durationMs: 99999 }) as unknown as { duration: number };
    expect(r.duration).toBe(4);
  });

  it('clamps slide delayMs below 0', () => {
    const r = resolveSlideTransitionConfig({ delayMs: -100 }, { delayMs: 200 }) as unknown as { delay: number };
    expect(r.delay).toBe(0);
  });
});

describe('resolveSlideTransitionConfig — invalid easing fallthrough', () => {
  it('invalid slide easing falls through to deck easing', () => {
    const deck: TransitionTimingSpec = { easing: 'circOut' };
    const slide: TransitionTimingSpec = { easing: 'made-up-ease' as unknown as string };
    const r = resolveSlideTransitionConfig(slide, deck) as unknown as { ease: number[] };
    expect(r.ease).toEqual([0, 0.55, 0.45, 1]);
  });

  it('invalid slide AND deck easing fall through to built-in', () => {
    const r = resolveSlideTransitionConfig(
      { easing: 'nope' as unknown as string },
      { easing: 'also-nope' as unknown as string },
    ) as unknown as { ease: number[] };
    expect(r.ease).toEqual(EXPO_OUT);
  });
});

describe('resolveSlideTransitionConfig — reproducibility', () => {
  it('same inputs ⇒ identical output (deck + slide)', () => {
    const deck: TransitionTimingSpec = { durationMs: 700, easing: 'expoOut' };
    const slide: TransitionTimingSpec = { delayMs: 120 };
    expect(resolveSlideTransitionConfig(slide, deck))
      .toEqual(resolveSlideTransitionConfig(slide, deck));
  });
});
