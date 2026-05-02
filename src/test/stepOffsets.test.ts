/**
 * Tests for the v0.144 offset additions:
 *
 *   - Per-step `enter.offsetPx` / `exit.offsetPx` — translate-Y motion
 *     distance the row travels during enter / exit. Pinning these makes
 *     a "soft 8px drift" vs "dramatic 80px push" reproducible across
 *     decks instead of relying on the reveal-mode preset names.
 *   - Slide-level `content.topOffsetPx` — vertical nudge for the eyebrow
 *     + title block; companion to the existing horizontal `headerOffsetPx`.
 *
 * The resolvers are pure, so we drive them directly with minimal fixtures
 * — no React renderer needed.
 */
import { describe, expect, it } from 'vitest';
import { resolveStepEnter, resolveStepExit, resolveSlideTopOffset } from '@/slides/stepTiming';
import type { SlideContent, StepSpec } from '@/slides/types';

// Minimal step fixture — only fields the resolvers actually read.
const baseStep = (overrides: Partial<StepSpec> = {}): StepSpec => ({
  label: 'Step',
  title: 'Step',
  ...overrides,
});

describe('resolveStepEnter — offsetPx', () => {
  it('returns null offsetPx when neither step nor slide override sets it (legacy default)', () => {
    const r = resolveStepEnter(baseStep(), undefined);
    expect(r.offsetPx).toBeNull();
  });

  it('reads per-step `enter.offsetPx`', () => {
    const r = resolveStepEnter(baseStep({ enter: { offsetPx: 24 } }), undefined);
    expect(r.offsetPx).toBe(24);
  });

  it('falls back to the slide-level `content.stepTiming.enter.offsetPx`', () => {
    const slide: SlideContent['stepTiming'] = {
      preset: 'smooth',
      enter: { offsetPx: 60 },
    };
    const r = resolveStepEnter(baseStep(), slide);
    expect(r.offsetPx).toBe(60);
  });

  it('per-step `enter.offsetPx` wins over slide-level override', () => {
    const slide: SlideContent['stepTiming'] = {
      preset: 'smooth',
      enter: { offsetPx: 60 },
    };
    const r = resolveStepEnter(baseStep({ enter: { offsetPx: 8 } }), slide);
    expect(r.offsetPx).toBe(8);
  });

  it('clamps positive overflow to +200', () => {
    const r = resolveStepEnter(baseStep({ enter: { offsetPx: 9999 } }), undefined);
    expect(r.offsetPx).toBe(200);
  });

  it('clamps negative overflow to -200', () => {
    const r = resolveStepEnter(baseStep({ enter: { offsetPx: -9999 } }), undefined);
    expect(r.offsetPx).toBe(-200);
  });

  it('treats non-finite values as unauthored (returns null)', () => {
    const r = resolveStepEnter(baseStep({ enter: { offsetPx: NaN } }), undefined);
    expect(r.offsetPx).toBeNull();
  });

  it('zero is a valid pinned value (NOT treated as unauthored)', () => {
    // Authoring `0` is meaningful: "explicitly suppress reveal-mode default Y motion".
    const r = resolveStepEnter(baseStep({ enter: { offsetPx: 0 } }), undefined);
    expect(r.offsetPx).toBe(0);
  });

  it('still resolves duration / delay / ease alongside offsetPx', () => {
    const r = resolveStepEnter(
      baseStep({ enter: { durationMs: 600, delayMs: 200, offsetPx: 16 } }),
      undefined,
    );
    expect(r.duration).toBe(0.6);
    expect(r.delay).toBe(0.2);
    expect(r.offsetPx).toBe(16);
  });
});

describe('resolveStepExit — offsetPx', () => {
  it('returns null when nothing is authored', () => {
    expect(resolveStepExit(baseStep(), undefined).offsetPx).toBeNull();
  });

  it('reads per-step `exit.offsetPx`', () => {
    const r = resolveStepExit(baseStep({ exit: { offsetPx: -28 } }), undefined);
    expect(r.offsetPx).toBe(-28);
  });

  it('per-step exit wins over slide-level exit', () => {
    const slide: SlideContent['stepTiming'] = {
      preset: 'smooth',
      exit: { offsetPx: 50 },
    };
    const r = resolveStepExit(baseStep({ exit: { offsetPx: -12 } }), slide);
    expect(r.offsetPx).toBe(-12);
  });
});

describe('resolveSlideTopOffset', () => {
  const baseContent = (overrides: Partial<SlideContent> = {}): SlideContent => ({
    ...overrides,
  });

  it('returns 0 when unauthored', () => {
    expect(resolveSlideTopOffset(baseContent())).toBe(0);
  });

  it('reads `content.topOffsetPx`', () => {
    expect(resolveSlideTopOffset(baseContent({ topOffsetPx: 40 }))).toBe(40);
  });

  it('clamps to [-160, 160]', () => {
    expect(resolveSlideTopOffset(baseContent({ topOffsetPx: 9999 }))).toBe(160);
    expect(resolveSlideTopOffset(baseContent({ topOffsetPx: -9999 }))).toBe(-160);
  });

  it('treats non-finite as 0', () => {
    expect(resolveSlideTopOffset(baseContent({ topOffsetPx: NaN }))).toBe(0);
  });

  it('is independent from `headerOffsetPx` (horizontal companion)', () => {
    // Both axes can be authored simultaneously — the resolver only owns Y.
    const c = baseContent({ topOffsetPx: 24, headerOffsetPx: 40 });
    expect(resolveSlideTopOffset(c)).toBe(24);
  });
});

describe('reproducibility contract', () => {
  it('two resolves with the same offsetPx produce identical results', () => {
    const a = resolveStepEnter(baseStep({ enter: { offsetPx: 32, durationMs: 500 } }), undefined);
    const b = resolveStepEnter(baseStep({ enter: { offsetPx: 32, durationMs: 500 } }), undefined);
    expect(a).toEqual(b);
  });
});
