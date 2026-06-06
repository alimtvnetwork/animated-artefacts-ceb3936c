/**
 * Spec confidence validator — a single pre-render gate that combines
 * every existing structural check into one scored report.
 *
 * Why this exists
 * ---------------
 * The codebase already ships strong validators (zod contracts, motion-
 * collision detector, density caps, catalog probe), but they're scattered
 * across `loader.ts` boot-time logs. When the user adds or hand-edits a
 * new slide they want ONE answer: *"did I use the schema correctly?"*
 *
 * This module aggregates the existing validators + two new lightweight
 * checks and returns a `SpecConfidenceReport`:
 *
 *   1. **Contract**       — runs `validateSlide()` per slide (zod, hard).
 *   2. **Animation rule** — `transition` / `textAnimation` must be a
 *      registered enum value AND adjacent linear slides must vary
 *      (delegates to `detectMotionCollisions`).
 *   3. **Unknown fields** — flags top-level slide keys that aren't on
 *      `SlideSpec`. Catches typos like `transitions` or `notesText`
 *      that the `.passthrough()` envelope would silently accept.
 *
 * The report carries a 0–100 `score` so dashboards / boot logs can
 * surface "spec confidence: 92/100" at a glance. Hard checks
 * (contract, unknown-enum) cost more than soft warnings (motion
 * variety, unknown fields).
 *
 * Public surface:
 *   - `auditSpecConfidence(slides)` → `SpecConfidenceReport`
 *   - `assertHighConfidence(slides, min=80)` → throws if score < min
 *
 * Never imports React — safe to call from `loader.ts`, tests, and the
 * `bun run` CLI.
 */
import { validateSlide, type SlideValidationIssue } from './contracts';
import { detectMotionCollisions, type MotionCollisionWarning } from './motionCollisions';
import { SlideTransition, TextAnimation } from './enums';
import type { SlideSpec } from './types';

/** Categorised issue surfaced by the confidence audit. */
export type SpecIssueCategory =
  | 'contract'        // hard — zod contract failed
  | 'unknown-enum'    // hard — transition/textAnimation not in registry
  | 'unknown-field'   // soft — top-level key not on SlideSpec
  | 'motion-variety'; // soft — adjacent slides share both animations

export interface SpecConfidenceIssue {
  category: SpecIssueCategory;
  /** `'hard'` issues subtract from the score and would refuse strict boot. */
  severity: 'hard' | 'soft';
  slideNumber: number | null;
  slideName: string | null;
  slideType: string | null;
  /** Dotted path inside the slide (e.g. `transition`, `content.steps.0.title`). */
  path: string;
  message: string;
  /** Concrete copy-pasteable suggestion. */
  fix: string;
}

export interface SpecConfidenceReport {
  /** 0–100. 100 = every slide passes every check. */
  score: number;
  totalSlides: number;
  /** All hard + soft findings combined. Ordered by slide then severity. */
  issues: readonly SpecConfidenceIssue[];
  /** Breakdown by category — handy for boot-log summaries. */
  counts: Record<SpecIssueCategory, number>;
  /** Adjective for the score band — UI/log uses it as a chip label. */
  band: 'excellent' | 'good' | 'fair' | 'poor';
}

/* ------------------------------------------------------------------ */
/* Whitelists derived from enums + SlideSpec                          */
/* ------------------------------------------------------------------ */

const TRANSITION_VALUES = new Set<string>(Object.values(SlideTransition));
const TEXT_ANIM_VALUES = new Set<string>(Object.values(TextAnimation));

/**
 * Top-level keys that legitimately appear on a SlideSpec. Source: the
 * `SlideSpec` interface in `src/slides/types.ts` (keep in sync when new
 * fields are added — the unit test guards parity).
 */
const KNOWN_SLIDE_FIELDS = new Set<string>([
  'slideNumber',
  'slideName',
  'slideType',
  'transition',
  'textAnimation',
  'enabled',
  'isClickReveal',
  'parentSlide',
  'showBrandHeader',
  'showPresenterChip',
  'brandStrip',
  'titleStyle',
  'titleShimmer',
  'notes',
  'sound',
  'ambientBackground',
  'content',
  // Authoring-only metadata tolerated by the runtime; not in SlideSpec
  // but commonly hand-written. Kept here so they don't trip the audit.
  'densityCheck',
  'theme',
  // One-line author-facing summary of the slide's single idea. Used in deck
  // JSON for review/outline tooling; not part of SlideSpec, ignored at render.
  'narrowIdea',
]);

/* ------------------------------------------------------------------ */
/* Per-check translators                                              */
/* ------------------------------------------------------------------ */

function contractToIssue(i: SlideValidationIssue): SpecConfidenceIssue {
  return {
    category: 'contract',
    severity: 'hard',
    slideNumber: i.slideNumber,
    slideName: i.slideName,
    slideType: i.slideType,
    path: i.path,
    message: i.message,
    fix: 'Open `src/slides/contracts.ts` and align the JSON with the per-type zod schema.',
  };
}

function motionToIssue(w: MotionCollisionWarning): SpecConfidenceIssue {
  return {
    category: 'motion-variety',
    severity: 'soft',
    slideNumber: w.slideNumber,
    slideName: w.slideName,
    slideType: w.slideType,
    path: w.path,
    message: w.message,
    fix: `Change either \`transition\` or \`textAnimation\` so this slide differs from #${w.neighborSlideNumber}.`,
  };
}

