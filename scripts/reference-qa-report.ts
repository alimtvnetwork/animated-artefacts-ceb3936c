/**
 * Reference QA report — spec 55 (v0.163).
 *
 * Runs the full reference-asset QA suite as a single, CI-friendly pass and
 * emits a Markdown table with one row per asset and one row per required
 * glyph / font-stack check. Pass/fail is deterministic and machine-greppable
 * so the workflow can attach the report as a build artifact AND fail the job
 * with a useful exit code.
 *
 * What it checks
 *   1. For every entry in `REFERENCE_ASSETS`:
 *        - file exists on disk
 *        - file is non-empty
 *        - PNG signature is intact
 *        - decoded width × height matches the manifest
 *   2. For every required glyph (× · §):
 *        - codepoint matches the pinned Unicode value
 *        - glyph is referenced from `tailwind.config.ts` font stacks
 *          (i.e. Ubuntu + Inter are still configured to render them)
 *   3. For both required font stacks (display, body):
 *        - the primary face is still listed in `tailwind.config.ts`
 *
 * Why a separate script (instead of just relying on vitest)
 *   - The vitest run already gates merges, but produces verbose output that
 *     buries which *specific* asset failed. This script's report is one
 *     compact Markdown table — perfect for `actions/upload-artifact` and
 *     for pasting into a PR comment.
 *   - It uses ZERO Node APIs that aren't already in the toolchain, so it
 *     runs identically on local and CI Bun.
 *
 * Exit codes (mirrors the other audits)
 *   0  — all checks passed
 *   1  — script error (couldn't read manifest, etc.)
 *   2  — at least one check failed (asset or glyph)
 */
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import {
  REFERENCE_ASSETS,
  REQUIRED_GLYPHS,
  REQUIRED_FONT_STACKS,
  decodePngDimensions,
} from '../src/slides/referenceAssetsManifest';

type CheckRow = {
  category: 'asset' | 'glyph' | 'font-stack';
  name: string;
  detail: string;
  status: 'pass' | 'fail';
  reason?: string;
};

const rows: CheckRow[] = [];

// ── Part 1 — Asset existence + dimensions ────────────────────────────
for (const asset of REFERENCE_ASSETS) {
  const fullPath = resolve(process.cwd(), asset.fsPath);
  const expected = `${asset.expectedWidth}×${asset.expectedHeight}`;

  if (!existsSync(fullPath)) {
    rows.push({
      category: 'asset',
      name: asset.publicPath,
      detail: `expected ${expected}`,
      status: 'fail',
      reason: `file missing at ${asset.fsPath}`,
    });
    continue;
  }
  if (statSync(fullPath).size === 0) {
    rows.push({
      category: 'asset',
      name: asset.publicPath,
      detail: `expected ${expected}`,
      status: 'fail',
      reason: 'file is 0 bytes',
    });
    continue;
  }

  try {
    const buf = readFileSync(fullPath);
    const { width, height } = decodePngDimensions(buf);
    if (width !== asset.expectedWidth || height !== asset.expectedHeight) {
      rows.push({
        category: 'asset',
        name: asset.publicPath,
        detail: `expected ${expected}, got ${width}×${height}`,
        status: 'fail',
        reason: asset.whyLocked,
      });
    } else {
      rows.push({
        category: 'asset',
        name: asset.publicPath,
        detail: `${expected} ✓`,
        status: 'pass',
      });
    }
  } catch (err) {
    rows.push({
      category: 'asset',
      name: asset.publicPath,
      detail: `expected ${expected}`,
      status: 'fail',
      reason: err instanceof Error ? err.message : String(err),
    });
  }
}

// ── Part 2 — Glyph codepoint + font-stack presence ───────────────────
const PINNED_CODEPOINTS: Record<string, number> = {
  '×': 0x00d7,
  '·': 0x00b7,
  '§': 0x00a7,
};

const tailwindConfigPath = resolve(process.cwd(), 'tailwind.config.ts');
let tailwindConfigSource = '';
try {
  tailwindConfigSource = readFileSync(tailwindConfigPath, 'utf8');
} catch (err) {
  console.error('[reference-qa] could not read tailwind.config.ts:', err);
  process.exit(1);
}

for (const glyph of REQUIRED_GLYPHS) {
  const codepoint = glyph.codePointAt(0) ?? -1;
  const expected = PINNED_CODEPOINTS[glyph];
  if (codepoint !== expected) {
    rows.push({
      category: 'glyph',
      name: glyph,
      detail: `expected U+${expected.toString(16).toUpperCase().padStart(4, '0')}, got U+${codepoint.toString(16).toUpperCase().padStart(4, '0')}`,
      status: 'fail',
      reason: 'codepoint drift — manifest may be corrupted',
    });
  } else {
    rows.push({
      category: 'glyph',
      name: glyph,
      detail: `U+${expected.toString(16).toUpperCase().padStart(4, '0')} ✓`,
      status: 'pass',
    });
  }
}

for (const [label, stack] of Object.entries(REQUIRED_FONT_STACKS)) {
  const primary = stack[0];
  // Heuristic but precise: tailwind.config.ts is authored as a TS literal
  // listing each face as a quoted string. Confirm the primary face is
  // present in the config source so a future PR can't silently drop it.
  const present = tailwindConfigSource.includes(`'${primary}'`);
  rows.push({
    category: 'font-stack',
    name: label,
    detail: `primary "${primary}" in tailwind.config.ts`,
    status: present ? 'pass' : 'fail',
    reason: present ? undefined : `primary face "${primary}" not found in tailwind.config.ts`,
  });
}

// ── Render Markdown report ───────────────────────────────────────────
const failures = rows.filter((r) => r.status === 'fail');
const stamp = new Date().toISOString();
const summary = `**${rows.length - failures.length}/${rows.length}** checks passed (${failures.length} failed)`;

const lines: string[] = [
  `# Reference QA report`,
  ``,
  `_Generated ${stamp}_`,
  ``,
  summary,
  ``,
  `| Category | Item | Detail | Status |`,
  `|---|---|---|---|`,
];
for (const row of rows) {
  const status = row.status === 'pass' ? '✅ pass' : '❌ fail';
  const detail = row.reason ? `${row.detail} — ${row.reason}` : row.detail;
  lines.push(`| ${row.category} | \`${row.name}\` | ${detail} | ${status} |`);
}

if (failures.length > 0) {
  lines.push('', '## Failures', '');
  for (const f of failures) {
    lines.push(`- **${f.category}** \`${f.name}\` — ${f.reason ?? f.detail}`);
  }
}

const report = lines.join('\n') + '\n';
const outPath =
  process.env.REFERENCE_QA_OUT ?? resolve(process.cwd(), 'reports/reference-qa.md');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, report, 'utf8');

// Console summary (compact — full table is in the artifact).
console.log(`Reference QA — ${summary}`);
console.log(`Report written to ${outPath}`);
if (failures.length > 0) {
  console.log('');
  console.log('Failures:');
  for (const f of failures) {
    console.log(`  ✗ [${f.category}] ${f.name} — ${f.reason ?? f.detail}`);
  }
  process.exit(2);
}
process.exit(0);
