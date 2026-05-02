/**
 * Tests for v0.146 — `resolveCapsuleLayout()` defaults, clamping, and
 * the rowGapPx → gapPx fallback contract.
 */
import { describe, it, expect } from 'vitest';
import { resolveCapsuleLayout } from '@/slides/capsuleLayout';

describe('resolveCapsuleLayout — defaults', () => {
  it('returns full defaults when layout is undefined', () => {
    const r = resolveCapsuleLayout(undefined);
    expect(r).toEqual({
      columns: undefined,
      gapPx: 16,
      rowGapPx: 16,
      align: 'start',
      verticalAlign: 'center',
      capsuleOpacity: 1,
    });
  });

  it('returns full defaults for an empty object', () => {
    const r = resolveCapsuleLayout({});
    expect(r.gapPx).toBe(16);
    expect(r.rowGapPx).toBe(16);
    expect(r.capsuleOpacity).toBe(1);
  });
});

describe('resolveCapsuleLayout — rowGapPx fallback', () => {
  it('rowGapPx defaults to gapPx when only gapPx is set', () => {
    const r = resolveCapsuleLayout({ gapPx: 40 });
    expect(r.gapPx).toBe(40);
    expect(r.rowGapPx).toBe(40);
  });

  it('rowGapPx is honored independently when set', () => {
    const r = resolveCapsuleLayout({ gapPx: 12, rowGapPx: 48 });
    expect(r.gapPx).toBe(12);
    expect(r.rowGapPx).toBe(48);
  });

  it('rowGapPx of 0 is preserved (not treated as missing)', () => {
    const r = resolveCapsuleLayout({ gapPx: 24, rowGapPx: 0 });
    expect(r.rowGapPx).toBe(0);
  });
});

describe('resolveCapsuleLayout — clamping', () => {
  it('columns clamped to [1, 6] and rounded', () => {
    expect(resolveCapsuleLayout({ columns: 0 }).columns).toBe(1);
    expect(resolveCapsuleLayout({ columns: 99 }).columns).toBe(6);
    expect(resolveCapsuleLayout({ columns: 3.7 }).columns).toBe(4);
  });

  it('gapPx clamped to [0, 96]', () => {
    expect(resolveCapsuleLayout({ gapPx: -10 }).gapPx).toBe(0);
    expect(resolveCapsuleLayout({ gapPx: 999 }).gapPx).toBe(96);
  });

  it('rowGapPx clamped to [0, 96]', () => {
    expect(resolveCapsuleLayout({ rowGapPx: -1 }).rowGapPx).toBe(0);
    expect(resolveCapsuleLayout({ rowGapPx: 500 }).rowGapPx).toBe(96);
  });

  it('capsuleOpacity clamped to [0, 1]', () => {
    expect(resolveCapsuleLayout({ capsuleOpacity: -0.5 }).capsuleOpacity).toBe(0);
    expect(resolveCapsuleLayout({ capsuleOpacity: 2 }).capsuleOpacity).toBe(1);
    expect(resolveCapsuleLayout({ capsuleOpacity: 0.5 }).capsuleOpacity).toBe(0.5);
  });

  it('NaN values fall back to defaults', () => {
    const r = resolveCapsuleLayout({ gapPx: NaN, capsuleOpacity: NaN });
    expect(r.gapPx).toBe(16);
    expect(r.capsuleOpacity).toBe(1);
  });
});

describe('resolveCapsuleLayout — enums', () => {
  it('honors valid align values', () => {
    expect(resolveCapsuleLayout({ align: 'center' }).align).toBe('center');
    expect(resolveCapsuleLayout({ align: 'between' }).align).toBe('between');
  });

  it('falls back to start for invalid align', () => {
    // @ts-expect-error — testing runtime guard
    expect(resolveCapsuleLayout({ align: 'wat' }).align).toBe('start');
  });

  it('honors valid verticalAlign values', () => {
    expect(resolveCapsuleLayout({ verticalAlign: 'stretch' }).verticalAlign).toBe('stretch');
    expect(resolveCapsuleLayout({ verticalAlign: 'end' }).verticalAlign).toBe('end');
  });

  it('falls back to center for invalid verticalAlign', () => {
    // @ts-expect-error — testing runtime guard
    expect(resolveCapsuleLayout({ verticalAlign: 'middle' }).verticalAlign).toBe('center');
  });
});

describe('resolveCapsuleLayout — reproducibility', () => {
  it('same input ⇒ identical output', () => {
    const input = { columns: 3, gapPx: 24, rowGapPx: 32, align: 'center' as const, capsuleOpacity: 0.8 };
    expect(resolveCapsuleLayout(input)).toEqual(resolveCapsuleLayout(input));
  });

  it('full custom layout passes through cleanly', () => {
    const r = resolveCapsuleLayout({
      columns: 4, gapPx: 20, rowGapPx: 28,
      align: 'center', verticalAlign: 'start', capsuleOpacity: 0.65,
    });
    expect(r).toEqual({
      columns: 4, gapPx: 20, rowGapPx: 28,
      align: 'center', verticalAlign: 'start', capsuleOpacity: 0.65,
    });
  });
});
