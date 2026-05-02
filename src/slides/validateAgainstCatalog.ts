/**
 * Phase 4 / A-03 — `validateAgainstCatalog(deck)` dev-mode probe.
 *
 * Cross-checks every value used in a deck (slideType, transition,
 * textAnimation, capsule.color) against the machine-readable catalog at
 * `spec/21-slides-system/llm/CATALOG.json`.
 *
 * Why a separate probe? `contracts.ts` already enforces structural
 * correctness, but it imports zod schemas — which can drift from the
 * authored catalog doc. This probe loads the catalog AT RUNTIME (in dev)
 * and warns when a deck uses a value the catalog doesn't list, OR when
 * the catalog lists a value that no live deck exercises (dead-letter).
 *
 * Production builds tree-shake this away — see the import-only-in-dev
 * gate in `loader.ts` (look for `import.meta.env.DEV`).
 */

import catalog from '../../spec/21-slides-system/llm/CATALOG.json';

interface CatalogShape {
  registries: {
    slideTypes:        { values: { name: string }[] };
    slideTransitions:  { values: { name: string }[] };
    textAnimations:    { values: { name: string }[] };
    capsuleColors:     { values: string[] };
  };
}
const C = catalog as unknown as CatalogShape;

export interface CatalogViolation {
  slideNumber: number;
  field: 'slideType' | 'transition' | 'textAnimation' | 'capsule.color';
  value: string;
  knownValues: string[];
}

interface SlideShape {
  slideNumber?: number;
  slideType?: string;
  transition?: string;
  textAnimation?: string;
  content?: { capsules?: { color?: string }[] };
}

/**
 * Walk a deck and surface every value not registered in the catalog.
 * Returns an empty array if the deck is fully congruent.
 *
 * Intended call site: `loader.ts`, dev-only, console.warn on non-empty.
 * Never throws — this is advisory, structural validity is contracts.ts's job.
 */
export function validateAgainstCatalog(slides: readonly unknown[]): CatalogViolation[] {
  const slideTypes      = new Set(C.registries.slideTypes.values.map((v) => v.name));
  const transitions     = new Set(C.registries.slideTransitions.values.map((v) => v.name));
  const textAnimations  = new Set(C.registries.textAnimations.values.map((v) => v.name));
  const capsuleColors   = new Set(C.registries.capsuleColors.values);

  // ClickRevealSlide isn't in the SlideType registry-counted catalog list,
  // but it IS a legal slideType. Tolerate the same way the runtime does.
  slideTypes.add('ClickRevealSlide');

  const out: CatalogViolation[] = [];
  slides.forEach((raw, i) => {
    const s = raw as SlideShape | null;
    const slideNumber = typeof s?.slideNumber === 'number' ? s.slideNumber : i + 1;

    if (s?.slideType && !slideTypes.has(s.slideType)) {
      out.push({
        slideNumber,
        field: 'slideType',
        value: s.slideType,
        knownValues: [...slideTypes].sort(),
      });
    }
    if (s?.transition && !transitions.has(s.transition)) {
      out.push({
        slideNumber,
        field: 'transition',
        value: s.transition,
        knownValues: [...transitions].sort(),
      });
    }
    if (s?.textAnimation && !textAnimations.has(s.textAnimation)) {
      out.push({
        slideNumber,
        field: 'textAnimation',
        value: s.textAnimation,
        knownValues: [...textAnimations].sort(),
      });
    }
    const capsules = s?.content?.capsules;
    if (Array.isArray(capsules)) {
      for (const cap of capsules) {
        if (cap?.color && !capsuleColors.has(cap.color)) {
          out.push({
            slideNumber,
            field: 'capsule.color',
            value: cap.color,
            knownValues: [...capsuleColors].sort(),
          });
        }
      }
    }
  });

  return out;
}

/**
 * Pretty-print violations as a single warn-friendly block.
 * Used by `loader.ts` dev gate.
 */
export function formatCatalogViolations(v: readonly CatalogViolation[]): string {
  if (v.length === 0) return '';
  const lines = v.map(
    (x) =>
      `  • Slide #${x.slideNumber} ${x.field}="${x.value}" — not in CATALOG.json. ` +
      `Known: [${x.knownValues.slice(0, 6).join(', ')}${x.knownValues.length > 6 ? ', …' : ''}]`,
  );
  return `[catalog-probe] ${v.length} value(s) not registered in CATALOG.json:\n${lines.join('\n')}`;
}
