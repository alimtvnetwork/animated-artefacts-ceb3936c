import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { OnboardingCoachmark } from '@/slides/controls/OnboardingCoachmark';
import { useOnboardingFlag, ONBOARDED_KEY } from '@/slides/controls/useOnboardingFlag';
import { renderHook } from '@testing-library/react';

describe('useOnboardingFlag', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts un-onboarded when the flag is absent', () => {
    const { result } = renderHook(() => useOnboardingFlag());
    expect(result.current.onboarded).toBe(false);
  });

  it('markOnboarded persists the flag', () => {
    const { result } = renderHook(() => useOnboardingFlag());
    act(() => result.current.markOnboarded());
    expect(result.current.onboarded).toBe(true);
    expect(localStorage.getItem(ONBOARDED_KEY)).toBe('1');
  });

  it('resetOnboarding clears the flag (Show intro again)', () => {
    localStorage.setItem(ONBOARDED_KEY, '1');
    const { result } = renderHook(() => useOnboardingFlag());
    expect(result.current.onboarded).toBe(true);
    act(() => result.current.resetOnboarding());
    expect(result.current.onboarded).toBe(false);
    expect(localStorage.getItem(ONBOARDED_KEY)).toBeNull();
  });
});

describe('OnboardingCoachmark', () => {
  it('renders the first story step when open', () => {
    render(<OnboardingCoachmark open onDismiss={() => {}} />);
    expect(screen.getByText('Move through the deck')).toBeInTheDocument();
  });

  it('advances through steps via Next', () => {
    render(<OnboardingCoachmark open onDismiss={() => {}} />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Go fullscreen')).toBeInTheDocument();
  });

  it('teach-by-doing: ArrowRight advances the story', async () => {
    render(<OnboardingCoachmark open onDismiss={() => {}} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await waitFor(() =>
      expect(screen.getByText('Go fullscreen')).toBeInTheDocument(),
    );
  });

  it('Done dismisses on the last step', () => {
    const onDismiss = vi.fn();
    render(<OnboardingCoachmark open onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Done'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('Skip dismisses immediately', () => {
    const onDismiss = vi.fn();
    render(<OnboardingCoachmark open onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Skip'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('dismisses immediately for webcam shortcuts so I/O are not blocked', () => {
    const onDismiss = vi.fn();
    render(<OnboardingCoachmark open onDismiss={onDismiss} />);
    fireEvent.keyDown(window, { key: 'o' });
    expect(onDismiss).toHaveBeenCalled();
  });
});
