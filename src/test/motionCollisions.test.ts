/**
 * Tests — `detectMotionCollisions` enforces the variety rule from
 * `spec/slides/llm/13-motion-system.md` §1.
 *
 * Coverage:
 *   - Empty / single-slide decks → no warnings (no adjacency to compare).
 *   - Both axes match adjacent → exactly one warning per pair, pinned to
 *     the *later* slide.
 *   - Single-axis match → no warning (intentional partial repeat).
 *   - Three-in-a-row identical → two warnings (one per adjacent pair).
 *   - Non-adjacent matches → no warning (variety judged on adjacency).
 */
import { describe, it, expect } from 'vitest';
import { detectMotionCollisions } from '../slides/motionCollisions';
import type { SlideSpec } from '../slides/types';

/** Minimal SlideSpec factory — only the fields the detector reads. */
function s(
  n: number,
  transition: string,
  textAnimation: string,
  name = `slide-${n}`,
): SlideSpec {
  return {
    slideNumber: n,
    slideName: name,
    slideType: 'TitleSlide',
    transition,
    textAnimation,
    isClickReveal: false,
    showBrandHeader: true,
    showPresenterChip: false,
    content: {},
  } as unknown as SlideSpec;
}

describe('detectMotionCollisions', () => {
  it('returns no warnings for an empty deck', () => {
    expect(detectMotionCollisions([])).toEqual([]);
  });

  it('returns no warnings for a single-slide deck', () => {
    expect(detectMotionCollisions([s(1, 'FadeIn', 'SlideUp')])).toEqual([]);
  });

  it('flags one warning when both axes match between adjacent slides', () => {
    const w = detectMotionCollisions([
      s(1, 'SlideIn', 'SlideUp'),
      s(2, 'SlideIn', 'SlideUp'),
    ]);
    expect(w).toHaveLength(1);
    // Warning is pinned to the LATER slide (the one to edit).
    expect(w[0].slideNumber).toBe(2);
    expect(w[0].neighborSlideNumber).toBe(1);
    expect(w[0].transition).toBe('SlideIn');
    expect(w[0].textAnimation).toBe('SlideUp');
    expect(w[0].path).toBe('transition / textAnimation');
    expect(w[0].message).toMatch(/Motion collision/);
  });

  it('does NOT flag when only the transition matches', () => {
    expect(
      detectMotionCollisions([
        s(1, 'SlideIn', 'SlideUp'),
        s(2, 'SlideIn', 'FadeIn'),
      ]),
    ).toEqual([]);
  });

  it('does NOT flag when only the textAnimation matches', () => {
    expect(
      detectMotionCollisions([
        s(1, 'SlideIn', 'SlideUp'),
        s(2, 'PushIn', 'SlideUp'),
      ]),
    ).toEqual([]);
  });

  it('emits one warning per colliding pair when three slides match in a row', () => {
    const w = detectMotionCollisions([
      s(1, 'FadeIn', 'FadeIn'),
      s(2, 'FadeIn', 'FadeIn'),
      s(3, 'FadeIn', 'FadeIn'),
    ]);
    expect(w.map((x) => x.slideNumber)).toEqual([2, 3]);
    expect(w.map((x) => x.neighborSlideNumber)).toEqual([1, 2]);
  });

  it('does NOT flag non-adjacent matches', () => {
    // Slides 1 and 3 match but are separated by a varied slide 2 — no warning.
    expect(
      detectMotionCollisions([
        s(1, 'PushIn', 'Bounce'),
        s(2, 'SlideIn', 'SlideUp'),
        s(3, 'PushIn', 'Bounce'),
      ]),
    ).toEqual([]);
  });

  it('returns a frozen array (callers cannot mutate the warning list)', () => {
    const w = detectMotionCollisions([
      s(1, 'SlideIn', 'SlideUp'),
      s(2, 'SlideIn', 'SlideUp'),
    ]);
    expect(Object.isFrozen(w)).toBe(true);
  });
});
