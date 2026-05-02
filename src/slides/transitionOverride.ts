/**
 * Live slide-transition overrides — runtime store consumed by the in-deck
 * **TransitionInspector** overlay (`src/slides/controls/TransitionInspector.tsx`).
 *
 * Purpose
 * Lets a deck author tune the slide-to-slide transition's `duration` and
 * `easing` *live*, against the running deck, without ever mutating the slide
 * JSON. `resolveSlideTransitionConfig` consults this store first; when a
 * field is non-null it wins over every other layer (per-slide, deck-by-type,
 * deck, built-in).
 *
 * Mirrors the pub-sub shape used by `scrubOverride.ts` so the resolver (a
 * pure function called inside Framer's render pipeline) can read the latest
 * value without React plumbing, while the inspector UI re-renders via the
 * `subscribe()` channel.
 *
 * Persistence (v0.183)
 * Off by default — closing the inspector clears overrides, matching the
 * "tuning tool, not config" contract used by `scrubOverride`. Opt-in via
 * the inspector's "Persist" toggle: when enabled, the duration/easing pair
 * AND the toggle itself are written to localStorage and rehydrated on next
 * load. `resetTransitionOverrideState()` always wipes both memory and
 * storage so Reset always returns to authored timing.
 */

/** Keys mirror the named easings supported by `transitions.ts`. */
export const TRANSITION_EASING_NAMES = [
  'linear',
  'easeIn',
  'easeOut',
  'easeInOut',
  'expoOut',
  'expoInOut',
  'circOut',
  'backOut',
] as const;

export type TransitionEasingName = (typeof TRANSITION_EASING_NAMES)[number];

/**
 * Slide-transition *type* names recognised by the runtime override (v0.187).
 * Mirrors the SlideTransition enum in `enums.ts` — kept as a string-literal
 * tuple here to avoid a hard dependency cycle (this module is consulted by
 * the resolver in `transitions.ts`, which is itself imported by SlideStage).
 */
export const TRANSITION_TYPE_NAMES = [
  'FadeIn',
  'SlideIn',
  'PushIn',
  'PushLeft',
  'PushRight',
] as const;

export type TransitionTypeName = (typeof TRANSITION_TYPE_NAMES)[number];

interface TransitionOverrideState {
  /** When non-null (ms), overrides the resolved ENTER transition duration. */
  durationMs: number | null;
  /** When non-null, overrides the resolved ENTER easing. */
  easing: TransitionEasingName | null;
  /**
   * EXIT (outgoing) transition duration override (v0.186). Null = the exit
   * inherits the enter override (or authored timing if enter is also null).
   */
  exitDurationMs: number | null;
  /** EXIT easing override (v0.186). Null = inherit from enter. */
  exitEasing: TransitionEasingName | null;
  /** When true, every change is mirrored to localStorage and restored on load. */
  persist: boolean;
  /**
   * Scope of the override (v0.185).
   * - `'deck'`: applies to every slide (default).
   * - `'slide'`: applies only when the active slide number matches `scopeSlideNumber`.
   */
  scope: 'deck' | 'slide';
  /** Target slide number when `scope === 'slide'`. Null = no slide pinned. */
  scopeSlideNumber: number | null;
  /**
   * Per-slide transition *type* override (v0.187). When non-null, replaces
   * the authored `slide.transition` while in scope (deck-wide or pinned to
   * `scopeSlideNumber`). Lets authors swap Fade ↔ Slide ↔ Push live without
   * editing JSON. Null = honour the authored transition.
   */
  transitionType: TransitionTypeName | null;
}

const STORAGE_KEY = 'riseup.transitionOverride';

const DEFAULTS: TransitionOverrideState = {
  durationMs: null,
  easing: null,
  exitDurationMs: null,
  exitEasing: null,
  persist: false,
  scope: 'deck',
  scopeSlideNumber: null,
  transitionType: null,
};

/**
 * Hydrate from localStorage on module load. Defensive: any parse error or
 * shape mismatch silently falls back to defaults so a corrupted entry can
 * never wedge the deck.
 */
