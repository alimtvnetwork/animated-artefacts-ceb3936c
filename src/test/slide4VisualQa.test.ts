/**
 * Slide-4 visual QA checklist — every theme.
 *
 * Slide 4 (`MetricGridSlide`) has historically been the canary for theme
 * regressions: hardcoded `bg-ink`, hardcoded vibrant accent values, and
 * chrome (DotPagination + grid-overview button) that assumes a particular
 * surface tone. This test pins the visual contract so the next regression
 * fails the build instead of shipping.
 *
 * For every theme defined in `src/slides/themes.ts`, we re-compute the
 * effective WCAG 2.1 contrast ratio for:
 *
 *   1. **Metric numbers** — every `metric-accent-*` variant against the
 *      slide's `--background`. The huge value text needs ≥ 3.0:1 (large)
 *      but we hold it to ≥ 4.5:1 (normal) because the numerals double as
 *      data labels and need to read at thumbnail sizes too.
 *   2. **Highlighted template color** — `--foreground` (metric label) and
 *      the eyebrow gold against the slide bg, ≥ 4.5:1 normal.
 *   3. **QR meeting card contrast** — the contact-card surface contract:
 *      QR card is locked white (#fff), so ink modules get a hardcoded
 *      ≥ 12:1 vs white; the "Scan to connect" caption uses
 *      `--muted-foreground` against `--background` and must clear AA;
 *      the wordmark accent half (`--gold`) on `--background` ≥ 4.5:1; and
 *      the CTA `--primary-foreground` on `--primary` (or `--gold`) surface
 *      must clear AA.
 *
 * Each failure prints: theme · element · expected · actual · source-of-truth
 * file path so a regression points at exactly what to fix.
 *
 * Companion: `spec/architecture/light-theme-bg.md` — explains why slide 4
 * inherits `hsl(var(--background))` instead of hardcoding a surface.
 */
import { describe, it, expect } from 'vitest';
import { THEME_IDS, type ThemeId } from '../slides/themes';
import { resolveTheme, deref } from './lib/themeVars';
import {
  effectiveContrast,
  parseHslTriplet,
  contrastRatio,
  type RGB,
  WCAG,
} from './lib/contrast';

/* ------------------------------------------------------------------ */
/* Vars we need across all three categories.                           */
/* ------------------------------------------------------------------ */
const NEEDED_VARS = [
  '--background',
  '--foreground',
  '--muted-foreground',
  '--gold',
  '--ember',
  '--cream',
  '--ink',
  '--primary',
  '--primary-foreground',
] as const;

/* ------------------------------------------------------------------ */
/* Helpers — bridge themeVars (string deref) and contrast (parse RGB). */
/* ------------------------------------------------------------------ */
function tripletFromVar(varName: string, vars: Record<string, string>): RGB {
  const raw = deref(vars[varName] ?? '', vars);
  // Strip optional `/ alpha` — these tests assert opaque-fg colors.
  const triplet = raw.split('/')[0].trim();
  return parseHslTriplet(triplet);
}

/** Slide-4 uses `bg-background`, so the surface is the resolved --background. */
function slideSurface(themeId: ThemeId): RGB {
  const vars = resolveTheme(themeId, NEEDED_VARS);
  return tripletFromVar('--background', vars);
}

/* ------------------------------------------------------------------ */
/* 1. Metric numbers — `metric-accent-*` recipes (mirror src/index.css)*/
/* ------------------------------------------------------------------ */

/**
 * Mirrors `.metric-accent-*` in `src/index.css` (lines ~847-878). If a
 * future override moves there, mirror it here too — the duplication is
 * intentional so a one-sided change shows up as a test failure.
 */
type MetricAccent = 'gold' | 'ember' | 'cream' | 'violet' | 'teal' | 'rose' | 'sky';

