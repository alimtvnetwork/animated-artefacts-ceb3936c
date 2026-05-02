/**
 * Webcam X-button hard-stop test.
 *
 * The X (close) button on the webcam overlay must IMMEDIATELY stop every
 * track on the live MediaStream — no 10-second `hidden` grace window. The
 * camera indicator light has to go out the moment the presenter dismisses
 * the panel; that's the user-facing contract ("when we cross the webcam,
 * it should actually stop the webcam").
 *
 * `hide()` keeps the older grace-window behavior (used by toggle/minimize
 * paths). `close()` is the new explicit-stop path bound to the X button.
 */
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PresenterWebcamProvider,
  usePresenterWebcam,
} from '@/slides/components/usePresenterWebcam';

interface Captured {
  ctx: ReturnType<typeof usePresenterWebcam> | null;
}

function Probe({ captured }: { captured: Captured }) {
  captured.ctx = usePresenterWebcam();
  return null;
}

function makeFakeStream() {
  const tracks = [
    { stop: vi.fn(), kind: 'video' },
    { stop: vi.fn(), kind: 'video' },
  ];
  return {
    stream: { getTracks: () => tracks } as unknown as MediaStream,
    tracks,
  };
}

describe('PresenterWebcam — X-button hard-stop', () => {
  const originalGUM = navigator.mediaDevices?.getUserMedia;

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    if (originalGUM && navigator.mediaDevices) {
      // restore
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        configurable: true,
        value: originalGUM,
      });
    }
  });

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

  it('close() stops every track immediately and resets phase to off', async () => {
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
    expect(captured.ctx!.state.phase).toBe('on');
    tracks.forEach((t) => expect(t.stop).not.toHaveBeenCalled());

    await act(async () => {
      captured.ctx!.close();
    });

    // Tracks stopped synchronously — no grace window.
    tracks.forEach((t) => expect(t.stop).toHaveBeenCalledTimes(1));
    expect(captured.ctx!.state.phase).toBe('off');
    expect(captured.ctx!.state.stream).toBeNull();
  });

  it('hide() keeps tracks alive for the grace window (regression guard)', async () => {
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
    await act(async () => {
      captured.ctx!.hide();
    });

    // Still alive — phase is 'hidden', tracks NOT yet stopped.
    expect(captured.ctx!.state.phase).toBe('hidden');
    tracks.forEach((t) => expect(t.stop).not.toHaveBeenCalled());

    // After grace window, the timer stops them.
    await act(async () => {
      vi.advanceTimersByTime(11_000);
    });
    tracks.forEach((t) => expect(t.stop).toHaveBeenCalledTimes(1));
    expect(captured.ctx!.state.phase).toBe('off');
  });

  it('close() while in hidden phase cancels the pending grace timer', async () => {
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
    await act(async () => {
      captured.ctx!.hide();
    });
    await act(async () => {
      captured.ctx!.close();
    });

    // Stopped exactly once (close), and advancing time does NOT stop them again.
    tracks.forEach((t) => expect(t.stop).toHaveBeenCalledTimes(1));
    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });
    tracks.forEach((t) => expect(t.stop).toHaveBeenCalledTimes(1));
    expect(captured.ctx!.state.phase).toBe('off');
  });
});
