#!/usr/bin/env bun
/**
 * Audit `src/slides/**` for hardcoded brand hex literals that bypass the
 * theme token system.
 *
 * Why this exists
 * ---------------
 * Brand colors are defined ONCE in `src/slides/themes.ts` and exposed via
 * CSS custom properties (`--gold`, `--ember`, `--cream`, `--ink`, …).
 * Slide components and CSS MUST reference them through
 * `hsl(var(--gold))` etc. — never via the raw hex value.
 *
 * Raw hex literals defeat:
 *   • Per-theme remapping (paper-ink, github-light flip cream/white → ink)
 *   • Brightness fine-tune (the `--gold` lightness slider)
 *   • Auto-contrast computation (gold-on-fg/border/glow alpha tokens)
 *   • Custom imported themes from `.riseup-theme.json`
 *
 * What it flags
 * -------------
 *   • `#C9A84C` (canonical gold)
 *   • `#E85D3A` (ember)
 *   • `#F0D78C` (cream)
 *   • `#0D0D0D` (ink / brand background)
 *   • `#F3A502` (legacy bright-gold)
 *   • `#FFBE2E` (current bright-gold)
 *   • 3-digit shorthands that resolve to the same colors
 *
 * What it ignores
 * ---------------
 *   • `src/slides/themes.ts` — the registry where hex literals ARE the API.
 *   • `src/slides/ambientIconRegistry.ts` — brand glyph defaults.
 *   • Any line carrying `// brand-hex-ok: <reason>` (or block-comment form).
 *
 * Usage
 * -----
 *   bun run scripts/audit-brand-hex.ts          # exit 1 on findings
 *   bun run scripts/audit-brand-hex.ts --json   # machine output
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const REPO_ROOT = process.cwd();
const SCAN_ROOT = join(REPO_ROOT, 'src/slides');

const OPT_OUT = /(?:\/\/|\/\*)\s*brand-hex-ok\b\s*:?\s*([^*\n]*)/i;

/** Canonical brand colors. Keys are the token name; values are the
 *  hex variants we want to catch. Add new brand colors here as the
 *  palette evolves. */
const BRAND_HEXES: Array<{ token: string; hexes: string[] }> = [
  { token: '--gold',        hexes: ['c9a84c'] },
  { token: '--ember',       hexes: ['e85d3a'] },
  { token: '--cream',       hexes: ['f0d78c'] },
  { token: '--ink',         hexes: ['0d0d0d'] },
  // Bright-gold preset has shifted: F3A502 (legacy) and FFBE2E (current).
  { token: '--gold (bright-gold preset)', hexes: ['f3a502', 'ffbe2e'] },
];

/** Build a single regex that catches any brand hex (3-, 6-, or 8-digit
 *  forms) with word boundaries so it doesn't trip inside identifiers. */
function buildBrandHexRegex(): RegExp {
  const six = BRAND_HEXES.flatMap((b) => b.hexes);
  // 3-digit shorthand: drop every other char (#abc = #aabbcc). Compute
  // the corresponding shorthand if both halves of each byte match.
  const three = six
    .map((h) => {
      const m = h.match(/^(.)\1(.)\2(.)\3$/);
      return m ? `${m[1]}${m[2]}${m[3]}` : null;
    })
    .filter((x): x is string => !!x);
  const all = [...six, ...three].join('|');
  // Allow optional 2-hex alpha suffix (8-digit hex).
  return new RegExp(`(?<![\\w])#(?:${all})(?:[0-9a-f]{2})?\\b`, 'gi');
}

const BRAND_HEX_RE = buildBrandHexRegex();

