import { useEffect, useState } from 'react';

/**
 * Deck-level "Click-reveal mode" flag.
 *
 * When on, slides with click-reveal capsules SHOULD render them as a
 * stepwise sequence (one-at-a-time, advance on Next/Click) rather
 * than rendering all reveal targets at once. Today this flag is
 * **persisted but not yet consumed** by individual slide types — see
 * `.lovable/question-and-ambiguity/32-reveal-hints-plus-step-timeline-mode.md`
 * for the follow-up scope.
 *
 * Paired with `revealHints` via the controller hamburger's "Click-reveal
 * mode" item so the gold pulse + stepwise behavior toggle together.
 */

const KEY = 'riseup.clickRevealStepwise';
type Listener = (v: boolean) => void;
const listeners = new Set<Listener>();

function read(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setClickRevealStepwise(next: boolean): void {
  try {
    window.localStorage.setItem(KEY, next ? '1' : '0');
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(next));
}

export function toggleClickRevealStepwise(): boolean {
  const next = !read();
  setClickRevealStepwise(next);
  return next;
}

export function useClickRevealStepwise(): boolean {
  const [v, setV] = useState<boolean>(read);
  useEffect(() => {
    const fn: Listener = (next) => setV(next);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return v;
}
