import type { Variants } from 'framer-motion';
import type { SlideTransitionValue } from './enums';
import type { TransitionTimingSpec } from './types';
import { flattenVariants, prefersReducedMotion } from './motionPreferences';
import {
  transitionDurationOverride,
  transitionEasingOverride,
  transitionExitDurationOverride,
  transitionExitEasingOverride,
} from './transitionOverride';

export type Direction = 'forward' | 'backward';

/**
 * Build the Framer Motion `Variants` for a slide transition. When the user
 * has `prefers-reduced-motion: reduce` set, the result is flattened to a
 * pure opacity cross-fade — translation/scale variants (PushLeft, SlideIn,
 * PushIn) collapse into the same fade so the audience still gets a clear
 * "slide changed" cue without vestibular motion. See `motionPreferences.ts`.
 */
export function getSlideVariants(t: SlideTransitionValue, dir: Direction): Variants {
  const fwd = dir === 'forward';
  const built = ((): Variants => {
    switch (t) {
      case 'FadeIn':
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
      case 'SlideIn':
        return {
          initial: { opacity: 0, y: 40 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -40 },
        };
      case 'PushIn':
        return {
          initial: { opacity: 0, scale: 0.92 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.04 },
        };
      case 'PushLeft':
        return {
          initial: { opacity: 0, x: fwd ? '8%' : '-8%' },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: fwd ? '-8%' : '8%' },
        };
      case 'PushRight':
        return {
          initial: { opacity: 0, x: fwd ? '-8%' : '8%' },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: fwd ? '8%' : '-8%' },
        };
      default:
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
    }
  })();
  return prefersReducedMotion() ? flattenVariants(built) : built;
}

export const SLIDE_TRANSITION_CONFIG = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

/* ------------------------------------------------------------------ */
/* Per-slide transition timing override (spec: content.transitionTiming) */
/* ------------------------------------------------------------------ */

/** Named easings authors can name in JSON. Keys mirror Framer Motion's API. */
const NAMED_EASINGS: Record<string, [number, number, number, number] | string> = {
  linear:    'linear',
  easeIn:    'easeIn',
  easeOut:   'easeOut',
  easeInOut: 'easeInOut',
  expoIn:    [0.7,  0,    0.84, 0],
  expoOut:   [0.16, 1,    0.3,  1],
  expoInOut: [0.87, 0,    0.13, 1],
  circIn:    [0.55, 0,    1,    0.45],
  circOut:   [0,    0.55, 0.45, 1],
  circInOut: [0.85, 0,    0.15, 1],
  backIn:    [0.36, 0,    0.66, -0.56],
  backOut:   [0.34, 1.56, 0.64, 1],
  backInOut: [0.68, -0.6, 0.32, 1.6],
};

/** Clamp a number into a closed range. */
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Resolve a per-slide `content.transitionTiming` block into the Framer
 * Motion `transition` config.
 *
 * Precedence chain (per field):
 *   1. `slide.content.transitionTiming.{field}`               (per-slide, all transitions)
 *   2. `slide.content.transitionTimingByType[T].{field}`      (per-slide, this transition) — v0.168
 *   3. `deck.transitionTimingByType[T].{field}`               (deck, this transition)     — v0.168
 *   4. `deck.transitionTiming.{field}`                        (deck-wide)
 *   5. Built-in `SLIDE_TRANSITION_CONFIG` (550ms, expoOut, no delay)
 *
 * Each field is resolved independently — a slide that only pins
 * `easing` will pick up the deck-level `durationMs` and vice versa. This
 * matches the field-by-field merge contract the per-slide block already
 * uses against `SLIDE_TRANSITION_CONFIG`.
 *
 * v0.168 — added per-transition-type override layers (`*ByType[T]`).
 * Old call sites (only passing `override` and `deckDefault`) continue to
 * work; the new layers default to `undefined` and short-circuit cleanly.
 */
import type { Transition } from 'framer-motion';

export interface ResolveTransitionExtras {
  /**
   * The active slide transition (e.g. `'PushIn'`). Used to look up entries
   * in the `*ByType` maps. Required to consult per-type overrides; when
   * omitted, the per-type layers are skipped and resolution falls back to
   * the legacy 2-level chain (per-slide → deck → built-in).
   */
  transition?: SlideTransitionValue;
  /** Per-slide, by-transition-type override map. */
  slideByType?: Partial<Record<SlideTransitionValue, TransitionTimingSpec>>;
  /** Deck, by-transition-type override map. */
  deckByType?: Partial<Record<SlideTransitionValue, TransitionTimingSpec>>;
  /**
   * Active slide number — used by the live TransitionInspector to decide
   * whether its override applies (deck scope always; slide scope only when
   * this number matches the pinned target). v0.185.
   */
  slideNumber?: number;
  /**
   * Which phase of the slide transition this resolution is for. Controls
   * which inspector override is consulted (`'enter'` reads the enter
   * duration/easing pair, `'exit'` reads the exit pair which falls back to
   * enter when unset). Defaults to `'enter'` for backward compatibility. v0.186.
   */
  phase?: 'enter' | 'exit';
}

