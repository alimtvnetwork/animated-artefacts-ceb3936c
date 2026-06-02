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
  hideNow: () => void;
  /** Force the cursor visible and re-arm the idle timer. */
  show: () => void;
  /** Pointer activity handler to attach to the camera surface itself. */
  registerActivity: () => void;
}

export function useAutoHideCursor({ active, delay = 2500 }: AutoHideCursorOptions): AutoHideCursor {
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setHidden(false);
    arm();
  }, [arm]);

  const registerActivity = useCallback(() => {
    setHidden(false);
    arm();
  }, [arm]);

  const hideNow = useCallback(() => {
    clearTimer();
    setHidden(true);
  }, [clearTimer]);

  useEffect(() => {
    if (!active) {
      clearTimer();
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
