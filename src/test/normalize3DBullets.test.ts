import { describe, it, expect } from 'vitest';
import { normalize3DBullets } from '../slides/normalize3DBullets';
import type { SlideSpec } from '../slides/types';

/**
 * Coverage for the deck-load preprocessor. Each test mirrors a real legacy
 * shape we've encountered in old `spec/26-slide-definitions/*` JSON or in
 * imported localStorage manifests that pre-date the keywords-only contract.
 */
function steps3DSlide(steps: unknown[]): SlideSpec {
  return {
    slideNumber: 4,
    slideName: 'process-3d',
    slideType: 'StepsChain3DSlide',
    enabled: true,
    transition: 'FadeIn',
    textAnimation: 'FadeIn',
    notes: '',
    showBrandHeader: true,
    showPresenterChip: false,
    titleShimmer: false,
    isClickReveal: false,
    content: { title: 'Our process', steps },
  } as unknown as SlideSpec;
}

describe('normalize3DBullets', () => {
  it('migrates body prose into bullets[] and drops body', () => {
    const slide = steps3DSlide([
      { label: 'A', title: 'A', subtitle: 's', description: { body: 'Discovery. Audit; Brief.' } },
    ]);
    const audit = normalize3DBullets([slide], 'bundled');
    const desc = (slide.content as any).steps[0].description;
    expect(desc.bullets).toEqual(['Discovery', 'Audit', 'Brief']);
    expect(desc.body).toBeUndefined();
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ slideNumber: 4, stepIndex: 0, finalCount: 3 });
  });

  it('appends to existing bullets up to 6 cap', () => {
    const slide = steps3DSlide([
      { label: 'A', title: 'A', subtitle: 's', description: { bullets: ['One', 'Two', 'Three', 'Four'], body: 'Five, Six, Seven, Eight' } },
    ]);
    normalize3DBullets([slide], 'bundled');
    const desc = (slide.content as any).steps[0].description;
    expect(desc.bullets).toEqual(['One', 'Two', 'Three', 'Four', 'Five', 'Six']);
    expect(desc.body).toBeUndefined();
  });

  it('coerces string-typed description into bullets', () => {
    const slide = steps3DSlide([
      { label: 'A', title: 'A', subtitle: 's', description: 'Stakeholder interviews, System audit, One-page brief' },
    ]);
    normalize3DBullets([slide], 'imported');
    const desc = (slide.content as any).steps[0].description;
    expect(desc.bullets).toEqual(['Stakeholder interviews', 'System audit', 'One-page brief']);
    expect(desc.body).toBeUndefined();
  });

  it('is idempotent — running twice yields no extra changes', () => {
    const slide = steps3DSlide([
      { label: 'A', title: 'A', subtitle: 's', description: { body: 'Alpha. Beta.' } },
    ]);
    const first = normalize3DBullets([slide], 'bundled');
    const second = normalize3DBullets([slide], 'bundled');
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
  });

  it('strips an empty body without touching bullets and emits no audit entry', () => {
    const slide = steps3DSlide([
      { label: 'A', title: 'A', subtitle: 's', description: { bullets: ['Kept'], body: '   ' } },
    ]);
    const audit = normalize3DBullets([slide], 'bundled');
    const desc = (slide.content as any).steps[0].description;
    expect(desc.body).toBeUndefined();
    expect(desc.bullets).toEqual(['Kept']);
    expect(audit).toHaveLength(0);
  });

  it('skips non-3D slides entirely', () => {
    const slide: SlideSpec = {
      slideNumber: 1, slideName: 't', slideType: 'TitleSlide',
      enabled: true, transition: 'FadeIn', textAnimation: 'FadeIn', notes: '',
      showBrandHeader: true, showPresenterChip: false, titleShimmer: false, isClickReveal: false,
      content: { title: 'Hello' },
    } as unknown as SlideSpec;
    const audit = normalize3DBullets([slide], 'bundled');
    expect(audit).toHaveLength(0);
    expect((slide.content as any).title).toBe('Hello');
  });
});
