import { describe, it, expect } from 'vitest';
import { buildPageWindow } from '@/slides/controls/pageWindow';

/**
 * Windowing math for the dot-pagination ellipsis (plan 05).
 * See spec/27-slides-number/05-surface-dot-pagination.md.
 */
describe('buildPageWindow', () => {
  it('returns the full range when nothing collapses', () => {
    expect(buildPageWindow(1, 5, 2)).toEqual([1, 2, 3, 4, 5]);
  });

  it('total=16, current=1 → leading run then gap then last', () => {
    expect(buildPageWindow(1, 16, 2)).toEqual([1, 2, 3, 'gap', 16]);
  });

  it('total=50, middle current collapses both sides', () => {
    expect(buildPageWindow(25, 50, 2)).toEqual([1, 'gap', 23, 24, 25, 26, 27, 'gap', 50]);
  });

  it('total=50, last current shows trailing run', () => {
    expect(buildPageWindow(50, 50, 2)).toEqual([1, 'gap', 48, 49, 50]);
  });

  it('a single skipped index renders as the number, never a gap', () => {
    expect(buildPageWindow(4, 7, 2)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('handles empty / single-slide decks', () => {
    expect(buildPageWindow(1, 0)).toEqual([]);
    expect(buildPageWindow(1, 1)).toEqual([1]);
  });
});
