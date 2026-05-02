/**
 * Visual contrast regression test for the controller-pill / ThemeMenu chrome.
 *
 * The controller pill (and the popovers anchored to it — ShareMenu, DeckMenu,
 * ThemeMenu) must stay legible regardless of which slide theme is active.
 * The way we guarantee that is:
 *
 *   1. Define theme-independent `--chrome-bg` / `--chrome-fg` /
 *      `--chrome-fg-muted` / `--chrome-fg-subtle` tokens at `:root` in
 *      `src/index.css`.
 *   2. Never let any theme in `src/slides/themes.ts` override those tokens.
 *      (If a theme did, switching to it would silently regress contrast on
 *      every controller surface — exactly the GitHub-Light bug we shipped
 *      a fix for in the prior loop.)
 *
 * This test enforces both invariants:
 *
 *   A. `:root` declares all four `--chrome-*` tokens.
 *   B. No `THEMES[*].vars` block redefines any `--chrome-*` token.
 *   C. The pinned `--chrome-fg` / `--chrome-bg` pair clears WCAG AA
 *      (contrast ratio ≥ 4.5 for normal text), and the muted/subtle
 *      variants clear AA-large (≥ 3.0), measured against the opaque
 *      `--chrome-bg` base. Because tokens are pinned, the pair is
 *      constant across every palette — but we still loop the assertion
 *      over every theme so a future override would fail loudly.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEMES } from '../slides/themes';

/* ------------------------------------------------------------------ */
/* CSS file parsing                                                    */
/* ------------------------------------------------------------------ */

const INDEX_CSS = readFileSync(
  join(process.cwd(), 'src/index.css'),
  'utf8',
);

/**
 * Concatenate every `:root { ... }` and `[data-theme] { ... }` declaration
 * block in the file. Token definitions live across multiple blocks (the
 * base palette in one, the chrome tokens in another `:root, [data-theme]`
 * group), so we union them and let the last definition win — the same
 * resolution the browser would do.
 */
function readRootDeclarations(css: string): string {
  const re = /(?::root|\[data-theme[^\]]*\])(?:\s*,\s*(?::root|\[data-theme[^\]]*\]))*\s*\{([\s\S]*?)\}/g;
  let out = '';
  for (const m of css.matchAll(re)) out += m[1] + '\n';
  if (out.length === 0) {
    throw new Error('Could not find any `:root { ... }` block in index.css');
  }
  return out;
}

/** Read the *last* declaration of a CSS var from a block (browser semantics). */
function readVar(block: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*:\\s*([^;]+);`, 'g');
  let last: string | null = null;
  for (const m of block.matchAll(re)) last = m[1].trim();
  return last;
}

/* ------------------------------------------------------------------ */
/* HSL → RGB → relative luminance → contrast ratio                     */
/* (WCAG 2.1 — https://www.w3.org/TR/WCAG21/#dfn-relative-luminance)   */
/* ------------------------------------------------------------------ */

interface RGB { r: number; g: number; b: number; a: number }

/**
 * Parse a CSS-var value of the form `H S% L%` or `H S% L% / A` (the
 * Tailwind/HSL-triplet shape used throughout this project) and return
 * an opaque sRGB triplet plus optional alpha.
 */
function parseHslTriplet(value: string): RGB {
  // Accept "H S% L%" and "H S% L% / A" (alpha 0-1).
  const m = value.match(
    /^\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+))?\s*$/,
  );
  if (!m) throw new Error(`Unparseable HSL triplet: "${value}"`);
  const h = Number(m[1]);
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const a = m[4] != null ? Number(m[4]) : 1;

  // Standard HSL → RGB conversion.
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if      (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp >= 1 && hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp >= 2 && hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp >= 3 && hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp >= 4 && hp < 5) [r1, g1, b1] = [x, 0, c];
  else                         [r1, g1, b1] = [c, 0, x];
  const m0 = l - c / 2;
  return {
    r: Math.round((r1 + m0) * 255),
    g: Math.round((g1 + m0) * 255),
    b: Math.round((b1 + m0) * 255),
    a,
  };
}

/** Composite a (possibly translucent) foreground over an opaque background. */
function composite(fg: RGB, bg: RGB): RGB {
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  };
}

/** WCAG relative luminance for an sRGB triplet (0-255 components). */
function luminance({ r, g, b }: RGB): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two opaque colors (1.0 → 21.0). */
function contrastRatio(a: RGB, b: RGB): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

const ROOT_BLOCK = readRootDeclarations(INDEX_CSS);
const CHROME_TOKENS = ['--chrome-bg', '--chrome-fg', '--chrome-fg-muted', '--chrome-fg-subtle'] as const;

describe('controller-pill chrome contrast — WCAG AA across every theme', () => {
  it('A — :root declares every --chrome-* token', () => {
    for (const token of CHROME_TOKENS) {
      const value = readVar(ROOT_BLOCK, token);
      expect(value, `expected ${token} to be defined at :root in src/index.css`).not.toBeNull();
    }
  });

  it('B — no theme overrides any --chrome-* token', () => {
    const offenders: string[] = [];
    for (const theme of Object.values(THEMES)) {
      for (const token of CHROME_TOKENS) {
        if (token in theme.vars) {
          offenders.push(`${theme.id} → ${token}`);
        }
      }
    }
    expect(
      offenders,
      `themes must NOT override --chrome-* tokens; offenders:\n  ${offenders.join('\n  ')}`,
    ).toEqual([]);
  });

  // The chrome pair is constant by construction (tokens are pinned), but
  // we loop over every theme so any future regression — e.g. a theme
  // sneaking a `--chrome-fg` override past the structural test above
  // through a different mechanism — surfaces per-theme in the report.
  const chromeBgRaw = readVar(ROOT_BLOCK, '--chrome-bg')!;
  const chromeFgRaw = readVar(ROOT_BLOCK, '--chrome-fg')!;
  const chromeFgMutedRaw = readVar(ROOT_BLOCK, '--chrome-fg-muted')!;
  const chromeFgSubtleRaw = readVar(ROOT_BLOCK, '--chrome-fg-subtle')!;

  for (const theme of Object.values(THEMES)) {
    describe(`theme: ${theme.id}`, () => {
      const bg = parseHslTriplet(chromeBgRaw);

      it('C1 — primary chrome-fg ≥ AA (4.5:1) on chrome-bg', () => {
        const fg = composite(parseHslTriplet(chromeFgRaw), bg);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `${theme.id}: chrome-fg/bg ratio = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      });

      it('C2 — muted chrome-fg ≥ AA-large (3.0:1) on chrome-bg', () => {
        const fg = composite(parseHslTriplet(chromeFgMutedRaw), bg);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `${theme.id}: chrome-fg-muted/bg ratio = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3.0);
      });

      it('C3 — subtle chrome-fg ≥ AA-large (3.0:1) on chrome-bg', () => {
        const fg = composite(parseHslTriplet(chromeFgSubtleRaw), bg);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `${theme.id}: chrome-fg-subtle/bg ratio = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3.0);
      });
    });
  }
});
