/**
 * useAutoHideCursor — hide the OS mouse cursor over a presenter surface after
 * a short period of pointer inactivity, and bring it back when the presenter
 * interacts with the camera surface again (then hide it again once movement
 * stops).
 *
 * Why: while presenting (and especially right after dragging / moving the
 * webcam), a stationary arrow/grab cursor sitting on top of the camera is
 * distracting. We want the cursor to disappear when idle, reappear on the
 * first camera-surface movement, stay visible for a few seconds, then fade
 * out again.
 *
 * Behaviour:
 *  - `active === false` → cursor always visible (hook is inert).
 *  - The consumer calls `registerActivity()` from camera-surface
 *    `pointermove` / `pointerdown` / `wheel`; that shows the cursor and
 *    (re)arms the idle timer (`delay`, default 2500ms).
 *  - When the timer fires with no further movement, the cursor hides.
 *  - `hideNow()` forces an immediate hide — call this right after a drag/move
 *    gesture ends so the cursor vanishes without waiting for the idle delay.
 *    After `hideNow()`, the cursor stays hidden until there is a REAL pointer
 *    move (not just the release event / capture teardown at the same coords).
 *
 * The consumer applies `cursor: none` to the surface root when `hidden` is
 * true. We deliberately do NOT touch `document.body` so only the camera
 * surface is affected, never the rest of the deck chrome.
 *
 * Respects `prefers-reduced-motion`? No animation is involved — the cursor
 * simply toggles — so there is nothing to gate on motion preference.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface AutoHideCursorOptions {
  /** When false the hook is inert and the cursor is always shown. */
  active: boolean;
  /** Idle time (ms) before the cursor hides. Default 2500. */
  delay?: number;
}

export interface AutoHideCursor {
  /** True when the cursor should be hidden (`cursor: none`). */
  hidden: boolean;
  /** Force an immediate hide — e.g. right after a drag/move gesture ends. */
  hideNow: (activity?: CursorActivityInput) => void;
  /** Force the cursor visible and re-arm the idle timer. */
  show: () => void;
  /** Pointer activity handler to attach to the camera surface itself. */
  registerActivity: (activity?: CursorActivityInput) => void;
}

export interface CursorActivityInput {
  clientX?: number;
  clientY?: number;
  kind?: 'move' | 'down' | 'wheel';
  type?: string;
  nativeEvent?: {
    clientX?: number;
    clientY?: number;
    type?: string;
  };
}

function normalizeActivity(input?: CursorActivityInput) {
  const source = input?.nativeEvent ?? input;
  const type = source?.type?.toLowerCase();
  const kind = input?.kind
    ?? (type?.includes('move') ? 'move'
      : type?.includes('down') ? 'down'
      : type?.includes('wheel') ? 'wheel'
      : 'move');
  const hasPoint = typeof source?.clientX === 'number' && typeof source?.clientY === 'number';

  return {
    kind,
    point: hasPoint ? { x: source.clientX as number, y: source.clientY as number } : null,
  };
}

/** Pointer travel (px) required to wake the cursor after `hideNow`. */
const SUPPRESS_MOVE_THRESHOLD = 6;

export function useAutoHideCursor({ active, delay = 2500 }: AutoHideCursorOptions): AutoHideCursor {
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const suppressUntilMoveRef = useRef(false);
  const suppressAnchorRef = useRef<{ x: number; y: number } | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const arm = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => setHidden(true), delay);
  }, [clearTimer, delay]);

  const show = useCallback(() => {
    suppressUntilMoveRef.current = false;
    suppressAnchorRef.current = null;
    setHidden(false);
    arm();
  }, [arm]);

  const registerActivity = useCallback((activity?: CursorActivityInput) => {
    const { kind, point } = normalizeActivity(activity);

    if (suppressUntilMoveRef.current) {
      // Stay hidden until the presenter makes a DELIBERATE move. The
      // pointerup that ends a drag/resize (and the natural hand jitter that
      // follows) fires a burst of `pointermove`s at ~the same spot — those
      // must NOT re-show the cursor. We anchor on the suppression point and
      // only wake once the pointer travels past a small threshold.
      const anchor = suppressAnchorRef.current;
      const moved =
        kind === 'move' &&
        point &&
        anchor != null &&
        Math.hypot(point.x - anchor.x, point.y - anchor.y) > SUPPRESS_MOVE_THRESHOLD;
      if (!moved) {
        if (point) lastPointRef.current = point;
        return;
      }
      suppressUntilMoveRef.current = false;
      suppressAnchorRef.current = null;
    }

    if (point) lastPointRef.current = point;
    setHidden(false);
    arm();
  }, [arm]);

  const hideNow = useCallback((activity?: CursorActivityInput) => {
    const { point } = normalizeActivity(activity);
    clearTimer();
    if (point) lastPointRef.current = point;
    suppressAnchorRef.current = point ?? lastPointRef.current;
    suppressUntilMoveRef.current = true;
    setHidden(true);
  }, [clearTimer]);

  useEffect(() => {
    if (!active) {
      clearTimer();
      lastPointRef.current = null;
      suppressUntilMoveRef.current = false;
      suppressAnchorRef.current = null;
      setHidden(false);
      return;
    }
    // Arm on mount so an untouched surface hides the cursor on its own.
    arm();
    return () => {
      clearTimer();
    };
  }, [active, arm, clearTimer]);

  return { hidden, hideNow, show, registerActivity };
}
