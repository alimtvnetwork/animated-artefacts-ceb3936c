/**
 * scripts/step-timeline-contrast-report.ts
 * ─────────────────────────────────────────────────────────────────────────
 * CI-friendly contrast report for **StepTimelineSlide** text elements.
 *
 * For every text element that renders inside a StepTimelineSlide
 * (slide title, eyebrow, active/adjacent/far step titles, step numbers,
 * side-panel copy, capsule labels, etc.) and for every theme defined in
 * `src/slides/themes.ts`, this script:
 *
 *   1. Resolves the foreground + background tokens via the same logic the
 *      runtime cascade uses (`:root` defaults from src/index.css overlaid
 *      by the theme's overrides in src/slides/themes.ts).
 *   2. Computes the effective WCAG 2.1 contrast ratio with the catalog's
 *      effective alpha (handles translucent text on a known surface).
 *   3. Emits a per-element row with the computed ratio AND the threshold
 *      it was checked against (4.5 normal / 3.0 large / 7.0 AAA, taken
 *      verbatim from the catalog so a future threshold tweak shows up
 *      automatically here).
 *
 * Output is intentionally lightweight:
 *   • Markdown table, one row per (element × theme) cell
 *   • Optional JSON sidecar (`--json[=path]`) for downstream tooling
 *   • Exit 0 if every cell passes, exit 1 if any cell falls short
 *
 * Why this is separate from `scripts/contrast-audit.ts`:
 *   The full audit walks every catalog entry across every slide-type ×
 *   viewport combination. CI dashboards only need a focused snapshot of
 *   the StepTimeline surface (the one we keep regressing), formatted as
 *   a single Markdown block they can paste into a comment/check.
 *
 * Usage:
 *   bun ./scripts/step-timeline-contrast-report.ts
 *   bun ./scripts/step-timeline-contrast-report.ts --json report.json
 *   bun ./scripts/step-timeline-contrast-report.ts --md report.md
 *   bun ./scripts/step-timeline-contrast-report.ts --theme=github-light
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  effectiveContrast,
  parseHslTriplet,
  type RGB,
} from '../src/test/lib/contrast';
import {
  TEXT_TOKEN_CATALOG,
  type TextTokenEntry,
} from '../src/test/lib/slideTextCatalog';
import { THEMES, type ThemeId } from '../src/slides/themes';

const SLIDE = 'StepTimelineSlide' as const;

/* ──────────────────────────────────────────────────────────────────────
 * Token resolution — mirrors scripts/contrast-audit.ts so the two reports
 * can never disagree on a value. (Kept inline rather than imported to
 * keep this script standalone for CI containers that copy a single file.)
 * ────────────────────────────────────────────────────────────────────── */

function loadRootTokens(): Record<string, string> {
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
  const match = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!match) throw new Error('Could not find :root block in src/index.css');
  const out: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^\s*(--[a-zA-Z0-9-]+)\s*:\s*([^;]+?)\s*;/);
    if (!m) continue;
    const value = m[2].trim();
    if (/^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(value)) out[m[1]] = value;
  }
  return out;
}
const ROOT_TOKENS = loadRootTokens();

function resolveToken(themeId: ThemeId, token: string): RGB {
  const vars = THEMES[themeId].vars as Record<string, string>;
  const triplet = vars[token] ?? ROOT_TOKENS[token];
  if (!triplet) {
    throw new Error(
      `No value for token "${token}" — neither theme "${themeId}" nor :root in src/index.css declares it.`,
    );
  }
  return parseHslTriplet(triplet);
}

function resolveFg(themeId: ThemeId, entry: TextTokenEntry): RGB {
  return entry.fg.kind === 'rgb' ? entry.fg.rgb : resolveToken(themeId, entry.fg.token);
}
function resolveBg(themeId: ThemeId, entry: TextTokenEntry): RGB {
  return resolveToken(themeId, entry.bg.token);
}

/* ──────────────────────────────────────────────────────────────────────
 * CLI parsing
 * ────────────────────────────────────────────────────────────────────── */

