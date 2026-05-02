/**
 * Step timing resolver — turns a slide's optional `content.stepTiming`
 * preset PLUS per-step `step.enter` / `step.exit` overrides into the
 * concrete `{ duration, delay, ease }` values that `StepTimelineSlide`
 * passes to Framer Motion.
 *
 * Single source of truth: change a preset's numbers here and every step
 * in every deck that uses it picks up the new tempo.
 *
 * Spec: spec/slides/49-step-top-offset-and-timing.md.
 */
import type {
  SlideContent,
  StepAnimOverride,
  StepSpec,
  StepTimingPresetName,
} from './types';
// v0.124 — the in-deck animation scrubber can override the active preset
// at runtime so authors see the timing change live without editing JSON.
// Returns null (no override) when the scrubber is closed.
import { stepTimingPresetOverride } from './scrubOverride';

export type EasingValue = [number, number, number, number] | string;

export interface ResolvedStepTiming {
  /** Animation duration in seconds (Framer expects seconds, not ms). */
  duration: number;
  /** Delay before animation starts, seconds. */
  delay: number;
  /** Easing — bezier tuple OR named string. */
  ease: EasingValue;
  /**
   * Translate-Y distance (px) authored on `step.enter.offsetPx` /
   * `step.exit.offsetPx`. `null` when not authored — caller falls back
   * to its reveal-mode default (e.g. ±24px for `slide`, ±28px for the
   * exit). Lets a deck pin the EXACT motion distance for reproducibility.
   */
  offsetPx: number | null;
}

/** Concrete numbers per named preset. Times in MILLISECONDS for clarity;
 *  resolver converts to seconds for Framer. */
interface PresetShape {
  enter: { durationMs: number; easing: EasingValue };
  exit:  { durationMs: number; easing: EasingValue };
}

const EXPO_OUT: EasingValue = [0.16, 1, 0.3, 1];
const EASE_OUT: EasingValue = [0.22, 1, 0.36, 1];

export const STEP_TIMING_PRESETS: Record<StepTimingPresetName, PresetShape> = {
  instant:   { enter: { durationMs: 0,    easing: 'linear' }, exit: { durationMs: 0,   easing: 'linear' } },
  snappy:    { enter: { durationMs: 220,  easing: EASE_OUT }, exit: { durationMs: 180, easing: EASE_OUT } },
  smooth:    { enter: { durationMs: 480,  easing: EXPO_OUT }, exit: { durationMs: 320, easing: EXPO_OUT } },
  cinematic: { enter: { durationMs: 900,  easing: EXPO_OUT }, exit: { durationMs: 600, easing: EXPO_OUT } },
  dramatic:  { enter: { durationMs: 1400, easing: EXPO_OUT }, exit: { durationMs: 900, easing: EXPO_OUT } },
};

const DEFAULT_PRESET: StepTimingPresetName = 'smooth';

/**
 * Legacy reveal-order constants (in seconds), preserved as the default
 * cadence for backwards compatibility. Authors override per-slide via
 * `content.stepTiming.baseDelayMs` / `staggerMs`. Single source of truth
 * — `StepTimelineSlide` reads `resolveStepRevealOrder()` instead of
 * hard-coding these.
 */
export const DEFAULT_REVEAL_BASE_DELAY_MS = 300;
export const DEFAULT_REVEAL_STAGGER_MS = 180;

/** Clamp a value to [min, max], coerce to a finite number, fall back to `fallback`. */
function safeNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/** Pick the slide-level preset name + the slide-level enter/exit overrides
 *  out of `content.stepTiming`'s polymorphic shape. */
function readSlideTiming(stepTiming: SlideContent['stepTiming']): {
  presetName: StepTimingPresetName;
  enterOverride?: StepAnimOverride;
  exitOverride?: StepAnimOverride;
} {
  // v0.124 — runtime scrub override takes precedence over BOTH the slide
  // JSON's preset and per-side enter/exit overrides. This is a tuning-time
  // surface only (closing the scrubber clears it), so we intentionally drop
  // the per-side overrides too — authors expect the picked preset to drive
  // the entire enter+exit profile.
  const scrub = stepTimingPresetOverride();
  if (scrub) return { presetName: scrub };

  if (!stepTiming) return { presetName: DEFAULT_PRESET };
  if (typeof stepTiming === 'string') {
    return { presetName: STEP_TIMING_PRESETS[stepTiming] ? stepTiming : DEFAULT_PRESET };
  }
  return {
    presetName: stepTiming.preset && STEP_TIMING_PRESETS[stepTiming.preset]
      ? stepTiming.preset
      : DEFAULT_PRESET,
    enterOverride: stepTiming.enter,
    exitOverride:  stepTiming.exit,
  };
}

