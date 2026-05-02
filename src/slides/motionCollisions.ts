/**
 * Motion-collision detector — enforces the variety rule from
 * `spec/slides/llm/13-motion-system.md` §1:
 *
 *   > Consecutive slides must not pair the same `transition` +
 *   > `textAnimation`. The deck reads as one cinematic flow.
 *
 * # What counts as a collision
 * A pair of *adjacent linear slides* (`linearSlides[i]` and
 * `linearSlides[i+1]`) where BOTH `transition` and `textAnimation`
 * match. Click-reveal slides are excluded — they're triggered out of
 * flow, never seen back-to-back with their parent in the linear cadence.
 *
 * # What we deliberately don't flag
 *   - Two slides three apart that match — variety is judged on adjacency,
 *     not deck-wide uniqueness. The audience only perceives back-to-back.
 *   - A single matching axis (e.g. both use `SlideIn` transition but
 *     different `textAnimation`) — the spec lets one axis carry over so
 *     authors can intentionally reinforce a section's pacing.
 *
 * # Output shape
 * Mirrors `SlideValidationIssue` (contracts.ts) so the existing
 * `ContractIssuesOverlay` can render motion warnings alongside contract
 * failures with zero new UI. Each warning carries the *second* slide of
 * the colliding pair (the one that should change to break the tie) plus
 * a `neighborSlideNumber` field pointing at its predecessor.
 */
import type { SlideSpec } from './types';

/** A structured warning emitted per colliding pair. */
export interface MotionCollisionWarning {
  /** Slide that should change to break the collision — i.e. the *later*
   *  of the two adjacent slides. Authors usually edit forward, so we
   *  pin the warning to the slide they last touched. */
  slideNumber: number;
  slideName: string | null;
  slideType: string | null;
  /** The predecessor slide whose motion this one duplicates. Surfaced
   *  so the warning row reads "matches slide #4". */
  neighborSlideNumber: number;
  /** Both axes that collided. Always both populated — single-axis
   *  matches are intentionally not flagged (see file header). */
  transition: string;
  textAnimation: string;
  /** Dotted path used by the overlay's monospaced "where to fix" column. */
  path: string;
  /** Human-readable, copy-pasteable into a bug ticket. */
  message: string;
}

/**
 * Walk the supplied (already linear-ordered) slide list once and emit
 * one warning per adjacent pair that duplicates BOTH motion axes.
 *
 * Pure function — no I/O, no `console`. Callers (loader, tests) decide
 * how to surface the result. Stable output: same input always produces
 * the same warning ordering, so snapshot tests stay deterministic.
 */
export function detectMotionCollisions(
  linearSlides: readonly SlideSpec[],
): readonly MotionCollisionWarning[] {
  const warnings: MotionCollisionWarning[] = [];
  for (let i = 1; i < linearSlides.length; i++) {
    const prev = linearSlides[i - 1];
    const curr = linearSlides[i];
    if (
      prev.transition === curr.transition &&
      prev.textAnimation === curr.textAnimation
    ) {
      warnings.push({
        slideNumber: curr.slideNumber,
        slideName: curr.slideName ?? null,
        slideType: curr.slideType ?? null,
        neighborSlideNumber: prev.slideNumber,
        transition: curr.transition,
        textAnimation: curr.textAnimation,
        // Two paths separated by ` / ` so the overlay row hints at
        // either axis being a valid fix — change one, the collision
        // disappears.
        path: 'transition / textAnimation',
        message:
          `Motion collision: same transition (${curr.transition}) and ` +
          `textAnimation (${curr.textAnimation}) as slide #${prev.slideNumber}. ` +
          `Vary one axis to keep the deck cinematic.`,
      });
    }
  }
  return Object.freeze(warnings);
}
