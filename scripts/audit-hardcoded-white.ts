#!/usr/bin/env bun
/**
 * Audit `src/slides/**` for hardcoded white colors that bypass the theme
 * token system.
 *
 * Why this exists
 * ---------------
 * Themes like `github-light` remap `--white` to dark ink so titles + body
 * text stay legible on light slide surfaces. Any slide that paints text
 * with a literal white (e.g. `style={{ color: 'hsl(0 0% 100%)' }}` or
 * `color: '#ffffff'`) silently bypasses that override and renders
 * white-on-white. Tailwind's `text-white` is OK because it maps to
 * `hsl(var(--white))` via `tailwind.config.ts` and follows the override.
 *
 * What it flags
 * -------------
 *   • `hsl(0 0% 100%)`  / `hsl(0, 0%, 100%)`  / `hsla(...)` variants
 *   • `#fff`, `#ffff`, `#ffffff`, `#ffffffff` (case-insensitive)
 *   • `'white'` / `"white"` JS string literals (not Tailwind class names,
 *     not CSS keywords inside a className string)
 *   • `rgb(255, 255, 255)` / `rgba(255, 255, 255, X)`
 *
 * What it ignores
 * ---------------
 *   • Canvas paint contexts that intentionally render white pixels
 *     regardless of theme (QR code light modules, ER diagram header
 *     fill). Add a trailing `// hardcoded-white-ok: <reason>` comment
 *     on the offending line to opt out — the auditor records the reason
 *     and skips the violation.
 *   • Tailwind `text-white` / `bg-white` / `border-white` classes.
 *     These resolve to `hsl(var(--white))` via the Tailwind config and
 *     follow the GitHub-Light override.
 *   • Comments. We strip `//`, block comments, and JSDoc before
 *     pattern-matching so prose like "// pure white" doesn't flag.
 *
 * Suggested fix
 * -------------
 * Replace the literal with the theme token:
 *
 *   color: 'hsl(var(--white))'         // most titles + body text
 *   color: 'hsl(var(--cream))'         // warm accent text
 *   color: 'hsl(var(--foreground))'    // generic body text
 *
 * Usage
 * -----
 *   bun run scripts/audit-hardcoded-white.ts          # exit 1 on findings
 *   bun run scripts/audit-hardcoded-white.ts --json   # machine output
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const REPO_ROOT = process.cwd();
const SCAN_ROOT = join(REPO_ROOT, 'src/slides');

/** Per-line opt-out marker. Accepts either a `//` line comment or a
 *  `/* … *\/` block comment so JSX call-sites (where `//` is invalid
 *  inside `{...}`) can still annotate a literal. */
const OPT_OUT = /(?:\/\/|\/\*)\s*hardcoded-white-ok\b\s*:?\s*([^*\n]*)/i;

interface Pattern {
  /** Short identifier shown in the report. */
  id: string;
  /** Regex executed against a comment-stripped line. Must use the `g` flag. */
  re: RegExp;
  /** Human-readable explanation of why this is a problem. */
  why: string;
  /** Concrete replacement suggestion. */
  fix: string;
  /** Optional path-prefix scope (relative to repo). When set, the pattern
   *  only runs on files whose repo-relative path starts with one of these
   *  prefixes. Used to limit the broader patterns (`inline-color`,
   *  `tw-text-white`) to **end-user slide surfaces** (`src/slides/types/`)
   *  and skip dev-only chrome (alignment guides, broken-asset overlays,
   *  runtime-QA overlays, color-token debug overlays) that are
   *  intentionally painted with literal colors. */
  scopePrefixes?: string[];
}

