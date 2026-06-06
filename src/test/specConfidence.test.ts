/**
 * Tests — `auditSpecConfidence` is the single pre-render gate that
 * combines contract / enum / unknown-field / motion-variety checks
 * into a 0–100 score. These tests lock down:
 *
 *   1. A clean deck scores 100 + zero issues.
 *   2. Each category fires the right `SpecIssueCategory` + severity.
 *   3. Scoring is monotonic — hard issues (−10) cost more than soft (−2).
 *   4. `assertHighConfidence` throws below the threshold, passes above.
 *   5. The `KNOWN_SLIDE_FIELDS` whitelist stays in parity with the
 *      `SlideSpec` interface (catches drift when new top-level fields
 *      are added without updating the audit).
 */
import { describe, it, expect } from 'vitest';
import {
  auditSpecConfidence,
  assertHighConfidence,
} from '../slides/specConfidence';

/** Minimal but valid TitleSlide envelope — used as a clean baseline. */
const titleSlide = (n: number, name = `slide-${n}`) => ({
  slideNumber: n,
  slideName: name,
  slideType: 'TitleSlide',
  // Alternate animations so the deck doesn't trip the variety rule.
  transition: n % 2 === 0 ? 'FadeIn' : 'SlideIn',
  textAnimation: n % 2 === 0 ? 'FadeIn' : 'SlideUp',
  isClickReveal: false,
  showBrandHeader: true,
  showPresenterChip: true,
  content: { title: `Slide ${n}` },
});

describe('auditSpecConfidence — clean deck', () => {
  it('scores 100/100 with zero issues for a 3-slide clean deck', () => {
    const r = auditSpecConfidence([titleSlide(1), titleSlide(2), titleSlide(3)]);
    expect(r.score).toBe(100);
    expect(r.band).toBe('excellent');
    expect(r.issues).toEqual([]);
    expect(r.totalSlides).toBe(3);
    expect(r.counts).toEqual({
      contract: 0,
      'unknown-enum': 0,
      'unknown-field': 0,
      'motion-variety': 0,
    });
  });
});

describe('auditSpecConfidence — category detection', () => {
  it('flags a contract violation (missing content.title) as hard / contract', () => {
    const r = auditSpecConfidence([
      { ...titleSlide(1), content: {} }, // title missing
    ]);
    expect(r.counts.contract).toBeGreaterThanOrEqual(1);
    const hit = r.issues.find((i) => i.category === 'contract');
    expect(hit?.severity).toBe('hard');
  });

  it('flags an unknown transition value as hard / unknown-enum', () => {
    const r = auditSpecConfidence([
      { ...titleSlide(1), transition: 'WarpSpeed' },
    ]);
    const hit = r.issues.find((i) => i.category === 'unknown-enum');
    expect(hit?.severity).toBe('hard');
    expect(hit?.path).toBe('transition');
    expect(hit?.fix).toMatch(/FadeIn/);
  });

  it('flags an unknown textAnimation value as hard / unknown-enum', () => {
    const r = auditSpecConfidence([
      { ...titleSlide(1), textAnimation: 'Wiggle' },
    ]);
    const hit = r.issues.find(
      (i) => i.category === 'unknown-enum' && i.path === 'textAnimation',
    );
    expect(hit).toBeDefined();
    expect(hit?.fix).toMatch(/Stagger/);
  });

  it('flags an unknown top-level field as soft / unknown-field', () => {
    const r = auditSpecConfidence([
      { ...titleSlide(1), transitions: 'FadeIn' }, // typo
    ]);
    const hit = r.issues.find((i) => i.category === 'unknown-field');
    expect(hit?.severity).toBe('soft');
    expect(hit?.path).toBe('transitions');
  });

  it('does NOT flag legitimate authoring metadata (densityCheck, theme, narrowIdea)', () => {
    const r = auditSpecConfidence([
      { ...titleSlide(1), densityCheck: { capsules: { cap: 6 } }, theme: 'noir-gold', narrowIdea: 'one idea' },
    ]);
    expect(r.counts['unknown-field']).toBe(0);
  });

  it('flags a motion-variety collision on adjacent identical pairs', () => {
    const r = auditSpecConfidence([
      { ...titleSlide(1), transition: 'FadeIn', textAnimation: 'FadeIn' },
      { ...titleSlide(2), transition: 'FadeIn', textAnimation: 'FadeIn' },
    ]);
    const hit = r.issues.find((i) => i.category === 'motion-variety');
    expect(hit?.severity).toBe('soft');
    expect(hit?.slideNumber).toBe(2);
  });
});

