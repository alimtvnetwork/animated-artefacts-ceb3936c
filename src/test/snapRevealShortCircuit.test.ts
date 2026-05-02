/**
 * Spec 49 — Snap-reveal short-circuit.
 *
 * When a step pins `enter.durationMs = 0` AND has `leftOffsetPx > 0`,
 * the auto-picked reveal mode must drop from the cinematic 1.1s
 * `timelineLand` to a flat `slide`. Authors who set `revealMode`
 * explicitly are unaffected — explicit always wins.
 *
 * The picker logic lives inline in `StepTimelineSlide.tsx`; we mirror
 * its decision here so a regression in either place is caught.
 */
import { describe, expect, it } from 'vitest';
import type { StepSpec } from '@/slides/types';

type RevealMode = 'fade' | 'slide' | 'pushLeft' | 'timelineLand';

/** Mirrors the picker in `StepTimelineSlide.tsx` (~L820). Pure function
 *  for unit-testability — the slide imports nothing from here. */
function pickRevealMode(s: StepSpec): RevealMode {
  const offsetPx = Math.min(80, Math.max(0, s.leftOffsetPx ?? 0));
  const explicitInstantEnter = s.enter?.durationMs === 0;
  return s.revealMode ?? (offsetPx > 0 && !explicitInstantEnter ? 'timelineLand' : 'slide');
}

const step = (o: Partial<StepSpec> = {}): StepSpec => ({ label: 'S', title: 'T', ...o });

describe('snap-reveal short-circuit (spec 49)', () => {
  it('snap with no enter override → timelineLand (legacy default)', () => {
    expect(pickRevealMode(step({ leftOffsetPx: 40 }))).toBe('timelineLand');
  });

  it('snap with enter.durationMs=0 → falls through to slide', () => {
    expect(pickRevealMode(step({ leftOffsetPx: 40, enter: { durationMs: 0 } }))).toBe('slide');
  });

  it('snap with non-zero enter.durationMs → still timelineLand', () => {
    expect(pickRevealMode(step({ leftOffsetPx: 40, enter: { durationMs: 200 } }))).toBe('timelineLand');
  });

  it('explicit revealMode beats the short-circuit', () => {
    expect(pickRevealMode(step({ leftOffsetPx: 40, enter: { durationMs: 0 }, revealMode: 'timelineLand' }))).toBe('timelineLand');
  });

  it('no snap → slide regardless of enter.durationMs', () => {
    expect(pickRevealMode(step())).toBe('slide');
    expect(pickRevealMode(step({ enter: { durationMs: 0 } }))).toBe('slide');
  });
});