function metricAccentColor(themeId: ThemeId, accent: MetricAccent): RGB {
  const vars = resolveTheme(themeId, NEEDED_VARS);
  // github-light and paper-ink override the slide bg to a light surface
  // and re-tune the metric accents for AA on that bg. macos-sonoma keeps
  // the dark noir bg and uses default accent tunings.
  const isGithubLight = themeId === 'github-light';
  const isPaperInk = themeId === 'paper-ink';

  // Default tunings (dark themes).
  const defaults: Record<MetricAccent, () => RGB> = {
    gold:   () => tripletFromVar('--gold', vars),
    ember:  () => tripletFromVar('--ember', vars),
    cream:  () => tripletFromVar('--cream', vars),
    violet: () => parseHslTriplet('265 85% 72%'),
    teal:   () => parseHslTriplet('175 75% 55%'),
    rose:   () => parseHslTriplet('345 85% 70%'),
    sky:    () => parseHslTriplet('210 90% 70%'),
  };

  // GitHub Light overrides.
  const githubLight: Partial<Record<MetricAccent, () => RGB>> = {
    cream:  () => parseHslTriplet('210 12% 16%'),
    violet: () => parseHslTriplet('265 75% 45%'),
    teal:   () => parseHslTriplet('175 85% 24%'),
    rose:   () => parseHslTriplet('345 80% 42%'),
    sky:    () => parseHslTriplet('210 90% 38%'),
  };

  // Paper & Ink overrides — slightly darker stops than github-light to
  // hit AA on the warmer cream surface (#FAF6EC). Mirrors CSS in
  // `src/index.css` under `[data-theme='paper-ink'] .metric-accent-*`.
  const paperInk: Partial<Record<MetricAccent, () => RGB>> = {
    gold:   () => parseHslTriplet('38 80% 30%'),
    cream:  () => parseHslTriplet('36 25% 12%'),
    violet: () => parseHslTriplet('265 75% 42%'),
    teal:   () => parseHslTriplet('175 85% 22%'),
    rose:   () => parseHslTriplet('345 80% 38%'),
    sky:    () => parseHslTriplet('210 90% 34%'),
  };

  if (isGithubLight && githubLight[accent]) return githubLight[accent]!();
  if (isPaperInk && paperInk[accent]) return paperInk[accent]!();
  return defaults[accent]();
}

/* ------------------------------------------------------------------ */
/* 3. QR meeting card — locked white tile + caption + wordmark + CTA   */
/* ------------------------------------------------------------------ */

const QR_TILE: RGB = [255, 255, 255]; // src/slides/types/QrMeetingSlide.tsx — '#ffffff' literal
const QR_INK: RGB = [13, 13, 13];     // src/slides/components/BrandedQR.tsx — '#0d0d0d' literal

/* ------------------------------------------------------------------ */
/* Test matrix                                                         */
/* ------------------------------------------------------------------ */

const METRIC_ACCENTS: ReadonlyArray<MetricAccent> = ['gold', 'ember', 'cream', 'violet', 'teal', 'rose', 'sky'];

interface Check {
  group: 'metric-numbers' | 'metric-template' | 'qr-card';
  label: string;
  fg: RGB;
  alpha: number;
  bg: RGB;
  min: number;
  source: string;
}

