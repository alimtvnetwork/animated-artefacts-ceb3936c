import { describe, expect, it } from 'vitest';
import { THEMES, type ThemeId } from '@/slides/themes';

/**
 * Automated visual contrast test for StepTimelineSlide in GitHub Light.
 *
 * This guards against regressions like the one fixed in v0.61 where
 * `.step-row .step-title` hardcoded `hsl(0 0% 100%)` and rendered as
 * pure-white-on-near-white in light themes.
 *
 * Approach: the slide's text elements (and the colors they resolve to)
 * are known and listed in `STEP_TIMELINE_TEXT_TOKENS`. For each one we
 * compute the WCAG 2.1 contrast ratio against the slide background and
 * fail if it falls below the AA threshold for the element's role.
 *
 * If you change a color rule for any element on StepTimelineSlide, also
 * update the matching entry below so the test stays in sync.
 */

// Color math lives in `src/test/lib/contrast.ts` so this test and the
// deck-wide audit (`deckContrastAudit.test.ts` / `scripts/contrast-audit.ts`)
// can never silently drift on WCAG calculations.
import { composite, contrastRatio, parseHslTriplet } from './lib/contrast';

// ── pull the GitHub Light token map ──────────────────────────────────────────
const themeId: ThemeId = 'github-light';
const vars = THEMES[themeId].vars;
const tok = (name: string): string => {
  const v = vars[name as keyof typeof vars];
  if (!v) throw new Error(`Theme ${themeId} missing token ${name}`);
  return v;
};

const BG = parseHslTriplet(tok('--background'));            // #ffffff
const FG = parseHslTriplet(tok('--foreground'));            // #1f2328
const GOLD = parseHslTriplet(tok('--gold'));                // #0969da (Primer blue)
const INK = parseHslTriplet(tok('--ink'));                  // #1f2328

// ── catalogue of every colored text element on StepTimelineSlide ────────────
// alpha is multiplied into the foreground color (composited over BG) before
// the ratio is computed — matches how browsers render `hsl(... / a)` text.
type TextToken = {
  /** Human-readable element label (matches data-debug-token in the slide) */
  label: string;
  /** Resolved foreground rgb (before alpha composite) */
  fg: [number, number, number];
  /** Foreground alpha 0–1 */
  alpha: number;
  /** Background to composite + measure against */
  bg: [number, number, number];
  /** Minimum WCAG 2.1 contrast required:
   *  - 4.5 = AA body text
   *  - 3.0 = AA large text (≥ 24px regular or ≥ 18.66px bold) and graphics
   */
  min: number;
  /** CSS source-of-truth comment (helps locate the rule when a test fails) */
  source: string;
};

const STEP_TIMELINE_TEXT_TOKENS: TextToken[] = [
  {
    label: 'eyebrow ("HOW WE WORK")',
    fg: GOLD, alpha: 1, bg: BG, min: 4.5,
    source: '.slide-eyebrow → color: hsl(var(--gold))',
  },
  {
    label: 'title ("Engagement Process")',
    fg: FG, alpha: 1, bg: BG, min: 3.0, // large display text
    source: '.slide-title-display → color: hsl(var(--foreground))',
  },
  {
    label: 'step-label ("STEP 1")',
    fg: FG, alpha: 0.78, bg: BG, min: 4.5,
    source: 'step-label uses text-foreground (~0.78 alpha ramp)',
  },
  {
    label: 'step-title active ("Discovery")',
    fg: FG, alpha: 1.0, bg: BG, min: 3.0, // large display
    source: '.step-row[data-state="active"] .step-title → hsl(var(--foreground))',
  },
  {
    label: 'step-title adjacent ("Strategy")',
    fg: FG, alpha: 0.62, bg: BG, min: 3.0, // large display, dimmed
    source: '.step-row[data-state="adjacent"] .step-title → hsl(var(--foreground)/0.62)',
  },
  {
    label: 'step-title far ("Scale")',
    fg: FG, alpha: 0.55, bg: BG, min: 3.0, // far/blurred — graphics-tier
    source: '.step-row[data-state="far"] .step-title → hsl(var(--foreground)/0.55)',
  },
  {
    label: 'step-subtitle ("Listen, audit, align")',
    fg: FG, alpha: 0.7, bg: BG, min: 4.5,
    source: 'step-subtitle uses text-foreground/70',
  },
  {
    label: 'side-panel eyebrow ("STEP 01 — DISCOVERY")',
    fg: GOLD, alpha: 1, bg: BG, min: 4.5,
    source: 'side-panel eyebrow → text-[hsl(var(--gold))]',
  },
  {
    label: 'side-panel description (body copy)',
    fg: FG, alpha: 1, bg: BG, min: 4.5,
    source: 'StepTimelineSlide description → text-foreground',
  },
  {
    label: 'CTA button label ("See discovery details")',
    fg: [255, 255, 255], alpha: 1, bg: GOLD, min: 4.5,
    source: 'CTA: bg=--gold (Primer blue #0969da), fg=white',
  },
];

describe('StepTimelineSlide visual contrast — GitHub Light', () => {
  it.each(STEP_TIMELINE_TEXT_TOKENS)(
    '$label meets WCAG (≥ $min:1)',
    ({ label, fg, alpha, bg, min, source }) => {
      const composited = alpha < 1 ? composite(fg, alpha, bg) : fg;
      const ratio = contrastRatio(composited, bg);
      const rounded = Math.round(ratio * 100) / 100;
      // Attach context to failure messages so a failing token tells you
      // *exactly* which CSS rule to fix.
      expect(
        ratio,
        `\n  Element: ${label}\n  Source : ${source}\n  Got    : ${rounded}:1 (need ≥ ${min}:1)\n`,
      ).toBeGreaterThanOrEqual(min);
    },
  );

  it('detects illegible text — sanity check (synthetic white-on-white)', () => {
    // Guards the test itself: if we ever broke the math, this would pass.
    const ratio = contrastRatio([255, 255, 255], [255, 255, 255]);
    expect(ratio).toBeLessThan(1.05);
  });
});
