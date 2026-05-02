/**
 * Shared theme-variable resolver for visual contrast tests.
 *
 * Mirrors the runtime cascade exactly:
 *
 *   1. `:root { ... }` (and grouped `:root, [data-theme=...]`) blocks in
 *      `src/index.css` — base palette + default tokens.
 *   2. `[data-theme='id'] { ... }` blocks in `src/index.css` — themed
 *      overrides authored in CSS (e.g. github-light's `--foreground`).
 *   3. `THEMES[id].vars` from `src/slides/themes.ts` — runtime applier
 *      writes these inline on `<html data-theme="id">`, so they win over
 *      any cascaded value.
 *
 * Extracted from `src/test/capsuleContrast.test.ts` so other contrast
 * tests (slide 4 visual QA, future per-slide audits) share one source
 * of truth and can never disagree about a resolved color.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEMES, type ThemeId } from '../../slides/themes';

const INDEX_CSS = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');

/** Concatenate every `:root { ... }` (and grouped `:root, [data-theme]`)
 *  block. Skips selector lists that are themed-only (those load below). */
export function readRootDeclarations(css: string = INDEX_CSS): string {
  const re = /(?::root|\[data-theme[^\]]*\])(?:\s*,\s*(?::root|\[data-theme[^\]]*\]))*\s*\{([\s\S]*?)\}/g;
  let out = '';
  for (const m of css.matchAll(re)) {
    const head = m[0].slice(0, m[0].indexOf('{'));
    const onlyThemed = !/:root/.test(head)
      && head.split(',').every(s => /\[data-theme\s*=\s*['"][^'"]+['"]\]/.test(s));
    if (onlyThemed) continue;
    out += m[1] + '\n';
  }
  if (!out) throw new Error('Could not find any `:root { ... }` block in index.css');
  return out;
}

/** Read every `[data-theme='id']` block. Map id → concatenated declarations. */
export function readThemeBlocks(css: string = INDEX_CSS): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(\[data-theme\s*=\s*['"][^'"]+['"]\](?:\s*,\s*\[data-theme\s*=\s*['"][^'"]+['"]\])*)\s*\{([\s\S]*?)\}/g;
  for (const m of css.matchAll(re)) {
    const ids = [...m[1].matchAll(/\[data-theme\s*=\s*['"]([^'"]+)['"]\]/g)].map(x => x[1]);
    for (const id of ids) out[id] = (out[id] ?? '') + m[2] + '\n';
  }
  return out;
}

/** Last declaration wins (browser semantics). Returns trimmed value or null. */
export function readVar(block: string, name: string): string | null {
  const re = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;]+);`, 'g');
  let last: string | null = null;
  for (const m of block.matchAll(re)) last = m[1].trim();
  return last;
}

const ROOT_BLOCK = readRootDeclarations();
const THEME_BLOCKS = readThemeBlocks();

export type VarMap = Record<string, string>;

/** Resolve any subset of CSS vars for a theme via the runtime cascade. */
export function resolveTheme(themeId: ThemeId, names: ReadonlyArray<string>): VarMap {
  const ts = (THEMES[themeId]?.vars ?? {}) as Record<string, string>;
  const themed = THEME_BLOCKS[themeId] ?? '';
  const out: VarMap = {};
  for (const name of names) {
    const fromRoot = readVar(ROOT_BLOCK, name);
    const fromThemed = readVar(themed, name);
    const fromTs = ts[name] ?? null;
    const resolved = fromTs ?? fromThemed ?? fromRoot;
    if (resolved != null) out[name] = resolved;
  }
  return out;
}

/** Recursively expand one level of `var(--x)` references inside a value.
 *  Also handles `var(--x) / 0.55` → `<triplet> / 0.55`. */
export function deref(value: string, vars: VarMap, depth = 0): string {
  if (depth > 4) return value;
  const m = value.match(/^var\(\s*(--[\w-]+)\s*\)\s*(?:\/\s*([\d.]+))?\s*$/);
  if (m) {
    const inner = vars[m[1]];
    if (inner == null) return value;
    const expanded = deref(inner, vars, depth + 1);
    return m[2] ? `${expanded} / ${m[2]}` : expanded;
  }
  return value;
}
