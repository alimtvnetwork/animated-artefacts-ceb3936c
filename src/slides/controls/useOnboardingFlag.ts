/**
 * useOnboardingFlag — single gate deciding whether the controller intro
 * coachmark (`OnboardingCoachmark`) is shown. Persists in localStorage under
 * `ctrl.onboarded.v1`. Default behavior is "already onboarded" so the deck
 * never opens a popup on first load; the intro only appears when explicitly
 * re-opened from the controller menu. See `spec/controller-2026/11-build-substeps-c07.md` (C07.1).
 */
import { useCallback, useEffect, useState } from 'react';

export const ONBOARDED_KEY = 'ctrl.onboarded.v1';
const ONBOARDED_SYNC_EVENT = 'riseup:onboarding-sync';

function readOnboarded(): boolean {
  if (typeof window === 'undefined') return true; // SSR: never flash the popup
  try {
    return window.localStorage.getItem(ONBOARDED_KEY) !== '0';
  } catch {
    // Privacy mode / blocked storage — treat as "already onboarded" so we
    // never nag on every visit when we can't persist the dismissal.
    return true;
  }
}

function dispatchOnboardingSync() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ONBOARDED_SYNC_EVENT));
}

export interface OnboardingFlag {
  /** True once the user has seen (and dismissed) the intro. */
  onboarded: boolean;
  /** Persist that onboarding is complete. Called by every dismiss path. */
  markOnboarded: () => void;
  /** Clear the flag so the intro shows again ("Show intro again"). */
  resetOnboarding: () => void;
}

export function useOnboardingFlag(): OnboardingFlag {
  const [onboarded, setOnboarded] = useState<boolean>(readOnboarded);

  // Keep multiple tabs / the menu re-trigger in sync.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === ONBOARDED_KEY) setOnboarded(readOnboarded());
    };
    const onSameTabSync = () => setOnboarded(readOnboarded());
    window.addEventListener('storage', onStorage);
    window.addEventListener(ONBOARDED_SYNC_EVENT, onSameTabSync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(ONBOARDED_SYNC_EVENT, onSameTabSync);
    };
  }, []);

  const markOnboarded = useCallback(() => {
    setOnboarded(true);
    try {
      window.localStorage.setItem(ONBOARDED_KEY, '1');
    } catch {
      /* ignore blocked storage */
    }
    dispatchOnboardingSync();
  }, []);

  const resetOnboarding = useCallback(() => {
    setOnboarded(false);
    try {
      window.localStorage.setItem(ONBOARDED_KEY, '0');
    } catch {
      /* ignore blocked storage */
    }
    dispatchOnboardingSync();
  }, []);

  return { onboarded, markOnboarded, resetOnboarding };
}
