/**
 * Webcam v3 — halo visibility + stage-fill round-trip tests.
 *
 * Covers:
 *  1. `haloVisible` defaults OFF, toggles, persists in localStorage
 *     (`riseup.webcam.halo`).
 *  2. `toggleStage` from `'on'` captures size + position, then a second
 *     call atomically restores the EXACT prior size config and position.
 *  3. `exitFullscreen` (Esc path) also exits `'stage'` and restores.
 *  4. `toggleStage` is a no-op from `off` / `tray` / `requesting`
 *     (no surprise camera prompts).
 *
 * Spec: `spec/21-slides-system/66-presenter-webcam.md` §14.
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

describe('PresenterWebcam v3 — halo', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it('haloVisible defaults OFF', () => {
    const captured: Captured = { ctx: null };
    render(
      <PresenterWebcamProvider>
        <Probe captured={captured} />
      </PresenterWebcamProvider>,
    );
    expect(captured.ctx!.haloVisible).toBe(false);
  });

  it('toggleHalo flips state and persists to localStorage', () => {
    const captured: Captured = { ctx: null };
    render(
      <PresenterWebcamProvider>
        <Probe captured={captured} />
      </PresenterWebcamProvider>,
    );

    act(() => {
      captured.ctx!.toggleHalo();
    });
    expect(captured.ctx!.haloVisible).toBe(true);
    expect(window.localStorage.getItem('riseup.webcam.halo')).toBe('1');

    act(() => {
      captured.ctx!.toggleHalo();
    });
    expect(captured.ctx!.haloVisible).toBe(false);
    expect(window.localStorage.getItem('riseup.webcam.halo')).toBe('0');
  });

  it('hydrates haloVisible from localStorage on mount', () => {
    window.localStorage.setItem('riseup.webcam.halo', '1');
    const captured: Captured = { ctx: null };
    render(
      <PresenterWebcamProvider>
        <Probe captured={captured} />
      </PresenterWebcamProvider>,
    );
    expect(captured.ctx!.haloVisible).toBe(true);
  });

  it('cycleShapeOverlay runs rectangle → circle → circle+glow → rectangle and persists both flags', () => {
    const captured: Captured = { ctx: null };
    render(
      <PresenterWebcamProvider>
        <Probe captured={captured} />
      </PresenterWebcamProvider>,
    );

    expect(captured.ctx!.circleShape).toBe(false);
    expect(captured.ctx!.haloVisible).toBe(false);

    act(() => {
      captured.ctx!.cycleShapeOverlay();
    });
    expect(captured.ctx!.circleShape).toBe(true);
    expect(captured.ctx!.haloVisible).toBe(false);
    expect(window.localStorage.getItem('riseup.webcam.circle')).toBe('1');
    expect(window.localStorage.getItem('riseup.webcam.halo')).toBe('0');

    act(() => {
      captured.ctx!.cycleShapeOverlay();
    });
    expect(captured.ctx!.circleShape).toBe(true);
    expect(captured.ctx!.haloVisible).toBe(true);
    expect(window.localStorage.getItem('riseup.webcam.circle')).toBe('1');
    expect(window.localStorage.getItem('riseup.webcam.halo')).toBe('1');

    act(() => {
      captured.ctx!.cycleShapeOverlay();
    });
    expect(captured.ctx!.circleShape).toBe(false);
    expect(captured.ctx!.haloVisible).toBe(false);
    expect(window.localStorage.getItem('riseup.webcam.circle')).toBe('0');
    expect(window.localStorage.getItem('riseup.webcam.halo')).toBe('0');
  });
});

describe('PresenterWebcam v3 — stage round-trip', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it('toggleStage from `on` enters stage; second toggle restores size + position + phase', async () => {
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

    // Establish a unique size (XL step) and a unique position so we can
    // assert exact restoration.
    act(() => {
      captured.ctx!.setSizeStep('XL');
      captured.ctx!.setPosition(123, 456);
    });
    const priorSize = { ...captured.ctx!.size };
    const priorPos = { ...captured.ctx!.position };
    expect(priorSize.w).toBe(720);
    expect(priorPos).toEqual({ x: 123, y: 456 });

    // Enter stage.
    act(() => {
      captured.ctx!.toggleStage();
    });
    expect(captured.ctx!.state.phase).toBe('stage');

    // Second press: round-trip restoration.
    act(() => {
      captured.ctx!.toggleStage();
    });
    expect(captured.ctx!.state.phase).toBe('on');
    expect(captured.ctx!.size).toEqual(priorSize);
    expect(captured.ctx!.position).toEqual(priorPos);
  });

  it('exitFullscreen restores stage size + position too (Esc path)', async () => {
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
      captured.ctx!.setSizeStep('S');
      captured.ctx!.setPosition(50, 60);
    });
    const priorSize = { ...captured.ctx!.size };
    const priorPos = { ...captured.ctx!.position };

    act(() => {
      captured.ctx!.toggleStage();
    });
    expect(captured.ctx!.state.phase).toBe('stage');

    act(() => {
      captured.ctx!.exitFullscreen();
    });
    expect(captured.ctx!.state.phase).toBe('on');
    expect(captured.ctx!.size).toEqual(priorSize);
    expect(captured.ctx!.position).toEqual(priorPos);
  });

  it('toggleStage is a no-op from `off` (no surprise camera prompt)', () => {
    const captured: Captured = { ctx: null };
    render(
      <PresenterWebcamProvider>
        <Probe captured={captured} />
      </PresenterWebcamProvider>,
    );
    expect(captured.ctx!.state.phase).toBe('off');

    act(() => {
      captured.ctx!.toggleStage();
    });
    expect(captured.ctx!.state.phase).toBe('off');
  });

  it('toggleStage is a no-op from `tray`', async () => {
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
      captured.ctx!.hide();
    });
    expect(captured.ctx!.state.phase).toBe('tray');

    act(() => {
      captured.ctx!.toggleStage();
    });
    expect(captured.ctx!.state.phase).toBe('tray');
  });
});
