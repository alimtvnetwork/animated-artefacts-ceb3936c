/**
 * guidePositions — a tiny pub/sub for the live x-positions of the three
 * alignment guides (logo edge / body grid edge / timeline rail), as
 * measured INSIDE the unscaled 1920px stage of `SlidePreview`.
 *
 * Producer: `SlidePreviewAlignmentOverlay` calls `setGuidePositions(...)`
 * on every measurement (mount, resize, MutationObserver tick).
 *
 * Consumer: the Step editor's "Snap to…" buttons (`ContentFieldEditor.tsx`)
 * read the latest values via `useGuidePositions()` so a click on
 * "Snap to body" fills the per-step `leftOffsetPx` with the body-grid x
 * minus the row's intrinsic origin (always 0 in stage coordinates).
 *
 * This deliberately bypasses the existing `presetSettings` store because
 * (a) guide positions change every resize and we don't want that thrashing
 * localStorage, and (b) consumers only need a snapshot at click-time.
 *
 * See spec/slides/40-step-snap-to-guides.md.
 */
import { useSyncExternalStore } from 'react';

export interface GuidePositions {
  /** Logo edge x in stage px (0-based, unscaled 1920 coord space). */
  logoX: number | null;
  /** Body grid edge x in stage px. */
  bodyX: number | null;
  /** Timeline rail x in stage px. Only populated on StepTimelineSlide
   *  previews; null elsewhere. */
  railX: number | null;
}

let current: GuidePositions = { logoX: null, bodyX: null, railX: null };
let lastUpdatedAt: number | null = null;
const listeners = new Set<() => void>();

export function setGuidePositions(next: GuidePositions) {
  // Skip the notify if nothing actually changed — prevents render storms
  // during resize where the MutationObserver fires N times per frame.
  if (
    next.logoX === current.logoX &&
    next.bodyX === current.bodyX &&
    next.railX === current.railX
  ) {
    return;
  }
  current = next;
  lastUpdatedAt = Date.now();
  listeners.forEach(fn => fn());
}

export function getGuidePositions(): GuidePositions {
  return current;
}

/** Epoch-ms timestamp of the most recent change to guide positions, or
 *  null if no measurement has landed since boot. Used by the editor HUD
 *  to show a "last updated" relative time. */
export function getGuidePositionsUpdatedAt(): number | null {
  return lastUpdatedAt;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

const SERVER_SNAPSHOT: GuidePositions = { logoX: null, bodyX: null, railX: null };

export function useGuidePositions(): GuidePositions {
  return useSyncExternalStore(subscribe, getGuidePositions, () => SERVER_SNAPSHOT);
}

/** Hook: live timestamp of the most recent guide-positions change.
 *  Re-renders whenever positions change (same listener set as above). */
export function useGuidePositionsUpdatedAt(): number | null {
  return useSyncExternalStore(subscribe, getGuidePositionsUpdatedAt, () => null);
}
