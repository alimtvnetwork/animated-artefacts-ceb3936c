/**
 * scripts/motion-variety-audit.ts
 *
 * Advisory script (M-03 from audit/remediation-plan.md).
 *
 * Reads every deck under `front-end/project/<slug>/data/slides/*.json`
 * and warns when a deck overuses a single `transition` or `textAnimation`
 * value. Memory rule: "Animations: variety required."
 *
 * Heuristic:
 *   - For decks with ≥4 slides, no single transition should account for
 *     more than 60% of slides.
 *   - Same threshold for textAnimation.
 *   - Per-slide-type defaults are not penalised — only authored values
 *     present in JSON count.
 *
 * Exit code is always 0 (advisory). Prints `::warning::` lines so CI
 * surfaces them without failing the build.
 *
 * Run: `bun scripts/motion-variety-audit.ts`
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'front-end', 'project');
const THRESHOLD = 0.6;
const MIN_SLIDES = 4;

type Counts = Record<string, number>;

function listDecks(): string[] {
  try {
    return readdirSync(ROOT).filter((d) => {
      try { return statSync(join(ROOT, d)).isDirectory(); } catch { return false; }
    });
  } catch { return []; }
}

function readSlides(slug: string): Array<Record<string, unknown>> {
  const dir = join(ROOT, slug, 'data', 'slides');
  let files: string[] = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { return []; }
  return files.map((f) => {
    try { return JSON.parse(readFileSync(join(dir, f), 'utf8')); }
    catch { return {}; }
  });
}

function tally(slides: Array<Record<string, unknown>>, key: string): Counts {
  const out: Counts = {};
  for (const s of slides) {
    const v = s[key];
    if (typeof v === 'string') out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

function dominant(counts: Counts, total: number): { key: string; ratio: number } | null {
  let best: { key: string; ratio: number } | null = null;
  for (const [k, n] of Object.entries(counts)) {
    const r = n / total;
    if (!best || r > best.ratio) best = { key: k, ratio: r };
  }
  return best;
}

function audit(slug: string): number {
  const slides = readSlides(slug);
  if (slides.length < MIN_SLIDES) return 0;
  let warnings = 0;
  for (const field of ['transition', 'textAnimation'] as const) {
    const c = tally(slides, field);
    const d = dominant(c, slides.length);
    if (d && d.ratio > THRESHOLD) {
      console.log(
        `::warning file=front-end/project/${slug}::deck "${slug}" uses ${field}="${d.key}" on ${(d.ratio * 100).toFixed(0)}% of ${slides.length} slides (threshold ${THRESHOLD * 100}%). Vary it.`
      );
      warnings++;
    }
  }
  return warnings;
}

function main(): void {
  const decks = listDecks();
  if (decks.length === 0) {
    console.log('motion-variety-audit: no decks found under front-end/project/');
    return;
  }
  let total = 0;
  for (const slug of decks) total += audit(slug);
  console.log(`motion-variety-audit: scanned ${decks.length} deck(s), ${total} advisory warning(s).`);
}

main();
