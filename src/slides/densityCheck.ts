/**
 * Phase 4 / A-02 — `densityCheck` enforcement.
 *
 * Implements the project's Core "Narrow Idea Per Slide" rule
 * (see `mem://features/folder-structure` and addendum 29). Every
 * slide JSON may declare a `densityCheck` block of soft caps — at boot
 * we count actual content and throw if any cap is exceeded.
 *
 * This is intentionally a SECOND validation pass after `assertValidSlides`
 * — zod handles per-type structural rules; `densityCheck` enforces the
 * cross-cutting "one idea per slide" cap that no single zod schema owns.
 *
 * Caps recognised today (extend as new slide types land):
 *   - capColumns      — DataTableSlide.dataColumns.length
 *   - capRows         — DataTableSlide.dataRows.length
 *   - capEntities     — DatabaseDiagramSlide.dbEntities.length
 *   - capRelationships— DatabaseDiagramSlide.dbRelationships.length
 *   - capKeywords     — KeywordSlide.keywords.length
 *   - capCapsules     — CapsuleListSlide.capsules.length
 *   - capSteps        — *TimelineSlide / StepsChain3DSlide steps[].length
 *   - capMetrics      — MetricGridSlide.metrics.length
 *   - capNumbers      — NumberCalloutSlide always 1; flag if author tries to add an array
 *   - capTerms        — EquationSlide.equationTerms?.length
 */

export interface DensityCap {
  capColumns?: number;
  capRows?: number;
  capEntities?: number;
  capRelationships?: number;
  capKeywords?: number;
  capCapsules?: number;
  capSteps?: number;
  capMetrics?: number;
  capNumbers?: number;
  capTerms?: number;
  /** ChecklistSlide — items[] count. Spec 62. */
  capItems?: number;
  /** MediaGridSlide — mediaTiles[] count. ≤6. */
  capTiles?: number;
}

export interface DensityViolation {
  slideNumber: number;
  slideName: string;
  slideType: string;
  field: string;
  actual: number;
  cap: number;
}

interface SlideShape {
  slideNumber?: number;
  slideName?: string;
  slideType?: string;
  densityCheck?: DensityCap & Record<string, unknown>;
  content?: Record<string, unknown>;
}

/** Map of cap-key → (slide) => actual count, or undefined if not measurable. */
const COUNTERS: Record<keyof DensityCap, (s: SlideShape) => number | undefined> = {
  capColumns:       (s) => arr(s.content?.dataColumns)?.length,
  capRows:          (s) => arr(s.content?.dataRows)?.length,
  capEntities:      (s) => arr(s.content?.dbEntities ?? s.content?.entities)?.length,
  capRelationships: (s) => arr(s.content?.dbRelationships ?? s.content?.relationships)?.length,
  capKeywords:      (s) => arr(s.content?.keywords)?.length,
  capCapsules:      (s) => arr(s.content?.capsules)?.length,
  capSteps:         (s) => arr(s.content?.steps)?.length,
  capMetrics:       (s) => arr(s.content?.metrics)?.length,
  capNumbers:       (s) => (s.content?.number ? 1 : arr(s.content?.numbers)?.length),
  capTerms:         (s) => arr(s.content?.equationTerms)?.length,
  capItems:         (s) => arr(s.content?.items)?.length,
};

const arr = (v: unknown): unknown[] | undefined => (Array.isArray(v) ? v : undefined);

/**
 * Walk every slide that declares `densityCheck`, count its content, and
 * collect violations. Slides without `densityCheck` are skipped — caps are
 * opt-in per slide (defined in spec/26-slide-definitions/**).
 */
export function checkDensity(slides: readonly unknown[]): DensityViolation[] {
  const violations: DensityViolation[] = [];
  for (const raw of slides) {
    const s = raw as SlideShape | null;
    const caps = s?.densityCheck;
    if (!caps || typeof caps !== 'object') continue;
    const slideNumber = typeof s?.slideNumber === 'number' ? s.slideNumber : 0;
    const slideName   = typeof s?.slideName === 'string' ? s.slideName : '?';
    const slideType   = typeof s?.slideType === 'string' ? s.slideType : '?';
    for (const key of Object.keys(COUNTERS) as (keyof DensityCap)[]) {
      const cap = caps[key];
      if (typeof cap !== 'number') continue;
      const actual = COUNTERS[key](s as SlideShape);
      if (typeof actual !== 'number') continue;
      if (actual > cap) {
        violations.push({ slideNumber, slideName, slideType, field: key, actual, cap });
      }
    }
  }
  return violations;
}

/**
 * Throw at boot if any slide breaks its declared density cap.
 * Mirrors the `assertValidSlides` shape — multi-line message naming every
 * offender.
 */
export function assertDensity(slides: readonly unknown[]): void {
  const v = checkDensity(slides);
  if (v.length === 0) return;
  const lines = v.map(
    (x) =>
      `  • Slide #${x.slideNumber} "${x.slideName}" (${x.slideType}) — ${x.field}: ${x.actual} > cap ${x.cap}`,
  );
  throw new Error(
    `[deck] Density-cap violations (Narrow Idea Per Slide rule):\n${lines.join('\n')}`,
  );
}
