/**
 * Named transition presets — stored in localStorage and surfaced by the
 * `TransitionInspector` dropdown so authors can save tuned settings (e.g.
 * "Slick Fade", "Expo Pop") and reload them across sessions.
 *
 * Built-in presets ship with the app and can NOT be deleted (the UI hides
 * the delete button for them); user presets live alongside in the same
 * store and can be removed individually. v0.184.
 */
import type { TransitionEasingName } from './transitionOverride';

export interface TransitionPreset {
  /** Unique, also used as the display label. Case-sensitive. */
  name: string;
  durationMs: number;
  easing: TransitionEasingName;
  /** Built-ins are read-only in the UI. */
  builtin?: boolean;
}

const STORAGE_KEY = 'riseup.transitionPresets.v1';

/** Curated starter presets. Authors can override by saving a custom preset
 *  with a different name; built-ins themselves are not editable. */
export const BUILTIN_PRESETS: TransitionPreset[] = [
  { name: 'Slick Fade', durationMs: 320, easing: 'easeOut',  builtin: true },
  { name: 'Expo Pop',   durationMs: 700, easing: 'expoOut',  builtin: true },
  { name: 'Snap',       durationMs: 180, easing: 'easeOut',  builtin: true },
  { name: 'Cinematic',  durationMs: 1100, easing: 'expoInOut', builtin: true },
  { name: 'Back Bounce',durationMs: 620, easing: 'backOut',  builtin: true },
];

const listeners = new Set<() => void>();

function loadUserPresets(): TransitionPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter((p): p is TransitionPreset => {
      if (!p || typeof p !== 'object') return false;
      const r = p as Record<string, unknown>;
      return typeof r.name === 'string' && (r.name as string).length > 0
        && typeof r.durationMs === 'number' && r.durationMs >= 0 && r.durationMs <= 4000
        && typeof r.easing === 'string';
    }).map((p) => ({ name: p.name, durationMs: p.durationMs, easing: p.easing }));
  } catch {
    return [];
  }
}

let userPresets: TransitionPreset[] = loadUserPresets();

function writeStorage(): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets)); }
  catch { /* quota / privacy mode — in-memory list still works */ }
}

function notify(): void {
  for (const fn of listeners) {
    try { fn(); } catch { /* swallow */ }
  }
}

/** All presets visible in the UI: built-ins first, then user presets. */
export function listTransitionPresets(): TransitionPreset[] {
  return [...BUILTIN_PRESETS, ...userPresets];
}

export function getTransitionPreset(name: string): TransitionPreset | undefined {
  return listTransitionPresets().find((p) => p.name === name);
}

/**
 * Save (or overwrite) a user preset. Names matching a built-in are rejected
 * to keep the curated presets reliable — caller should surface that as an
 * error to the user. Returns `true` on success, `false` on rejected name.
 */
export function saveTransitionPreset(name: string, durationMs: number, easing: TransitionEasingName): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (BUILTIN_PRESETS.some((p) => p.name === trimmed)) return false;
  const idx = userPresets.findIndex((p) => p.name === trimmed);
  const next: TransitionPreset = { name: trimmed, durationMs, easing };
  if (idx >= 0) userPresets[idx] = next;
  else userPresets = [...userPresets, next];
  writeStorage();
  notify();
  return true;
}

export function deleteTransitionPreset(name: string): void {
  const before = userPresets.length;
  userPresets = userPresets.filter((p) => p.name !== name);
  if (userPresets.length !== before) {
    writeStorage();
    notify();
  }
}

export function subscribeTransitionPresets(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
