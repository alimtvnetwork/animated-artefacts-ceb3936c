/**
 * Analytics recorder + summarizer (Window-2 task 24).
 *
 * Verifies the privacy-first guarantees AND the aggregation math:
 *   • Disabled by default — recordEvent is a no-op pre-enable.
 *   • Enable flips both localStorage AND the URL flag.
 *   • Ring buffer caps at MAX_EVENTS (drops oldest).
 *   • summarizeDwell rolls (enter, exit, click-reveal) into the right shape.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  _MAX_EVENTS,
  _resetAnalyticsForTests,
  clearEvents,
  getEvents,
  isAnalyticsEnabled,
  recordEvent,
  setAnalyticsEnabled,
  summarizeByType,
  summarizeDwell,
  summarizeReveals,
  type AnalyticsEvent,
} from '@/slides/analytics/recorder';

describe('analytics recorder (Window-2 task 24)', () => {
  beforeEach(() => {
    _resetAnalyticsForTests();
  });
  afterEach(() => {
    _resetAnalyticsForTests();
  });

  it('starts disabled and silently ignores recordEvent calls', () => {
    expect(isAnalyticsEnabled()).toBe(false);
    recordEvent('slide-enter', 3);
    recordEvent('slide-exit', 3, { dwellMs: 1000 });
    expect(getEvents()).toHaveLength(0);
  });

  it('setAnalyticsEnabled(true) persists to localStorage and writes ?analytics=1 to the URL', () => {
    setAnalyticsEnabled(true);
    expect(isAnalyticsEnabled()).toBe(true);
    expect(localStorage.getItem('riseup.analytics.enabled')).toBe('1');
    expect(new URL(window.location.href).searchParams.get('analytics')).toBe('1');
  });

  it('records events once enabled and persists across reads', () => {
    setAnalyticsEnabled(true);
    recordEvent('slide-enter', 1);
    recordEvent('slide-exit', 1, { dwellMs: 1500 });
    recordEvent('click-reveal', 2, { revealSlug: 'lovable-cloud' });
    const events = getEvents();
    expect(events).toHaveLength(3);
    expect(events[0].kind).toBe('slide-enter');
    expect(events[1].data?.dwellMs).toBe(1500);
    expect(events[2].data?.revealSlug).toBe('lovable-cloud');
  });

  it('clearEvents wipes the buffer but leaves the enabled flag alone', () => {
    setAnalyticsEnabled(true);
    recordEvent('slide-enter', 1);
    expect(getEvents()).toHaveLength(1);
    clearEvents();
    expect(getEvents()).toHaveLength(0);
    expect(isAnalyticsEnabled()).toBe(true);
  });

  it('caps the ring buffer at MAX_EVENTS by dropping the oldest entries', () => {
    setAnalyticsEnabled(true);
    // Record N+5 events — the first 5 should be evicted.
    for (let i = 0; i < _MAX_EVENTS + 5; i++) {
      recordEvent('slide-enter', i + 1);
    }
    const events = getEvents();
    expect(events).toHaveLength(_MAX_EVENTS);
    // The oldest surviving event is event #6 (1-indexed).
    expect(events[0].slide).toBe(6);
    // The newest is the very last we recorded.
    expect(events[events.length - 1].slide).toBe(_MAX_EVENTS + 5);
  });

  it('summarizeDwell rolls per-slide visits + dwell + reveals correctly', () => {
    const events: AnalyticsEvent[] = [
      { t: 1, slide: 3, kind: 'slide-enter' },
      { t: 2, slide: 3, kind: 'click-reveal', data: { revealSlug: 'a' } },
      { t: 3, slide: 3, kind: 'slide-exit', data: { dwellMs: 4000 } },
      { t: 4, slide: 5, kind: 'slide-enter' },
      { t: 5, slide: 5, kind: 'slide-exit', data: { dwellMs: 1000 } },
      { t: 6, slide: 3, kind: 'slide-enter' },
      { t: 7, slide: 3, kind: 'slide-exit', data: { dwellMs: 2000 } },
    ];
    const summary = summarizeDwell(events);
    const s3 = summary.find((r) => r.slide === 3)!;
    const s5 = summary.find((r) => r.slide === 5)!;
    expect(s3.visits).toBe(2);
    expect(s3.totalDwellMs).toBe(6000);
    expect(s3.meanDwellMs).toBe(3000);
    expect(s3.reveals).toBe(1);
    expect(s5.visits).toBe(1);
    expect(s5.totalDwellMs).toBe(1000);
    expect(s5.meanDwellMs).toBe(1000);
    expect(s5.reveals).toBe(0);
  });

  it('summarizeDwell handles a slide that was entered but never exited (NaN mean)', () => {
    const events: AnalyticsEvent[] = [
      { t: 1, slide: 9, kind: 'slide-enter' },
    ];
    const [row] = summarizeDwell(events);
    expect(row.visits).toBe(1);
    expect(row.totalDwellMs).toBe(0);
    // visits>0 so meanDwellMs = 0 / 1 = 0, NOT NaN. Verify.
    expect(row.meanDwellMs).toBe(0);
  });

  it('summary results are sorted by slide ascending', () => {
    const events: AnalyticsEvent[] = [
      { t: 1, slide: 7, kind: 'slide-enter' },
      { t: 2, slide: 1, kind: 'slide-enter' },
      { t: 3, slide: 3, kind: 'slide-enter' },
    ];
    const summary = summarizeDwell(events);
    expect(summary.map((r) => r.slide)).toEqual([1, 3, 7]);
  });

  it('summarizeByType groups visits, dwell, and reveals by slideType tag', () => {
    const events: AnalyticsEvent[] = [
      { t: 1, slide: 1, kind: 'slide-enter', data: { slideType: 'TitleSlide' } },
      { t: 2, slide: 1, kind: 'slide-exit', data: { dwellMs: 2000, slideType: 'TitleSlide' } },
      { t: 3, slide: 2, kind: 'slide-enter', data: { slideType: 'CapsuleListSlide' } },
      { t: 4, slide: 2, kind: 'click-reveal', data: { revealSlug: 'pricing', slideType: 'CapsuleListSlide' } },
      { t: 5, slide: 2, kind: 'slide-exit', data: { dwellMs: 4000, slideType: 'CapsuleListSlide' } },
      { t: 6, slide: 3, kind: 'slide-enter', data: { slideType: 'CapsuleListSlide' } },
      { t: 7, slide: 3, kind: 'slide-exit', data: { dwellMs: 1000, slideType: 'CapsuleListSlide' } },
    ];
    const rows = summarizeByType(events);
    // Sorted by visits desc, then alpha. CapsuleListSlide has 2 visits.
    expect(rows[0].slideType).toBe('CapsuleListSlide');
    expect(rows[0].visits).toBe(2);
    expect(rows[0].totalDwellMs).toBe(5000);
    expect(rows[0].meanDwellMs).toBe(2500);
    expect(rows[0].reveals).toBe(1);
    expect(rows[1].slideType).toBe('TitleSlide');
    expect(rows[1].visits).toBe(1);
    expect(rows[1].reveals).toBe(0);
  });

  it('summarizeByType skips events without a slideType tag (back-compat)', () => {
    const events: AnalyticsEvent[] = [
      { t: 1, slide: 1, kind: 'slide-enter' }, // legacy event, no tag
      { t: 2, slide: 1, kind: 'slide-enter', data: { slideType: 'TitleSlide' } },
    ];
    const rows = summarizeByType(events);
    expect(rows).toHaveLength(1);
    expect(rows[0].slideType).toBe('TitleSlide');
    expect(rows[0].visits).toBe(1);
  });

  it('summarizeReveals counts opens, dedupes parents, sorts by opens desc', () => {
    const events: AnalyticsEvent[] = [
      { t: 100, slide: 4, kind: 'click-reveal', data: { revealSlug: 'lovable-cloud' } },
      { t: 200, slide: 4, kind: 'click-reveal', data: { revealSlug: 'lovable-cloud' } },
      { t: 300, slide: 7, kind: 'click-reveal', data: { revealSlug: 'lovable-cloud' } },
      { t: 400, slide: 5, kind: 'click-reveal', data: { revealSlug: 'pricing' } },
      // Non-reveal events must be ignored.
      { t: 500, slide: 5, kind: 'slide-enter' },
    ];
    const rows = summarizeReveals(events);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      revealSlug: 'lovable-cloud',
      opens: 3,
      parentSlides: [4, 7],
      lastOpenedAt: 300,
    });
    expect(rows[1]).toMatchObject({
      revealSlug: 'pricing',
      opens: 1,
      parentSlides: [5],
      lastOpenedAt: 400,
    });
  });

  it('summarizeReveals falls back to "unknown" when revealSlug is missing', () => {
    const events: AnalyticsEvent[] = [
      { t: 1, slide: 2, kind: 'click-reveal' },
    ];
    const [row] = summarizeReveals(events);
    expect(row.revealSlug).toBe('unknown');
    expect(row.opens).toBe(1);
  });
});
