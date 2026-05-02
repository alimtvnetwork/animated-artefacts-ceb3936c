/**
 * Live animation scrub overrides — runtime store consumed by the in-deck
 * **AnimationScrubber** overlay (`src/slides/controls/AnimationScrubber.tsx`).
 *
 * # Purpose
 * The scrubber lets a deck author tune step enter/exit timing presets and
 * playback speed *live*, against the running deck, without ever mutating the
 * slide JSON. This module is the bridge: the scrubber writes here, and:
 *
 *   - `src/slides/stepTiming.ts` reads `stepTimingPresetOverride()` so every
 *     step's resolved `{ duration, ease }` reflects the override at render
 *     time. Setting `null` clears the override.
 *
 *   - `src/slides/SlideStage.tsx` reads `playbackSpeed()` and wraps its
 *     children in `<MotionConfig transition={{ duration: 1 / speed }}>` so
 *     every Framer animation slows/speeds together. Speed 1 is a no-op.
 *
 * # Why a tiny pub-sub (instead of React context)
 * Step-timing resolution happens inside Framer's render pipeline at variant
 * resolve time, not inside a React component. A context would only reach
 * components that subscribe via `useContext` — `resolveStepEnter` is a pure
 * function called by `StepTimelineSlide` while building variants. A module-
 * scoped store lets that pure function read the latest value without any
 * React plumbing, and the subscribe() API still lets components re-render
 * when the override flips so the visual feedback is instant.
 *
 * # Persistence
 * Intentionally NOT persisted. Reload = back to the deck's authored timing.
 * The scrubber is a tuning tool, never a config surface — anything an author
 * wants to keep ships in `content.stepTiming` (slide JSON) or
 * `STEP_TIMING_PRESETS` (single source of truth in `stepTiming.ts`).
 */
import type { StepTimingPresetName } from './types';

interface ScrubState {
  /** When non-null, every step in every slide resolves through this preset
   *  regardless of `content.stepTiming`. Authors can flip presets and watch
   *  the same slide replay at instant / snappy / smooth / cinematic / dramatic. */
  presetOverride: StepTimingPresetName | null;
  /** Multiplier on every Framer animation's duration. 1 = authored speed.
   *  0.25 → 4× slower (great for inspecting individual phases).
   *  2 → 2× faster (sanity check it still reads at speed). */
  playbackSpeed: number;
}

const DEFAULTS: ScrubState = {
  presetOverride: null,
  playbackSpeed: 1,
};

let state: ScrubState = { ...DEFAULTS };
const listeners = new Set<() => void>();

/** Read the active preset override (null = use authored timing). */
export function stepTimingPresetOverride(): StepTimingPresetName | null {
  return state.presetOverride;
}

/** Read the active playback speed multiplier. 1 when no scrub is active. */
export function playbackSpeed(): number {
  return state.playbackSpeed;
}

/** Read the full state — used by the scrubber UI for hydration. */
export function getScrubState(): ScrubState {
  return { ...state };
}

/** Patch one or more fields and notify subscribers. */
export function setScrubState(patch: Partial<ScrubState>): void {
  state = { ...state, ...patch };
  for (const fn of listeners) {
    try { fn(); } catch { /* ignore listener errors so one bad sub can't break others */ }
  }
}

/** Reset to defaults. Closing the scrubber calls this so the next open
 *  surface starts from a clean slate (and the deck plays at authored speed). */
export function resetScrubState(): void {
  setScrubState(DEFAULTS);
}

/** Subscribe to changes. Returns an unsubscribe function. */
export function subscribeScrubState(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