/**
 * Resolve the FINAL `{ duration, delay, ease }` for one step's enter
 * animation, applying the precedence chain:
 *
 *   1. `step.enter` (per-step JSON override) — highest priority
 *   2. `content.stepTiming.enter` (slide-level override)
 *   3. `content.stepTiming.preset.enter` (slide-level named preset)
 *   4. The hard-coded `DEFAULT_PRESET` ('smooth')
 *
 * `extraDelayMs` is the legacy stagger (`REVEAL_BASE_DELAY + i *
 * REVEAL_STAGGER`) — added on TOP of any explicit delay so the natural
 * reveal cadence is preserved unless the step explicitly overrides it.
 */
export function resolveStepEnter(
  step: StepSpec,
  contentTiming: SlideContent['stepTiming'],
  extraDelayMs = 0,
): ResolvedStepTiming {
  const { presetName, enterOverride } = readSlideTiming(contentTiming);
  const preset = STEP_TIMING_PRESETS[presetName].enter;

  const duration = safeNum(
    step.enter?.durationMs ?? enterOverride?.durationMs ?? preset.durationMs,
    0, 4000, preset.durationMs,
  );
  const explicitDelay = safeNum(
    step.enter?.delayMs ?? enterOverride?.delayMs ?? 0,
    0, 4000, 0,
  );
  const ease: EasingValue =
    step.enter?.easing ?? enterOverride?.easing ?? preset.easing;
  const offsetPx = resolveOffsetPx(step.enter?.offsetPx ?? enterOverride?.offsetPx);

  return {
    duration: duration / 1000,
    delay:    (explicitDelay + Math.max(0, extraDelayMs)) / 1000,
    ease,
    offsetPx,
  };
}

/** Mirror of `resolveStepEnter` for the exit side. */
export function resolveStepExit(
  step: StepSpec,
  contentTiming: SlideContent['stepTiming'],
): ResolvedStepTiming {
  const { presetName, exitOverride } = readSlideTiming(contentTiming);
  const preset = STEP_TIMING_PRESETS[presetName].exit;

  const duration = safeNum(
    step.exit?.durationMs ?? exitOverride?.durationMs ?? preset.durationMs,
    0, 4000, preset.durationMs,
  );
  const delay = safeNum(
    step.exit?.delayMs ?? exitOverride?.delayMs ?? 0,
    0, 4000, 0,
  );
  const ease: EasingValue =
    step.exit?.easing ?? exitOverride?.easing ?? preset.easing;
  const offsetPx = resolveOffsetPx(step.exit?.offsetPx ?? exitOverride?.offsetPx);

  return { duration: duration / 1000, delay: delay / 1000, ease, offsetPx };
}

/** Clamp a step's `topOffsetPx` to the spec range [-160, 160]. */
export function resolveStepTopOffset(step: StepSpec): number {
  return safeNum(step.topOffsetPx, -160, 160, 0);
}

/** Clamp the slide-level eyebrow+title vertical nudge to [-160, 160]. */
export function resolveSlideTopOffset(content: SlideContent): number {
  return safeNum(content.topOffsetPx, -160, 160, 0);
}

/**
 * Clamp an authored enter/exit motion distance to [-200, 200]px and return
 * `null` when not authored — `null` signals "use reveal-mode default".
 * Range exceeds the position-nudge clamp ([-160, 160]) because motion
 * distance is allowed to be more dramatic than resting offsets.
 */
function resolveOffsetPx(raw: number | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.max(-200, Math.min(200, n));
}

export interface ResolvedRevealOrder {
  /** Delay (ms) before the first row's reveal animation starts. */
  baseDelayMs: number;
  /** Additional delay (ms) added per row index — row `i` waits
   *  `baseDelayMs + i * staggerMs` before entering. */
  staggerMs: number;
}

/**
 * Resolve the slide-level reveal-order cadence.
 *
 *   - `baseDelayMs` clamped to [0, 4000], default 300.
 *   - `staggerMs`   clamped to [0, 2000], default 180.
 *
 * String form (`stepTiming: 'cinematic'`) and missing fields fall through
 * to the legacy defaults so existing decks render unchanged.
 */
export function resolveStepRevealOrder(
  contentTiming: SlideContent['stepTiming'],
): ResolvedRevealOrder {
  const base = DEFAULT_REVEAL_BASE_DELAY_MS;
  const stag = DEFAULT_REVEAL_STAGGER_MS;
  if (!contentTiming || typeof contentTiming === 'string') {
    return { baseDelayMs: base, staggerMs: stag };
  }
  return {
    baseDelayMs: safeNum(contentTiming.baseDelayMs, 0, 4000, base),
    staggerMs:   safeNum(contentTiming.staggerMs,   0, 2000, stag),
  };
}

/** Compute the per-row stagger delay (in MILLISECONDS) for row index `i`,
 *  honoring the slide's `baseDelayMs` + `staggerMs`. Pure helper used by
 *  `StepTimelineSlide` for both the reveal animation and the auto-advance
 *  kickoff timer. */
export function stepRevealDelayMs(
  contentTiming: SlideContent['stepTiming'],
  i: number,
): number {
  const { baseDelayMs, staggerMs } = resolveStepRevealOrder(contentTiming);
  return baseDelayMs + Math.max(0, i) * staggerMs;
}
