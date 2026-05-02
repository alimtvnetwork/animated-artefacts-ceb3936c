/**
 * scripts/contrast-audit.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Automated visual contrast audit for the test deck (showcase).
 *
 * Walks every text-token entry in `src/test/lib/slideTextCatalog.ts`
 * across:
 *   • every theme defined in `src/slides/themes.ts`
 *   • the three target viewports — 1920×1080, 1366×768, 768×1024
 *
 * For each (slide-type, text-role, theme, viewport) cell it computes the
 * effective WCAG 2.1 contrast ratio and flags any cell that falls below
 * the role's required threshold (AA-normal 4.5:1 or AA-large 3:1).
 *
 * Why no headless-browser render:
 *   The deck uses a fixed-1920×1080 stage scaled with `transform: scale()`.
 *   No CSS rule changes color based on viewport width — only the render
 *   scale changes. So a true browser render at 3 viewports would produce
 *   identical contrast values, but at ~30s per cell × 24 cells × 3
 *   viewports = ~36 minutes of network + CPU. The catalog approach
 *   gives the SAME signal in <1s and is what guards the regression
 *   today (see `stepTimelineGithubLightContrast.test.ts`).
 *
 *   The viewport axis is preserved as a first-class column in the report
 *   so any FUTURE viewport-conditional rule (e.g. a `@media` color swap)
 *   can wire itself into the catalog and surface here without restructure.
 *
 * Usage:
 *   bun ./scripts/contrast-audit.ts                  # console report, exit 1 on fail
 *   bun ./scripts/contrast-audit.ts --json out.json  # machine-readable export
 *   bun ./scripts/contrast-audit.ts --theme=noir-gold  # filter to one theme
 *
 * Exit codes:
 *   0 — every cell passes
 *   1 — one or more cells fall below the WCAG threshold
 *   2 — script error (bad CLI flag, malformed catalog entry, etc.)
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
  TEST_DECK_SLIDE_TYPES,
  type SlideType,
  type TextTokenEntry,
} from '../src/test/lib/slideTextCatalog';
import { THEMES, type ThemeId } from '../src/slides/themes';

// ── :root token defaults ────────────────────────────────────────────────
// Themes only declare the tokens they want to OVERRIDE; everything else
// inherits from `:root` in src/index.css. We parse those defaults once at
// startup so the audit can resolve any token a theme leaves implicit.
function loadRootTokens(): Record<string, string> {
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
  // Match the FIRST `:root { ... }` block — that's the unscoped one with
  // the canonical defaults. Subsequent `:root` blocks (e.g. inside
  // `@layer` or media queries) are intentionally ignored.
  const match = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!match) throw new Error('Could not find :root block in src/index.css');
  const out: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^\s*(--[a-zA-Z0-9-]+)\s*:\s*([^;]+?)\s*;/);
    if (!m) continue;
    // Only keep simple HSL-triplet values (`H S% L%`) — gradients,
    // var() chains, and shadows are out of scope for contrast math.
    const value = m[2].trim();
    if (/^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(value)) {
      out[m[1]] = value;
    }
  }
  return out;
}
const ROOT_TOKENS = loadRootTokens();


// ── viewports we audit ──────────────────────────────────────────────────
const VIEWPORTS = [
  { id: '1920x1080', w: 1920, h: 1080, label: 'Desktop FHD' },
  { id: '1366x768',  w: 1366, h: 768,  label: 'Laptop' },
  { id: '768x1024',  w: 768,  h: 1024, label: 'Tablet portrait' },
] as const;
type Viewport = (typeof VIEWPORTS)[number];

// ── CLI parsing ─────────────────────────────────────────────────────────
function parseArgs(argv: string[]): {
  json?: string;
  themeFilter?: ThemeId;
  slideFilter?: SlideType;
  quiet: boolean;
} {
  const out: {
    json?: string;
    themeFilter?: ThemeId;
    slideFilter?: SlideType;
    quiet: boolean;
  } = { quiet: false };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = argv[++i] ?? 'contrast-audit.json';
    else if (a.startsWith('--json=')) out.json = a.slice('--json='.length);
    else if (a.startsWith('--theme=')) {
      const id = a.slice('--theme='.length) as ThemeId;
      if (!(id in THEMES)) {
        console.error(`Unknown theme: ${id}`);
        process.exit(2);
      }
      out.themeFilter = id;
    } else if (a.startsWith('--slide=')) {
      const id = a.slice('--slide='.length) as SlideType;
      if (!(TEST_DECK_SLIDE_TYPES as ReadonlyArray<string>).includes(id)) {
        console.error(`Unknown slide type: ${id}`);
        process.exit(2);
      }
      out.slideFilter = id;
    } else if (a === '-q' || a === '--quiet') out.quiet = true;
    else if (a === '-h' || a === '--help') {
      console.log(`
Usage: bun ./scripts/contrast-audit.ts [options]

  --json[=PATH]      Write machine-readable report (default: contrast-audit.json)
  --theme=ID         Restrict audit to one theme
  --slide=TYPE       Restrict audit to one slide type
  -q, --quiet        Print only the failure summary
  -h, --help         Show this message

Exit code 0 if every cell passes WCAG, 1 if any fail.
`);
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}  (try --help)`);
      process.exit(2);
    }
  }
  return out;
}

// ── theme token resolution ──────────────────────────────────────────────
// Themes only declare overrides — fall back to `:root` defaults parsed
// from src/index.css when a theme leaves a token implicit.
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

function resolveBg(themeId: ThemeId, entry: TextTokenEntry): RGB {
  // 'token-surface' = the surface IS the token color (e.g. gold CTA bg);
  // 'token' = the surface is the named background.
  return resolveToken(themeId, entry.bg.token);
}

function resolveFg(themeId: ThemeId, entry: TextTokenEntry): RGB {
  if (entry.fg.kind === 'rgb') return entry.fg.rgb;
  return resolveToken(themeId, entry.fg.token);
}

// ── audit cell ──────────────────────────────────────────────────────────
interface AuditCell {
  slideType: SlideType;
  tokenId: string;
  tokenLabel: string;
  themeId: ThemeId;
  viewport: Viewport['id'];
  ratio: number;
  required: number;
  passes: boolean;
  source: string;
}

function runAudit(opts: {
  themeFilter?: ThemeId;
  slideFilter?: SlideType;
}): AuditCell[] {
  const cells: AuditCell[] = [];
  const themes = (Object.keys(THEMES) as ThemeId[]).filter(
    (t) => !opts.themeFilter || t === opts.themeFilter,
  );

  for (const themeId of themes) {
    for (const entry of TEXT_TOKEN_CATALOG) {
      const slideTypes = entry.presentOn.filter(
        (s) => !opts.slideFilter || s === opts.slideFilter,
      );
      if (slideTypes.length === 0) continue;

      const fg = resolveFg(themeId, entry);
      const bg = resolveBg(themeId, entry);
      const ratio = effectiveContrast(fg, entry.alpha, bg);
      const passes = ratio >= entry.min;

      for (const slideType of slideTypes) {
        for (const vp of VIEWPORTS) {
          cells.push({
            slideType,
            tokenId: entry.id,
            tokenLabel: entry.label,
            themeId,
            viewport: vp.id,
            ratio: Math.round(ratio * 100) / 100,
            required: entry.min,
            passes,
            source: entry.source,
          });
        }
      }
    }
  }
  return cells;
}

// ── reporting ───────────────────────────────────────────────────────────
const COLOR = {
  reset: '\x1b[0m',
  red:   '\x1b[31m',
  green: '\x1b[32m',
  yellow:'\x1b[33m',
  dim:   '\x1b[2m',
  bold:  '\x1b[1m',
};

function fmtRatio(r: number, required: number): string {
  const txt = `${r.toFixed(2)}:1`;
  if (r < required) return `${COLOR.red}${txt}${COLOR.reset}`;
  if (r < required + 1) return `${COLOR.yellow}${txt}${COLOR.reset}`;
  return `${COLOR.green}${txt}${COLOR.reset}`;
}

function printReport(cells: AuditCell[], quiet: boolean): void {
  const fails = cells.filter((c) => !c.passes);
  const total = cells.length;

  if (!quiet) {
    // Group by theme for readability. Within a theme, deduplicate the
    // viewport axis (since the catalog is viewport-invariant today)
    // and surface a "× viewports" tag on the row instead of printing
    // the same line three times.
    const byTheme = new Map<ThemeId, AuditCell[]>();
    for (const c of cells) {
      const arr = byTheme.get(c.themeId) ?? [];
      arr.push(c);
      byTheme.set(c.themeId, arr);
    }

    for (const [themeId, themeCells] of byTheme) {
      console.log(`\n${COLOR.bold}═══ ${themeId} ═══${COLOR.reset}`);

      // Collapse identical (slide,token) cells across viewports.
      const seen = new Set<string>();
      for (const c of themeCells) {
        const key = `${c.slideType}|${c.tokenId}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const status = c.passes ? `${COLOR.green}✓${COLOR.reset}` : `${COLOR.red}✗${COLOR.reset}`;
        const ratio = fmtRatio(c.ratio, c.required);
        console.log(
          `  ${status} ${c.slideType.padEnd(20)} ${c.tokenLabel.padEnd(40)} ${ratio} ${COLOR.dim}(need ≥ ${c.required}:1, all ${VIEWPORTS.length} viewports)${COLOR.reset}`,
        );
      }
    }
  }

  console.log(`\n${COLOR.bold}── Summary ──${COLOR.reset}`);
  console.log(`  Themes audited     : ${new Set(cells.map((c) => c.themeId)).size}`);
  console.log(`  Slide types        : ${new Set(cells.map((c) => c.slideType)).size}`);
  console.log(`  Viewports per cell : ${VIEWPORTS.length} (${VIEWPORTS.map((v) => v.id).join(', ')})`);
  console.log(`  Total cells        : ${total}`);
  console.log(
    fails.length === 0
      ? `  ${COLOR.green}✓ All cells pass WCAG AA${COLOR.reset}`
      : `  ${COLOR.red}✗ ${fails.length} cell${fails.length === 1 ? '' : 's'} below threshold${COLOR.reset}`,
  );

  if (fails.length > 0) {
    console.log(`\n${COLOR.red}${COLOR.bold}Failures:${COLOR.reset}`);
    // Dedupe failures by (slide,token,theme) since viewports collapse.
    const failKey = new Set<string>();
    for (const f of fails) {
      const key = `${f.slideType}|${f.tokenId}|${f.themeId}`;
      if (failKey.has(key)) continue;
      failKey.add(key);
      console.log(
        `  • [${f.themeId}] ${f.slideType} → ${f.tokenLabel}\n` +
        `      got ${f.ratio}:1, need ≥ ${f.required}:1\n` +
        `      ${COLOR.dim}source: ${f.source}${COLOR.reset}`,
      );
    }
  }
}

function writeJsonReport(cells: AuditCell[], path: string): void {
  const fails = cells.filter((c) => !c.passes);
  const report = {
    generatedAt: new Date().toISOString(),
    viewports: VIEWPORTS,
    totalCells: cells.length,
    failureCount: fails.length,
    passing: fails.length === 0,
    cells,
  };
  const abs = resolve(process.cwd(), path);
  writeFileSync(abs, JSON.stringify(report, null, 2));
  console.log(`\nWrote JSON report → ${abs}`);
}

// ── entry ───────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));
const cells = runAudit({
  themeFilter: args.themeFilter,
  slideFilter: args.slideFilter,
});
printReport(cells, args.quiet);
if (args.json) writeJsonReport(cells, args.json);

const anyFail = cells.some((c) => !c.passes);
process.exit(anyFail ? 1 : 0);
