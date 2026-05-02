/**
 * Tests for v0.145 — slide-level reveal-order cadence
 * (`content.stepTiming.baseDelayMs` / `staggerMs`).
 *
 * Contract:
 *   - Defaults match the legacy 300ms / 180ms exactly (so existing decks
 *     render identically).
 *   - Authored values are honored and clamped to safe ranges.
 *   - String preset form (`stepTiming: 'cinematic'`) does NOT change order
 *     timing — only enter/exit tempo. Order falls back to defaults.
 *   - `stepRevealDelayMs(timing, i)` = `baseDelayMs + i * staggerMs`.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveStepRevealOrder,
  stepRevealDelayMs,
  DEFAULT_REVEAL_BASE_DELAY_MS,
  DEFAULT_REVEAL_STAGGER_MS,
} from '@/slides/stepTiming';
import type { SlideContent } from '@/slides/types';

describe('resolveStepRevealOrder — defaults', () => {
  it('returns legacy 300/180 when stepTiming is undefined', () => {
    const r = resolveStepRevealOrder(undefined);
    expect(r.baseDelayMs).toBe(300);
    expect(r.staggerMs).toBe(180);
  });

  it('exposes legacy constants for downstream consumers', () => {
    expect(DEFAULT_REVEAL_BASE_DELAY_MS).toBe(300);
    expect(DEFAULT_REVEAL_STAGGER_MS).toBe(180);
  });

  it('preset string form keeps default order timing', () => {
    const r = resolveStepRevealOrder('cinematic');
    expect(r.baseDelayMs).toBe(300);
    expect(r.staggerMs).toBe(180);
  });
});

describe('resolveStepRevealOrder — authored', () => {
  it('honors authored baseDelayMs and staggerMs', () => {
    const t: SlideContent['stepTiming'] = { preset: 'smooth', baseDelayMs: 100, staggerMs: 400 };
    const r = resolveStepRevealOrder(t);
    expect(r.baseDelayMs).toBe(100);
    expect(r.staggerMs).toBe(400);
  });

  it('staggerMs: 0 produces simultaneous reveal', () => {
    const t: SlideContent['stepTiming'] = { staggerMs: 0 };
    const r = resolveStepRevealOrder(t);
    expect(r.staggerMs).toBe(0);
    expect(r.baseDelayMs).toBe(300); // default preserved
  });

  it('partial override keeps the other field at default', () => {
    const t: SlideContent['stepTiming'] = { baseDelayMs: 50 };
    const r = resolveStepRevealOrder(t);
    expect(r.baseDelayMs).toBe(50);
    expect(r.staggerMs).toBe(180);
  });
});

describe('resolveStepRevealOrder — clamping', () => {
  it('clamps baseDelayMs to [0, 4000]', () => {
    expect(resolveStepRevealOrder({ baseDelayMs: -100 }).baseDelayMs).toBe(0);
    expect(resolveStepRevealOrder({ baseDelayMs: 99999 }).baseDelayMs).toBe(4000);
  });

  it('clamps staggerMs to [0, 2000]', () => {
    expect(resolveStepRevealOrder({ staggerMs: -50 }).staggerMs).toBe(0);
    expect(resolveStepRevealOrder({ staggerMs: 99999 }).staggerMs).toBe(2000);
  });

  it('falls back to defaults on NaN', () => {
    const r = resolveStepRevealOrder({ baseDelayMs: NaN, staggerMs: NaN });
    expect(r.baseDelayMs).toBe(300);
    expect(r.staggerMs).toBe(180);
  });
});

describe('stepRevealDelayMs', () => {
  it('row 0 → baseDelayMs', () => {
    expect(stepRevealDelayMs({ baseDelayMs: 200, staggerMs: 100 }, 0)).toBe(200);
  });

  it('row N → baseDelayMs + N * staggerMs', () => {
    expect(stepRevealDelayMs({ baseDelayMs: 200, staggerMs: 100 }, 3)).toBe(500);
  });

  it('legacy default cadence: row 4 = 300 + 4*180 = 1020ms', () => {
    expect(stepRevealDelayMs(undefined, 4)).toBe(1020);
  });

  it('negative index clamped to 0', () => {
    expect(stepRevealDelayMs({ baseDelayMs: 100, staggerMs: 50 }, -2)).toBe(100);
  });

  it('reproducibility — same input ⇒ same output', () => {
    const t: SlideContent['stepTiming'] = { baseDelayMs: 250, staggerMs: 75 };
    expect(stepRevealDelayMs(t, 5)).toBe(stepRevealDelayMs(t, 5));
  });
});
