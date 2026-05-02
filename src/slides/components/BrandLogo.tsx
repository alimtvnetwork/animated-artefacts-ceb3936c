/**
 * BrandLogo — RiseupAsia wordmark that auto-swaps between the light-on-dark
 * and dark-on-light variants based on the active theme's appearance.
 *
 * Mapping:
 *   - dark themes (default)        → `riseup-asia-logo-trimmed.png` (light wordmark)
 *   - light themes (e.g. github-light) → `riseup-asia-logo-dark.png` (dark wordmark)
 *
 * Authors should prefer this component over importing a logo asset directly,
 * so light-theme regressions (low-contrast or invisible wordmarks) are
 * impossible by construction. See `useThemeAppearance`.
 */
import { type CSSProperties } from 'react';
import lightWordmark from '@/assets/brand/riseup-asia-logo-trimmed.png';
import darkWordmark from '@/assets/brand/riseup-asia-logo-dark.png';
import { useThemeAppearance } from '../hooks/useThemeAppearance';

interface Props {
  alt?: string;
  className?: string;
  style?: CSSProperties;
  /**
   * Force a specific variant regardless of theme. Use sparingly — only when
   * the surrounding container is itself locked to a tone (e.g. a white tile
   * inside a dark theme would still need the dark wordmark).
   */
  variant?: 'auto' | 'light' | 'dark';
}

/** Resolve the wordmark URL for a given variant + active appearance. */
export function getBrandLogoSrc(
  variant: 'auto' | 'light' | 'dark',
  appearance: 'light' | 'dark',
): string {
  if (variant === 'light') return lightWordmark;
  if (variant === 'dark') return darkWordmark;
  // auto: light theme → dark wordmark, dark theme → light wordmark.
  return appearance === 'light' ? darkWordmark : lightWordmark;
}

export function BrandLogo({
  alt = 'Riseup Asia LLC',
  className,
  style,
  variant = 'auto',
}: Props) {
  const appearance = useThemeAppearance();
  const src = getBrandLogoSrc(variant, appearance);
  return <img src={src} alt={alt} className={className} style={style} draggable={false} />;
}
