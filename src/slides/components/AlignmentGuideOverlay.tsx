/**
 * AlignmentGuideOverlay
 *
 * Live, full-viewport debug overlay that draws two vertical guide lines:
 *   1. The BrandHeader logo's left edge (gold)
 *   2. The body grid's left edge (cream)
 *
 * Plus a numeric readout in the top-right corner showing both x-positions
 * and the delta between them, so the author can pixel-check whether the
 * "header-anchored" body alignment (spec 34) is actually in sync with the
 * logo at the current viewport size.
 *
 * Activation:
 *   - Toggle from `/settings` → "Alignment guide" checkbox.
 *   - Subscribes to `subscribePresetSettings` so flipping the toggle
 *     mounts/unmounts immediately, no reload.
 *
 * Implementation notes:
 *   - Probes the DOM on mount AND on every `resize`, `scroll`, and slide
 *     navigation (route change). Because slides remount on route change,
 *     a `MutationObserver` on document.body is the simplest universal
 *     trigger — fires when the StepTimeline (or any slide) swaps in.
 *   - Targets are looked up by stable selectors:
 *       header logo → `header img[alt="Riseup Asia LLC"]`
 *       body grid   → `.step-timeline-content` (extend the selector list
 *                     when more body grids opt into spec 34)
 *   - Pure presentational, `pointer-events-none`. Cannot interfere with
 *     click handlers, hover states, or autoplay.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { getPresetSettings, subscribePresetSettings } from '../presetSettings';
import {
  GUIDE_SET_OPTIONS,
  setSlideGuideSet,
  showsGuide,
  useSlideGuideSet,
} from '../slideGuideOverrides';

const BODY_GRID_SELECTORS = [
  '.step-timeline-content',
  // Extend here when other body grids opt into spec 34.
];

interface Measurement {
  logoX: number | null;
  bodyX: number | null;
  delta: number | null;
}

function measure(): Measurement {
  if (typeof document === 'undefined') {
    return { logoX: null, bodyX: null, delta: null };
  }
  const logo = document.querySelector<HTMLImageElement>(
    'header img[alt="Riseup Asia LLC"]',
  );
  const logoX = logo ? Math.round(logo.getBoundingClientRect().left) : null;

  let bodyX: number | null = null;
  for (const sel of BODY_GRID_SELECTORS) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) {
      bodyX = Math.round(el.getBoundingClientRect().left);
      break;
    }
  }
  const delta = logoX !== null && bodyX !== null ? bodyX - logoX : null;
  return { logoX, bodyX, delta };
}

export function AlignmentGuideOverlay() {
  const enabled = useSyncExternalStore(
    subscribePresetSettings,
    () => getPresetSettings().showAlignmentGuide,
    () => false,
  );

  // v0.77 — per-slide guide-set override. Keyed by current pathname so
  // every route (`/3`, `/12`, …) keeps its own dropdown selection.
  const { pathname } = useLocation();
  const slideKey = pathname || '*';
  const guideSet = useSlideGuideSet(slideKey);

  const [m, setM] = useState<Measurement>({ logoX: null, bodyX: null, delta: null });

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setM(measure()));
    };

    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true });

    // Catch slide swaps / fullscreen toggles / dynamic class changes.
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-wide-stage'],
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
      observer.disconnect();
    };
  }, [enabled]);

  if (!enabled) return null;

  const aligned = m.delta !== null && Math.abs(m.delta) <= 1;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999]"
      data-alignment-guide="true"
    >
      {/* Logo guide — gold */}
      {m.logoX !== null && showsGuide(guideSet, 'logo') && (
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${m.logoX}px`,
            background:
              'repeating-linear-gradient(to bottom, hsl(var(--gold)) 0 6px, transparent 6px 12px)',
            boxShadow: '0 0 6px hsl(var(--gold) / 0.6)',
          }}
        >
          <span
            className="absolute top-2 left-2 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm whitespace-nowrap"
            style={{
              color: 'hsl(var(--gold))',
              background: 'hsl(0 0% 5% / 0.85)',
              border: '1px solid hsl(var(--gold) / 0.5)',
            }}
          >
            LOGO • {m.logoX}px
          </span>
        </div>
      )}

      {/* Body grid guide — cream */}
      {m.bodyX !== null && showsGuide(guideSet, 'body') && (
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${m.bodyX}px`,
            background:
              'repeating-linear-gradient(to bottom, hsl(var(--cream)) 0 6px, transparent 6px 12px)',
            boxShadow: '0 0 6px hsl(var(--cream) / 0.45)',
          }}
        >
          <span
            className="absolute top-8 left-2 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm whitespace-nowrap"
            style={{
              color: 'hsl(var(--cream))',
              background: 'hsl(0 0% 5% / 0.85)',
              border: '1px solid hsl(var(--cream) / 0.4)',
            }}
          >
            BODY • {m.bodyX}px
          </span>
        </div>
      )}

      {/* HUD readout — pointer-events-auto on the dropdown only so the
          rest of the overlay still passes clicks through to the deck. */}
      <div
        className="absolute top-3 right-3 px-3 py-2 rounded-md font-mono text-[11px] leading-tight"
        style={{
          color: 'hsl(var(--cream))',
          background: 'hsl(0 0% 5% / 0.92)',
          border: `1px solid ${aligned ? 'hsl(var(--gold) / 0.65)' : 'hsl(var(--ember) / 0.65)'}`,
          boxShadow: '0 6px 18px hsl(0 0% 0% / 0.5)',
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: aligned ? 'hsl(var(--gold))' : 'hsl(var(--ember))',
              boxShadow: `0 0 6px ${aligned ? 'hsl(var(--gold))' : 'hsl(var(--ember))'}`,
            }}
          />
          <span className="font-semibold uppercase tracking-[0.18em] text-[10px]">
            Alignment guide
          </span>
          <span className="text-[10px] text-foreground/40 ml-auto">{slideKey}</span>
        </div>

        {/* v0.77 — per-slide guide-set dropdown */}
        <label className="pointer-events-auto flex items-center gap-1.5 mb-1.5 text-[10px]">
          <span className="text-foreground/60 uppercase tracking-[0.16em]">Show:</span>
          <select
            value={guideSet}
            onChange={e => setSlideGuideSet(slideKey, e.target.value as typeof guideSet)}
            className="font-mono text-[10px] bg-black/60 text-cream border border-cream/30 rounded px-1.5 py-0.5 focus:outline-none focus:border-gold cursor-pointer"
          >
            {GUIDE_SET_OPTIONS.map(o => (
              <option key={o.value} value={o.value} className="bg-black text-cream">
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-0.5">
          <div>logo.x: <span className="text-gold">{m.logoX ?? '—'}</span></div>
          <div>body.x: <span className="text-cream">{m.bodyX ?? '—'}</span></div>
          <div>
            Δ:{' '}
            <span style={{ color: aligned ? 'hsl(var(--gold))' : 'hsl(var(--ember))' }}>
              {m.delta === null ? '—' : `${m.delta > 0 ? '+' : ''}${m.delta}px`}
            </span>{' '}
            {aligned && <span className="text-gold">✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
