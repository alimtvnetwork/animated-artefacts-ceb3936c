/**
 * useAutoFrame — smoke tests for the face-tracking hook.
 *
 * Detection itself depends on the browser-native `FaceDetector` API which
 * isn't available in jsdom, so we focus on:
 *   1. The hook reports `supported: false` cleanly when FaceDetector is
 *      missing (the jsdom default), and `enabled` defaults off.
 *   2. The transform string falls back to the static mirror flip when
 *      tracking is disabled or unsupported — i.e. nothing changes from
 *      the pre-feature behavior.
 *   3. `toggle()` flips `enabled` and persists to localStorage.
 *
 * These guard the contract the overlay relies on: when auto-frame can't
 * run, the camera looks identical to before and the toggle button is
 * hidden (overlay checks `supported`).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoFrame } from '@/slides/components/useAutoFrame';

const STORAGE_KEY = 'riseup.webcam.autoframe';

describe('useAutoFrame', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Ensure FaceDetector is undefined for the unsupported-path tests.
    delete (window as unknown as { FaceDetector?: unknown }).FaceDetector;
  });

  afterEach(() => {
    delete (window as unknown as { FaceDetector?: unknown }).FaceDetector;
    window.localStorage.clear();
  });

  it('reports unsupported when FaceDetector is absent', () => {
    const { result } = renderHook(() => useAutoFrame(null, true));
    expect(result.current.supported).toBe(false);
    expect(result.current.enabled).toBe(false);
    expect(result.current.tracking).toBe(false);
  });

  it('returns a static mirror transform when disabled', () => {
    const { result } = renderHook(() => useAutoFrame(null, true));
    expect(result.current.transform).toBe('scaleX(-1)');
  });

  it('returns "none" transform when not mirrored and disabled', () => {
    const { result } = renderHook(() => useAutoFrame(null, false));
    expect(result.current.transform).toBe('none');
  });

  it('toggle flips enabled and persists to localStorage', () => {
    const { result } = renderHook(() => useAutoFrame(null, true));
    expect(result.current.enabled).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('1');

    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('0');
  });

  it('reads initial enabled state from localStorage', () => {
    window.localStorage.setItem(STORAGE_KEY, '1');
    const { result } = renderHook(() => useAutoFrame(null, true));
    expect(result.current.enabled).toBe(true);
  });

  it('resets transform to identity when enabled but unsupported (no FaceDetector)', () => {
    window.localStorage.setItem(STORAGE_KEY, '1');
    const { result } = renderHook(() => useAutoFrame(null, true));
    // Even though enabled=true, supported=false → transform stays static mirror.
    expect(result.current.supported).toBe(false);
    expect(result.current.enabled).toBe(true);
    expect(result.current.transform).toBe('scaleX(-1)');
    expect(result.current.tracking).toBe(false);
  });
});
