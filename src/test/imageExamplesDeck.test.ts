import { describe, it, expect } from 'vitest';
import { inferImageSlot } from '@/slides/imagePlacement';
import { SlideType } from '@/slides/enums';

/**
 * Guards the `image-examples` deck contract: every supported image source
 * (asset / svg / base64 / data-uri) resolves to a valid slot, and explicit
 * `imageRole` overrides win. See spec/21-slides-system/images/01-image-authoring.md.
 */
describe('image-examples deck — source × slot resolution', () => {
  const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/AP+AAAAAElFTkSuQmCC';
  const svgDataUri = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E';

  it('public asset → bodyFigure via slide-type default', () => {
    expect(inferImageSlot({ slideType: SlideType.ImageSlide, filename: '/assets/examples/photo.png' }).slot.id).toBe('bodyFigure');
  });

  it('.svg file → bodyFigure via slide-type default', () => {
    expect(inferImageSlot({ slideType: SlideType.ImageSlide, filename: '/assets/examples/diagram.svg' }).slot.id).toBe('bodyFigure');
  });

  it('base64 PNG data URI resolves without throwing', () => {
    expect(inferImageSlot({ slideType: SlideType.ImageSlide, filename: base64 }).slot.id).toBe('bodyFigure');
  });

  it('inline SVG data URI resolves without throwing', () => {
    expect(inferImageSlot({ slideType: SlideType.ImageSlide, filename: svgDataUri }).slot.id).toBe('bodyFigure');
  });

  it('explicit imageRole wins over any source', () => {
    expect(inferImageSlot({ role: 'inlineThumbnail', filename: '/assets/examples/photo.png' }).slot.id).toBe('inlineThumbnail');
    expect(inferImageSlot({ role: 'iconBadge', filename: base64 }).slot.id).toBe('iconBadge');
  });
});
