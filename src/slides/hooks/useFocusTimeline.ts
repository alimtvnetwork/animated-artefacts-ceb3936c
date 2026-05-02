import { useCallback, useEffect, useState } from 'react';

/**
 * State machine for "focus-of-one" timelines (see
 * `spec/slides/11-focus-timeline.md` and `mem://features/focus-timeline-effect`).
 *
 * Owns the index of the currently focused step and exposes navigation helpers.
 * Reusable across any future "carousel of one" pattern (testimonials,
 * before/after galleries, milestone walks).
 *
 * Boundary semantics: `next()` does NOT loop — it stops at the last step and
 * returns `false`. The caller (typically a slide component) interprets the
 * `false` return as "fall through to the deck-level Next/Prev". This is what
 * lets `FocusTimelineSlide` consume Next/Prev presses internally until it
 * runs out of steps, then hand off to the deck.
 */
export function useFocusTimeline(stepCount: number, initial = 0) {
  const safeInitial = clamp(initial, 0, Math.max(0, stepCount - 1));
  const [focusIndex, setFocusIndex] = useState<number>(safeInitial);

  // If the deck swaps to a different timeline slide while this hook is
  // mounted (rare, but possible during hot reload), rein in the index so we
  // never render an out-of-range step.
  useEffect(() => {
    if (focusIndex > stepCount - 1) setFocusIndex(Math.max(0, stepCount - 1));
  }, [stepCount, focusIndex]);

  const focusOn = useCallback(
    (idx: number) => {
      const next = clamp(idx, 0, Math.max(0, stepCount - 1));
      setFocusIndex(next);
    },
    [stepCount],
  );

  /** Advance focus by one. Returns `true` when consumed, `false` at the boundary. */
  const next = useCallback((): boolean => {
    if (focusIndex >= stepCount - 1) return false;
    setFocusIndex((i) => Math.min(stepCount - 1, i + 1));
    return true;
  }, [focusIndex, stepCount]);

  /** Move focus back by one. Returns `true` when consumed, `false` at the boundary. */
  const prev = useCallback((): boolean => {
    if (focusIndex <= 0) return false;
    setFocusIndex((i) => Math.max(0, i - 1));
    return true;
  }, [focusIndex]);

  return {
    focusIndex,
    focusOn,
    next,
    prev,
    isAtStart: focusIndex === 0,
    isAtEnd: focusIndex >= stepCount - 1,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/**
 * Imperative handle exposed by `FocusTimelineSlide` (and any future slide
 * that integrates with the deck's Next/Prev short-circuit pattern).
 *
 * `tryAdvance(dir)` returns `true` when the slide consumed the navigation
 * (focus moved internally) and `false` when the deck should navigate to the
 * sibling slide instead.
 */
export interface FocusTimelineHandle {
  tryAdvance: (dir: 'forward' | 'backward') => boolean;
  /**
   * v0.124 — direct-set step API used by the in-deck animation scrubber
   * (`src/slides/controls/AnimationScrubber.tsx`). Optional so existing
   * implementers (`FocusTimelineSlide`) don't need to change to stay
   * compatible. Pass `-1` on a `StepTimelineSlide` to return to the
   * pre-reveal phase so the entrance animations can be re-watched.
   */
  setStep?: (index: number) => void;
  /** Current focus index, or `-1` when in the pre-reveal phase. */
  getStep?: () => number;
  /** Total number of focusable steps. */
  getStepCount?: () => number;
  /**
   * Replay the slide's entrance from the initial state. The scrubber's
   * "Replay" button calls this so authors can rewatch each step's enter
   * animation after tuning the timing preset live.
   */
  replay?: () => void;
}
