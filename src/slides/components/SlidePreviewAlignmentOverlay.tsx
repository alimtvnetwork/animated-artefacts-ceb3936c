/**
 * SlidePreviewAlignmentOverlay
 *
 * Local-scoped alignment guide for `SlidePreview`. Unlike the deck-wide
 * `AlignmentGuideOverlay` which is `position: fixed` and queries the
 * entire viewport, this overlay measures inside the preview's own
 * 1920×1080 stage so the guide lines stay accurate even though the
 * stage is CSS-scaled to a thumbnail size.
 *
 * Three guides are drawn:
 *   1. Logo edge        — gold, dashed
 *   2. Body grid edge   — cream, dashed
 *   3. Timeline rail    — ember, dotted (only when a StepTimelineSlide
 *                         is being previewed)
 *
 * Plus a compact HUD pinned to the top-right of the stage with px values
 * and the delta between logo + body-grid (in stage px, not CSS px).
 *
 * Activation: same toggle as the live overlay — `/settings` → "Alignment
 * guide". When the user enables it for live presenting, every preview
 * tile (BuilderPage, SettingsPage, GridOverview) lights up too so they
 * can verify positioning before exporting.
 *
 * See spec/slides/35-alignment-guide.md and spec/slides/38-preview-alignment-guide.md.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getPresetSettings, subscribePresetSettings, ALIGNMENT_TARGETS } from '../presetSettings';
import { setGuidePositions } from '../guidePositions';
import { showsGuide, useSlideGuideSet } from '../slideGuideOverrides';

interface Measurement {
  logoX: number | null;
  bodyX: number | null;
  railX: number | null;
}

interface Props {
  /** Ref to the unscaled 1920×1080 stage (the inner div in SlidePreview). */
  stageRef: React.RefObject<HTMLDivElement>;
}

