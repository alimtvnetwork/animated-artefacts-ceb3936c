/**
 * Shared WCAG 2.1 contrast math for visual contrast audits.
 *
 * Extracted v0.174 from `stepTimelineGithubLightContrast.test.ts` so both
 * that file and the deck-wide `contrast-audit.ts` script share a single
 * source of truth for color math (no chance of one drifting from the
 * other and silently passing/failing).
 *
 * Pure functions; no DOM, no I/O — safe to import from scripts and tests.
 */

export type RGB = [number, number, number];

/** Convert HSL (deg, %, %) to RGB 0-255. */
export function hslToRgb(h: number, s: number, l: number): RGB {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255)) as RGB;
}

/** Parse Tailwind/shadcn HSL token form `"H S% L%"` → RGB. */
export function parseHslTriplet(triplet: string): RGB {
  const parts = triplet.trim().split(/\s+/).map((p) => parseFloat(p));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`Invalid HSL triplet: "${triplet}"`);
  }
  const [h, s, l] = parts;
  return hslToRgb(h, s, l);
}

/** Composite a translucent foreground over an opaque background. */
export function composite(fg: RGB, alpha: number, bg: RGB): RGB {
  return [0, 1, 2].map((i) =>
    Math.round(fg[i] * alpha + bg[i] * (1 - alpha)),
  ) as RGB;
}

/** WCAG 2.1 relative luminance. */
export function relativeLuminance([r, g, b]: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.1 contrast ratio between two opaque colors (1.0 — 21.0). */
export function contrastRatio(fg: RGB, bg: RGB): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Compute the effective contrast ratio of a (possibly translucent) foreground
 * against a background. Composites first when alpha < 1.
 */
export function effectiveContrast(
  fg: RGB,
  alpha: number,
  bg: RGB,
): number {
  const composited = alpha < 1 ? composite(fg, alpha, bg) : fg;
  return contrastRatio(composited, bg);
}

/** WCAG AA thresholds. */
export const WCAG = {
  /** Normal-size text (< 18pt regular / < 14pt bold). */
  AA_NORMAL: 4.5,
  /** Large text (≥ 18pt regular / ≥ 14pt bold) and UI graphics. */
  AA_LARGE: 3.0,
  /** Enhanced (AAA) normal-size text. */
  AAA_NORMAL: 7.0,
  /** Enhanced (AAA) large text. */
  AAA_LARGE: 4.5,
} as const;
