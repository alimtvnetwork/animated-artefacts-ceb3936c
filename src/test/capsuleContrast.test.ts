/**
 * Capsule label contrast — WCAG AA across every theme.
 *
 * Capsules (`<Capsule>` in `src/slides/components/Capsule.tsx`) render as
 * colored chips with a single line of label text. The label MUST stay
 * legible regardless of which slide theme is active.
 *
 * Several themes — most acutely the light ones (github-light, macos-sonoma)
 * but also the navy-blue editorial palette — retune both `--gold` and the
 * capsule tokens, and we have already shipped multiple loops of contrast
 * regressions when those overrides drifted apart from the foreground
 * tokens. This test pins the invariant:
 *
 *     For every (theme × capsule variant) pair, the composited label
 *     color over the composited capsule background (with the slide
 *     background underneath, when the chip is translucent) must clear
 *     WCAG AA — 4.5:1 for normal-weight text. Gradient chips are
 *     evaluated at the WORST end of the gradient so the failing pixel
 *     is the one being asserted.
 *
 * If a future palette change drops any pair below 4.5:1, this test
 * fails the build with a per-pair report instead of waiting for a
 * human to spot it in QA.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEMES } from '../slides/themes';

/* ------------------------------------------------------------------ */
/* CSS parsing                                                         */
/* ------------------------------------------------------------------ */

const INDEX_CSS = readFileSync(
  join(process.cwd(), 'src/index.css'),
  'utf8',
);

/**
 * Concatenate every `:root { ... }` (and grouped `:root, [data-theme]`)
 * block in `index.css`. These hold the base palette + the default
 * capsule tokens.
 */
function readRootDeclarations(css: string): string {
  // Match selector lists that contain at least one of `:root` /
  // `[data-theme=...]`. Excludes `[data-theme='X']`-only blocks (those
  // are read separately per theme below).
  const re = /(?::root|\[data-theme[^\]]*\])(?:\s*,\s*(?::root|\[data-theme[^\]]*\]))*\s*\{([\s\S]*?)\}/g;
  let out = '';
  for (const m of css.matchAll(re)) {
    // Skip selector lists that target ONLY `[data-theme='id']` (single,
    // quoted) — those are theme-specific and applied later.
    const head = m[0].slice(0, m[0].indexOf('{'));
    const onlyThemed = !/:root/.test(head)
      && head.split(',').every(s => /\[data-theme\s*=\s*['"][^'"]+['"]\]/.test(s));
    if (onlyThemed) continue;
    out += m[1] + '\n';
  }
  if (out.length === 0) {
    throw new Error('Could not find any `:root { ... }` block in index.css');
  }
  return out;
}

/**
 * Read every `[data-theme='id']` block (single-theme selector) from
 * `index.css` and return a map of themeId → concatenated declarations.
 * These layer ON TOP of the base `:root` block at runtime.
 */
function readThemeBlocks(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Match `[data-theme='id'] { ... }` and grouped lists where every
  // selector is a single-theme `[data-theme='id']`.
  const re = /(\[data-theme\s*=\s*['"][^'"]+['"]\](?:\s*,\s*\[data-theme\s*=\s*['"][^'"]+['"]\])*)\s*\{([\s\S]*?)\}/g;
  for (const m of css.matchAll(re)) {
    const ids = [...m[1].matchAll(/\[data-theme\s*=\s*['"]([^'"]+)['"]\]/g)].map(x => x[1]);
    for (const id of ids) {
      out[id] = (out[id] ?? '') + m[2] + '\n';
    }
  }
  return out;
}

