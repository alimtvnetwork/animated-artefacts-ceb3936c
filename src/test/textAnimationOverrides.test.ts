/**
 * Per-block timing-override tests for text animations.
 *
 * The override form (`{ preset, delayMs, durationMs, easing }`) is the
 * mechanism that makes a fade-in or bounce reproducible across decks —
 * two authors using the same preset with the same overrides should land
 * pixel-identical timing. These tests guard the merge semantics.
 */
import { describe, expect, it } from 'vitest';
import { resolvePreset, isOverrideObject } from '@/slides/textAnimations';
import type { Variants } from 'framer-motion';

// Helper — pull the merged transition block off the resolved variants.
function transitionOf(v: Variants): Record<string, unknown> {
  const animate = v.animate as Record<string, unknown>;
  return (animate.transition as Record<string, unknown>) ?? {};
}

describe('resolvePreset — override form', () => {
  it('isOverrideObject discriminates string vs object form', () => {
    expect(isOverrideObject('fadeIn')).toBe(false);
    expect(isOverrideObject({ preset: 'fadeIn' })).toBe(true);
    expect(isOverrideObject(null)).toBe(false);
    expect(isOverrideObject(undefined)).toBe(false);
  });

  it('legacy string form still resolves (back-compat)', () => {
    const v = resolvePreset('fadeIn');
    const t = transitionOf(v);
    // Default fadeIn has duration 0.45s and the soft-out cubic.
    expect(t.duration).toBe(0.45);
  });

  it('delayMs is converted to seconds and applied to the transition', () => {
    const v = resolvePreset({ preset: 'fadeIn', delayMs: 250 });
    expect(transitionOf(v).delay).toBe(0.25);
  });

  it('durationMs replaces the preset default', () => {
    const v = resolvePreset({ preset: 'fadeIn', durationMs: 800 });
    expect(transitionOf(v).duration).toBe(0.8);
  });

  it('easing accepts named curves', () => {
    const v = resolvePreset({ preset: 'fadeIn', easing: 'easeOut' });
    expect(transitionOf(v).ease).toBe('easeOut');
  });

  it('easing accepts cubic-bezier 4-tuples', () => {
    const curve: [number, number, number, number] = [0.1, 0.9, 0.2, 1];
    const v = resolvePreset({ preset: 'fadeIn', easing: curve });
    expect(transitionOf(v).ease).toEqual(curve);
  });

  it('all three knobs combine in one resolve', () => {
    const v = resolvePreset({
      preset: 'fadeIn',
      delayMs: 100,
      durationMs: 600,
      easing: 'easeInOut',
    });
    const t = transitionOf(v);
    expect(t.delay).toBe(0.1);
    expect(t.duration).toBe(0.6);
    expect(t.ease).toBe('easeInOut');
  });

  it('omitted knobs do not stomp the preset defaults', () => {
    // `fadeIn` ships with its own ease — passing only delayMs must not wipe it.
    const baseline = resolvePreset('fadeIn');
    const overridden = resolvePreset({ preset: 'fadeIn', delayMs: 50 });
    expect(transitionOf(overridden).ease).toEqual(transitionOf(baseline).ease);
    expect(transitionOf(overridden).delay).toBe(0.05);
  });

  it('bounce override merges delay onto the spring without clobbering it', () => {
    // Spring channel must survive the merge — durationMs is a no-op for the
    // spring itself but delayMs still gates entry. This is the docstring
    // contract for spring presets in textAnimations.ts.
    const v = resolvePreset({ preset: 'bounce', delayMs: 200, durationMs: 999 });
    const t = transitionOf(v);
    expect(t.delay).toBe(0.2);
    expect(t.type).toBe('spring');
    // stiffness/damping remain from the preset.
    expect(t.stiffness).toBe(260);
    expect(t.damping).toBe(16);
  });

  it('unknown preset name in override falls back to fadeIn', () => {
    const v = resolvePreset({ preset: 'totally-made-up', delayMs: 100 });
    // Should still apply the delay onto the fallback preset.
    expect(transitionOf(v).delay).toBe(0.1);
  });

  it('legacy capitalised preset name works inside override form', () => {
    // Authors migrating older decks may pass `Bounce` (slide-level enum).
    const v = resolvePreset({ preset: 'Bounce', delayMs: 150 });
    const t = transitionOf(v);
    expect(t.delay).toBe(0.15);
    expect(t.type).toBe('spring');
  });

  it('two resolves with identical overrides produce identical transitions (reproducibility contract)', () => {
    const a = resolvePreset({ preset: 'fadeIn', delayMs: 120, durationMs: 540, easing: 'easeOut' });
    const b = resolvePreset({ preset: 'fadeIn', delayMs: 120, durationMs: 540, easing: 'easeOut' });
    expect(transitionOf(a)).toEqual(transitionOf(b));
  });
});