const PATTERNS: Pattern[] = [
  {
    id: 'hsl-100',
    re: /hsla?\(\s*0\s*,?\s*0%?\s*,?\s*100%\s*(?:,\s*[\d.]+\s*)?\)/gi,
    why: 'Bypasses the GitHub-Light `--white` remap → white-on-white text on light slides.',
    fix: "Use `hsl(var(--white))` (theme-aware) or `hsl(var(--foreground))` for body text.",
  },
  {
    id: 'hex-fff',
    re: /(?<![\w])#(?:fff|ffff|ffffff|ffffffff)\b/gi,
    why: 'Hex literal is theme-blind; light themes lose contrast.',
    fix: "Use `hsl(var(--white))` via inline style, or the Tailwind class `text-white`.",
  },
  {
    id: 'rgb-255',
    re: /rgba?\(\s*255\s*,\s*255\s*,\s*255\s*(?:,\s*[\d.]+\s*)?\)/gi,
    why: 'rgb() literal is theme-blind; light themes lose contrast.',
    fix: "Use `hsl(var(--white))` or the Tailwind class `text-white`.",
  },
  {
    // Match a Tailwind text-white utility (with optional variant prefixes
    // like `hover:`, `md:`, `dark:`) inside any class string. This is
    // detected separately from raw CSS literals because the fix is
    // different: callers should swap to `text-foreground` (themed body)
    // or `text-[hsl(var(--white))]` (themed white) so the GitHub-Light
    // remap takes effect.
    id: 'tw-text-white',
    re: /(?<![\w-])(?:[a-z]+:)*text-white(?![\w-])/g,
    why: "Tailwind `text-white` resolves to literal #fff regardless of theme — the GitHub-Light `--white` remap does not apply to this utility.",
    fix: "Use `text-foreground` for body text, or `text-[hsl(var(--white))]` if a true white-token color is intended.",
    // End-user slide types only. Dev/QA chrome (color-token debug overlay,
    // alignment guides) is intentionally painted with literal whites.
    scopePrefixes: ['src/slides/types/'],
  },
  {
    // Match a JSX inline style assigning `color:` to a value that does
    // NOT reference a CSS custom property. Uses negative lookahead to
    // skip the safe form `color: 'hsl(var(--…))'` so the audit only
    // surfaces theme-blind values (literal hex/rgb/hsl, opaque vars,
    // unknown identifiers). Anchored to `style={{` blocks so attribute
    // strings like `data-debug-class="color: hsl(...)"` don't trip it.
    //
    // Caught:
    //   style={{ color: 'white' }}
    //   style={{ color: '#fff' }}                  // also caught by hex-fff
    //   style={{ color: 'rgb(255,0,0)' }}
    //   style={{ color: customRedVar }}
    //   style={{ background: '#fff', color: 'hsl(40 50% 50%)' }}
    //
    // NOT caught:
    //   style={{ color: 'hsl(var(--gold))' }}
    //   style={{ color: 'hsl(var(--foreground) / 0.7)' }}
    //   data-debug-class=".step-title (color: hsl(var(--foreground)))"
    id: 'inline-color',
    // Two-step match: require that we're inside a `style={{` opening
    // somewhere on the line, then the `color: <value>` where <value>
    // is NOT a string containing `var(--`.
    re: /style=\{\{[^}]*?\bcolor\s*:\s*(?!['"`]?(?:[^'"`]*\bvar\(--)['"`]?)(?:'[^']*'|"[^"]*"|`[^`]*`|[A-Za-z_$][\w$.]*)/g,
    why: 'Inline `style={{ color: ... }}` with a non-token value bypasses the design system. Theme overrides (e.g. GitHub-Light) cannot reach this value.',
    fix: "Use `hsl(var(--foreground))`, `hsl(var(--gold))` etc., a Tailwind class, or a semantic CSS class in `index.css`.",
    // End-user slide types only. Dev/QA overlays, broken-asset overlays,
    // runtime-image-QA panels, alignment guides, ambient backgrounds and
    // chart palette modules paint literal colors by design.
    scopePrefixes: ['src/slides/types/'],
  },
  // Note: We intentionally do NOT flag the bare string `'white'` /
  // `"white"` standalone. In this codebase that token is used heavily
  // as a TS string-literal union member (e.g. `titleStyle: 'cream' |
  // 'white'`) and as a discriminator in `titleColorClass()` switch
  // arms — both of which translate into theme-aware CSS classes
  // downstream. Real white-text contrast bugs always surface as CSS
  // color literals (`hsl(0 0% 100%)`, `#fff*`, `rgb(255,255,255)`),
  // which the patterns above already catch.
];

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

interface Skip {
  file: string;
  line: number;
  reason: string;
}

/* ------------------------------------------------------------------ */
/* File walking                                                        */
/* ------------------------------------------------------------------ */

/**
 * Files excluded from scanning. These are theme/palette source-of-truth
 * modules whose entire JOB is to declare hex/HSL color values — flagging
 * them would be circular. The scanner targets *consumers* of these
 * tokens (slide components, slide CSS), not the registry.
 */
const EXCLUDED_FILES = new Set<string>([
  'src/slides/themes.ts',          // Theme token registry — hex literals are the API
  'src/slides/ambientIconRegistry.ts', // Brand glyph default colors
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

/* ------------------------------------------------------------------ */
/* Comment stripping (per-line, conservative)                          */
/* ------------------------------------------------------------------ */

/**
 * Strip line + block comments from a single source line so prose
 * inside comments never trips the pattern matcher. We keep this
 * conservative: a line that opens a block comment but doesn't close
 * it is treated as fully commented from the `/*` onward.
 */
function stripComments(line: string): string {
  // Block comment opens — drop everything from `/*` onward (the rest
  // of the file's block comments are handled per-line at the caller).
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

/* ------------------------------------------------------------------ */
/* Auditing                                                            */
/* ------------------------------------------------------------------ */

function auditFile(absPath: string): { findings: Finding[]; skips: Skip[] } {
  const rel = relative(REPO_ROOT, absPath);
  const src = readFileSync(absPath, 'utf8');
  return auditSource(rel, src);
}

/**
 * Run the audit pattern engine against a raw source string. Exposed so
 * tests can exercise individual patterns without writing fixture files
 * to disk. `relPath` is the repo-relative path the source would have —
 * it controls per-pattern `scopePrefixes` filtering.
 */
export function auditSource(
  relPath: string,
  src: string,
): { findings: Finding[]; skips: Skip[] } {
  const rel = relPath;
  const lines = src.split(/\r?\n/);
  const findings: Finding[] = [];
  const skips: Skip[] = [];

  // Naive multi-line block-comment tracking. Good enough for our
  // codebase's well-formed comments.
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // Block-comment state machine.
    let working = raw;
    if (inBlock) {
      const end = working.indexOf('*/');
      if (end === -1) continue;
      working = working.slice(end + 2);
      inBlock = false;
    }
    // Re-scan for an unterminated block opener after handling closer.
    {
      const open = working.indexOf('/*');
      const close = working.indexOf('*/', open + 2);
      if (open !== -1 && close === -1) {
        inBlock = true;
        working = working.slice(0, open);
      }
    }

    // Per-line opt-out — record the reason and skip pattern matching.
    const opt = raw.match(OPT_OUT);
    if (opt) {
      skips.push({
        file: rel,
        line: i + 1,
        reason: (opt[1] || '').trim() || '(no reason given)',
      });
      continue;
    }

    const stripped = stripComments(working);
    if (!stripped.trim()) continue;

    for (const pattern of PATTERNS) {
      // Honor per-pattern path scope. Use forward-slash form so the
      // comparison works on Windows too (paths come from `relative()`
      // which uses the platform separator — normalize for the check).
      if (pattern.scopePrefixes && pattern.scopePrefixes.length > 0) {
        const norm = rel.split(/[\\/]/).join('/');
        if (!pattern.scopePrefixes.some((p) => norm.startsWith(p))) continue;
      }
      // Reset lastIndex — these regexes use the `g` flag.
      pattern.re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.re.exec(stripped)) !== null) {
        findings.push({
          file: rel,
          line: i + 1,
          column: m.index + 1,
          patternId: pattern.id,
          match: m[0],
          source: raw.trim(),
          why: pattern.why,
          fix: pattern.fix,
        });
      }
    }
  }

  return { findings, skips };
}

/* ------------------------------------------------------------------ */
/* Reporting                                                           */
/* ------------------------------------------------------------------ */

function reportHuman(findings: Finding[], skips: Skip[]): void {
  if (findings.length === 0) {
    console.log('✓ No hardcoded white colors found in src/slides/.');
  } else {
    console.log(
      `✗ Found ${findings.length} hardcoded white color${findings.length === 1 ? '' : 's'} in src/slides/:\n`,
    );
    // Group by file for readable output.
    const byFile = new Map<string, Finding[]>();
    for (const f of findings) {
      const list = byFile.get(f.file) ?? [];
      list.push(f);
      byFile.set(f.file, list);
    }
    for (const [file, items] of byFile) {
      console.log(`  ${file}`);
      for (const f of items) {
        console.log(`    L${f.line}:${f.column}  [${f.patternId}]  ${f.match}`);
        console.log(`      ${f.source}`);
        console.log(`      why: ${f.why}`);
        console.log(`      fix: ${f.fix}\n`);
      }
    }
    console.log(
      'Add a trailing `// hardcoded-white-ok: <reason>` comment to intentionally allow a literal (e.g. canvas pixel fills).',
    );
  }

  if (skips.length > 0) {
    console.log(`\nℹ Skipped ${skips.length} opted-out line${skips.length === 1 ? '' : 's'}:`);
    for (const s of skips) {
      console.log(`  ${s.file}:${s.line}  — ${s.reason}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Public API + CLI                                                    */
/* ------------------------------------------------------------------ */

export function auditHardcodedWhite(root = SCAN_ROOT): {
  findings: Finding[];
  skips: Skip[];
} {
  const allFindings: Finding[] = [];
  const allSkips: Skip[] = [];
  for (const file of walk(root)) {
    const { findings, skips } = auditFile(file);
    allFindings.push(...findings);
    allSkips.push(...skips);
  }
  return { findings: allFindings, skips: allSkips };
}

function main(): void {
  const args = process.argv.slice(2);
  const json = args.includes('--json');

  const result = auditHardcodedWhite();

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    reportHuman(result.findings, result.skips);
  }

  process.exit(result.findings.length === 0 ? 0 : 1);
}

// Only run main when invoked as a script (not when imported by vitest).
// `import.meta.main` is Bun-specific; cast to keep tsc happy under the
// project's standard TS lib (which doesn't declare it).
if ((import.meta as unknown as { main?: boolean }).main) {
  main();
}
