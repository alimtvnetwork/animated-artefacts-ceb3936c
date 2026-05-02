import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flattenTransition, flattenVariants } from '@/slides/motionPreferences';
import { getSlideVariants, resolveSlideTransitionConfig } from '@/slides/transitions';
import { getContainerVariants, resolvePreset } from '@/slides/textAnimations';

/**
 * These tests exercise the dual contract described in `motionPreferences.ts`:
 *   - Default (no OS preference) — variants/transitions render as authored.
 *   - Reduced-motion — transforms drop, springs/long durations collapse to a
 *     150 ms opacity cross-fade (per spec/slides/llm/13-motion-system.md §5),
 *     but opacity cues + delay ordering survive.
 *
 * `matchMedia` is mocked per-test so each scenario is hermetic.
 */

/** The reduced-motion safe duration, sourced from the motion-system spec
 *  (spec 13 §5). Tests reference this constant — never a magic number — so
 *  if the spec changes there is exactly one place to update. */
const SAFE_RM_DURATION = 0.15;

function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce') ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('motionPreferences — pure helpers', () => {
  it('flattenVariants strips transforms but keeps opacity', () => {
    const out = flattenVariants({
      initial: { opacity: 0, y: 40, scale: 0.9, filter: 'blur(8px)' },
      animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
    });
    expect(out.initial).toEqual({ opacity: 0, transition: { duration: SAFE_RM_DURATION, ease: 'linear' } });
    expect(out.animate).toMatchObject({ opacity: 1 });
    // No transform-ish key survives.
    for (const key of ['x', 'y', 'scale', 'filter', 'rotate']) {
      expect(out.initial).not.toHaveProperty(key);
      expect(out.animate).not.toHaveProperty(key);
    }
  });

  it('flattenTransition clamps long springs but preserves delay ordering', () => {
    const t = flattenTransition({ type: 'spring', stiffness: 100, duration: 1.2, delay: 0.4, staggerChildren: 0.2 });
    expect(t).toMatchObject({ duration: SAFE_RM_DURATION, ease: 'linear' });
    // Delay clamped, not dropped — preserves cascade order.
    expect((t as { delay: number }).delay).toBeLessThanOrEqual(0.05);
    // Stagger window cascades visibly across the 150 ms safe cross-fade.
    expect((t as { staggerChildren: number }).staggerChildren).toBeCloseTo(0.03);
  });
});

describe('reduced-motion: OFF (default user)', () => {
  beforeEach(() => mockReducedMotion(false));
  afterEach(() => vi.restoreAllMocks());

  it('PushLeft variants keep their x translation', () => {
    const v = getSlideVariants('PushLeft', 'forward') as Record<string, Record<string, unknown>>;
    expect(v.initial).toHaveProperty('x');
    expect(v.exit).toHaveProperty('x');
  });

  it('bounce preset keeps spring + scale', () => {
    const v = resolvePreset('bounce') as Record<string, Record<string, unknown>>;
    expect(v.initial).toHaveProperty('scale');
    const t = (v.animate as { transition?: { type?: string } }).transition;
    expect(t?.type).toBe('spring');
  });

  it('per-slide timing override wins (1200ms back-overshoot)', () => {
    const t = resolveSlideTransitionConfig({ durationMs: 1200, easing: 'backOut', delayMs: 200 });
    expect(t).toMatchObject({ duration: 1.2, delay: 0.2 });
  });

  it('container stagger uses authored cascade window', () => {
    const v = getContainerVariants('slideUp') as { animate: { transition: { staggerChildren: number } } };
    expect(v.animate.transition.staggerChildren).toBeCloseTo(0.08);
  });
});

describe('reduced-motion: ON (accessibility)', () => {
  beforeEach(() => mockReducedMotion(true));
  afterEach(() => vi.restoreAllMocks());

  it('PushLeft variants drop x translation, keep opacity', () => {
    const v = getSlideVariants('PushLeft', 'forward') as Record<string, Record<string, unknown>>;
    expect(v.initial).not.toHaveProperty('x');
    expect(v.initial).toHaveProperty('opacity', 0);
    expect(v.animate).toHaveProperty('opacity', 1);
  });

  it('bounce preset loses scale + spring → instant fade', () => {
    const v = resolvePreset('bounce') as Record<string, Record<string, unknown>>;
    expect(v.initial).not.toHaveProperty('scale');
    expect(v.initial).not.toHaveProperty('y');
    const t = (v.animate as { transition?: { duration?: number; ease?: string } }).transition;
    expect(t).toMatchObject({ duration: SAFE_RM_DURATION, ease: 'linear' });
  });

  it('cinematicCapsules drops blur filter under reduced motion', () => {
    const v = resolvePreset('cinematicCapsules') as Record<string, Record<string, unknown>>;
    expect(v.initial).not.toHaveProperty('filter');
    expect(v.animate).not.toHaveProperty('filter');
  });

  it('per-slide 1200ms override is clamped to safe 150ms cross-fade', () => {
    const t = resolveSlideTransitionConfig({ durationMs: 1200, easing: 'backOut', delayMs: 800 });
    expect(t).toMatchObject({ duration: SAFE_RM_DURATION, ease: 'linear' });
    // Delay survives but is clamped so the audience doesn't wait nearly a second.
    expect((t as { delay: number }).delay).toBeLessThanOrEqual(0.05);
  });

  it('container stagger cascades visibly across the 150ms window', () => {
    const v = getContainerVariants('slideUp') as { animate: { transition: { staggerChildren: number } } };
    expect(v.animate.transition.staggerChildren).toBeCloseTo(0.03);
  });

  it('unknown preset name still produces a safe fade (no crash)', () => {
    const v = resolvePreset('doesNotExist') as Record<string, Record<string, unknown>>;
    expect(v.animate).toHaveProperty('opacity', 1);
  });
});
