/**
 * Theme QA — one-click visual contract check for GitHub Light.
 *
 * Run: `bunx vitest run src/test/themeQa.test.ts`
 *
 * Asserts the GitHub Light theme honors the locked spec for the two surfaces
 * most prone to regression in light mode:
 *
 *   • Homepage / hero slide (`bg-background`) — no flat #ffffff, body wash
 *     present, hero caption (`--muted-foreground`) clears WCAG AA on the
 *     resolved `--background`.
 *   • QR / contact slide — BrandedQR safety mode active (opaque white base
 *     compositing), QR ink modules ≥ 7:1 vs that white, "Scan to connect"
 *     caption clears AA on the slide background.
 *
 * Source-of-truth refs (failure messages cite these):
 *   - spec/architecture/light-theme-bg.md
 *   - mem://design/qr-safety-mode.md
 *   - src/index.css (github-light token block + body wash recipe)
 *   - src/slides/components/BrandedQR.tsx (createSafeQrCanvas)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { resolveTheme, deref } from './lib/themeVars';
import {
  contrastRatio,
  parseHslTriplet,
  type RGB,
  WCAG,
} from './lib/contrast';

const INDEX_CSS = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
const BRANDED_QR = readFileSync(
  join(process.cwd(), 'src/slides/components/BrandedQR.tsx'),
  'utf8',
);

const NEEDED = [
  '--background',
  '--foreground',
  '--muted-foreground',
  '--gold',
  '--primary',
] as const;

function rgb(name: string, vars: Record<string, string>): RGB {
  const raw = deref(vars[name] ?? '', vars).split('/')[0].trim();
  return parseHslTriplet(raw);
}

const PURE_WHITE: RGB = [255, 255, 255];
const QR_INK: RGB = [13, 13, 13]; // BrandedQR locks `dark: '#0d0d0d'`

describe('Theme QA — GitHub Light', () => {
  const vars = resolveTheme('github-light', NEEDED);
  const bg = rgb('--background', vars);

  describe('Homepage / hero slide background wash', () => {
    it('--background is the cool tint, never pure white', () => {
      const triplet = deref(vars['--background'] ?? '', vars).trim();
      expect(triplet, 'github-light --background must not be 0 0% 100%')
        .not.toMatch(/^0\s+0%\s+100%$/);
      // Spec requires hsl(212 40% 97%) cool tint.
      expect(triplet).toMatch(/^212\s+40%\s+97%$/);
    });

    it('body has the radial blue-wash recipe (spec/architecture/light-theme-bg.md)', () => {
      const bodyBlock = INDEX_CSS.match(
        /\[data-theme='github-light'\]\s*body\s*\{([\s\S]*?)\}/,
      );
      expect(bodyBlock, 'github-light body block missing in src/index.css')
        .not.toBeNull();
      const decl = bodyBlock![1];
      expect(decl, 'body must paint a radial-gradient wash').toMatch(
        /radial-gradient\s*\(\s*ellipse/,
      );
      expect(decl, 'wash must layer on the cool-tint base').toMatch(
        /212\s+40%\s+97%/,
      );
    });

    it('hero caption (--muted-foreground on --background) clears WCAG AA', () => {
      const muted = rgb('--muted-foreground', vars);
      const ratio = contrastRatio(muted, bg);
      expect(
        ratio,
        `--muted-foreground vs --background = ${ratio.toFixed(2)}:1, need ≥ ${WCAG.AA_NORMAL}:1`,
      ).toBeGreaterThanOrEqual(WCAG.AA_NORMAL);
    });
  });

  describe('QR / contact slide', () => {
    it('BrandedQR runs in safety mode (createSafeQrCanvas + opaque white base)', () => {
      // Locked contract — see mem://design/qr-safety-mode.md.
      expect(
        BRANDED_QR,
        'BrandedQR must define createSafeQrCanvas helper',
      ).toMatch(/function\s+createSafeQrCanvas/);
      expect(
        BRANDED_QR,
        'createSafeQrCanvas must request an opaque (alpha:false) context',
      ).toMatch(/getContext\(\s*['"]2d['"]\s*,\s*\{\s*alpha:\s*false\s*\}\s*\)/);
      expect(
        BRANDED_QR,
        'safety mode must seed the canvas with an opaque white fillRect',
      ).toMatch(/fillStyle\s*=\s*['"]#ffffff['"][\s\S]{0,120}?fillRect\(\s*0\s*,\s*0\s*,/);
      // Both styles must route through the helper — no ad-hoc canvas reuse.
      const safeCalls = (BRANDED_QR.match(/createSafeQrCanvas\(/g) ?? []).length;
      expect(
        safeCalls,
        'both clean and riseup-finder paths must call createSafeQrCanvas',
      ).toBeGreaterThanOrEqual(2);
      // Forbid actual useRef<HTMLCanvasElement>(...) calls — comments are fine.
      const codeOnly = BRANDED_QR.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(
        codeOnly,
        'BrandedQR must not reuse a ref-held canvas (stale-pixel regression)',
      ).not.toMatch(/useRef\s*<\s*HTMLCanvasElement[^>]*>\s*\(/);
    });

    it('QR ink modules clear ≥ 7:1 vs the white tile (scanner-grade)', () => {
      const ratio = contrastRatio(QR_INK, PURE_WHITE);
      expect(
        ratio,
        `QR #0d0d0d vs #ffffff = ${ratio.toFixed(2)}:1, need ≥ 7:1 for reliable scanning`,
      ).toBeGreaterThanOrEqual(7);
    });

    it('"Scan to connect" caption (--muted-foreground on --background) clears AA', () => {
      const muted = rgb('--muted-foreground', vars);
      const ratio = contrastRatio(muted, bg);
      expect(
        ratio,
        `caption vs slide bg = ${ratio.toFixed(2)}:1, need ≥ ${WCAG.AA_NORMAL}:1`,
      ).toBeGreaterThanOrEqual(WCAG.AA_NORMAL);
    });

    it('wordmark accent (--gold) clears AA on the slide background', () => {
      const gold = rgb('--gold', vars);
      const ratio = contrastRatio(gold, bg);
      expect(
        ratio,
        `--gold vs --background = ${ratio.toFixed(2)}:1, need ≥ ${WCAG.AA_NORMAL}:1`,
      ).toBeGreaterThanOrEqual(WCAG.AA_NORMAL);
    });
  });
});