function enumIssue(
  raw: Partial<SlideSpec> | null,
  field: 'transition' | 'textAnimation',
  value: unknown,
  registry: Set<string>,
): SpecConfidenceIssue {
  return {
    category: 'unknown-enum',
    severity: 'hard',
    slideNumber: typeof raw?.slideNumber === 'number' ? raw.slideNumber : null,
    slideName: typeof raw?.slideName === 'string' ? raw.slideName : null,
    slideType: typeof raw?.slideType === 'string' ? raw.slideType : null,
    path: field,
    message: `${field} = ${JSON.stringify(value)} is not a registered enum value.`,
    fix: `Use one of: ${[...registry].join(', ')}.`,
  };
}

function unknownFieldIssue(
  raw: Partial<SlideSpec> | null,
  key: string,
): SpecConfidenceIssue {
  return {
    category: 'unknown-field',
    severity: 'soft',
    slideNumber: typeof raw?.slideNumber === 'number' ? raw.slideNumber : null,
    slideName: typeof raw?.slideName === 'string' ? raw.slideName : null,
    slideType: typeof raw?.slideType === 'string' ? raw.slideType : null,
    path: key,
    message: `Unknown top-level field "${key}" — slide envelopes use \`.passthrough()\`, so this won't error but will silently do nothing.`,
    fix: `Move the value under \`content\`, rename the key, or delete it.`,
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Run every structural check the renderer cares about against a deck.
 * Pure function — no I/O, no logging, no React. Returns a fully formed
 * report so callers (boot log, test, CLI, debug overlay) all see the
 * same shape.
 */
export function auditSpecConfidence(
  slides: readonly unknown[],
): SpecConfidenceReport {
  const issues: SpecConfidenceIssue[] = [];
  const valid: SlideSpec[] = [];

  // ---- Per-slide checks: contract + enum tokens + unknown fields ----
  for (const raw of slides) {
    const r = validateSlide(raw);
    if (r.ok) valid.push(r.slide);
    else issues.push(...r.issues.map(contractToIssue));

    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const rawTyped = obj as Partial<SlideSpec>;

    // Animation-enum check — independent of the zod pass so we report a
    // specific "not a registered enum" message instead of zod's generic one.
    if (obj.transition !== undefined && !TRANSITION_VALUES.has(String(obj.transition))) {
      issues.push(enumIssue(rawTyped, 'transition', obj.transition, TRANSITION_VALUES));
    }
    if (obj.textAnimation !== undefined && !TEXT_ANIM_VALUES.has(String(obj.textAnimation))) {
      issues.push(enumIssue(rawTyped, 'textAnimation', obj.textAnimation, TEXT_ANIM_VALUES));
    }

    // Unknown-top-level-field check — catches typos that the
    // `.passthrough()` envelope would silently absorb.
    for (const key of Object.keys(obj)) {
      if (!KNOWN_SLIDE_FIELDS.has(key)) {
        issues.push(unknownFieldIssue(rawTyped, key));
      }
    }
  }

  // ---- Deck-level: motion variety ----
  // Only run over slides that parsed cleanly; otherwise the collision
  // detector would crash on missing animation fields.
  const linear = valid.filter((s) => !s.isClickReveal && s.enabled !== false);
  for (const w of detectMotionCollisions(linear)) {
    issues.push(motionToIssue(w));
  }

  // ---- Score: hard issues cost 10 pts, soft cost 2 pts (clamped 0–100) ----
  const counts: Record<SpecIssueCategory, number> = {
    'contract': 0,
    'unknown-enum': 0,
    'unknown-field': 0,
    'motion-variety': 0,
  };
  let penalty = 0;
  for (const i of issues) {
    counts[i.category] += 1;
    penalty += i.severity === 'hard' ? 10 : 2;
  }
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const band: SpecConfidenceReport['band'] =
    score >= 95 ? 'excellent' : score >= 80 ? 'good' : score >= 50 ? 'fair' : 'poor';

  // Stable ordering: slide number asc, then hard before soft.
  issues.sort((a, b) => {
    const an = a.slideNumber ?? Infinity;
    const bn = b.slideNumber ?? Infinity;
    if (an !== bn) return an - bn;
    if (a.severity !== b.severity) return a.severity === 'hard' ? -1 : 1;
    return a.category.localeCompare(b.category);
  });

  return {
    score,
    totalSlides: slides.length,
    issues: Object.freeze(issues),
    counts,
    band,
  };
}

/**
 * Throw if the score falls below `minScore`. Use in pre-deploy CI or in
 * `?validation=strict` boots to refuse rendering a low-confidence deck.
 */
export function assertHighConfidence(
  slides: readonly unknown[],
  minScore = 80,
): SpecConfidenceReport {
  const report = auditSpecConfidence(slides);
  if (report.score < minScore) {
    const hard = report.issues.filter((i) => i.severity === 'hard');
    const lines = hard.slice(0, 8).map(
      (i) =>
        `  • Slide #${i.slideNumber ?? '?'} "${i.slideName ?? '?'}" ` +
        `[${i.category}] ${i.path}: ${i.message}`,
    );
    const tail = hard.length > 8 ? `\n  … and ${hard.length - 8} more` : '';
    throw new Error(
      `[deck] Spec confidence ${report.score}/100 (${report.band}) — ` +
        `below required ${minScore}.\n${lines.join('\n')}${tail}\n` +
        `Run \`bun run scripts/audit-spec-confidence.ts\` for the full list.`,
    );
  }
  return report;
}