function measureWithinStage(stage: HTMLElement | null): Measurement {
  if (!stage) return { logoX: null, bodyX: null, railX: null };
  const stageRect = stage.getBoundingClientRect();
  // Account for the CSS scale: bounding rects come back in *rendered* px,
  // but we want positions in the unscaled 1920px coordinate space so the
  // dashed lines render at the same x as the slide's own elements.
  // stageRect.width is the rendered width; stage.offsetWidth is the
  // intrinsic 1920px. Their ratio is the scale.
  const scale = stageRect.width / stage.offsetWidth || 1;

  const xOf = (sel: string): number | null => {
    const el = stage.querySelector<HTMLElement>(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return Math.round((r.left - stageRect.left) / scale);
  };

  return {
    logoX: xOf('header img[alt="Riseup Asia LLC"]'),
    bodyX: xOf('.step-timeline-content'),
    // The rail is the absolutely-positioned vertical line inside
    // .step-timeline-content. We pick the first child div with a width-1
    // class signature; fall back to the column itself.
    railX: xOf('.step-timeline-content [data-timeline-rail]'),
  };
}

export function SlidePreviewAlignmentOverlay({ stageRef }: Props) {
  const enabled = useSyncExternalStore(
    subscribePresetSettings,
    () => getPresetSettings().showAlignmentGuide,
    () => false,
  );
  // v0.205 — independent toggle for the red "target" boxes. Either toggle
  // (or both) being on causes the overlay to mount.
  const showTargets = useSyncExternalStore(
    subscribePresetSettings,
    () => getPresetSettings().showAlignmentTargets,
    () => false,
  );

  // v0.77 — read the per-slide guide-set selection. Preview tiles use
  // `'*'` as a fallback so the dropdown chosen on the live deck route
  // still applies inside builder/settings preview panes when the user
  // hasn't navigated to a slide route.
  const slideKey = typeof window !== 'undefined' ? window.location.pathname || '*' : '*';
  const guideSet = useSlideGuideSet(slideKey);

  const [m, setM] = useState<Measurement>({ logoX: null, bodyX: null, railX: null });
  const frameRef = useRef(0);

  // v0.205 — read the resolved `--brand-inset-x` (in stage px) so the red
  // target boxes track whatever inset the user has set. Re-measured on
  // every schedule tick alongside the guide measurements.
  const [insetPx, setInsetPx] = useState<number>(218);

  useEffect(() => {
    if (!enabled && !showTargets) return;
    const stage = stageRef.current;
    if (!stage) return;

    const schedule = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        if (enabled) {
          const next = measureWithinStage(stage);
          setM(next);
          // Publish to the global guide-positions store so the Step
          // editor's "Snap to…" buttons can read live coordinates.
          setGuidePositions(next);
        }
        if (showTargets) {
          // Resolve `--brand-inset-x` against the stage element so the
          // clamp() value collapses to a real px number at the current
          // viewport. Stage is the unscaled 1920px box, so the resolved
          // value IS the stage-space inset we want.
          const cs = getComputedStyle(stage);
          const raw = cs.getPropertyValue('--brand-inset-x').trim();
          const parsed = parseFloat(raw);
          if (!Number.isNaN(parsed) && parsed > 0) setInsetPx(parsed);
        }
      });
    };

    schedule();
    window.addEventListener('resize', schedule);
    const observer = new MutationObserver(schedule);
    observer.observe(stage, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-wide-stage'],
    });

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [enabled, showTargets, stageRef]);

  if (!enabled && !showTargets) return null;

  const delta = m.logoX !== null && m.bodyX !== null ? m.bodyX - m.logoX : null;
  const aligned = delta !== null && Math.abs(delta) <= 1;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[60]"
      data-preview-alignment-guide="true"
    >
      {enabled && m.logoX !== null && showsGuide(guideSet, 'logo') && (
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${m.logoX}px`,
            width: '2px',
            background:
              'repeating-linear-gradient(to bottom, hsl(var(--gold)) 0 12px, transparent 12px 24px)',
            boxShadow: '0 0 8px hsl(var(--gold) / 0.6)',
          }}
        >
          <span
            className="absolute top-3 left-3 px-2 py-1 rounded font-mono whitespace-nowrap"
            style={{
              fontSize: '14px',
              color: 'hsl(var(--gold))',
              background: 'hsl(0 0% 5% / 0.9)',
              border: '1px solid hsl(var(--gold) / 0.5)',
            }}
          >
            LOGO • {m.logoX}px
          </span>
        </div>
      )}

      {enabled && m.bodyX !== null && showsGuide(guideSet, 'body') && (
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${m.bodyX}px`,
            width: '2px',
            background:
              'repeating-linear-gradient(to bottom, hsl(var(--cream)) 0 12px, transparent 12px 24px)',
            boxShadow: '0 0 8px hsl(var(--cream) / 0.45)',
          }}
        >
          <span
            className="absolute top-14 left-3 px-2 py-1 rounded font-mono whitespace-nowrap"
            style={{
              fontSize: '14px',
              color: 'hsl(var(--cream))',
              background: 'hsl(0 0% 5% / 0.9)',
              border: '1px solid hsl(var(--cream) / 0.4)',
            }}
          >
            BODY • {m.bodyX}px
          </span>
        </div>
      )}

      {enabled && m.railX !== null && showsGuide(guideSet, 'rail') && (
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${m.railX}px`,
            width: '2px',
            background:
              'repeating-linear-gradient(to bottom, hsl(var(--ember)) 0 4px, transparent 4px 10px)',
            boxShadow: '0 0 6px hsl(var(--ember) / 0.5)',
          }}
        >
          <span
            className="absolute top-24 left-3 px-2 py-1 rounded font-mono whitespace-nowrap"
            style={{
              fontSize: '14px',
              color: 'hsl(var(--ember))',
              background: 'hsl(0 0% 5% / 0.9)',
              border: '1px solid hsl(var(--ember) / 0.5)',
            }}
          >
            RAIL • {m.railX}px
          </span>
        </div>
      )}

      {/* HUD */}
      {enabled && (
      <div
        className="absolute top-4 right-4 px-4 py-3 rounded-md font-mono"
        style={{
          fontSize: '14px',
          lineHeight: 1.4,
          color: 'hsl(var(--cream))',
          background: 'hsl(0 0% 5% / 0.92)',
          border: `1px solid ${aligned ? 'hsl(var(--gold) / 0.65)' : 'hsl(var(--ember) / 0.65)'}`,
          boxShadow: '0 6px 18px hsl(0 0% 0% / 0.5)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              background: aligned ? 'hsl(var(--gold))' : 'hsl(var(--ember))',
              boxShadow: `0 0 8px ${aligned ? 'hsl(var(--gold))' : 'hsl(var(--ember))'}`,
            }}
          />
          <span className="font-semibold uppercase tracking-[0.18em]" style={{ fontSize: '12px' }}>
            Preview alignment
          </span>
        </div>
        <div className="space-y-0.5">
          <div>logo.x: <span style={{ color: 'hsl(var(--gold))' }}>{m.logoX ?? '—'}</span></div>
          <div>body.x: <span style={{ color: 'hsl(var(--cream))' }}>{m.bodyX ?? '—'}</span></div>
          {m.railX !== null && (
            <div>rail.x: <span style={{ color: 'hsl(var(--ember))' }}>{m.railX}</span></div>
          )}
          <div>
            Δ logo→body:{' '}
            <span style={{ color: aligned ? 'hsl(var(--gold))' : 'hsl(var(--ember))' }}>
              {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}px`}
            </span>{' '}
            {aligned && <span style={{ color: 'hsl(var(--gold))' }}>✓</span>}
          </div>
        </div>
      </div>
      )}

      {/* v0.205 — Red "target" boxes for the desired logo + chip positions.
          Renders independently of the live guides so the author can drag
          the logo/chip while seeing both the CURRENT (gold/cream) and the
          TARGET (red) positions side-by-side. */}
      {showTargets && (
        <>
          {/* Logo target — left side */}
          <div
            className="absolute"
            style={{
              left: `${insetPx + ALIGNMENT_TARGETS.logo.xOffsetFromInset}px`,
              top: `${ALIGNMENT_TARGETS.logo.y}px`,
              width: `${ALIGNMENT_TARGETS.logo.w}px`,
              height: `${ALIGNMENT_TARGETS.logo.h}px`,
              border: '3px dashed hsl(0 80% 55%)',
              background: 'hsl(0 80% 55% / 0.08)',
              boxShadow: '0 0 12px hsl(0 80% 55% / 0.5)',
              borderRadius: '6px',
            }}
          >
            <span
              className="absolute -top-7 left-0 px-2 py-0.5 rounded font-mono uppercase tracking-[0.2em] whitespace-nowrap"
              style={{
                fontSize: '12px',
                color: 'hsl(0 0% 100%)', // hardcoded-white-ok: dev alignment-overlay label on red background, never user-visible
                background: 'hsl(0 80% 45% / 0.95)',
                letterSpacing: '0.18em',
              }}
            >
              LOGO TARGET
            </span>
          </div>

          {/* Chip target — right side, mirrored from the inset */}
          <div
            className="absolute"
            style={{
              right: `${insetPx - ALIGNMENT_TARGETS.chip.xOffsetFromInset}px`,
              top: `${ALIGNMENT_TARGETS.chip.y}px`,
              width: `${ALIGNMENT_TARGETS.chip.w}px`,
              height: `${ALIGNMENT_TARGETS.chip.h}px`,
              border: '3px dashed hsl(0 80% 55%)',
              background: 'hsl(0 80% 55% / 0.08)',
              boxShadow: '0 0 12px hsl(0 80% 55% / 0.5)',
              borderRadius: '999px',
            }}
          >
            <span
              className="absolute -top-7 right-0 px-2 py-0.5 rounded font-mono uppercase tracking-[0.2em] whitespace-nowrap"
              style={{
                fontSize: '12px',
                color: 'hsl(0 0% 100%)', // hardcoded-white-ok: dev alignment-overlay label on red background, never user-visible
                background: 'hsl(0 80% 45% / 0.95)',
                letterSpacing: '0.18em',
              }}
            >
              CHIP TARGET
            </span>
          </div>
        </>
      )}
    </div>
  );
}