export function resolveSlideTransitionConfig(
  override?: TransitionTimingSpec,
  deckDefault?: TransitionTimingSpec,
  extras?: ResolveTransitionExtras,
): Transition {
  // Layered specs, ordered most-specific → least-specific. Each may be
  // undefined and is skipped by `??` in the field merge below.
  const transition = extras?.transition;
  const slideByType = transition ? extras?.slideByType?.[transition] : undefined;
  const deckByType  = transition ? extras?.deckByType ?.[transition] : undefined;

  // Reduced-motion short-circuit. Authors may declare a 1.2s back-overshoot
  // for a hero slide; we honor the OS preference and collapse it to a tiny
  // linear cross-fade. Delay is preserved (clamped) so any choreography that
  // depends on staggered onset still cascades in the right order. Per-slide
  // delay wins over deck-level delay here too.
  if (prefersReducedMotion()) {
    const rawDelay =
      override?.delayMs ??
      slideByType?.delayMs ??
      deckByType?.delayMs ??
      deckDefault?.delayMs;
    const safeDelay =
      rawDelay !== undefined ? Math.min(clamp(rawDelay, 0, 4000) / 1000, 0.05) : undefined;
    // 150 ms — see SAFE_TRANSITION in motionPreferences.ts and spec 13 §5.
    return safeDelay !== undefined
      ? ({ duration: 0.15, ease: 'linear', delay: safeDelay } as Transition)
      : ({ duration: 0.15, ease: 'linear' } as Transition);
  }

  const base = SLIDE_TRANSITION_CONFIG;

  // Per-field merge: per-slide → per-slide-by-type → deck-by-type → deck → built-in.
  const rawDuration =
    override?.durationMs ??
    slideByType?.durationMs ??
    deckByType?.durationMs ??
    deckDefault?.durationMs;
  const duration = rawDuration !== undefined
    ? clamp(rawDuration, 0, 4000) / 1000
    : base.duration;

  const rawDelay =
    override?.delayMs ??
    slideByType?.delayMs ??
    deckByType?.delayMs ??
    deckDefault?.delayMs;
  const delay = rawDelay !== undefined
    ? clamp(rawDelay, 0, 4000) / 1000
    : undefined;

  const resolveEase = (raw: TransitionTimingSpec['easing']): [number, number, number, number] | string | null => {
    if (!raw) return null;
    if (Array.isArray(raw) && raw.length === 4) return raw as [number, number, number, number];
    if (typeof raw === 'string' && NAMED_EASINGS[raw]) return NAMED_EASINGS[raw];
    return null;
  };
  const ease: [number, number, number, number] | string =
    resolveEase(override?.easing) ??
    resolveEase(slideByType?.easing) ??
    resolveEase(deckByType?.easing) ??
    resolveEase(deckDefault?.easing) ??
    base.ease;

  // Live inspector overrides (v0.182). When the in-deck TransitionInspector
  // pins a value, it wins over every authored layer so the audience sees the
  // tuning instantly. Reduced-motion still short-circuits above.
  const isExit = extras?.phase === 'exit';
  const liveDurationMs = isExit
    ? transitionExitDurationOverride(extras?.slideNumber)
    : transitionDurationOverride(extras?.slideNumber);
  const liveEasing = isExit
    ? transitionExitEasingOverride(extras?.slideNumber)
    : transitionEasingOverride(extras?.slideNumber);
  const finalDuration = liveDurationMs !== null
    ? clamp(liveDurationMs, 0, 4000) / 1000
    : duration;
  const finalEase = liveEasing !== null
    ? (NAMED_EASINGS[liveEasing] ?? ease)
    : ease;

  // Framer Motion's `Transition` types `ease` narrowly; cast through unknown
  // because we validate the shape ourselves above.
  const out = delay !== undefined
    ? { duration: finalDuration, delay, ease: finalEase }
    : { duration: finalDuration, ease: finalEase };
  return out as unknown as Transition;
}
