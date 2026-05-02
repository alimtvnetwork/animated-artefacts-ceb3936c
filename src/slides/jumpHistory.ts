/**
 * Jump history — remembers the last few slide numbers the presenter
 * successfully jumped to via the keyboard quick-jump buffer or the
 * SlideIndicator inline input.
 *
 * Why it exists
 * -------------
 * During Q&A or improv, presenters bounce between the same handful of
 * slides ("the pricing one, then the roadmap, then back to the demo").
 * Re-typing those numbers each time interrupts the talk. This tiny ring
 * buffer + dropdown surfaces the last 6 unique destinations as one-click
 * chips inside the SlideIndicator's edit popover.
 *
 * Persistence
 * -----------
 * Stored in `localStorage` under `riseup.jumpHistory.v1` so it survives
 * accidental refreshes mid-talk. Capped at 6 entries; new pushes dedupe
 * (the most-recent target moves to the front instead of duplicating).
 *
 * API
 * ---
 * - `getJumpHistory()` — synchronous read.
 * - `pushJumpHistory(n)` — record a successful jump; broadcasts to subscribers.
 * - `clearJumpHistory()` — wipes the list (also broadcasts).
 * - `subscribeJumpHistory(fn)` — React-friendly subscription, returns
 *   unsubscribe. Use via `useJumpHistory()` below.
 */
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'riseup.jumpHistory.v1';
const MAX_ENTRIES = 6;

type Listener = (history: number[]) => void;
const listeners = new Set<Listener>();

function readStorage(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Coerce + dedupe + cap defensively in case the stored payload was
    // tampered with or written by an older build.
    const seen = new Set<number>();
    const out: number[] = [];
    for (const v of parsed) {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 1) continue;
      const i = Math.floor(n);
      if (seen.has(i)) continue;
      seen.add(i);
      out.push(i);
      if (out.length >= MAX_ENTRIES) break;
    }
    return out;
  } catch {
    return [];
  }
}

function writeStorage(next: number[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode — ignore, history just won't persist */
  }
}

let cache: number[] = readStorage();

function broadcast() {
  for (const l of listeners) l(cache);
}

export function getJumpHistory(): number[] {
  return cache;
}

export function pushJumpHistory(n: number): void {
  if (!Number.isFinite(n) || n < 1) return;
  const i = Math.floor(n);
  // Move-to-front dedupe: the most recent target is always at index 0,
  // even if it was already in the list.
  const next = [i, ...cache.filter((x) => x !== i)].slice(0, MAX_ENTRIES);
  cache = next;
  writeStorage(next);
  broadcast();
}

export function clearJumpHistory(): void {
  cache = [];
  writeStorage([]);
  broadcast();
}

export function subscribeJumpHistory(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** React hook — re-renders consumers whenever history changes. */
export function useJumpHistory(): number[] {
  const [hist, setHist] = useState<number[]>(cache);
  useEffect(() => subscribeJumpHistory(setHist), []);
  return hist;
}
