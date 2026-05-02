import { useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';
import alim from '@/assets/brand/alim-presenter.png';

interface Props {
  showPresenter: boolean;
  /** Offset from the top of the stage in px (used when a BrandStrip sits above). Default 0. */
  offsetTop?: number;
}

/**
 * Fullscreen-banner safeguard.
 *
 * Browsers paint a "…is now full screen — Press Esc" banner at the top of
 * the viewport for ~2s when entering fullscreen. This banner is OS chrome,
 * not DOM — no API exposes its presence. The only signal we have is the
 * `fullscreenchange` event firing with `document.fullscreenElement` set.
 *
 * Heuristic: when entering fullscreen, push the brand header down by
 * `BANNER_HEIGHT_PX` for `BANNER_DURATION_MS`, then animate back. The logo
 * sits below the banner area for the full window the banner could be
 * visible. Zero impact when not in fullscreen.
 *
 * Browser banner heights (measured 2026-04-30):
 *   Chrome / Edge: ~52px
 *   Firefox:       ~60px
 *   Safari:        ~48px
 * 64px clears all three with margin.
 */
const BANNER_HEIGHT_PX = 64;
const BANNER_DURATION_MS = 2500;

function useFullscreenBannerSafeguard(): number {
  const [nudge, setNudge] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onFsChange = () => {
      if (document.fullscreenElement) {
        // Entering fullscreen — push down to clear the OS banner.
        setNudge(BANNER_HEIGHT_PX);
        clearTimeout(timer);
        timer = setTimeout(() => setNudge(0), BANNER_DURATION_MS);
      } else {
        // Exited — snap back immediately.
        clearTimeout(timer);
        setNudge(0);
      }
    };

    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      clearTimeout(timer);
    };
  }, []);

  return nudge;
}

/**
 * Fixed-height brand header. Slides reserve top padding equal to its height
 * so the title never overlaps the logo. Keep `h-24` and `pt-32` on slide bodies in sync.
 *
 * When a deck-level BrandStrip is active, `offsetTop` shifts the header down
 * by the strip's height (36px) so the two stack cleanly.
 */
export function BrandHeader({ showPresenter, offsetTop = 0 }: Props) {
  const bannerNudge = useFullscreenBannerSafeguard();
  return (
    <header
      style={{
        top: offsetTop + bannerNudge,
        // Smooth slide-down on entry, snap-back on exit. 320ms matches the
        // deck's standard easing window so the nudge feels intentional.
        transition: 'top 320ms cubic-bezier(0.22, 1, 0.36, 1)',
        // v0.88 — header reads from the same `--brand-inset-x` token as the
        // body grid (see index.css). 15% of viewport, clamped 48px..288px.
        paddingLeft: 'var(--brand-inset-x)',
        paddingRight: 'var(--brand-inset-x)',
      }}
      className="absolute left-0 right-0 z-20 h-24 flex items-center justify-between pt-5 pointer-events-none"
    >
      {/* v0.89 — logo height now driven by `--brand-logo-scale` (default 0.85
          = the v0.88 "−15% smaller" treatment). Tunable from /settings via
          the "Brand logo size" slider. Base is 64px (the original `h-16`)
          multiplied by the scale, so 0.85 → 54px, 1.0 → 64px, 1.2 → 76.8px. */}
      <BrandLogo
        alt="Riseup Asia LLC"
        style={{
          height: 'calc(64px * var(--brand-logo-scale, 0.85))',
          // v0.210 — live nudge from /settings sliders. Defaults to 0 so the
          // baseline position is unchanged when the user hasn't tuned anything.
          transform: 'translate(var(--brand-logo-offset-x, 0px), var(--brand-logo-offset-y, 0px))',
        }}
        className="w-auto opacity-95 brand-logo-shadow"
      />
      {showPresenter && (
        <div
          className="flex items-center gap-3 px-3 py-1.5 rounded-full controller-pill pointer-events-auto"
          style={{
            // v0.210 — live nudge for the presenter chip, independent of the logo.
            transform: 'translate(var(--brand-chip-offset-x, 0px), var(--brand-chip-offset-y, 0px))',
          }}
        >
          {/* Avatar scales with the logo so the right-side chip stays
              visually balanced with the wordmark. Base 28px (h-7). */}
          <img
            src={alim}
            alt="MD ALIM UL KARIM"
            style={{
              height: 'calc(28px * var(--brand-logo-scale, 0.85))',
              width: 'calc(28px * var(--brand-logo-scale, 0.85))',
            }}
            className="rounded-full object-cover ring-1 ring-gold/40"
          />
          <span className="text-xs font-medium tracking-wide text-foreground/85 pr-2">MD ALIM UL KARIM</span>
        </div>
      )}
    </header>
  );
}
