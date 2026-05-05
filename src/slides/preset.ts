import type { SlideSpec } from './types';
import type { SlideTypeValue } from './enums';
import { deck } from './loader';

/**
 * Premium slide preset — single source of truth for title color, eyebrow,
 * subtitle, and clamp-based sizing rules used across the whole deck.
 *
 * # Why this exists
 * Every slide type used to repeat the same `font-display text-5xl md:text-6xl
 * text-title-cream` ladder and re-derive `titleStyle` with a 3-branch ternary.
 * That meant changing the deck's typography meant editing 6+ files. The
 * preset moves all of that into one resolver + a few CSS utilities
 * (`.slide-title-display`, `.slide-title-content`, `.slide-eyebrow`,
 * `.slide-subtitle` — see `index.css`).
 *
 * # How decks opt in
 * In `deck.json`:
 *   { "preset": "premium" }
 *
 * Every slide automatically gets:
 *   - Ubuntu Bold titles (author writes the casing — no CSS transform).
 *   - Clamp-based sizing that holds from 360px → 4K with no breakpoint hacks.
 *   - Auto-picked title color when the slide doesn't declare `titleStyle`:
 *       - TitleSlide / SectionDividerSlide → white  (hero moments)
 *       - `titleShimmer: true`             → gold   (brand emphasis)
 *       - everything else                  → cream  (default)
 *   - Subtitles always rendered with `--foreground/70`.
 *
 * # Override precedence (most → least specific)
 *   1. Per-slide `titleStyle` field (always wins)
 *   2. Auto-pick rules above (only when the deck preset is enabled)
 *   3. Cream fallback (when no preset and no explicit value)
 */

export type PresetName = 'premium';

/**
 * Slide types that read as "hero moments" — they get white titles by default
 * under the premium preset for maximum contrast.
 */
const HERO_SLIDE_TYPES: ReadonlySet<SlideTypeValue> = new Set([
  'TitleSlide',
  'SectionDividerSlide',
  // BlastRadiusSlide draws its own gradient title via inline CSS — it
  // never reads `resolveTitleStyle()` — but listing it here keeps the
  // contract honest for any downstream consumer that introspects HERO_SLIDE_TYPES.
  'BlastRadiusSlide',
]);

export type ResolvedTitleStyle = 'cream' | 'gold' | 'gradient' | 'white';

/**
 * Resolve the effective title color for a slide.
 *
 * Reads the active preset off the deck (cached at module load via `loader.ts`).
 * Pure — safe to call from any render path.
 */
export function resolveTitleStyle(slide: SlideSpec): ResolvedTitleStyle {
  // 1. Explicit per-slide value always wins, regardless of preset.
  if (slide.titleStyle) return slide.titleStyle;

  // 2. Preset auto-pick. `premium` is the implicit default — a deck must
  //    opt OUT (e.g. by setting `preset: undefined` programmatically) to get
  //    the legacy cream-only behavior. This means every new `deck.json`
  //    inherits Ubuntu Bold + clamp sizing + white/cream/gold rules without
  //    the author remembering to type `"preset": "premium"`.
  const preset = deck.preset ?? 'premium';
  if (preset === 'premium') {
    if (HERO_SLIDE_TYPES.has(slide.slideType)) return 'white';
    if (slide.titleShimmer) return 'gold';
    return 'cream';
  }

  // 3. Pre-preset legacy fallback (only reachable if a future preset name
  //    is added that doesn't auto-pick).
  return 'cream';
}

/** Map a resolved style → the Tailwind/CSS color class slides apply on the title element. */
export function titleColorClass(style: ResolvedTitleStyle): string {
  switch (style) {
    case 'white':    return 'text-title-white';
    case 'gold':     return 'text-title-gold';
    case 'gradient': return 'text-gold-gradient';
    case 'cream':
    default:         return 'text-title-cream';
  }
}

/**
 * Convenience: returns the full className suffix for a slide title.
 *
 *   <h2 className={`slide-title-display ${titleClassFor(spec)}`}>
 *
 * Combines color resolution + optional shimmer wrapper class.
 */
export function titleClassFor(spec: SlideSpec): string {
  const color = titleColorClass(resolveTitleStyle(spec));
  return spec.titleShimmer ? `${color} shimmer-sweep` : color;
}
