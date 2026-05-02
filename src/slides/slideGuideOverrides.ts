/**
 * slideGuideOverrides — per-slide override of which alignment guides
 * are visible. Lets the author dial in the overlay PER slide without
 * touching the global `showAlignmentGuide` toggle.
 *
 * Storage: in-memory only (sessionStorage-compatible Map). These are
 * authoring-time choices that don't need to persist across browser
 * sessions and definitely should never ship inside deck JSON.
 *
 * Slide key convention: the route pathname (`/3`, `/12`, etc.). For
 * non-slide routes (`/builder`, `/settings`) we use '*' as a fallback
 * so the dropdown still works inside the SlidePreview tiles there.
 *
 * Resolution order at render time:
 *   per-slide override → 'all' (default)
 *
 * The global `showAlignmentGuide` toggle still gates everything: when
 * OFF, no overlay renders regardless of per-slide setting.
 *
 * See spec/slides/41-per-slide-guide-set.md.
 */
import { useSyncExternalStore } from 'react';

export type GuideSet = 'all' | 'logo' | 'body' | 'rail' | 'none';

export const GUIDE_SET_OPTIONS: ReadonlyArray<{ value: GuideSet; label: string }> = [
  { value: 'all',  label: 'All three' },
  { value: 'logo', label: 'Logo only' },
  { value: 'body', label: 'Body only' },
  { value: 'rail', label: 'Rail only' },
  { value: 'none', label: 'Off (this slide)' },
];

const overrides = new Map<string, GuideSet>();
const listeners = new Set<() => void>();

export function getSlideGuideSet(slideKey: string): GuideSet {
  return overrides.get(slideKey) ?? overrides.get('*') ?? 'all';
}

export function setSlideGuideSet(slideKey: string, set: GuideSet) {
  if (set === 'all') {
    // 'all' is the default — drop the entry to keep the map clean.
    overrides.delete(slideKey);
  } else {
    overrides.set(slideKey, set);
  }
  listeners.forEach(fn => fn());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function useSlideGuideSet(slideKey: string): GuideSet {
  return useSyncExternalStore(
    subscribe,
    () => getSlideGuideSet(slideKey),
    () => 'all' as GuideSet,
  );
}

/** Helper used by both overlays (live + preview) to decide whether
 *  a given guide should render. */
export function showsGuide(set: GuideSet, which: 'logo' | 'body' | 'rail'): boolean {
  if (set === 'none') return false;
  if (set === 'all') return true;
  return set === which;
}
