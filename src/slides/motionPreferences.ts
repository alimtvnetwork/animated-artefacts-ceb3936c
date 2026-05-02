/**
 * Single source of truth for `prefers-reduced-motion` at the JS layer.
 *
 * Why this file exists
 * --------------------
 * The deck honors reduced-motion in TWO places, and they need to stay in sync:
 *
 *   1. CSS — `src/index.css` shortens every `animation`/`transition` to 0.01ms
 *      under `@media (prefers-reduced-motion: reduce)`. This catches every
 *      pure-CSS effect (ambient floats, lattice glow, hover lift, etc.).
 *
 *   2. JS / Framer Motion — variant objects authored in `transitions.ts` and
 *      `textAnimations.ts` are read by Framer at runtime. Framer respects the
 *      user setting per-instance only if components opt in via
 *      `useReducedMotion()`. The CSS rule above does NOT reach Framer because
 *      Framer drives styles via the Web Animations API on a property-by-
 *      property basis — durations specified inline in JS win.
 *
 * Without this module, an author who set
 *   "transitionTiming": { "durationMs": 1200, "easing": "backInOut" }
 * would still see a 1.2s back-overshoot under reduced-motion, even though
 * every CSS-driven decoration on the same slide collapses to 0.01ms. That
 * mismatch is jarring and arguably worse than no respect at all.
 *
 * What the helpers do
 * -------------------
 *   - `prefersReducedMotion()`  — synchronous read of the OS setting (SSR-safe).
 *   - `flattenVariants(v)`      — strip transforms (x/y/scale/rotate/blur) and
 *                                 force any springs into a 10ms linear tween,
 *                                 leaving opacity transitions intact so the
 *                                 user still sees enter/exit cues.
 *   - `flattenTransition(t)`    — clamp Framer `Transition` objects to 10ms
 *                                 linear (preserves `delay` so staggered
 *                                 reveals still cascade in order).
 *
 * Opacity is intentionally PRESERVED. The WCAG guidance behind
 * `prefers-reduced-motion` targets motion that triggers vestibular disorders
 * (parallax, large translation, scale, spin); a soft fade is fine and helps
 * users tell when the slide changes.
 */

import type { Transition, Variants } from 'framer-motion';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyVariant = Record<string, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Synchronous read. Safe in non-browser environments (returns `false`).
 * For React components prefer Framer's `useReducedMotion()` hook so the value
 * stays reactive when the user toggles the setting mid-session.
 */
/**
 * Synchronous read. Safe in non-browser environments (returns `false`).
 *
 * Returns `true` when EITHER:
 *   - the OS reports `prefers-reduced-motion: reduce`, OR
 *   - the document has `<html data-export-mode="true">` set (handout/PDF
 *     export route — see spec 28). Export mode reuses the same flatteners
 *     so JS-driven Framer animations freeze on their final state alongside
 *     the CSS `animation: 0s` rules.
 *
 * For React components prefer Framer's `useReducedMotion()` hook so the
 * value stays reactive when the user toggles the OS setting mid-session.
 * Export mode is set once at HandoutPage mount, so the synchronous read
 * is sufficient for that path.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  if (typeof document !== 'undefined') {
    const html = document.documentElement;
    if (html?.getAttribute('data-export-mode') === 'true') return true;
    // v0.206 — Pixel Snap preview mode: same flatten behavior as export
    // mode so JS-driven Framer animations also freeze on their final
    // keyframe while the user is measuring alignment.
    if (html?.getAttribute('data-pixel-snap') === 'true') return true;
    // Window-2 / task 22 — in-app reduced-motion toggle. Driven by
    // `src/slides/components/reducedMotionToggle.ts` (chrome button +
    // ?reduceMotion=1 URL flag + localStorage). Lets users on locked
    // devices opt into reduced motion without OS-level access.
    // WCAG 2.3.3 ("Animation from Interactions") + 2.2.2 ("Pause, Stop, Hide").
    if (html?.getAttribute('data-reduce-motion') === 'true') return true;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Properties we strip from variant `initial`/`animate`/`exit` keyframes. */
const TRANSFORM_KEYS = new Set([
  'x', 'y', 'z',
  'rotate', 'rotateX', 'rotateY', 'rotateZ',
  'scale', 'scaleX', 'scaleY',
  'skew', 'skewX', 'skewY',
  'filter',
]);

/**
 * The reduced-motion "safe" transition. 150 ms matches the master rule in
 * `spec/slides/llm/13-motion-system.md` §5 and `spec/slides/42-steps-motion.md`
 * §5: long enough that the audience perceives a real cross-fade (so the slide
 * change is legible), short enough to fall well under any vestibular-disorder
 * threshold. An earlier value of 10 ms (~0.6 frames at 60fps) read as an
 * instantaneous swap and made the deck feel robotic — see
 * `spec/issues/23-motion-feels-robotic-under-reduced-motion.md`.
 */
const SAFE_TRANSITION: Transition = { duration: 0.15, ease: 'linear' };

/**
 * Strip transform/blur keys from a single variant target while keeping
 * opacity. Returns a NEW object — never mutates the input (presets are
 * frozen `as const` literals).
 */
function flattenTarget(target: AnyVariant): AnyVariant {
  const out: AnyVariant = {};
  for (const [k, v] of Object.entries(target)) {
    if (k === 'transition') {
      out.transition = SAFE_TRANSITION;
      continue;
    }
    if (TRANSFORM_KEYS.has(k)) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  // If the target carried a transform (and hence implied motion), inject
  // a safe transition even when the author didn't supply one.
  if (!('transition' in out) && Object.keys(target).some((k) => TRANSFORM_KEYS.has(k))) {
    out.transition = SAFE_TRANSITION;
  }
  return out;
}

/**
 * Flatten a Variants object: strip transforms from every named state
 * (initial / animate / exit / hover / …) and replace any spring/long tween
 * with a 10ms linear cross-fade.
 *
 * Pure function — input variants (often module-level `as const` constants)
 * are never mutated.
 */
export function flattenVariants(variants: Variants): Variants {
  const out: Variants = {};
  for (const [stateName, def] of Object.entries(variants)) {
    if (def && typeof def === 'object' && !Array.isArray(def)) {
      out[stateName] = flattenTarget(def as AnyVariant);
    } else {
      out[stateName] = def;
    }
  }
  return out;
}

/**
 * Clamp any Framer `Transition` to a safe instant tween. Preserves `delay`
 * (so `staggerChildren` cascades still order correctly) and `staggerChildren`
 * itself (the children's individual transitions are also clamped, so the
 * overall sequence completes nearly instantly while keeping order).
 */
export function flattenTransition(t?: Transition): Transition {
  if (!t) return SAFE_TRANSITION;
  const src = t as Record<string, unknown>;
  // Mirror SAFE_TRANSITION's 150 ms — see spec 13 §5.
  const out: Record<string, unknown> = { duration: 0.15, ease: 'linear' };
  if (typeof src.delay === 'number') out.delay = Math.min(src.delay, 0.05);
  // Stagger window scales with the safe duration so a row of children
  // cascades visibly across the 150 ms cross-fade instead of collapsing.
  if (typeof src.staggerChildren === 'number') out.staggerChildren = 0.03;
  if (typeof src.delayChildren === 'number') out.delayChildren = Math.min(src.delayChildren, 0.05);
  return out as Transition;
}
