#!/usr/bin/env bun
/**
 * Build preflight (v0.188).
 *
 * Fails the build BEFORE Vite runs with a single, strongly-typed,
 * actionable error report when:
 *
 *   1. A package is `import`-ed by `src/**` but is missing from
 *      `package.json`'s `dependencies`/`devDependencies`, or installed
 *      under `node_modules` (catches the @tanstack/query-core class of
 *      regression where a transitive dep silently disappears and the
 *      production bundle boots blank).
 *   2. A `<Route element={<X />} />` in `src/App.tsx` references a page
 *      component that has no matching file under `src/pages/`.
 *   3. A deck folder under `front-end/project/<slug>/` is missing
 *      `deck.json` (loader.ts will throw at boot — surface it here).
 *
 * All failures from all three checks are aggregated into ONE multi-line
 * error so authors see the full picture in one shot.
 *
 * Run via `bun scripts/preflight.ts` or automatically via the `prebuild`
 * npm script.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

// ───────────────────────────────────────────────────────────── types ───────

type Severity = 'error';

interface PreflightIssue {
  readonly check: 'dependency' | 'route-mapping' | 'deck-manifest';
  readonly severity: Severity;
  readonly message: string;
  /** Where the offending reference lives (file path + line when known). */
  readonly source?: string;
  /** Hint the author can paste to fix the issue. */
  readonly remediation?: string;
}

interface CheckResult {
  readonly issues: readonly PreflightIssue[];
}

// ─────────────────────────────────────────────────────────── helpers ───────

const ROOT = resolve(import.meta.dir, '..');
const SRC = join(ROOT, 'src');
const PAGES_DIR = join(SRC, 'pages');
const APP_TSX = join(SRC, 'App.tsx');
const SPEC_DECKS = join(ROOT, 'front-end', 'project');
const PKG_JSON = join(ROOT, 'package.json');
const NODE_MODULES = join(ROOT, 'node_modules');

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git') continue;
      walk(full, out);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** Extract the package name from an import specifier ("react-dom/client" → "react-dom"; "@scope/pkg/sub" → "@scope/pkg"). */
function pkgFromSpecifier(spec: string): string | null {
  if (!spec || spec.startsWith('.') || spec.startsWith('/')) return null;
  if (spec.startsWith('@/') || spec.startsWith('~/')) return null;
  // bare `node:` builtins — skip
  if (spec.startsWith('node:')) return null;
  const parts = spec.split('/');
  if (spec.startsWith('@')) {
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0];
}

const NODE_BUILTINS = new Set([
  'fs', 'path', 'os', 'crypto', 'stream', 'util', 'events', 'http', 'https',
  'url', 'buffer', 'child_process', 'process', 'module', 'assert', 'zlib',
  'querystring', 'tty', 'net', 'dns', 'readline', 'perf_hooks',
]);

// ──────────────────────────────────────────────────── check: deps ───────

