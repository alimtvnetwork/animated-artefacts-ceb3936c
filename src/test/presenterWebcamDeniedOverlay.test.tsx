import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PresenterWebcamOverlay } from '@/slides/components/PresenterWebcamOverlay';

const state = {
  phase: 'denied' as const,
  stream: null,
  error: 'Camera permission denied. Enable it in your browser site settings.',
};

vi.mock('@/slides/components/usePresenterWebcam', () => ({
  usePresenterWebcam: () => ({
    state,
    position: { x: 0, y: 0 },
    size: { w: 320, h: 180 },
    minimized: false,
    close: vi.fn(),
    hide: vi.fn(),
    show: vi.fn(),
    setPosition: vi.fn(),
    toggleMinimized: vi.fn(),
    growSize: vi.fn(),
    shrinkSize: vi.fn(),
    resizeFree: vi.fn(),
    enterFullscreen: vi.fn(),
    exitFullscreen: vi.fn(),
    pushFullscreenAction: vi.fn(),
    haloVisible: false,
    toggleHalo: vi.fn(),
    toggleStage: vi.fn(),
    circleShape: false,
    cycleShapeOverlay: vi.fn(),
    cinematicExiting: false,
  }),
}));

vi.mock('@/slides/components/useAutoFrame', () => ({
  useAutoFrame: () => ({ supported: false, enabled: false, tracking: false, toggle: vi.fn(), transform: '' }),
}));

vi.mock('@/slides/components/useAutoHideCursor', () => ({
  useAutoHideCursor: () => ({ hidden: false, registerActivity: vi.fn(), hideNow: vi.fn() }),
}));

describe('PresenterWebcamOverlay denied state', () => {
  it('renders a visible blocked-camera panel with recovery actions', () => {
    render(<PresenterWebcamOverlay />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Camera blocked')).toBeInTheDocument();
    expect(screen.getByText(/Camera permission denied/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shape preview (O)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    expect(screen.getByAltText('Presenter fallback preview')).toBeInTheDocument();
  });
});