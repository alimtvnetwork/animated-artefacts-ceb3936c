import riseupLogo from '@/assets/brand/riseup-asia-logo.png';
import { getBrandLogoSrc } from './BrandLogo';
import { useThemeAppearance } from '../hooks/useThemeAppearance';
import type { BrandStripSpec } from '../types';

interface Props {
  spec: BrandStripSpec;
}

/**
 * Thin full-width branded strip rendered above the standard BrandHeader.
 *
 * Stays within an `h-9` band so it never crowds slide content. Slides that
 * include this strip should keep their `pt-32` body padding (the regular
 * BrandHeader still handles the safe-area; this strip sits in the very top
 * 36px and does not consume additional title space).
 *
 * Configured at the deck level via `deck.brandStrip` and overridable per
 * slide via `slide.brandStrip` (set to `false` to hide on a single slide).
 * Theme-aware: all colors read through CSS variables so it tracks the
 * Noir & Gold ↔ Bright Gold theme switcher.
 */
const LOGO_ASSETS: Record<NonNullable<BrandStripSpec['logoAsset']>, string> = {
  'riseup-asia': riseupLogo,
};

export function BrandStrip({ spec }: Props) {
  const {
    logoAsset = 'riseup-asia',
    logo,
    logoAlt = 'Riseup Asia LLC',
    logoHeight: rawLogoHeight = 22,
    logoAlign = 'left',
    padding = 'cozy',
    tagline,
    taglineTone = 'cream',
    divider = true,
    background = 'solid',
  } = spec;

  // Clamp logo to the strip's 36px envelope so authors can't accidentally
  // overflow the band. 12–32px keeps the pixel-grid crisp for both icons
  // and full wordmarks.
  const logoHeight = Math.min(32, Math.max(12, rawLogoHeight));

  // Padding presets — applied to the outer container's left/right edges. The
  // 3-column grid inside still uses these as the only horizontal inset, so
  // `tight` and `roomy` shift logo + tagline together rather than independently.
  const paddingClass =
    padding === 'tight'
      ? 'px-3 sm:px-4'
      : padding === 'roomy'
        ? 'px-8 sm:px-10 md:px-14'
        : 'px-5 sm:px-6 md:px-8';

  /**
   * Noir & Gold backgrounds — all three presets layer subtle gold accents over
   * the deep ink surface so the strip reads as branded chrome rather than a
   * neutral header. Tokens only (no raw hex) so theme switches track live.
   */
  const bgClass =
    background === 'gradient'
      ? 'bg-[linear-gradient(90deg,hsl(var(--gold)/0.18),hsl(var(--ink)/0.7)_55%,hsl(var(--ink)/0.92))]'
      : background === 'transparent'
        ? 'bg-transparent'
        : 'bg-[linear-gradient(180deg,hsl(var(--ink)/0.92),hsl(var(--ink)/0.88))] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,hsl(var(--gold)/0.08),transparent_70%)] before:pointer-events-none';

  /**
   * Tagline pill tone — three premium presets, all with strong contrast against
   * the strip background. Padding/sizing is identical across tones so swapping
   * tones never shifts layout.
   */
  const toneClass =
    taglineTone === 'gold'
      ? 'bg-[linear-gradient(135deg,hsl(var(--gold)),hsl(var(--gold-glow)))] text-ink border-[hsl(var(--gold))] shadow-[0_2px_10px_-2px_hsl(var(--gold)/0.45),inset_0_1px_0_hsl(var(--white)/0.3)]'
      : taglineTone === 'muted'
        ? 'bg-[hsl(var(--ink)/0.7)] text-cream/90 border-[hsl(var(--gold)/0.35)] shadow-[0_2px_8px_-3px_hsl(0_0%_0%/0.5)]'
        : 'bg-[hsl(var(--cream))] text-ink border-[hsl(var(--cream))] shadow-[0_2px_10px_-3px_hsl(var(--cream)/0.35),inset_0_1px_0_hsl(var(--white)/0.5)]';

  // Auto-swap RiseupAsia wordmark to the dark variant on light themes so it
  // never disappears against the page wash. Authors can still pin a specific
  // asset by passing `logo` explicitly.
  const appearance = useThemeAppearance();
  const builtinLogo =
    logoAsset === 'riseup-asia'
      ? getBrandLogoSrc('auto', appearance)
      : LOGO_ASSETS[logoAsset];
  const resolvedLogo = logo ?? builtinLogo;

  // Logo node — bundled asset by default so exported/imported decks do not fall
  // back to browser text rendering. Direct `logo` only wins when authors supply
  // an explicit export-safe URL.
  const logoNode = resolvedLogo ? (
    <img
      src={resolvedLogo}
      alt={logoAlt}
      style={{ height: `${logoHeight}px` }}
      className="w-auto opacity-95 brand-logo-shadow"
    />
  ) : (
    <span className="font-display text-[11px] font-bold tracking-[0.3em] uppercase bg-[linear-gradient(135deg,hsl(var(--gold)),hsl(var(--gold-glow)))] bg-clip-text text-transparent brand-logo-shadow">
      {logoAlt}
    </span>
  );

  // Tagline pill node — fixed 22px height so it never affects strip height.
  const taglineNode = tagline ? (
    <span
      className={`inline-flex items-center h-[22px] px-2.5 sm:px-3 rounded-full border text-[10px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold whitespace-nowrap ${toneClass}`}
    >
      {tagline}
    </span>
  ) : null;

  /**
   * Layout uses a 3-column grid (left / center / right) so the logo can sit
   * at any of the three positions while the tagline stays anchored to the
   * opposite side without ever colliding with the logo.
   *
   *   logoAlign=left   → logo LEFT,   tagline RIGHT
   *   logoAlign=center → logo CENTER, tagline RIGHT
   *   logoAlign=right  → logo RIGHT,  tagline LEFT (swap so they don't overlap)
   */
  const logoSlot =
    logoAlign === 'center' ? 'center' : logoAlign === 'right' ? 'right' : 'left';
  const taglineSlot = logoSlot === 'right' ? 'left' : 'right';

  const slotClass = (slot: 'left' | 'center' | 'right') =>
    slot === 'left'
      ? 'justify-self-start'
      : slot === 'right'
        ? 'justify-self-end'
        : 'justify-self-center';

  // Divider thickness + color come from the live preset-settings CSS vars
  // (`--preset-rule-thickness`, `--preset-rule-color`) so the in-app
  // /settings panel can tune them globally without touching this file.
  const dividerStyle: React.CSSProperties | undefined = divider
    ? {
        borderBottomWidth: 'var(--preset-rule-thickness, 1px)',
        borderBottomStyle: 'solid',
        borderBottomColor: 'var(--preset-rule-color, hsl(var(--gold) / 0.35))',
        boxShadow: '0 1px 0 0 hsl(var(--gold) / 0.12), 0 4px 18px -8px hsl(0 0% 0% / 0.7)',
      }
    : undefined;
  return (
    <div
      className={`absolute top-0 left-0 right-0 z-30 h-9 grid grid-cols-3 items-center ${paddingClass} backdrop-blur-md pointer-events-none ${bgClass}`}
      style={dividerStyle}
      aria-label="Branded strip"
    >
      {/* Left column */}
      <div className={`relative z-10 flex items-center ${slotClass('left')}`}>
        {logoSlot === 'left' && logoNode}
        {taglineSlot === 'left' && taglineNode}
      </div>
      {/* Center column */}
      <div className={`relative z-10 flex items-center ${slotClass('center')}`}>
        {logoSlot === 'center' && logoNode}
      </div>
      {/* Right column */}
      <div className={`relative z-10 flex items-center ${slotClass('right')}`}>
        {logoSlot === 'right' && logoNode}
        {taglineSlot === 'right' && taglineNode}
      </div>
    </div>
  );
}
