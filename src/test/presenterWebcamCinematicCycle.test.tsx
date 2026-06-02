/**
 * Webcam v5 — `]` cinematic 3-state cycle regression tests.
 *
 * Locks the contract that `runCinematicCycle` is driven by the CURRENT
 * phase (self-healing), never an internal counter:
 *
 *   1. fullscreen → off   (squish + whoosh, ~0.8s, then stream stops)
 *   2. off/tray/denied → on    (re-acquires via show())
 *   3. on/stage → fullscreen   (bouncy zoom via enterFullscreen())
 *
 * Reduced motion collapses step 1 to an instant exit and plays NO sound.
 *
 * Spec: `spec/21-slides-system/65-presenter-shortcuts-v5.md` §4.
 */
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PresenterWebcamProvider,
  usePresenterWebcam,
} from '@/slides/components/usePresenterWebcam';

const playSpy = vi.fn();
vi.mock('@/slides/sound', () => ({
  slideSound: { play: (...args: unknown[]) => playSpy(...args) },
}));

interface Captured {
  ctx: ReturnType<typeof usePresenterWebcam> | null;
}

function Probe({ captured }: { captured: Captured }) {
  captured.ctx = usePresenterWebcam();
  return null;
}

function makeFakeStream() {
  const tracks = [{ stop: vi.fn(), kind: 'video' }];
  return { stream: { getTracks: () => tracks } as unknown as MediaStream, tracks };
}

function mockGetUserMedia(stream: MediaStream) {
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {} as MediaDevices,
    });
  }
  Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
    configurable: true,
    value: vi.fn().mockResolvedValue(stream),
  });
}

function setReducedMotion(reduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: reduced && query.includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }),
  });
}

describe('PresenterWebcam v5 — cinematic `]` cycle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    playSpy.mockClear();
    setReducedMotion(false);
  });
  afterEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it('off → on: runCinematicCycle acquires the camera', async () => {
    const { stream } = makeFakeStream();
    mockGetUserMedia(stream);
    const captured: Captured = { ctx: null };
    render(
      <PresenterWebcamProvider>
        <Probe captured={captured} />
      </PresenterWebcamProvider>,
    );

    expect(captured.ctx!.state.phase).toBe('off');
    await act(async () => {
      captured.ctx!.runCinematicCycle();
    });
    await waitFor(() => expect(captured.ctx!.state.phase).toBe('on'));
  });

  it('on → fullscreen: runCinematicCycle zooms to fullscreen', async () => {
    const { stream } = makeFakeStream();
    mockGetUserMedia(stream);
    const captured: Captured = { ctx: null };
    render(
      <PresenterWebcamProvider>
        <Probe captured={captured} />
      </PresenterWebcamProvider>,
    );

    await act(async () => {
      await captured.ctx!.show();
    });
    expect(captured.ctx!.state.phase).toBe('on');

    act(() => {
      captured.ctx!.runCinematicCycle();
    });
    expect(captured.ctx!.state.phase).toBe('fullscreen');
  });

  it('fullscreen → off: squishes with whoosh, then stops the stream after 0.8s', async () => {
    vi.useFakeTimers();
    const { stream, tracks } = makeFakeStream();
    mockGetUserMedia(stream);
    const captured: Captured = { ctx: null };
    render(
      <PresenterWebcamProvider>
        <Probe captured={captured} />
      </PresenterWebcamProvider>,
    );

    await act(async () => {
      await captured.ctx!.show();
    });
    act(() => {
      captured.ctx!.runCinematicCycle(); // on → fullscreen
    });
    expect(captured.ctx!.state.phase).toBe('fullscreen');

    act(() => {
      captured.ctx!.runCinematicCycle(); // fullscreen → squish
    });
    expect(captured.ctx!.cinematicExiting).toBe(true);
    expect(playSpy).toHaveBeenCalledWith('whoosh');

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(captured.ctx!.cinematicExiting).toBe(false);
    expect(captured.ctx!.state.phase).toBe('off');
    expect(tracks[0].stop).toHaveBeenCalled();
  });

  it('reduced motion: fullscreen → off is instant and plays NO sound', async () => {
    setReducedMotion(true);
    const { stream } = makeFakeStream();
    mockGetUserMedia(stream);
    const captured: Captured = { ctx: null };
    render(
      <PresenterWebcamProvider>
        <Probe captured={captured} />
      </PresenterWebcamProvider>,
    );

    await act(async () => {
      await captured.ctx!.show();
    });
    act(() => {
      captured.ctx!.runCinematicCycle(); // on → fullscreen
    });
    expect(captured.ctx!.state.phase).toBe('fullscreen');

    act(() => {
      captured.ctx!.runCinematicCycle(); // fullscreen → off (instant)
    });
    expect(captured.ctx!.state.phase).toBe('off');
    expect(captured.ctx!.cinematicExiting).toBe(false);
    expect(playSpy).not.toHaveBeenCalled();
  });
});
