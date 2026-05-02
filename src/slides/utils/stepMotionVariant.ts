/**
 * stepMotionVariant — shared rotation that picks the entrance-animation
 * shape for a given step index across every step-driven slide type
 * (StepTimelineSlide, StepsChain3DSlide, and any future siblings).
 *
 * The contract is documented in `mem://design/step-row-motion-parity` and
 * the CSS keyframes live in `src/index.css` under
 * `.step-row[data-motion-variant="…"][data-state="active"] .step-title`.
 *
 * Why a fixed rotation, not random?
 *   - Deterministic: a 6-step deck always reads as L-S-P-L-S-P. Re-renders,
 *     hot reloads, and presenter back-navigation never reshuffle motion,
 *     so the talk's rhythm is reproducible.
 *   - Predictable for accessibility: a screen-reader user re-running the
 *     same step gets the same motion (or none under reduced-motion).
 *   - Cheap to override: a deck that wants a single variant can hard-code
 *     it; one that wants a different rotation can pass a custom array.
 */

export type StepMotionVariant = 'lift' | 'slide' | 'parallax';

/** Default rotation. Order chosen so adjacent variants feel maximally
 *  different (calm 2D rise → horizontal entry → 3D depth). */
export const DEFAULT_STEP_MOTION_ROTATION: readonly StepMotionVariant[] = [
  'lift',
  'slide',
  'parallax',
] as const;

/**
 * Resolve the motion variant for `index` in a step list.
 *
 *   stepMotionVariant(0) → 'lift'
 *   stepMotionVariant(1) → 'slide'
 *   stepMotionVariant(2) → 'parallax'
 *   stepMotionVariant(3) → 'lift'   (rotation wraps)
 *
 * Negative indices are clamped to 0 — they don't normally happen, but a
 * defensive default keeps the helper total over `number`.
 */
import { stepMotionOverride } from '../stepMotionOverride';

export function stepMotionVariant(
  index: number,
  rotation: readonly StepMotionVariant[] = DEFAULT_STEP_MOTION_ROTATION,
): StepMotionVariant {
  // Live deck-wide override (controller hamburger → "Step motion" picker)
  // wins over the rotation when set. Lets the presenter lock every step
  // to a single entrance (e.g. all-`slide`) without editing slide JSON.
  const override = stepMotionOverride();
  if (override) return override;
  if (rotation.length === 0) return 'lift';
  const i = Math.max(0, Math.floor(index));
  return rotation[i % rotation.length];
}