interface Args {
  json?: string;
  md?: string;
  themeFilter?: ThemeId;
  quiet: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if      (a === '--json')        out.json = argv[++i] ?? 'step-timeline-contrast.json';
    else if (a.startsWith('--json=')) out.json = a.slice('--json='.length);
    else if (a === '--md')          out.md   = argv[++i] ?? 'step-timeline-contrast.md';
    else if (a.startsWith('--md='))   out.md   = a.slice('--md='.length);
    else if (a.startsWith('--theme=')) {
      const id = a.slice('--theme='.length) as ThemeId;
      if (!(id in THEMES)) {
        console.error(`Unknown theme: ${id}`);
        process.exit(2);
      }
      out.themeFilter = id;
    }
    else if (a === '-q' || a === '--quiet') out.quiet = true;
    else if (a === '-h' || a === '--help') {
      console.log(`
Usage: bun ./scripts/step-timeline-contrast-report.ts [options]

  --md[=PATH]      Write the Markdown report to PATH (default prints to stdout)
  --json[=PATH]    Also emit a JSON sidecar (default: step-timeline-contrast.json)
  --theme=ID       Restrict to one theme
  -q, --quiet      Print only the failure summary (no full table to stdout)
  -h, --help       Show this message

Exit code 0 if every cell meets its threshold, 1 if any cell falls short.
`);
      process.exit(0);
    }
    else {
      console.error(`Unknown argument: ${a}  (try --help)`);
      process.exit(2);
    }
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────────────
 * Build the report
 * ────────────────────────────────────────────────────────────────────── */

interface ReportRow {
  elementId: string;
  elementLabel: string;
  themeId: ThemeId;
  /** WCAG threshold this cell was checked against (4.5 normal, 3.0 large, 7.0 AAA). */
  threshold: number;
  /** Friendly threshold label, e.g. "AA-normal (4.5:1)". */
  thresholdLabel: string;
  ratio: number;
  passes: boolean;
  source: string;
}

function thresholdLabel(min: number): string {
  if (min >= 7)      return `AAA (${min.toFixed(1)}:1)`;
  if (min >= 4.5)    return `AA-normal (${min.toFixed(1)}:1)`;
  return `AA-large (${min.toFixed(1)}:1)`;
}

function buildReport(args: Args): ReportRow[] {
  const rows: ReportRow[] = [];
  const themes = (Object.keys(THEMES) as ThemeId[]).filter(
    (t) => !args.themeFilter || t === args.themeFilter,
  );

  // Catalog entries that render on a StepTimelineSlide.
  const entries = TEXT_TOKEN_CATALOG.filter((e) =>
    (e.presentOn as ReadonlyArray<string>).includes(SLIDE),
  );
  if (entries.length === 0) {
    console.error(`No catalog entries claim presence on ${SLIDE}`);
    process.exit(2);
  }

  for (const themeId of themes) {
    for (const entry of entries) {
      const fg = resolveFg(themeId, entry);
      const bg = resolveBg(themeId, entry);
      const ratio = effectiveContrast(fg, entry.alpha, bg);
      rows.push({
        elementId:      entry.id,
        elementLabel:   entry.label,
        themeId,
        threshold:      entry.min,
        thresholdLabel: thresholdLabel(entry.min),
        ratio:          Math.round(ratio * 100) / 100,
        passes:         ratio >= entry.min,
        source:         entry.source ?? '',
      });
    }
  }
  return rows;
}

/* ──────────────────────────────────────────────────────────────────────
 * Markdown rendering
 * ────────────────────────────────────────────────────────────────────── */

function renderMarkdown(rows: ReportRow[], args: Args): string {
  const failed = rows.filter((r) => !r.passes);
  const themesShown = Array.from(new Set(rows.map((r) => r.themeId))).join(', ');

  const lines: string[] = [];
  lines.push(`# StepTimelineSlide contrast report`);
  lines.push('');
  lines.push(`Generated: \`${new Date().toISOString()}\``);
  lines.push(`Slide type: \`${SLIDE}\``);
  lines.push(`Themes: \`${themesShown}\``);
  lines.push(`Cells: **${rows.length}** — ✅ ${rows.length - failed.length} pass · ${failed.length === 0 ? '🟢' : '❌'} ${failed.length} fail`);
  lines.push('');
  lines.push(`Thresholds taken from \`src/test/lib/slideTextCatalog.ts\` — AA-normal = 4.5:1, AA-large = 3.0:1, AAA = 7.0:1.`);
  lines.push('');

  // Group rows by element so the table reads top-to-bottom per element.
  const byElement = new Map<string, ReportRow[]>();
  for (const r of rows) {
    const k = r.elementId;
    if (!byElement.has(k)) byElement.set(k, []);
    byElement.get(k)!.push(r);
  }

  lines.push(`| Element | Theme | Ratio | Threshold | Result |`);
  lines.push(`| --- | --- | ---: | --- | :---: |`);
  for (const [elementId, group] of byElement) {
    const label = group[0].elementLabel;
    for (let i = 0; i < group.length; i++) {
      const r = group[i];
      const elCell = i === 0 ? `**${label}**<br/><sub>\`${elementId}\`</sub>` : '';
      const ratioCell = `${r.ratio.toFixed(2)}:1`;
      const result = r.passes ? '✅ pass' : '❌ **fail**';
      lines.push(`| ${elCell} | \`${r.themeId}\` | ${ratioCell} | ${r.thresholdLabel} | ${result} |`);
    }
  }
  lines.push('');

  if (failed.length > 0) {
    lines.push(`## Failures`);
    lines.push('');
    lines.push(`| Element | Theme | Ratio | Threshold | Shortfall |`);
    lines.push(`| --- | --- | ---: | --- | ---: |`);
    for (const r of failed) {
      const shortfall = (r.threshold - r.ratio).toFixed(2);
      lines.push(`| ${r.elementLabel} | \`${r.themeId}\` | ${r.ratio.toFixed(2)}:1 | ${r.thresholdLabel} | −${shortfall} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/* ──────────────────────────────────────────────────────────────────────
 * Main
 * ────────────────────────────────────────────────────────────────────── */

const args = parseArgs(process.argv.slice(2));
const rows = buildReport(args);
const md = renderMarkdown(rows, args);

if (args.md) {
  writeFileSync(resolve(process.cwd(), args.md), md, 'utf8');
  console.log(`Wrote Markdown report → ${args.md}`);
}
if (args.json) {
  writeFileSync(
    resolve(process.cwd(), args.json),
    JSON.stringify({ slideType: SLIDE, generatedAt: new Date().toISOString(), rows }, null, 2),
    'utf8',
  );
  console.log(`Wrote JSON sidecar     → ${args.json}`);
}
if (!args.md && !args.quiet) {
  // Stdout is the default sink so CI can `tee` or pipe directly.
  console.log(md);
}

const failed = rows.filter((r) => !r.passes);
if (failed.length > 0) {
  console.error(
    `\n❌ ${failed.length} of ${rows.length} StepTimelineSlide contrast cells fell below threshold.`,
  );
  process.exit(1);
}
console.log(
  `\n✅ All ${rows.length} StepTimelineSlide contrast cells meet threshold.`,
);