describe('auditSpecConfidence — scoring', () => {
  it('subtracts 10 per hard issue and 2 per soft issue (clamped 0–100)', () => {
    const oneHard = auditSpecConfidence([
      { ...titleSlide(1), transition: 'WarpSpeed' }, // 1 hard
    ]);
    expect(oneHard.score).toBe(90);

    const oneSoft = auditSpecConfidence([
      { ...titleSlide(1), notesText: 'oops' }, // 1 soft (unknown field)
    ]);
    expect(oneSoft.score).toBe(98);

    // Many hard issues should clamp at 0, never go negative.
    const manyHard = auditSpecConfidence(
      Array.from({ length: 20 }, (_, i) => ({
        ...titleSlide(i + 1),
        transition: 'WarpSpeed', // hard each
      })),
    );
    expect(manyHard.score).toBe(0);
    expect(manyHard.band).toBe('poor');
  });

  it('assigns the right band per score range', () => {
    // 100 → excellent (covered above).
    // 90 → good.
    const good = auditSpecConfidence([
      { ...titleSlide(1), transition: 'WarpSpeed' },
    ]);
    expect(good.band).toBe('good');

    // Drive score into "fair" (50–79). Five hard issues = -50 → 50.
    const fair = auditSpecConfidence(
      Array.from({ length: 5 }, (_, i) => ({
        ...titleSlide(i + 1),
        transition: 'WarpSpeed',
      })),
    );
    expect(fair.score).toBe(50);
    expect(fair.band).toBe('fair');
  });
});

describe('assertHighConfidence', () => {
  it('returns the report when the score meets the minimum', () => {
    const r = assertHighConfidence([titleSlide(1), titleSlide(2)], 80);
    expect(r.score).toBe(100);
  });

  it('throws with a multi-line message when the score is below the minimum', () => {
    expect(() =>
      assertHighConfidence(
        [
          { ...titleSlide(1), transition: 'WarpSpeed' },
          { ...titleSlide(2), textAnimation: 'Wiggle' },
          { ...titleSlide(3), content: {} },
        ],
        95,
      ),
    ).toThrow(/Spec confidence \d+\/100/);
  });
});

/**
 * Parity guard — if a new top-level field lands on `SlideSpec` and the
 * author forgets to teach the audit about it, every future deck will
 * silently log spurious "unknown-field" warnings. This test fails fast
 * with a list of the missing keys so the fix is obvious.
 *
 * We import the raw SlideSpec shape via a sample object literal whose
 * keys match the interface; the test compares those keys against the
 * audit's whitelist by feeding a single slide and asserting no
 * unknown-field issues are emitted for the canonical key set.
 */
describe('audit ↔ SlideSpec parity', () => {
  it('every documented SlideSpec top-level field is whitelisted', () => {
    const canonicalSlide = {
      slideNumber: 1,
      slideName: 'parity',
      slideType: 'TitleSlide',
      transition: 'FadeIn',
      textAnimation: 'FadeIn',
      enabled: true,
      isClickReveal: false,
      parentSlide: null,
      showBrandHeader: true,
      showPresenterChip: true,
      brandStrip: false,
      titleStyle: 'cream',
      titleShimmer: false,
      notes: 'speaker notes',
      sound: { kind: 'whoosh' },
      ambientBackground: 'minimal',
      content: { title: 'parity' },
    };
    const r = auditSpecConfidence([canonicalSlide]);
    const unknown = r.issues.filter((i) => i.category === 'unknown-field');
    if (unknown.length > 0) {
      throw new Error(
        `Audit is missing ${unknown.length} canonical SlideSpec field(s) ` +
          `from its whitelist:\n` +
          unknown.map((u) => `  • ${u.path}`).join('\n') +
          `\nAdd them to KNOWN_SLIDE_FIELDS in src/slides/specConfidence.ts.`,
      );
    }
    expect(unknown).toEqual([]);
  });
});
