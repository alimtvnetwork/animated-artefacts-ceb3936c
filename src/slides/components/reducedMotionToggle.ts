/**
 * `reducedMotionToggle` — UI-level reduced-motion switch (WCAG 2.3.3 / 2.2.2).
 *
 * Why
 * ---
 * The deck already honors the OS-level `prefers-reduced-motion: reduce`
 * media query (see `motionPreferences.ts` + the @media blocks in
 * `src/index.css`). But many presenters run on locked-down corporate
 * laptops, kiosks, or A/V-room machines where they CAN'T flip the OS
 * accessibility pane mid-talk. WCAG 2.3.3 explicitly calls for an
 * "interaction trigger" that can be disabled, and 2.2.2 wants the user
 * to be able to pause/stop motion without admin rights.
 *
 * This module is the in-app override: a tiny pub/sub flag that, when
 * enabled, sets `<html data-reduce-motion="true">`. Two consumers read
 * it:
 *
 *   1. `prefersReducedMotion()` in `motionPreferences.ts` already checks
 *      that attribute, so all Framer-driven animations flatten through
 *      the same `flattenVariants` / `flattenTransition` path used by
 *      export mode and pixel-snap mode.
 *
 *   2. `src/index.css` mirrors every `@media (prefers-reduced-motion: reduce)`
 *      block with a `:root[data-reduce-motion="true"]` companion, so
 *      pure-CSS effects (ambient floats, equation term cascade, checklist
 *      chevron transitions, count-up timing tokens) collapse identically
 *      whether the trigger is OS-level or in-app.
 *
 * The flag is persisted in localStorage (survives reload) and mirrored
 * onto the URL (`?reduceMotion=1`) so a deep-link copy carries the
 * preference. Off by default — we never override the user's OS setting,
 * we only ADD a way to opt in when they can't reach it.
 */

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'riseup.reduceMotion';
const HTML_ATTR = 'data-reduce-motion';
const URL_PARAM = 'reduceMotion';

function readInitial(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(URL_PARAM);
    if (fromUrl === '1' || fromUrl === 'true') return true;
    if (fromUrl === '0' || fromUrl === 'false') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function applyAttribute(next: boolean): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  if (!html) return;
  if (next) html.setAttribute(HTML_ATTR, 'true');
  else html.removeAttribute(HTML_ATTR);
}

let _enabled = readInitial();
const _listeners = new Set<(v: boolean) => void>();

// Apply the attribute on module init so the first paint already honors
// a persisted preference (no flash of motion).
if (typeof document !== 'undefined') {
  applyAttribute(_enabled);
}

export function isReduceMotionEnabled(): boolean {
  return _enabled;
}

export function setReduceMotion(next: boolean): void {
  if (next === _enabled) return;
  _enabled = next;
  applyAttribute(next);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      const url = new URL(window.location.href);
      if (next) url.searchParams.set(URL_PARAM, '1');
      else url.searchParams.delete(URL_PARAM);
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    /* ignore — best-effort persistence */
  }
  _listeners.forEach((fn) => fn(next));
}

export function toggleReduceMotion(): void {
  setReduceMotion(!_enabled);
}

/** React subscription so chrome buttons re-render when the flag flips. */
export function useReduceMotion(): boolean {
  const [v, setV] = useState<boolean>(_enabled);
  useEffect(() => {
    _listeners.add(setV);
    setV(_enabled);
    return () => {
      _listeners.delete(setV);
    };
  }, []);
  return v;
}

// Test-only: reset module state between specs without reloading the page.
export function _resetReduceMotionForTests(): void {
  _enabled = false;
  applyAttribute(false);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}
