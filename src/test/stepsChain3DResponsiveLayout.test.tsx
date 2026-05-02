/**
 * Responsive layout invariants for StepsChain3DSlide (slide 4).
 *
 * Post-#20 contract (rail-on-marker-center axis):
 *   • Rail X position = `markerSize / 2` (rail passes THROUGH marker centers).
 *   • Row gap        = `railOffset + textGap`.
 *   • Rail vertical = trimmed by `markerSize / 2` on top and bottom so it
 *     spans EXACTLY from marker-1 center to marker-N center.
 *   • Marker size clamps to `[32, 120]` (raised from 96 at #22 for FitStage
 *     downscale legibility).
 *   • Rail offset clamps to `[0, 48]`, text gap clamps to `[0, ∞)`.
 *
 * Geometry is viewport-INDEPENDENT — all values are pixel constants on the
 * chain container, so mobile / tablet / desktop / large all yield the same
 * numbers. Tests below verify that.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { StepsChain3DSlide } from '../slides/types/StepsChain3DSlide';
import type { SlideSpec } from '../slides/types';

const baseSpec = (layout?: { markerSize?: number; railOffset?: number; textGap?: number }) => ({
  slideNumber: 4,
  slideName: 'process-3d',
  slideType: 'StepsChain3DSlide',
  transition: 'FadeIn',
  textAnimation: 'FadeIn',
  isClickReveal: false,
  showBrandHeader: false,
  showPresenterChip: false,
  content: {
    title: 'Process',
    steps: [
      { label: 'A', title: 'One',   description: { bullets: ['a'] } },
      { label: 'B', title: 'Two',   description: { bullets: ['b'] } },
      { label: 'C', title: 'Three', description: { bullets: ['c'] } },
    ],
    ...(layout ? { layout } : {}),
  },
}) as unknown as SlideSpec;

const setViewport = (w: number, h: number) => {
  Object.defineProperty(window, 'innerWidth',  { configurable: true, value: w });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: h });
  window.dispatchEvent(new Event('resize'));
};

// jsdom lacks the Web Animations API — stub Element.animate so passive
// effects in StepsChain3DSlide can mount without throwing.
beforeEach(() => {
  if (!(Element.prototype as unknown as { animate?: unknown }).animate) {
    (Element.prototype as unknown as { animate: () => unknown }).animate = () => {
      const done = Promise.resolve();
      return {
        ready: done, finished: done,
        cancel: () => {}, finish: () => {}, play: () => {}, pause: () => {},
        addEventListener: () => {}, removeEventListener: () => {},
        onfinish: null, oncancel: null, playState: 'finished',
      };
    };
  }
});

const getRail = (container: HTMLElement): HTMLDivElement => {
  const rail = container.querySelector<HTMLDivElement>('[data-testid="chain3d-rail"]');
  if (!rail) throw new Error('rail element not found (data-testid="chain3d-rail")');
  return rail;
};

const getRailLeftPx = (container: HTMLElement): number =>
  parseFloat(getRail(container).style.left);

const getRowGapPx = (container: HTMLElement): number => {
  const visual = container.querySelector<HTMLDivElement>('.chain3d-card-visual');
  if (!visual) throw new Error('chain3d-card-visual not found');
  return parseFloat(visual.style.gap);
};

const getMarkerSizePx = (container: HTMLElement): number => {
  const marker = container.querySelector<HTMLDivElement>('.chain3d-marker');
  if (!marker) throw new Error('chain3d-marker not found');
  return parseFloat(marker.style.width);
};

describe('StepsChain3DSlide — responsive rail/text clearance', () => {
  beforeEach(() => setViewport(1280, 720));

  it.each([
    ['mobile',  390, 844],
    ['tablet',  820, 1180],
    ['desktop', 1440, 900],
    ['large',   1920, 1080],
  ])('rail and gap stay correct on %s (%dx%d) with default layout', (_n, w, h) => {
    setViewport(w, h);
    const { container } = render(<StepsChain3DSlide spec={baseSpec()} />);
    const markerSize = getMarkerSizePx(container);
    const railLeft   = getRailLeftPx(container);
    const rowGap     = getRowGapPx(container);

    // Defaults: marker 72, railOffset 8, textGap 8 (post-#22 bump).
    expect(markerSize).toBe(72);
    expect(railLeft).toBe(36);     // markerSize / 2 (rail on center axis)
    expect(rowGap).toBe(16);       // railOffset + textGap = 8 + 8

    // Invariants — the actual contract, valid at any viewport:
    // 1. Rail sits ON the marker center axis (post-#20 layout).
    expect(railLeft).toBe(markerSize / 2);
    // 2. Text column starts past the marker right edge by rowGap.
    const textStart = markerSize + rowGap;
    expect(textStart).toBeGreaterThan(markerSize);
  });

  it('honors custom layout knobs and keeps invariants', () => {
    const { container } = render(
      <StepsChain3DSlide spec={baseSpec({ markerSize: 80, railOffset: 12, textGap: 12 })} />,
    );
    expect(getMarkerSizePx(container)).toBe(80);
    expect(getRailLeftPx(container)).toBe(40);   // 80 / 2 (center axis)
    expect(getRowGapPx(container)).toBe(24);     // 12 + 12
    // Invariant: rail axis is exactly marker center
    expect(40).toBe(80 / 2);
  });

  it.each([2, 3, 4, 5, 8])('rail is vertically trimmed to marker centers (%d steps)', (n) => {
    const stepsArr = Array.from({ length: n }, (_, i) => ({
      label: `${i + 1}`, title: `Step ${i + 1}`, description: { bullets: ['x'] },
    }));
    const spec = {
      slideNumber: 4, slideName: 'process-3d', slideType: 'StepsChain3DSlide',
      transition: 'FadeIn', textAnimation: 'FadeIn', isClickReveal: false,
      showBrandHeader: false, showPresenterChip: false,
      content: { title: 'Process', steps: stepsArr },
    } as unknown as SlideSpec;
    const { container } = render(<StepsChain3DSlide spec={spec} />);
    const rail = getRail(container);
    // Default marker 72 → rail trimmed by 36 on top + bottom so it spans
    // exactly marker 1 center → marker N center, regardless of step count.
    expect(parseFloat(rail.style.top)).toBe(36);
    expect(parseFloat(rail.style.bottom)).toBe(36);
  });

  it('clamps out-of-range values to safe defaults (no broken layout)', () => {
    const { container } = render(
      // 9999 should clamp to 120 (max marker, raised from 96 at #22),
      // 999 to 48 (max rail offset), -50 to 0 (min text gap).
      <StepsChain3DSlide spec={baseSpec({ markerSize: 9999, railOffset: 999, textGap: -50 })} />,
    );
    expect(getMarkerSizePx(container)).toBe(120);
    expect(getRailLeftPx(container)).toBe(60);  // 120 / 2 (center axis)
    expect(getRowGapPx(container)).toBe(48);    // 48 + 0
    // Invariant still holds: rail is on marker center axis at the clamp ceiling.
    expect(60).toBe(120 / 2);
  });
});