function tokenForHex(hex: string): string {
  const norm = hex.replace(/^#/, '').toLowerCase().slice(0, 6);
  // Expand 3-digit shorthand for lookup.
  const six = norm.length === 3
    ? norm.split('').map((c) => c + c).join('')
    : norm;
  for (const b of BRAND_HEXES) {
    if (b.hexes.includes(six)) return b.token;
  }
  return '--?';
}

interface Finding {
  file: string;
  line: number;
  column: number;
  patternId: string;
  match: string;
  source: string;
  why: string;
  fix: string;
}
interface Skip { file: string; line: number; reason: string; }

const EXCLUDED_FILES = new Set<string>([
  'src/slides/themes.ts',
  'src/slides/ambientIconRegistry.ts',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (/\.(tsx?|css)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      const rel = relative(REPO_ROOT, full);
      if (EXCLUDED_FILES.has(rel)) continue;
      out.push(full);
    }
  }
  return out;
}

function stripComments(line: string): string {
  const blockStart = line.indexOf('/*');
  const lineStart = line.indexOf('//');
  let cutoff = -1;
  if (blockStart !== -1 && (lineStart === -1 || blockStart < lineStart)) {
    cutoff = blockStart;
  } else if (lineStart !== -1) {
    cutoff = lineStart;
  }
  return cutoff === -1 ? line : line.slice(0, cutoff);
}

/** Run the audit against an in-memory source string. Exposed for tests. */
export function auditSource(
  relPath: string,
  src: string,
): { findings: Finding[]; skips: Skip[] } {
  const lines = src.split(/\r?\n/);
  const findings: Finding[] = [];
  const skips: Skip[] = [];
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    let working = raw;
    if (inBlock) {
      const end = working.indexOf('*/');
      if (end === -1) continue;
      working = working.slice(end + 2);
      inBlock = false;
    }
    {
      const open = working.indexOf('/*');
      const close = working.indexOf('*/', open + 2);
      if (open !== -1 && close === -1) {
        inBlock = true;
        working = working.slice(0, open);
      }
    }

    const opt = raw.match(OPT_OUT);
    if (opt) {
      skips.push({
        file: relPath,
        line: i + 1,
        reason: (opt[1] || '').trim() || '(no reason given)',
      });
      continue;
    }

    const stripped = stripComments(working);
    if (!stripped.trim()) continue;

    BRAND_HEX_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = BRAND_HEX_RE.exec(stripped)) !== null) {
      const token = tokenForHex(m[0]);
      findings.push({
        file: relPath,
        line: i + 1,
        column: m.index + 1,
        patternId: 'brand-hex',
        match: m[0],
        source: raw.trim(),
        why: `Hardcoded brand hex bypasses theme tokens — themes, brightness slider, and auto-contrast can no longer reach this color.`,
        fix: `Replace with \`hsl(var(${token}))\` (or a semantic class such as \`.capsule-gold\`).`,
      });
    }
  }

  return { findings, skips };
}

export function auditBrandHex(root = SCAN_ROOT): {
  findings: Finding[];
  skips: Skip[];
} {
  const allFindings: Finding[] = [];
  const allSkips: Skip[] = [];
  for (const file of walk(root)) {
    const rel = relative(REPO_ROOT, file);
    const src = readFileSync(file, 'utf8');
    const { findings, skips } = auditSource(rel, src);
    allFindings.push(...findings);
    allSkips.push(...skips);
  }
  return { findings: allFindings, skips: allSkips };
}

function reportHuman(findings: Finding[], skips: Skip[]): void {
  if (findings.length === 0) {
    console.log('✓ No hardcoded brand hex literals found in src/slides/.');
  } else {
    console.log(
      `✗ Found ${findings.length} hardcoded brand hex literal${findings.length === 1 ? '' : 's'}:\n`,
    );
    const byFile = new Map<string, Finding[]>();
    for (const f of findings) {
      const list = byFile.get(f.file) ?? [];
      list.push(f);
      byFile.set(f.file, list);
    }
    for (const [file, items] of byFile) {
      console.log(`  ${file}`);
      for (const f of items) {
        console.log(`    L${f.line}:${f.column}  ${f.match}`);
        console.log(`      ${f.source}`);
        console.log(`      fix: ${f.fix}\n`);
      }
    }
    console.log(
      'Add `// brand-hex-ok: <reason>` to intentionally allow a literal.',
    );
  }
  if (skips.length > 0) {
    console.log(`\nℹ Skipped ${skips.length} opted-out line${skips.length === 1 ? '' : 's'}:`);
    for (const s of skips) console.log(`  ${s.file}:${s.line}  — ${s.reason}`);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const result = auditBrandHex();
  if (json) console.log(JSON.stringify(result, null, 2));
  else reportHuman(result.findings, result.skips);
  process.exit(result.findings.length === 0 ? 0 : 1);
}

if ((import.meta as unknown as { main?: boolean }).main) {
  main();
}
