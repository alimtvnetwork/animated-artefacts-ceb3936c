import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Count-up driver for `NumberCalloutSlide` (spec addendum 29 §2.3).
 *
 * Easings:
 *   - linear        — constant velocity
 *   - easeOutQuint  — 1 - (1 - t)^5  (cinematic, late slowdown)
 *   - spring        — critically-damped-ish; mass 1, stiffness 180, damping 22.
 *
 * Reduced-motion → snap to `to` on first frame, no rAF loop.
 */
export type CountUpEasing = 'linear' | 'easeOutQuint' | 'spring';
export type CountUpDuration = 'fast' | 'slow';

interface Options {
  from?: number;
  to: number;
  duration?: CountUpDuration;
  easing?: CountUpEasing;
  /** Decimal places preserved when formatting. Default: matches `to`. */
  decimals?: number;
}

const EASE_FNS: Record<Exclude<CountUpEasing, 'spring'>, (t: number) => number> = {
  linear: (t) => t,
  easeOutQuint: (t) => 1 - Math.pow(1 - t, 5),
};

/** Critically-damped spring sample at normalised time `t ∈ [0,1]`. */
function springSample(t: number): number {
  // ω = sqrt(k/m), ζ = c / (2*sqrt(k*m)) → with k=180, m=1, c=22 → ζ ≈ 0.82
  // Closed-form approximation for monotonic underdamped envelope; clamps to 1.
  const v = 1 - Math.exp(-6 * t) * (1 + 6 * t);
  return Math.min(1, Math.max(0, v));
}

function easingValue(t: number, easing: CountUpEasing): number {
  if (easing === 'spring') return springSample(t);
  return EASE_FNS[easing](t);
}

function durationMs(duration: CountUpDuration): number {
  if (typeof window === 'undefined') return duration === 'fast' ? 900 : 1800;
  const root = getComputedStyle(document.documentElement);
  const raw = root.getPropertyValue(duration === 'fast' ? '--dur-count-fast' : '--dur-count-slow').trim();
  const match = raw.match(/^([\d.]+)\s*(ms|s)?$/);
  if (!match) return duration === 'fast' ? 900 : 1800;
  const v = parseFloat(match[1]);
  return match[2] === 's' ? v * 1000 : v;
}

export function useCountUp({ from = 0, to, duration = 'slow', easing = 'easeOutQuint', decimals }: Options) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState<number>(reduced ? to : from);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) { setValue(to); return; }
    const total = durationMs(duration);
    if (total === 0) { setValue(to); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      const eased = easingValue(t, easing);
      setValue(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [from, to, duration, easing, reduced]);

  const dp = decimals ?? (Number.isInteger(to) ? 0 : 1);
  return value.toFixed(dp);
}