function checkDependencies(): CheckResult {
  const issues: PreflightIssue[] = [];
  const pkg = JSON.parse(readFileSync(PKG_JSON, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const declared = new Set<string>([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);

  const importRegex = /(?:import\s+(?:[^'"`;]+?\s+from\s+)?|export\s+[^'"`;]+?\s+from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g;

  // Map<pkg, Array<{file, line}>>
  const usages = new Map<string, Array<{ file: string; line: number }>>();
  for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(text)) !== null) {
      const pkgName = pkgFromSpecifier(match[1]);
      if (!pkgName) continue;
      if (NODE_BUILTINS.has(pkgName)) continue;
      const line = text.slice(0, match.index).split('\n').length;
      if (!usages.has(pkgName)) usages.set(pkgName, []);
      usages.get(pkgName)!.push({ file, line });
    }
  }

  for (const [pkgName, sites] of usages) {
    const isDeclared = declared.has(pkgName);
    const isInstalled = existsSync(join(NODE_MODULES, ...pkgName.split('/')));
    if (isDeclared && isInstalled) continue;
    const first = sites[0];
    const reason = !isDeclared && !isInstalled
      ? 'not in package.json AND not installed in node_modules'
      : !isDeclared
        ? 'imported in src/ but missing from package.json'
        : 'declared in package.json but not installed in node_modules';
    issues.push({
      check: 'dependency',
      severity: 'error',
      message: `Package "${pkgName}" is ${reason}.`,
      source: `${relative(ROOT, first.file)}:${first.line}` +
        (sites.length > 1 ? ` (and ${sites.length - 1} other site${sites.length > 2 ? 's' : ''})` : ''),
      remediation: `bun add ${pkgName}`,
    });
  }

  // Also verify every declared dep is actually installed on disk. Catches
  // transitive/peer regressions (e.g. @tanstack/query-core silently absent
  // after a lockfile churn) that don't appear as direct imports in src/.
  for (const pkgName of declared) {
    if (!existsSync(join(NODE_MODULES, ...pkgName.split('/')))) {
      issues.push({
        check: 'dependency',
        severity: 'error',
        message: `Package "${pkgName}" is declared in package.json but not installed in node_modules.`,
        source: 'package.json',
        remediation: `Run: bun install   (or: bun add ${pkgName})`,
      });
    }
  }

  return { issues };
}

// ────────────────────────────────────────────────── check: routes ───────

function checkRouteMappings(): CheckResult {
  const issues: PreflightIssue[] = [];
  if (!existsSync(APP_TSX)) {
    return { issues: [{
      check: 'route-mapping',
      severity: 'error',
      message: `src/App.tsx not found.`,
    }] };
  }
  const text = readFileSync(APP_TSX, 'utf8');
  const lines = text.split('\n');

  // Build component → import-spec map for default imports inside App.tsx.
  // Matches:  import Foo from "./pages/Foo";   import Foo from "./pages/Foo.tsx";
  const importMap = new Map<string, string>(); // local name → resolved file path
  const importRe = /^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/gm;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(text)) !== null) {
    const local = m[1];
    const spec = m[2];
    if (!spec.startsWith('.')) continue;
    importMap.set(local, spec);
  }

  // Routes: <Route ... element={<Foo />} ... />
  const routeRe = /<Route\b[^>]*\belement=\{<([A-Za-z_$][\w$]*)\b[^>]*\/>\}/g;
  let r: RegExpExecArray | null;
  while ((r = routeRe.exec(text)) !== null) {
    const comp = r[1];
    const line = text.slice(0, r.index).split('\n').length;
    // Skip locally-defined components (function X() {...} or const X = ...).
    const localDef = new RegExp(`(?:function|const|let|var)\\s+${comp}\\b`).test(text);
    if (localDef) continue;
    const spec = importMap.get(comp);
    if (!spec) {
      issues.push({
        check: 'route-mapping',
        severity: 'error',
        message: `<Route element={<${comp} />}> references a component with no import in App.tsx.`,
        source: `src/App.tsx:${line}`,
        remediation: `Add: import ${comp} from "./pages/${comp}";`,
      });
      continue;
    }
    // Resolve relative spec against App.tsx directory.
    const base = resolve(SRC, spec);
    const candidates = [base, `${base}.tsx`, `${base}.ts`, `${base}.jsx`, `${base}.js`, join(base, 'index.tsx'), join(base, 'index.ts')];
    if (!candidates.some(p => existsSync(p))) {
      issues.push({
        check: 'route-mapping',
        severity: 'error',
        message: `<Route element={<${comp} />}> imports "${spec}" but no matching file exists.`,
        source: `src/App.tsx:${line}`,
        remediation: `Create the file at ${relative(ROOT, base)}.tsx or fix the import path.`,
      });
    }
  }

  // Sanity: every page file under src/pages/ should be importable too. Not fatal,
  // but warn-as-error on unreferenced page files would be too noisy. Skip.
  void PAGES_DIR;

  return { issues };
}

// ──────────────────────────────────────────────── check: deck.json ───────

function checkDeckManifests(): CheckResult {
  const issues: PreflightIssue[] = [];
  if (!existsSync(SPEC_DECKS)) {
    issues.push({
      check: 'deck-manifest',
      severity: 'error',
      message: `Spec root not found: ${relative(ROOT, SPEC_DECKS)}`,
      remediation: `Create at least one deck folder with a deck.json (see spec/readme.md).`,
    });
    return { issues };
  }
  const folders = readdirSync(SPEC_DECKS).filter(name => {
    const full = join(SPEC_DECKS, name);
    return statSync(full).isDirectory();
  });
  if (folders.length === 0) {
    issues.push({
      check: 'deck-manifest',
      severity: 'error',
      message: `No deck folders under ${relative(ROOT, SPEC_DECKS)}.`,
      remediation: `Run: bun run new:deck`,
    });
  }
  for (const slug of folders) {
    const deckFile = join(SPEC_DECKS, slug, 'data', 'slides.json');
    if (!existsSync(deckFile)) {
      issues.push({
        check: 'deck-manifest',
        severity: 'error',
        message: `Deck folder "${slug}" is missing data/slides.json.`,
        source: relative(ROOT, join(SPEC_DECKS, slug)),
        remediation: `Add ${relative(ROOT, deckFile)} or remove the empty folder.`,
      });
    }
  }
  return { issues };
}

// ───────────────────────────────────────────────────────── runner ───────

function formatReport(issues: readonly PreflightIssue[]): string {
  const byCheck = new Map<PreflightIssue['check'], PreflightIssue[]>();
  for (const i of issues) {
    if (!byCheck.has(i.check)) byCheck.set(i.check, []);
    byCheck.get(i.check)!.push(i);
  }
  const sections: string[] = [];
  for (const [check, list] of byCheck) {
    const lines = [`\n  ▸ ${check} (${list.length})`];
    for (const i of list) {
      lines.push(`    ✗ ${i.message}`);
      if (i.source) lines.push(`        at ${i.source}`);
      if (i.remediation) lines.push(`        fix: ${i.remediation}`);
    }
    sections.push(lines.join('\n'));
  }
  return (
    `\n[preflight] ${issues.length} blocking issue(s) — refusing to build.` +
    sections.join('\n') +
    `\n\nResolve the issues above and re-run the build.\n`
  );
}

function main(): void {
  const t0 = Date.now();
  const all: PreflightIssue[] = [
    ...checkDependencies().issues,
    ...checkRouteMappings().issues,
    ...checkDeckManifests().issues,
  ];
  const ms = Date.now() - t0;
  if (all.length === 0) {
    console.log(`[preflight] ✓ deps + routes + decks OK (${ms}ms)`);
    return;
  }
  console.error(formatReport(all));
  process.exit(1);
}

main();
