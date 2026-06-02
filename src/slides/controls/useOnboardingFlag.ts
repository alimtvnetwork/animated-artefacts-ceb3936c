/**
 * useOnboardingFlag — single gate deciding whether the first-run controller
 * coachmark (`OnboardingCoachmark`) is shown. Persists in localStorage under
 * `ctrl.onboarded.v1`. Centralizing read/write keeps every dismiss path
 * (button / Esc / backdrop) consistent and the "Show intro again" menu item
 * trivial. See `spec/controller-2026/11-build-substeps-c07.md` (C07.1).
 */
import { useCallback, useEffect, useState } from 'react';

export const ONBOARDED_KEY = 'ctrl.onboarded.v1';

function readOnboarded(): boolean {
  if (typeof window === 'undefined') return true; // SSR: never flash the popup
  try {
    return window.localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    // Privacy mode / blocked storage — treat as "already onboarded" so we
    // never nag on every visit when we can't persist the dismissal.
    return true;
  }
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
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const markOnboarded = useCallback(() => {
    setOnboarded(true);
    try {
      window.localStorage.setItem(ONBOARDED_KEY, '1');
    } catch {
      /* ignore blocked storage */
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    setOnboarded(false);
    try {
      window.localStorage.removeItem(ONBOARDED_KEY);
    } catch {
      /* ignore blocked storage */
    }
  }, []);

  return { onboarded, markOnboarded, resetOnboarding };
}
