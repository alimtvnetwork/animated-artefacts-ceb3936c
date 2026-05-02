#!/usr/bin/env node
/**
 * Click-reveal dependency audit — CLI entrypoint.
 *
 * Usage:
 *   tsx scripts/audit-click-reveal.ts                       # audits showcase deck
 *   tsx scripts/audit-click-reveal.ts navy-showcase         # audits a specific deck
 *   tsx scripts/audit-click-reveal.ts --all                 # audits every bundled deck
 *
 * Exit code: non-zero when any deck has at least one `error`-severity issue.
 * Suitable for wiring into CI:
 *
 *   - run: tsx scripts/audit-click-reveal.ts --all
 *
 * # Why a separate script (not just the `/click-reveal-audit` page)
 * The page is great for interactive triage but doesn't fit CI. This script
 * shares the exact same analyzer (`auditClickRevealDependencies`) so the
 * two views can never drift.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { auditClickRevealDependencies, formatClickRevealReport } from '../src/slides/clickRevealAudit';
import type { SlideSpec } from '../src/slides/types';

const SPEC_ROOT = resolve(__dirname, '..', 'front-end', 'project');

function listDeckSlugs(): string[] {
  return readdirSync(SPEC_ROOT)
    .filter((name) => {
      const p = join(SPEC_ROOT, name);
      try { return statSync(p).isDirectory(); } catch { return false; }
    })
    .sort();
}

function loadDeckSlides(slug: string): SlideSpec[] {
  const dir = join(SPEC_ROOT, slug, 'data', 'slides');
  const slides: SlideSpec[] = [];
  let names: string[] = [];
  try { names = readdirSync(dir); } catch { return slides; }
  for (const name of names) {
    if (!name.endsWith('.json')) continue;
    const raw = readFileSync(join(dir, name), 'utf8');
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj.slideNumber === 'number') slides.push(obj as SlideSpec);
    } catch (err) {
      console.error(`  [WARN] failed to parse ${slug}/${name}:`, (err as Error).message);
    }
  }
  return slides.sort((a, b) => a.slideNumber - b.slideNumber);
}

function auditDeck(slug: string): number {
  const slides = loadDeckSlides(slug);
  if (slides.length === 0) {
    console.log(`\n=== ${slug} === (no slides found)\n`);
    return 0;
  }
  const report = auditClickRevealDependencies(slides);
  console.log(`\n=== ${slug} ===`);
  console.log(formatClickRevealReport(report));
  return report.stats.errors;
}

function main() {
  const args = process.argv.slice(2);
  let slugs: string[];
  if (args.includes('--all')) {
    slugs = listDeckSlugs();
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    slugs = [args[0]];
  } else {
    slugs = ['showcase'];
  }

  let totalErrors = 0;
  for (const slug of slugs) {
    totalErrors += auditDeck(slug);
  }

  console.log('\n----------------------------------------');
  console.log(`Decks audited: ${slugs.length}  ·  Total errors: ${totalErrors}`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