/** Read the *last* declaration of a CSS var from a block (browser semantics). */
function readVar(block: string, name: string): string | null {
  const re = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;]+);`, 'g');
  let last: string | null = null;
  for (const m of block.matchAll(re)) last = m[1].trim();
  return last;
}

/* ------------------------------------------------------------------ */
/* HSL/CSS color → RGB → relative luminance → contrast ratio           */
/* (WCAG 2.1 — https://www.w3.org/TR/WCAG21/#dfn-relative-luminance)   */
/* ------------------------------------------------------------------ */

interface RGB { r: number; g: number; b: number; a: number }

const WHITE: RGB = { r: 255, g: 255, b: 255, a: 1 };

function hslToRgb(h: number, s: number, l: number, a = 1): RGB {
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

/** Parse the project's HSL-triplet shape: `H S% L%` or `H S% L% / A`. */
function parseHslTriplet(value: string): RGB {
  const m = value.match(
    /^\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+))?\s*$/,
  );
  if (!m) throw new Error(`Unparseable HSL triplet: "${value}"`);
  return hslToRgb(Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100,
    m[4] != null ? Number(m[4]) : 1);
}

/**
 * Parse any CSS color string the capsule recipes produce — supports the
 * raw HSL triplet, `hsl(H S% L%)`, `hsl(H S% L% / A)`, and `transparent`.
 * Anything else throws so a future recipe change can't silently bypass
 * the test.
 */
function parseCssColor(value: string): RGB {
  const v = value.trim();
  if (v === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  // hsl(...) wrapper
  const fn = v.match(/^hsla?\(([^)]+)\)$/i);
  if (fn) return parseHslTriplet(fn[1].replace(',', ' '));
  // bare triplet
  return parseHslTriplet(v);
}

/** Composite a (possibly translucent) fg over an opaque bg. */
function composite(fg: RGB, bg: RGB): RGB {
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  };
}

function luminance({ r, g, b }: RGB): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: RGB, b: RGB): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ------------------------------------------------------------------ */
/* Resolve CSS-var maps per theme                                      */
/* ------------------------------------------------------------------ */

const ROOT_BLOCK = readRootDeclarations(INDEX_CSS);
const THEME_BLOCKS = readThemeBlocks(INDEX_CSS);

/**
 * The set of vars we care about. We resolve *only* what the capsule
 * recipes need so the resolver stays cheap and obvious.
 */
const NEEDED_VARS = [
  '--background',
  '--gold', '--gold-glow', '--ember', '--cream', '--ink', '--white', '--foreground',
  '--surface-1', '--surface-2', '--surface-3',
  '--capsule-gold-bg',     '--capsule-gold-fg',     '--capsule-gold-border',
  '--capsule-ember-bg',    '--capsule-ember-fg',    '--capsule-ember-border',
  '--capsule-cream-bg',    '--capsule-cream-fg',    '--capsule-cream-border',
  '--capsule-ink-bg',      '--capsule-ink-fg',      '--capsule-ink-border',
  '--capsule-outline-bg',  '--capsule-outline-fg',  '--capsule-outline-border',
  '--capsule-violet-start','--capsule-violet-end',  '--capsule-violet-fg',
  '--capsule-rose-start',  '--capsule-rose-end',    '--capsule-rose-fg',
  '--capsule-sky-start',   '--capsule-sky-end',     '--capsule-sky-fg',
] as const;

type VarMap = Record<string, string>;

function resolveTheme(themeId: string): VarMap {
  const themePreset = THEMES[themeId as keyof typeof THEMES];
  const themeBlockText = THEME_BLOCKS[themeId] ?? '';

  const out: VarMap = {};
  for (const name of NEEDED_VARS) {
    // Order: base :root → index.css `[data-theme='id']` block → themes.ts vars.
    // (themes.ts vars are applied last in the runtime by `applyTheme`,
    // but the index.css `[data-theme='id']` selector also wins over `:root`
    // in cascade order. Where both define the same var, the themes.ts
    // value wins because it's set inline on the element via the runtime
    // applier. Mirror that here.)
    const fromRoot   = readVar(ROOT_BLOCK, name);
    const fromThemed = readVar(themeBlockText, name);
    const fromTs     = themePreset?.vars?.[name] ?? null;
    const resolved = fromTs ?? fromThemed ?? fromRoot;
    if (resolved != null) out[name] = resolved;
  }
  return out;
}

/**
 * Some capsule recipes reference one var inside another (e.g.
 * `--capsule-cream-bg: var(--cream)` in the noir base). Recursively
 * dereference one level of `var(--x)` so we end up with raw HSL
 * triplets. Also expand `var(--x) / 0.55` → `<triplet> / 0.55`.
 */
function deref(value: string, vars: VarMap, depth = 0): string {
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

/* ------------------------------------------------------------------ */
/* Capsule recipes — mirror src/index.css                              */
/* ------------------------------------------------------------------ */

interface Recipe {
  /** One color per gradient stop (or single fill). The WORST stop wins. */
  bgStops: string[];
  /** Label color. */
  fg: string;
}

/**
 * For each capsule variant, return the (resolved) bg + fg colors as
 * CSS color strings ready for `parseCssColor`. Mirrors the CSS in
 * `src/index.css` so any drift here will be caught by code review.
 */
function recipeFor(variant: string, themeId: string, vars: VarMap): Recipe {
  const v = (name: string) => deref(vars[name] ?? '', vars);
  const isLightTheme = themeId === 'github-light' || themeId === 'paper-ink' || themeId === 'macos-sonoma';

  switch (variant) {
    case 'gold':
      // Per index.css `.capsule-gold` (line 536) — gradient of --gold → --gold-glow,
      // color --ink. (The `--capsule-gold-*` tokens defined at :root and per
      // theme are vestigial — no .capsule-gold rule references them.)
      // v0.181 override for github-light + macos-sonoma: solid hsl(--gold), white text.
      // 2026-05-01 a11y fix: macos-sonoma uses a darker L=45 solid gold
      // ONLY for the capsule (mirrors the CSS override) so white-on-gold
      // clears AA without darkening the eyebrow/step-label brand color.
      if (themeId === 'macos-sonoma') {
        return { bgStops: ['hsl(212 100% 45%)'], fg: 'hsl(0 0% 100%)' };
      }
      if (isLightTheme) {
        return { bgStops: [`hsl(${v('--gold')})`], fg: 'hsl(0 0% 100%)' };
      }
      return {
        bgStops: [`hsl(${v('--gold')})`, `hsl(${v('--gold-glow')})`],
        fg: `hsl(${v('--ink')})`,
      };
    case 'ember':
      // Per index.css `.capsule-ember` (line 546) — hardcoded amber gradient
      // hsl(22 85% 60%) → hsl(28 90% 70%), color --ink. Same vestigial-token note.
      // v0.181 override for light themes: solid hsl(--ember), white text.
      if (isLightTheme) {
        return { bgStops: [`hsl(${v('--ember')})`], fg: 'hsl(0 0% 100%)' };
      }
      return {
        bgStops: ['hsl(22 85% 60%)', 'hsl(28 90% 70%)'],
        fg: `hsl(${v('--ink')})`,
      };
    case 'cream':
      return {
        bgStops: [`hsl(${v('--capsule-cream-bg')})`],
        fg: `hsl(${v('--capsule-cream-fg')})`,
      };
    case 'ink':
      return {
        bgStops: [`hsl(${v('--capsule-ink-bg')})`],
        fg: `hsl(${v('--capsule-ink-fg')})`,
      };
    case 'outline':
      // outline-bg is a raw CSS color (incl. `transparent`), not a triplet.
      return {
        bgStops: [v('--capsule-outline-bg')],
        fg: `hsl(${v('--capsule-outline-fg')})`,
      };
    case 'violet':
      return {
        bgStops: [`hsl(${v('--capsule-violet-start')})`, `hsl(${v('--capsule-violet-end')})`],
        fg: `hsl(${v('--capsule-violet-fg')})`,
      };
    case 'teal':
      // .capsule-teal default: hardcoded gradient hsl(176 70% 42%) → hsl(168 78% 55%), color --ink
      return {
        bgStops: ['hsl(176 70% 42%)', 'hsl(168 78% 55%)'],
        fg: `hsl(${v('--ink')})`,
      };
    case 'rose':
      return {
        bgStops: [`hsl(${v('--capsule-rose-start')})`, `hsl(${v('--capsule-rose-end')})`],
        fg: `hsl(${v('--capsule-rose-fg')})`,
      };
    case 'sky':
      return {
        bgStops: [`hsl(${v('--capsule-sky-start')})`, `hsl(${v('--capsule-sky-end')})`],
        fg: `hsl(${v('--capsule-sky-fg')})`,
      };
    default:
      throw new Error(`Unknown capsule variant: ${variant}`);
  }
}

const VARIANTS = ['gold', 'ember', 'cream', 'ink', 'outline', 'violet', 'teal', 'rose', 'sky'] as const;

/** WCAG AA threshold for normal-weight body text. Capsule labels render
 *  at 0.95rem (Inter Medium), comfortably below the 18pt large-text
 *  break, so we hold the strict 4.5:1 bar. */
const AA_NORMAL = 4.5;

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('capsule label contrast — WCAG AA across every theme', () => {
  for (const themeId of Object.keys(THEMES)) {
    const vars = resolveTheme(themeId);
    const slideBgRaw = vars['--background'];
    const slideBg = parseHslTriplet(slideBgRaw);

    describe(`theme: ${themeId} (slide bg ${slideBgRaw})`, () => {
      for (const variant of VARIANTS) {
        it(`capsule-${variant} label clears AA (≥ ${AA_NORMAL}:1)`, () => {
          const recipe = recipeFor(variant, themeId, vars);

          // Composite fg over EACH gradient stop (over slide bg, since
          // some bgs are translucent) and take the worst contrast — the
          // failing pixel is the one being asserted against.
          const fgRaw = parseCssColor(recipe.fg);
          let worst = Infinity;
          let worstStop = '';
          for (const stopRaw of recipe.bgStops) {
            const bgOnSlide = composite(parseCssColor(stopRaw), slideBg);
            const fgOnBg = composite(fgRaw, bgOnSlide);
            const ratio = contrastRatio(fgOnBg, bgOnSlide);
            if (ratio < worst) {
              worst = ratio;
              worstStop = stopRaw;
            }
          }
          expect(
            worst,
            `capsule-${variant} on ${themeId}: worst stop "${worstStop}" → ${worst.toFixed(2)}:1 (need ≥ ${AA_NORMAL})`,
          ).toBeGreaterThanOrEqual(AA_NORMAL);
        });
      }
    });
  }
});
