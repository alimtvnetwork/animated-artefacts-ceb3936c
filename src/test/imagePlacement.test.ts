import { describe, it, expect } from 'vitest';
import { inferImageSlot, IMAGE_SLOTS } from '@/slides/imagePlacement';
import { SlideType } from '@/slides/enums';

describe('imagePlacement.inferImageSlot', () => {
  it('honors an explicit role above all other signals', () => {
    const r = inferImageSlot({ role: 'titleHero', filename: 'logo.png', slideType: SlideType.ImageSlide });
    expect(r.slot.id).toBe('titleHero');
    expect(r.reason).toBe('explicit-role');
  });

  it('matches the presenter avatar by slug or filename', () => {
    expect(inferImageSlot({ assetSlug: 'presenter' }).slot.id).toBe('presenterAvatar');
    expect(inferImageSlot({ filename: '/assets/brand/alim-presenter.png' }).slot.id).toBe('presenterAvatar');
  });

  it('matches the header logo by filename pattern', () => {
    expect(inferImageSlot({ filename: '/assets/brand/riseup-asia-logo.png' }).slot.id).toBe('headerLogo');
    expect(inferImageSlot({ assetSlug: 'wordmark' }).slot.id).toBe('headerLogo');
  });

  it('matches the QR overlay by slug', () => {
    expect(inferImageSlot({ assetSlug: 'qr-meeting' }).slot.id).toBe('qrOverlay');
    expect(inferImageSlot({ filename: 'meeting-qr.png' }).slot.id).toBe('qrOverlay');
  });

  it('falls back to slide-type defaults when the filename is generic', () => {
    expect(inferImageSlot({ slideType: SlideType.TitleSlide, filename: 'photo.jpg' }).slot.id).toBe('titleHero');
    expect(inferImageSlot({ slideType: SlideType.ImageSlide, filename: 'photo.jpg' }).slot.id).toBe('bodyFigure');
  });

  it('falls back to bodyFigure when nothing matches', () => {
    const r = inferImageSlot({});
    expect(r.slot.id).toBe('bodyFigure');
    expect(r.reason).toBe('fallback');
  });

  it('produces a non-empty alt text for every slot', () => {
    for (const slot of Object.values(IMAGE_SLOTS)) {
      const r = inferImageSlot({ role: slot.id });
      expect(r.alt.length).toBeGreaterThan(0);
    }
  });

  it('preserves caller-supplied alt over the slot default', () => {
    const r = inferImageSlot({ role: 'titleHero', alt: 'A custom hero' });
    expect(r.alt).toBe('A custom hero');
  });
});
