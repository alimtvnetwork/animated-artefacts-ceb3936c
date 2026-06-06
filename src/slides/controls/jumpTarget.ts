/**
 * Shared slide-jump parsing + validation.
 *
 * Both the controller's `SlideIndicator` and the dot-pagination `…` gap token
 * accept free-typed slide numbers. This module is the single source of truth
 * for turning raw input into either a valid 1-based slide number or a typed
 * error reason, so both entry points fail loudly and identically (rule 9: DRY).
 */

/** Empty input → silent cancel; numbers out of range → typed error reason. */
export type JumpResolution =
  | { kind: 'cancel' }
  | { kind: 'ok'; slide: number }
  | { kind: 'nan' }
  | { kind: 'tooLow' }
  | { kind: 'tooHigh'; slide: number };

/** Pure parse: never throws, never side-effects. */
export function resolveJumpTarget(raw: string, total: number): JumpResolution {
  const trimmed = raw.trim();
  if (trimmed === '') return { kind: 'cancel' };
  const slide = parseInt(trimmed, 10);
  if (Number.isNaN(slide)) return { kind: 'nan' };
  if (slide < 1) return { kind: 'tooLow' };
  if (slide > total) return { kind: 'tooHigh', slide };
  return { kind: 'ok', slide };
}
