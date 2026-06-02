import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoHideCursor } from '@/slides/components/useAutoHideCursor';

describe('useAutoHideCursor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-hides after the idle delay when active', () => {
    const { result } = renderHook(() => useAutoHideCursor({ active: true, delay: 2500 }));

    expect(result.current.hidden).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.hidden).toBe(true);
  });

  it('shows on registerActivity and hides again after a fresh idle window', () => {
    const { result } = renderHook(() => useAutoHideCursor({ active: true, delay: 2500 }));

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(result.current.hidden).toBe(true);

    act(() => {
      result.current.registerActivity();
    });
    expect(result.current.hidden).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2499);
    });
    expect(result.current.hidden).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.hidden).toBe(true);
  });

  it('hideNow hides immediately after movement ends', () => {
    const { result } = renderHook(() => useAutoHideCursor({ active: true, delay: 2500 }));

    act(() => {
      result.current.registerActivity();
      result.current.hideNow();
    });

    expect(result.current.hidden).toBe(true);
  });

  it('resets to visible when inactive', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useAutoHideCursor({ active, delay: 2500 }),
      { initialProps: { active: true } },
    );

    act(() => {
      result.current.hideNow();
    });
    expect(result.current.hidden).toBe(true);

    rerender({ active: false });
    expect(result.current.hidden).toBe(false);
  });
});