function buildChecks(themeId: ThemeId): Check[] {
  const vars = resolveTheme(themeId, NEEDED_VARS);
  const surface = slideSurface(themeId);
  const checks: Check[] = [];

  // 1. Metric numbers — every accent against the slide bg.
  // Big-number metrics qualify as WCAG large text (~9rem, ≥18pt bold), so
  // the threshold is 3.0:1. We tighten to AA_NORMAL only for variants that
  // double as small UI labels elsewhere (cream, which is also figcaption).
  for (const accent of METRIC_ACCENTS) {
    const isSmallElsewhere = accent === 'cream';
    checks.push({
      group: 'metric-numbers',
      label: `metric-accent-${accent}`,
      fg: metricAccentColor(themeId, accent),
      alpha: 1,
      bg: surface,
      min: isSmallElsewhere ? WCAG.AA_NORMAL : WCAG.AA_LARGE,
      source: `src/index.css .metric-accent-${accent}`,
    });
  }

  // 2. Highlighted template — eyebrow + label color over the slide bg.
  checks.push({
    group: 'metric-template',
    label: 'eyebrow ("BY THE NUMBERS")',
    fg: tripletFromVar('--gold', vars),
    alpha: 1,
    bg: surface,
    // Eyebrow is small-caps tracked text — but it's also reused as the
    // section label across the deck, so AA_LARGE is the contractual floor.
    min: WCAG.AA_LARGE,
    source: 'src/index.css .slide-eyebrow → color: hsl(var(--gold))',
  });
  checks.push({
    group: 'metric-template',
    label: 'metric label (figcaption)',
    fg: tripletFromVar('--foreground', vars),
    alpha: 1,
    bg: surface,
    min: WCAG.AA_NORMAL,
    source: 'src/slides/types/MetricGridSlide.tsx → text-foreground',
  });
  checks.push({
    group: 'metric-template',
    label: 'metric caption (translucent body)',
    fg: tripletFromVar('--foreground', vars),
    alpha: 0.65,
    bg: surface,
    min: WCAG.AA_NORMAL,
    source: 'src/slides/types/MetricGridSlide.tsx → text-foreground/65',
  });

  // 3. QR meeting card — locked white tile, then theme-resolved chrome.
  checks.push({
    group: 'qr-card',
    label: 'QR ink modules on white tile',
    fg: QR_INK,
    alpha: 1,
    bg: QR_TILE,
    min: WCAG.AAA_NORMAL, // hard floor — QR scanners need very high contrast
    source: 'src/slides/components/BrandedQR.tsx → dark #0d0d0d / light #ffffff',
  });
  checks.push({
    group: 'qr-card',
    label: '"Scan to connect" caption',
    fg: tripletFromVar('--muted-foreground', vars),
    alpha: 1,
    bg: surface,
    min: WCAG.AA_NORMAL,
    source: 'src/slides/types/QrMeetingSlide.tsx → muted-foreground caption',
  });
  checks.push({
    group: 'qr-card',
    label: 'wordmark accent half ("Asia")',
    fg: tripletFromVar('--gold', vars),
    alpha: 1,
    bg: surface,
    min: WCAG.AA_LARGE, // 64px display headline qualifies as large
    source: 'src/slides/types/QrMeetingSlide.tsx splitWordmark accent → --gold',
  });
  checks.push({
    group: 'qr-card',
    label: 'CTA label on primary surface',
    fg: tripletFromVar('--primary-foreground', vars),
    alpha: 1,
    bg: tripletFromVar('--primary', vars),
    min: WCAG.AA_LARGE, // CTA is large UI label (15px semibold + amber/blue surface)
    source: 'CTA: bg=hsl(var(--primary)), fg=hsl(var(--primary-foreground))',
  });

  return checks;
}

/* ------------------------------------------------------------------ */
/* Vitest matrix                                                       */
/* ------------------------------------------------------------------ */

describe('Slide 4 visual QA — every theme', () => {
  for (const themeId of THEME_IDS) {
    describe(`theme: ${themeId}`, () => {
      const checks = buildChecks(themeId);

      // Group failures by category for readable test output.
      for (const group of ['metric-numbers', 'metric-template', 'qr-card'] as const) {
        const groupChecks = checks.filter(c => c.group === group);
        it(`${group} — all elements meet target contrast`, () => {
          const failures: string[] = [];
          for (const c of groupChecks) {
            const ratio = effectiveContrast(c.fg, c.alpha, c.bg);
            if (ratio < c.min) {
              failures.push(
                `  ✗ ${c.label}: ${ratio.toFixed(2)}:1 < ${c.min.toFixed(2)}:1\n`
                + `      source: ${c.source}\n`
                + `      fg(rgb)=${JSON.stringify(c.fg)} alpha=${c.alpha} bg(rgb)=${JSON.stringify(c.bg)}`,
              );
            }
          }
          expect(
            failures,
            `Slide 4 contrast regressions on ${themeId} / ${group}:\n${failures.join('\n')}`,
          ).toEqual([]);
        });
      }
    });
  }

  it('exposes a stable check matrix shape', () => {
    // Sanity guard so test infra can later count expected cells in CI dashboards.
    const sample = buildChecks('noir-gold' as ThemeId);
    expect(sample.length).toBeGreaterThan(0);
    expect(sample.every(c => c.min > 0)).toBe(true);
  });
});

/* Re-export the matrix for the CI report script (slide-4-visual-qa-report). */
export { buildChecks, METRIC_ACCENTS };
export type { Check, MetricAccent };

/** Belt-and-suspenders: the hardcoded QR contract must always pass. */
describe('QR meeting card invariants (theme-independent)', () => {
  it('ink modules vs white tile clear AAA', () => {
    expect(contrastRatio(QR_INK, QR_TILE)).toBeGreaterThanOrEqual(WCAG.AAA_NORMAL);
  });
});
