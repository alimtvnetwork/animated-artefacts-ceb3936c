/**
 * Step-motion override — runtime store consulted by the shared
 * `stepMotionVariant()` resolver in `utils/stepMotionVariant.ts`. When the
 * override is non-null, every step-driven slide (StepTimelineSlide,
 * StepsChain3DSlide, FocusTimelineSlide etc.) uses the chosen variant for
 * every step instead of cycling through the default `lift → slide →
 * parallax` rotation.
 *
 * Lets the presenter compose a "timeline mode" from the controller
 * hamburger: pair `Transition style = Slide in` (slide-to-slide) with
 * `Step motion = Slide in` (every step within a slide) and the deck
 * reads as a single sliding timeline while step labels keep their
 * existing fade animation from `.step-title`.
 */

import { useEffect, useState } from 'react';
import type { StepMotionVariant } from './utils/stepMotionVariant';

interface StepMotionOverrideState {
  /** Null = use default rotation. Else lock every step to this variant. */
  variant: StepMotionVariant | null;
  /** When true, the override is mirrored to localStorage. */
  persist: boolean;
}

const STORAGE_KEY = 'riseup.stepMotionOverride';
const VALID_VARIANTS: readonly StepMotionVariant[] = ['lift', 'slide', 'parallax'];

const DEFAULTS: StepMotionOverrideState = {
  variant: null,
  persist: false,
};

function loadInitialState(): StepMotionOverrideState {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<StepMotionOverrideState>;
    if (!parsed || parsed.persist !== true) return { ...DEFAULTS };
    const variant =
      typeof parsed.variant === 'string'
      && (VALID_VARIANTS as readonly string[]).includes(parsed.variant)
        ? (parsed.variant as StepMotionVariant)
        : null;
    return { variant, persist: true };
  } catch {
    return { ...DEFAULTS };
  }
}

let state: StepMotionOverrideState = loadInitialState();
const listeners = new Set<() => void>();

function writeStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    if (state.persist) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* quota / privacy mode — in-memory state still works */ }
}

/** Sync getter — used by `stepMotionVariant()` on every step render. */
export function stepMotionOverride(): StepMotionVariant | null {
  return state.variant;
}

export function getStepMotionOverrideState(): StepMotionOverrideState {
  return { ...state };
}

export function setStepMotionOverrideState(patch: Partial<StepMotionOverrideState>): void {
  state = { ...state, ...patch };
  writeStorage();
  for (const fn of listeners) {
    try { fn(); } catch { /* swallow */ }
  }
}

export function resetStepMotionOverride(): void {
  state = { ...DEFAULTS };
  if (typeof window !== 'undefined') {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
  for (const fn of listeners) {
    try { fn(); } catch { /* swallow */ }
  }
}

export function subscribeStepMotionOverride(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/**
 * React hook — returns the current override variant and re-renders the
 * caller when the user changes it from the controller hamburger picker.
 * Step-driven slide types (StepTimelineSlide, StepsChain3DSlide,
 * FocusTimelineSlide) call this so updating "Step motion" mid-talk
 * propagates to the live `data-motion-variant` attributes immediately
 * without requiring a slide change.
 */
export function useStepMotionOverride(): StepMotionVariant | null {
  const [variant, setVariant] = useState<StepMotionVariant | null>(() => state.variant);
  useEffect(
    () => subscribeStepMotionOverride(() => setVariant(getStepMotionOverrideState().variant)),
    [],
  );
  return variant;
}
