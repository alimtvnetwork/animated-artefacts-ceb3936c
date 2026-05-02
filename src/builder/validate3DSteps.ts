/**
 * Hard pre-save validation for 3D step decks.
 *
 * Runtime contracts (`src/slides/contracts.ts`) still tolerate the legacy
 * `description.body` prose field — render code auto-splits it into bullets so
 * existing decks don't crash. The builder, however, is the place where
 * authors create *new* content, and we want the keyword-only rule to be
 * absolute there: no `body` strings, no missing/empty `bullets[]`, no string
 * descriptions.
 *
 * This module surfaces the rule as a hard gate. `findStepsChain3DProseErrors`
 * returns one entry per offending step (slide number, step index, reason)
 * and `assertNoStepsChain3DProse` throws with a multi-line summary suitable
 * for a toast.
 *
 * Wired into BuilderPage save paths: handleExport, handleLoadAsActive,
 * copyManifest. Save is blocked when any 3D step still uses prose.
 */
import type { SlideSpec } from '../slides/types';

export interface ProseError {
  slideNumber: number;
  slideName?: string;
  stepIndex: number;
  /** Human-readable reason: "uses description.body" / "missing bullets[]" / "description is a string" */
  reason: string;
}

interface Step3DLite {
  description?: unknown;
}

function checkStep(step: Step3DLite, slideNumber: number, slideName: string | undefined, stepIndex: number): ProseError | null {
  const desc = step.description;
  if (desc === undefined || desc === null) return null;

  // String description = prose. Hard fail.
  if (typeof desc === 'string') {
    return {
      slideNumber, slideName, stepIndex,
      reason: 'description is a prose string — use description.bullets[] instead',
    };
  }

  if (typeof desc !== 'object') return null;
  const d = desc as Record<string, unknown>;

  // body present and non-empty = legacy prose. Hard fail.
  if (typeof d.body === 'string' && d.body.trim().length > 0) {
    return {
      slideNumber, slideName, stepIndex,
      reason: 'description.body is set — move the content into description.bullets[] (1–6 keyword strings)',
    };
  }

  // bullets present but empty / non-array
  if ('bullets' in d) {
    const b = d.bullets;
    if (!Array.isArray(b) || b.length === 0) {
      return {
        slideNumber, slideName, stepIndex,
        reason: 'description.bullets must be a non-empty string[] (1–6 keywords)',
      };
    }
    if (b.some(x => typeof x !== 'string' || x.trim().length === 0)) {
      return {
        slideNumber, slideName, stepIndex,
        reason: 'description.bullets contains an empty / non-string entry',
      };
    }
  }

  return null;
}

export function findStepsChain3DProseErrors(slides: SlideSpec[]): ProseError[] {
  const errors: ProseError[] = [];
  for (const slide of slides) {
    if (slide.slideType !== 'StepsChain3DSlide') continue;
    const steps = (slide.content as { steps?: Step3DLite[] } | undefined)?.steps;
    if (!Array.isArray(steps)) continue;
    steps.forEach((step, i) => {
      const err = checkStep(step, slide.slideNumber, slide.slideName, i);
      if (err) errors.push(err);
    });
  }
  return errors;
}

/**
 * Format errors into a toast-friendly multi-line message.
 * First line is the headline; following lines list each offending step.
 */
export function formatProseErrors(errors: ProseError[]): string {
  if (errors.length === 0) return '';
  const lines = [
    `${errors.length} 3D step${errors.length === 1 ? '' : 's'} still use prose. Save blocked.`,
    '',
    ...errors.slice(0, 6).map(e =>
      `• Slide ${e.slideNumber}${e.slideName ? ` (${e.slideName})` : ''} · step ${e.stepIndex + 1}: ${e.reason}`,
    ),
  ];
  if (errors.length > 6) lines.push(`…and ${errors.length - 6} more`);
  lines.push('', 'Open the slide editor and use the bullets[] repeater to fix.');
  return lines.join('\n');
}

/** Throws a typed error if any 3D step uses prose. Use at save/export sites. */
export class StepsChain3DProseError extends Error {
  constructor(public readonly errors: ProseError[]) {
    super(formatProseErrors(errors));
    this.name = 'StepsChain3DProseError';
  }
}

export function assertNoStepsChain3DProse(slides: SlideSpec[]): void {
  const errors = findStepsChain3DProseErrors(slides);
  if (errors.length > 0) throw new StepsChain3DProseError(errors);
}
