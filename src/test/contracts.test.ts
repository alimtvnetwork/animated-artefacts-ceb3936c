import { describe, it, expect } from 'vitest';
import { validateSlide, assertValidSlides, REQUIRED_FIELDS } from '../slides/contracts';
import { planSingleSlideImport } from '../slides/slideJsonImport';

const baseEnvelope = {
  slideNumber: 1,
  slideName: 'sample',
  transition: 'FadeIn',
  textAnimation: 'FadeIn',
};

describe('per-slideType contracts', () => {
  it('accepts a valid TitleSlide', () => {
    const r = validateSlide({ ...baseEnvelope, slideType: 'TitleSlide', content: { title: 'Hi' } });
    expect(r.ok).toBe(true);
  });

  it('rejects KeywordSlide with <3 keywords by slideType-specific message', () => {
    const r = validateSlide({
      ...baseEnvelope,
      slideType: 'KeywordSlide',
      content: { title: 'X', keywords: ['a', 'b'] },
    });
    expect(r.ok).toBe(false);
    if (r.ok === false) {
      expect(r.issues[0].slideType).toBe('KeywordSlide');
      expect(r.issues[0].path).toBe('content.keywords');
    }
  });

  it('rejects StepTimelineSlide with >6 steps', () => {
    const step = { label: 'Step', title: 'T', subtitle: 'S' };
    const r = validateSlide({
      ...baseEnvelope,
      slideType: 'StepTimelineSlide',
      content: { title: 'X', steps: Array(7).fill(step) },
    });
    expect(r.ok).toBe(false);
  });

  it('rejects QrMeetingSlide missing meetingUrl/qrUrl/qrAsset', () => {
    const r = validateSlide({ ...baseEnvelope, slideType: 'QrMeetingSlide', content: {} });
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.issues[0].slideType).toBe('QrMeetingSlide');
  });

  it('rejects unknown slideType (discriminator catches it fast)', () => {
    const r = validateSlide({ ...baseEnvelope, slideType: 'NonsenseSlide', content: {} });
    expect(r.ok).toBe(false);
  });

  it('assertValidSlides throws with a slide-naming message on first failure', () => {
    expect(() =>
      assertValidSlides([
        { ...baseEnvelope, slideType: 'TitleSlide', content: { title: 'ok' } },
        { ...baseEnvelope, slideNumber: 2, slideName: 'broken', slideType: 'ImageSlide', content: {} },
      ]),
    ).toThrow(/Slide #2 "broken".*ImageSlide/s);
  });

  it('REQUIRED_FIELDS table covers every slideType in the discriminator', () => {
    const types = [
      'TitleSlide','MiddleTitleSlide','SectionDividerSlide','KeywordSlide',
      'CapsuleListSlide','StepTimelineSlide','FocusTimelineSlide','AdvanceStepSlide','StepsChain3DSlide',
      'ImageSlide','QrMeetingSlide',
    ];
    for (const t of types) expect(REQUIRED_FIELDS[t]).toBeDefined();
  });

  it('accepts StepsChain3DSlide step.description.body (legacy — auto-converted at render via deriveBullets)', () => {
    // v0.214 — legacy `body` is no longer rejected. The renderer auto-splits
    // it into bullets so older decks load without manual editing. Authors are
    // still nudged via a dev-only console warning to migrate.
    const stepWithBody = {
      label: 'Step', title: 'T', subtitle: 'S',
      description: { title: 'Hi', body: 'Listen. Build. Ship.' },
    };
    const otherStep = { label: 'Step', title: 'T2', subtitle: 'S2' };
    const r = validateSlide({
      ...baseEnvelope,
      slideType: 'StepsChain3DSlide',
      content: { title: 'X', steps: [stepWithBody, otherStep] },
    });
    expect(r.ok).toBe(true);
  });

  it('accepts StepsChain3DSlide step.description with bullets only', () => {
    const r = validateSlide({
      ...baseEnvelope,
      slideType: 'StepsChain3DSlide',
      content: {
        title: 'X',
        steps: [
          { label: 'S', title: 'T', subtitle: 'Sub', description: { title: 'Hi', bullets: ['a', 'b'] } },
          { label: 'S', title: 'T', subtitle: 'Sub' },
        ],
      },
    });
    expect(r.ok).toBe(true);
  });

  it('rejects StepsChain3DSlide step.description with unknown key, with rich help message', () => {
    // Author typed `text` instead of `bullets` — the validation panel
    // should surface the four allowed fields plus the example payload.
    const r = validateSlide({
      ...baseEnvelope,
      slideType: 'StepsChain3DSlide',
      content: {
        title: 'X',
        steps: [
          { label: 'S', title: 'T', subtitle: 'Sub', description: { text: 'oops' } },
          { label: 'S', title: 'T', subtitle: 'Sub' },
        ],
      },
    });
    expect(r.ok).toBe(false);
    if (r.ok === false) {
      const msg = r.issues.map(i => i.message).join('\n');
      expect(msg).toMatch(/bullets/);
      expect(msg).toMatch(/Stakeholder interviews/);
      expect(msg).toMatch(/Common typos/);
    }
  });

  it('rejects empty StepsChain3DSlide step.description with bullets[] guidance', () => {
    const r = validateSlide({
      ...baseEnvelope,
      slideType: 'StepsChain3DSlide',
      content: {
        title: 'X',
        steps: [
          { label: 'S', title: 'T', subtitle: 'Sub', description: {} },
          { label: 'S', title: 'T', subtitle: 'Sub' },
        ],
      },
    });
    expect(r.ok).toBe(false);
    if (r.ok === false) {
      expect(r.issues.some(i => /bullets/.test(i.message))).toBe(true);
    }
  });

  it('plans single-slide import by inserting after the current slide and shifting later links', () => {
    const deck = { deckSlug: 'demo', deckName: 'Demo' } as const;
    const slides = [
      {
        ...baseEnvelope,
        slideNumber: 1,
        slideName: 'one',
        slideType: 'TitleSlide',
        content: { title: 'One', capsules: [{ text: 'Open', color: 'gold', clickRevealSlide: 3 }] },
      },
      {
        ...baseEnvelope,
        slideNumber: 2,
        slideName: 'two',
        slideType: 'TitleSlide',
        content: { title: 'Two' },
      },
      {
        ...baseEnvelope,
        slideNumber: 3,
        slideName: 'three',
        slideType: 'TitleSlide',
        isClickReveal: true,
        parentSlide: 1,
        content: { title: 'Three' },
      },
    ];
    const raw = {
      manifestVersion: 1,
      exportedAt: '2026-06-06T00:00:00.000Z',
      source: 'demo',
      slideNumber: 99,
      slide: {
        ...baseEnvelope,
        slideNumber: 99,
        slideName: 'imported',
        slideType: 'TitleSlide',
        content: { title: 'Imported' },
      },
    };

    const plan = planSingleSlideImport(deck as never, slides as never, raw, 1);

    expect(plan.insertedNumber).toBe(2);
    expect(plan.manifest.slides.map((slide) => slide.slideNumber)).toEqual([1, 2, 3, 4]);
    expect(plan.manifest.slides[1].slideName).toBe('imported');
    expect((plan.manifest.slides[0].content as { capsules: Array<{ clickRevealSlide?: number }> }).capsules[0].clickRevealSlide).toBe(4);
    expect(plan.manifest.slides[3].parentSlide).toBe(1);
  });
});
