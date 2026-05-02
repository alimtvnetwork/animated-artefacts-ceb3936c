#!/usr/bin/env bun
/**
 * Phase 4 / A-04 — CI guard against `enums.ts` ↔ `CATALOG.json` drift.
 *
 * Compares:
 *   • src/slides/enums.ts  → SlideType / SlideTransition / TextAnimation /
 *                            CapsuleColor / ControllerPosition
 *   • spec/21-slides-system/llm/CATALOG.json
 *
 * Fails the CI job (exit 1) if either side declares a value the other
 * doesn't. Single source of truth was easy to forget when adding a new
 * slide type — this script makes the forget impossible at PR time.
 *
 * Wired in `.github/workflows/ci.yml` as the "Catalog ↔ enums drift" step.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SlideType,
  SlideTransition,
  TextAnimation,
  CapsuleColor,
  ControllerPosition,
} from '../src/slides/enums';

interface CatalogShape {
  registries: {
    slideTypes:          { values: { name: string }[] };
    slideTransitions:    { values: { name: string }[] };
    textAnimations:      { values: { name: string }[] };
    capsuleColors:       { values: string[] };
    controllerPositions: { values: string[] };
  };
}

const CATALOG_PATH = resolve(__dirname, '../spec/21-slides-system/llm/CATALOG.json');
const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8')) as CatalogShape;

// ClickRevealSlide is a real SlideType but is intentionally NOT counted in
// the catalog `slideTypes` list (it's a hidden navigation target, see
// CATALOG.json `slideTypes.count` comment). Exclude it on BOTH sides so
// the diff stays clean whether or not authors choose to surface it.
const SLIDE_TYPE_EXCLUDE = new Set(['ClickRevealSlide']);

interface DriftReport {
  registry: string;
  inEnumOnly: string[];
  inCatalogOnly: string[];
}

function diff(
  registry: string,
  enumValues: string[],
  catalogValues: string[],
  exclude: Set<string> = new Set(),
): DriftReport {
  const enumSet = new Set(enumValues.filter((v) => !exclude.has(v)));
  const catSet  = new Set(catalogValues.filter((v) => !exclude.has(v)));
  return {
    registry,
    inEnumOnly:    [...enumSet].filter((v) => !catSet.has(v)).sort(),
    inCatalogOnly: [...catSet].filter((v) => !enumSet.has(v)).sort(),
  };
}

const reports: DriftReport[] = [
  diff(
    'slideTypes',
    Object.values(SlideType),
    catalog.registries.slideTypes.values.map((v) => v.name),
    SLIDE_TYPE_EXCLUDE,
  ),
  diff(
    'slideTransitions',
    Object.values(SlideTransition),
    catalog.registries.slideTransitions.values.map((v) => v.name),
  ),
  diff(
    'textAnimations',
    Object.values(TextAnimation),
    catalog.registries.textAnimations.values.map((v) => v.name),
  ),
  diff(
    'capsuleColors',
    Object.values(CapsuleColor),
    catalog.registries.capsuleColors.values,
  ),
  diff(
    'controllerPositions',
    Object.values(ControllerPosition),
    catalog.registries.controllerPositions.values,
  ),
];

const drift = reports.filter((r) => r.inEnumOnly.length > 0 || r.inCatalogOnly.length > 0);
if (drift.length === 0) {
  console.log('✓ enums.ts ↔ CATALOG.json are in sync.');
  process.exit(0);
}

console.error('::error::enums.ts ↔ CATALOG.json drift detected.');
for (const r of drift) {
  console.error(`\n[${r.registry}]`);
  if (r.inEnumOnly.length)    console.error(`  In enums.ts only:    ${r.inEnumOnly.join(', ')}`);
  if (r.inCatalogOnly.length) console.error(`  In CATALOG.json only: ${r.inCatalogOnly.join(', ')}`);
}
console.error(
  '\nFix: update spec/21-slides-system/llm/CATALOG.json to match src/slides/enums.ts ' +
  '(or vice-versa) in the same patch. See spec/21-slides-system/llm/22-add-new-slide-type.md.',
);
process.exit(1);
