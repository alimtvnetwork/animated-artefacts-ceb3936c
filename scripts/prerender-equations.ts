/**
 * scripts/prerender-equations.ts
 *
 * Build-time KaTeX prerender for `EquationSlide` (audit remediation,
 * spec 21-slides-system/29 §2.4).
 *
 * Walks every JSON under `front-end/project/<slug>/data/slides/*.json`,
 * finds slides with `slideType === 'EquationSlide'` that have a `tex`
 * source, renders them once via KaTeX, and writes:
 *
 *   - `content.equationHtml` — opaque HTML the runtime drops in via
 *     `dangerouslySetInnerHTML`. Each whitespace-split term is wrapped
 *     in `<span class="equation-term" data-term-id="…">` so the
 *     existing 80ms CSS stagger reveal still plays.
 *   - `content.termIds` — preserved if the author already supplied them.
 *
 * No runtime KaTeX dep. The script is idempotent: rerunning it
 * regenerates `equationHtml` from the current `tex`. Skipped silently
 * when `tex` is absent.
 *
 * Run: `bun scripts/prerender-equations.ts`
 * Auto-runs as part of `prebuild`.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import katex from 'katex';

const ROOT = join(process.cwd(), 'front-end', 'project');

interface SlideJson {
  slideType?: string;
  content?: {
    tex?: string;
    termIds?: string[];
    equationHtml?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

function listDecks(): string[] {
  try {
    return readdirSync(ROOT).filter((d) => {
      try { return statSync(join(ROOT, d)).isDirectory(); } catch { return false; }
    });
  } catch { return []; }
}

function listSlideFiles(slug: string): string[] {
  const dir = join(ROOT, slug, 'data', 'slides');
  try {
    return readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => join(dir, f));
  } catch { return []; }
}

/**
 * Render `tex` once with KaTeX, then post-process the HTML to wrap each
 * whitespace-split source token in `<span class="equation-term" data-term-id>`
 * so the runtime's stagger CSS keys off real ids.
 */
function renderEquation(tex: string, providedTermIds?: string[]): { html: string; termIds: string[] } {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: true,
    output: 'html',
    strict: 'ignore',
  });
  const tokens = tex.split(/\s+/).filter(Boolean);
  const termIds = (providedTermIds && providedTermIds.length === tokens.length)
    ? providedTermIds
    : tokens.map((_, i) => `t${i}`);

  // Wrap the entire KaTeX block once so the runtime can target it as a
  // single equation-term sequence. KaTeX itself tokenises internally —
  // we don't reach inside its DOM. For the staggered reveal, the runtime
  // uses .equation-term children of .equation-host. We synthesise an
  // overlay span list keyed by termIds beneath the rendered KaTeX so the
  // stagger animation still triggers without requiring KaTeX-internal
  // surgery.
  const overlay = tokens
    .map((tok, i) => `<span class="equation-term equation-term--prerendered" data-term-id="${termIds[i]}" style="animation-delay:${i * 80}ms">${escapeHtml(tok)}</span>`)
    .join(' ');

  const wrapped = `<div class="equation-katex">${html}</div><div class="equation-stagger-overlay" aria-hidden="true">${overlay}</div>`;
  return { html: wrapped, termIds };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function processFile(path: string): boolean {
  const raw = readFileSync(path, 'utf8');
  let json: SlideJson;
  try { json = JSON.parse(raw); } catch { return false; }
  if (json.slideType !== 'EquationSlide') return false;
  const tex = json.content?.tex;
  if (!tex) return false;

  const { html, termIds } = renderEquation(tex, json.content?.termIds);
  json.content = { ...json.content, tex, equationHtml: html, termIds };
  writeFileSync(path, JSON.stringify(json, null, 2) + '\n', 'utf8');
  return true;
}

function main(): void {
  const decks = listDecks();
  let total = 0;
  let touched = 0;
  for (const slug of decks) {
    for (const file of listSlideFiles(slug)) {
      total++;
      if (processFile(file)) touched++;
    }
  }
  console.log(`prerender-equations: scanned ${total} slide file(s), prerendered ${touched} EquationSlide(s).`);
}

main();
