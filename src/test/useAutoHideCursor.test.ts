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
      result.current.registerActivity({ kind: 'move', clientX: 40, clientY: 60 });
      result.current.hideNow({ kind: 'move', clientX: 40, clientY: 60 });
    });

    expect(result.current.hidden).toBe(true);
  });

  it('stays hidden until the pointer actually moves past the threshold after hideNow', () => {
    const { result } = renderHook(() => useAutoHideCursor({ active: true, delay: 2500 }));

    act(() => {
      result.current.registerActivity({ kind: 'move', clientX: 120, clientY: 180 });
      result.current.hideNow({ kind: 'move', clientX: 120, clientY: 180 });
    });

    expect(result.current.hidden).toBe(true);

    // Jitter at ~same spot (within threshold) keeps it hidden.
    act(() => {
      result.current.registerActivity({ kind: 'move', clientX: 123, clientY: 181 });
    });
    expect(result.current.hidden).toBe(true);

    // A deliberate move past the threshold wakes the cursor.
    act(() => {
      result.current.registerActivity({ kind: 'move', clientX: 140, clientY: 180 });
    });
    expect(result.current.hidden).toBe(false);
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