function loadInitialState(): TransitionOverrideState {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<TransitionOverrideState>;
    if (!parsed || parsed.persist !== true) return { ...DEFAULTS };
    const dur = typeof parsed.durationMs === 'number' && parsed.durationMs >= 0 && parsed.durationMs <= 4000
      ? parsed.durationMs
      : null;
    const ease = typeof parsed.easing === 'string'
      && (TRANSITION_EASING_NAMES as readonly string[]).includes(parsed.easing)
      ? (parsed.easing as TransitionEasingName)
      : null;
    const exitDur = typeof parsed.exitDurationMs === 'number' && parsed.exitDurationMs >= 0 && parsed.exitDurationMs <= 4000
      ? parsed.exitDurationMs
      : null;
    const exitEase = typeof parsed.exitEasing === 'string'
      && (TRANSITION_EASING_NAMES as readonly string[]).includes(parsed.exitEasing)
      ? (parsed.exitEasing as TransitionEasingName)
      : null;
    const scope: 'deck' | 'slide' = parsed.scope === 'slide' ? 'slide' : 'deck';
    const scopeSlideNumber = typeof parsed.scopeSlideNumber === 'number' && parsed.scopeSlideNumber > 0
      ? parsed.scopeSlideNumber
      : null;
    const transitionType = typeof parsed.transitionType === 'string'
      && (TRANSITION_TYPE_NAMES as readonly string[]).includes(parsed.transitionType)
      ? (parsed.transitionType as TransitionTypeName)
      : null;
    return { durationMs: dur, easing: ease, exitDurationMs: exitDur, exitEasing: exitEase, persist: true, scope, scopeSlideNumber, transitionType };
  } catch {
    return { ...DEFAULTS };
  }
}

let state: TransitionOverrideState = loadInitialState();
const listeners = new Set<() => void>();

function writeStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    if (state.persist) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* quota / privacy mode — ignore, in-memory state still works */ }
}

/**
 * Returns true when the override is in scope for the given slide number.
 * Deck-scope always matches; slide-scope only matches when the pinned slide
 * number equals `slideNumber`. When `slideNumber` is omitted, slide-scope is
 * treated as out-of-scope so authored timing wins.
 */
function inScope(slideNumber?: number): boolean {
  if (state.scope === 'deck') return true;
  if (state.scopeSlideNumber == null) return false;
  return slideNumber === state.scopeSlideNumber;
}

export function transitionDurationOverride(slideNumber?: number): number | null {
  return inScope(slideNumber) ? state.durationMs : null;
}

export function transitionEasingOverride(slideNumber?: number): TransitionEasingName | null {
  return inScope(slideNumber) ? state.easing : null;
}

/**
 * Exit (outgoing) duration override. Falls back to the enter override when
 * the user has only tuned the enter side — keeps single-sided tuning simple
 * while letting authors split exit independently when they need it. v0.186.
 */
export function transitionExitDurationOverride(slideNumber?: number): number | null {
  if (!inScope(slideNumber)) return null;
  return state.exitDurationMs ?? state.durationMs;
}

/** Exit easing override. Falls back to the enter easing override. v0.186. */
export function transitionExitEasingOverride(slideNumber?: number): TransitionEasingName | null {
  if (!inScope(slideNumber)) return null;
  return state.exitEasing ?? state.easing;
}

/**
 * Live transition-*type* override (v0.187). Returns the user-picked variant
 * (FadeIn/SlideIn/PushIn/PushLeft/PushRight) when the override is in scope
 * for the given slide number, else `null` so authored `slide.transition`
 * wins. Consumed by `SlideStage` immediately before `getSlideVariants`.
 */
export function transitionTypeOverride(slideNumber?: number): TransitionTypeName | null {
  return inScope(slideNumber) ? state.transitionType : null;
}
export function getTransitionOverrideState(): TransitionOverrideState {
  return { ...state };
}

export function setTransitionOverrideState(patch: Partial<TransitionOverrideState>): void {
  state = { ...state, ...patch };
  writeStorage();
  for (const fn of listeners) {
    try { fn(); } catch { /* swallow */ }
  }
}

/** Wipe overrides AND any persisted entry. Reset always returns to authored timing. */
export function resetTransitionOverrideState(): void {
  state = { ...DEFAULTS };
  if (typeof window !== 'undefined') {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
  for (const fn of listeners) {
    try { fn(); } catch { /* swallow */ }
  }
}

export function subscribeTransitionOverride(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
