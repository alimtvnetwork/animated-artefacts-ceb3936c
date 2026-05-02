/**
 * Deck-load preprocessor — migrates legacy `description.body` prose into
 * `description.bullets[]` on `StepsChain3DSlide` steps before the loader
 * runs schema validation.
 *
 * # Why a preprocessor?
 * The runtime contract still tolerates `body` (it auto-splits at render),
 * but having the migration happen *once at load* means:
 *   1. The validator only ever sees normalized data → boot diagnostics
 *      stay clean for legacy decks.
 *   2. Anything downstream (overlays, exports, AT readers) gets the same
 *      shape regardless of the deck's age.
 *   3. The builder's "Convert to bullets" action and this loader path
 *      share `splitProseToBullets`, so authors can never observe a
 *      different bullet split between editor and runtime.
 *
 * # Behaviour
 * For every `StepsChain3DSlide` step with a non-empty `description.body`:
 *  - Append the split fragments to existing `bullets[]` (capped at 6 total).
 *  - Drop the `body` field afterwards — keyword-only contract is final.
 * String-typed `description` (rare legacy export shape) is wrapped into
 * `{ body: <str> }` first, then put through the same path.
 *
 * # Audit
 * Every migration is appended to the returned audit array so the loader
 * can console.info a one-line summary at boot ("normalized N steps across
 * M slides") and so the audit overlay can list the exact slides touched.
 *
 * # Idempotent
 * Running the function twice is a no-op the second time — the first pass
 * removed every `body`, so the second pass finds nothing to migrate.
 *
 * # Mutation contract
 * Mirrors `stripRejectedBrandStrip` in `loader.ts`: mutates the passed-in
 * slides in place and also returns the audit so callers can choose to log
 * or surface it.
 */
import type { SlideSpec } from './types';
import { splitProseToBullets } from './proseToBullets';

export interface BulletNormalizationEntry {
  /** `imported` = localStorage manifest; `bundled` = spec/26-slide-definitions JSON. */
  source: 'imported' | 'bundled';
  slideNumber: number;
  slideName?: string;
  stepIndex: number;
  /** Original `body` string, trimmed. Useful for the audit row + before/after diffs. */
  fromBody: string;
  /** Bullets the body was split into (added to whatever was already there). */
  addedBullets: string[];
  /** Total bullet count after the migration (capped at 6). */
  finalCount: number;
}

interface Step3DLoose {
  description?: unknown;
  [k: string]: unknown;
}

/**
 * Run the preprocessor over a list of slides. Mutates `description` on any
 * StepsChain3D step with legacy prose. Returns one audit entry per
 * migrated step (empty array when nothing was touched).
 */
export function normalize3DBullets(
  slides: SlideSpec[],
  source: 'imported' | 'bundled',
): BulletNormalizationEntry[] {
  const audit: BulletNormalizationEntry[] = [];
  for (const slide of slides) {
    if (slide.slideType !== 'StepsChain3DSlide') continue;
    const steps = (slide.content as { steps?: Step3DLoose[] } | undefined)?.steps;
    if (!Array.isArray(steps)) continue;

    steps.forEach((step, stepIndex) => {
      // Coerce the rare string-typed legacy description into the canonical
      // object shape so the rest of the function only handles one path.
      if (typeof step.description === 'string') {
        step.description = { body: step.description };
      }
      const desc = step.description;
      if (!desc || typeof desc !== 'object') return;

      const d = desc as { title?: string; bullets?: string[]; meta?: string; body?: string };
      const body = typeof d.body === 'string' ? d.body.trim() : '';
      if (!body) {
        // No prose to migrate. If `body` was an empty string, strip it so
        // the validator doesn't see a meaningless legacy field.
        if ('body' in d) delete d.body;
        return;
      }

      const existing = Array.isArray(d.bullets) ? d.bullets.filter((b): b is string => typeof b === 'string' && b.trim().length > 0) : [];
      const remaining = Math.max(0, 6 - existing.length);
      const fragments = splitProseToBullets(body).slice(0, remaining);

      if (fragments.length === 0 && existing.length === 0) {
        // Body had no usable fragments AND no bullets exist. Drop the body
        // anyway — the validator will then surface the empty-description
        // error with the proper "add bullets[]" guidance instead of a
        // confusing "unexpected body field" message.
        delete d.body;
        return;
      }

      const merged = [...existing, ...fragments];
      d.bullets = merged;
      delete d.body;

      // Only audit when something actually changed (i.e. fragments were
      // added). A body-only-strip with no new bullets is a contract clean-up,
      // not a content migration, and would just clutter the report.
      if (fragments.length > 0) {
        audit.push({
          source,
          slideNumber: slide.slideNumber,
          slideName: slide.slideName,
          stepIndex,
          fromBody: body,
          addedBullets: fragments,
          finalCount: merged.length,
        });
      }
    });
  }
  return audit;
}
