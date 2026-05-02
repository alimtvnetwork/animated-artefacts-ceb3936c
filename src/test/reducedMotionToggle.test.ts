/**
 * In-app reduced-motion toggle (Window-2 task 22 / WCAG 2.3.3 + 2.2.2).
 *
 * Verifies the chain:
 *   chrome button → setReduceMotion(true)
 *     → <html data-reduce-motion="true">
 *     → prefersReducedMotion() returns true
 *     → flattenVariants/flattenTransition behave like export mode
 *
 * The Framer flatten helpers themselves are already covered by
 * `motionPreferences.test.ts`; this spec only proves the toggle plumbing
 * flips the same gate that exists for `data-export-mode` / `data-pixel-snap`.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  setReduceMotion,
  toggleReduceMotion,
  isReduceMotionEnabled,
  _resetReduceMotionForTests,
} from '@/slides/components/reducedMotionToggle';
import { prefersReducedMotion } from '@/slides/motionPreferences';

describe('reducedMotionToggle (WCAG 2.3.3 in-app override)', () => {
  beforeEach(() => {
    _resetReduceMotionForTests();
  });
  afterEach(() => {
    _resetReduceMotionForTests();
  });

  it('starts off and prefersReducedMotion is false (no OS pref in jsdom)', () => {
    expect(isReduceMotionEnabled()).toBe(false);
    expect(document.documentElement.hasAttribute('data-reduce-motion')).toBe(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('setReduceMotion(true) sets <html data-reduce-motion="true"> and prefersReducedMotion flips', () => {
    setReduceMotion(true);
    expect(isReduceMotionEnabled()).toBe(true);
    expect(document.documentElement.getAttribute('data-reduce-motion')).toBe('true');
    expect(prefersReducedMotion()).toBe(true);
  });

  it('setReduceMotion(false) clears the attribute and resets the gate', () => {
    setReduceMotion(true);
    setReduceMotion(false);
    expect(isReduceMotionEnabled()).toBe(false);
    expect(document.documentElement.hasAttribute('data-reduce-motion')).toBe(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('toggleReduceMotion flips the value', () => {
    expect(isReduceMotionEnabled()).toBe(false);
    toggleReduceMotion();
    expect(isReduceMotionEnabled()).toBe(true);
    toggleReduceMotion();
    expect(isReduceMotionEnabled()).toBe(false);
  });

  it('persists the preference to localStorage', () => {
    setReduceMotion(true);
    expect(localStorage.getItem('riseup.reduceMotion')).toBe('1');
    setReduceMotion(false);
    expect(localStorage.getItem('riseup.reduceMotion')).toBe('0');
  });

  it('mirrors the preference onto the URL via reduceMotion query param', () => {
    setReduceMotion(true);
    expect(new URL(window.location.href).searchParams.get('reduceMotion')).toBe('1');
    setReduceMotion(false);
    expect(new URL(window.location.href).searchParams.get('reduceMotion')).toBeNull();
  });
});
