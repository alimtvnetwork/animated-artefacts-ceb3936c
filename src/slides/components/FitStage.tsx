/**
 * FitStage — uniform-scale 1920×1080 stage for the live deck.
 *
 * Why this exists
 * ----------------
 * Every slide in this deck pins layout to a fixed 1920×1080 design canvas
 * (e.g. `--brand-inset-x: 218px`, `StepsChain3D`'s rail at 218px + 28px).
 * Below the design width those raw pixels overflow the viewport: the
 * brand logo, presenter chip, slide title, and the 3D-steps rail all
 * decouple from each other because nothing scales together.
 *
 * `FitStage` solves this with the same trick `SlidePreview` uses for
 * thumbnails: a fixed-size 1920×1080 inner box, CSS-transform-scaled by
 * `min(viewportW / 1920, viewportH / 1080)` so the entire design canvas
 * always fits the viewport while preserving its 16:9 aspect ratio. Every
 * coordinate inside — logo X, rail X, marker centers, capsule rows —
 * scales by the same factor, so alignment is preserved by construction.
 *
 * Letterbox bands (vertical or horizontal, depending on the viewport's
 * aspect ratio vs. 16:9) are filled with `bg-background` so the unused
 * area visually disappears against the deck's noir backdrop.
 *
 * Side effects
 * ------------
 * - Publishes the live scale on the document element as `--stage-scale`.
 *   Components that need to convert pointer/touch coordinates back to
 *   stage space (e.g. drag-to-pan, hotspot tooling) can read this var
 *   instead of measuring the DOM.
 * - The stage element gets `data-fit-stage` so dev overlays
 *   (`AlignmentGuideOverlay`, `SlidePreviewAlignmentOverlay`) can detect
 *   the in-deck scaled mode if they need to.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const STAGE_W = 1920;
const STAGE_H = 1080;

interface Props {
  children: ReactNode;
  /** Optional class on the outer letterbox container. */
  className?: string;
}

export function FitStage({ children, className }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // useLayoutEffect so the first paint already has the correct scale —
  // avoids a one-frame flash where the stage renders at native 1920px
  // and overflows the viewport before being scaled down.
  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      const next = Math.min(w / STAGE_W, h / STAGE_H);
      setScale(next);
      // Publish for any downstream code that needs to invert the scale
      // (e.g. mapping touch deltas to stage coordinates).
      document.documentElement.style.setProperty('--stage-scale', next.toFixed(6));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  // Reset --stage-scale on unmount so non-deck routes don't inherit a
  // stale value (Settings, Builder etc. may read the same var).
  useEffect(() => () => {
    document.documentElement.style.removeProperty('--stage-scale');
  }, []);

  const scaledW = STAGE_W * scale;
  const scaledH = STAGE_H * scale;

  return (
    <div
      ref={outerRef}
      className={`relative overflow-hidden bg-background ${className ?? ''}`}
      style={{ width: '100%', height: '100%' }}
    >
      {/*
        Centered 1920×1080 stage. We reserve the scaled box first
        (so flex/grid centering works on the actual rendered footprint),
        then absolutely position the 1920×1080 inner so the CSS transform
        scales from its top-left corner.
      */}
      <div
        className="absolute"
        style={{
          width: scaledW,
          height: scaledH,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          data-fit-stage="true"
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
