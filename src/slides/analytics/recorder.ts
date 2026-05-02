/**
 * `analytics/recorder.ts` — privacy-first slide telemetry (Window-2 task 24).
 *
 * Why
 * ---
 * Presenters want to know AFTER a talk: which slide ran long? Which slide
 * did I skip past? Did anyone actually click the reveal capsule on slide 4?
 * The deck has none of that today. Off-the-shelf analytics SDKs (PostHog,
 * Plausible, GA) would solve it but:
 *
 *   1. The deck is often rehearsed offline / on planes — network calls fail.
 *   2. The audience may be under NDA (Riseup's clients) — phoning home is
 *      unacceptable.
 *   3. Adding a third-party SDK contradicts the "no Lovable branding /
 *      no external pings" constitutional rule (memory: Core).
 *
 * Solution: a tiny in-browser ring buffer. Events live in localStorage,
 * never leave the device, and the presenter reviews them at `/analytics`
 * after the talk. Bring-your-own-export — they can copy the JSON, drop it
 * into a spreadsheet, send it to themselves over email. No background
 * fetch, no service worker, no IndexedDB.
 *
 * Shape
 * -----
 * Events are flat, append-only, capped at MAX_EVENTS so localStorage stays
 * under a couple of MB even after a multi-hour rehearsal session. The
 * recorder is a singleton pub/sub mirror of the proven pattern used by
 * `ColorTokenDebugOverlay` and `reducedMotionToggle`.
 *
 * The recorder is OPT-IN. It starts disabled; the presenter flips it on
 * via the `/analytics` page or `?analytics=1` URL flag. We never silently
 * record the audience's interaction.
 */

import { useEffect, useState } from 'react';

const STORAGE_KEY_EVENTS = 'riseup.analytics.events';
const STORAGE_KEY_ENABLED = 'riseup.analytics.enabled';
const URL_PARAM = 'analytics';

/**
 * Hard cap to keep localStorage from ballooning. ~50KB at 200 bytes/event,
 * which is well under the 5MB browser quota even with other deck state
 * (preset settings, color-debug flags, deck overrides).
 *
 * When the buffer is full we drop the OLDEST event — a presenter is
 * always more interested in the last rehearsal than the first.
 */
const MAX_EVENTS = 2000;

export type AnalyticsEventKind =
  | 'slide-enter'   // user navigated TO this slide
  | 'slide-exit'    // user navigated AWAY (carries dwellMs)
  | 'click-reveal'  // a click-reveal capsule/hotspot opened
  | 'theme-change'  // theme palette changed mid-deck
  | 'session-start' // deck mounted with analytics enabled
  | 'session-end';  // tab/window closed (best-effort)

/**
 * One event row. Discriminated by `kind` so consumers narrow the optional
 * payload safely. All events carry `t` (epoch ms) + `slide` (the active
 * slide number at the moment the event was recorded).
 */
export interface AnalyticsEvent {
  /** Wall-clock timestamp at record time (Date.now()). */
  t: number;
  /** Active slide number when the event fired (0 means "no slide yet"). */
  slide: number;
  /** Discriminator. */
  kind: AnalyticsEventKind;
  /** Optional payload — populated per kind below. */
  data?: {
    /** `slide-exit` only — milliseconds the user spent on the slide. */
    dwellMs?: number;
    /** `click-reveal` only — slug of the reveal target (e.g. "lovable-cloud"). */
    revealSlug?: string;
    /** `click-reveal` only — slide number of the off-flow target. */
    revealTarget?: number;
    /** `theme-change` only — { from, to } theme ids. */
    themeFrom?: string;
    themeTo?: string;
    /** `session-start` only — deck slug at mount time. */
    deckSlug?: string;
    /**
     * Slide-type label for `slide-enter` / `slide-exit` / `click-reveal`.
     * Lets the analytics view answer "which *type* of slide do I dwell
     * on most" without re-resolving the deck (which may have changed
     * since the recording). Optional for back-compat with events written
     * before v0.190.
     */
    slideType?: string;
  };
}

/* ────────────────────────────────────────────────────────────────────────
   Storage helpers — keep all the JSON.parse error-handling in one spot
   so the rest of the module reads as simple field access.
   ──────────────────────────────────────────────────────────────────── */

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore — quota exceeded; we'd rather silently truncate than crash a talk. */
  }
}

/* ────────────────────────────────────────────────────────────────────────
   Enabled flag — pub/sub like every other in-app toggle.
   ──────────────────────────────────────────────────────────────────── */

function readInitialEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(URL_PARAM);
    if (fromUrl === '1' || fromUrl === 'true') return true;
    if (fromUrl === '0' || fromUrl === 'false') return false;
    return window.localStorage.getItem(STORAGE_KEY_ENABLED) === '1';
  } catch {
    return false;
  }
}

let _enabled = readInitialEnabled();
const _enabledListeners = new Set<(v: boolean) => void>();
const _eventListeners = new Set<(events: ReadonlyArray<AnalyticsEvent>) => void>();

export function isAnalyticsEnabled(): boolean {
  return _enabled;
}

export function setAnalyticsEnabled(next: boolean): void {
  if (next === _enabled) return;
  _enabled = next;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY_ENABLED, next ? '1' : '0');
      const url = new URL(window.location.href);
      if (next) url.searchParams.set(URL_PARAM, '1');
      else url.searchParams.delete(URL_PARAM);
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    /* ignore */
  }
  _enabledListeners.forEach((fn) => fn(next));
}

export function useAnalyticsEnabled(): boolean {
  const [v, setV] = useState<boolean>(_enabled);
  useEffect(() => {
    _enabledListeners.add(setV);
    setV(_enabled);
    return () => {
      _enabledListeners.delete(setV);
    };
  }, []);
  return v;
}

/* ────────────────────────────────────────────────────────────────────────
   Event ring buffer.
   ──────────────────────────────────────────────────────────────────── */

function readEvents(): AnalyticsEvent[] {
  return safeRead<AnalyticsEvent[]>(STORAGE_KEY_EVENTS, []);
}

function writeEvents(events: AnalyticsEvent[]): void {
  // Drop oldest if we'd exceed MAX_EVENTS — a ring buffer in array form.
  // Done at write time (not record time) so callers don't pay the cost
  // when the buffer is healthy.
  const trimmed =
    events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events;
  safeWrite(STORAGE_KEY_EVENTS, trimmed);
  _eventListeners.forEach((fn) => fn(trimmed));
}

/**
 * Record a single event. No-op when analytics is disabled — callers can
 * always invoke this without an explicit check, which keeps the
 * instrumentation in `SlideDeckPage` cheap and one-line.
 */
export function recordEvent(
  kind: AnalyticsEventKind,
  slide: number,
  data?: AnalyticsEvent['data'],
): void {
  if (!_enabled) return;
  const event: AnalyticsEvent = {
    t: Date.now(),
    slide,
    kind,
    ...(data ? { data } : {}),
  };
  const events = readEvents();
  events.push(event);
  writeEvents(events);
}

/** Read the full event log (most-recent last). */
export function getEvents(): ReadonlyArray<AnalyticsEvent> {
  return readEvents();
}

/** Clear the event log. The enabled flag is unchanged. */
export function clearEvents(): void {
  writeEvents([]);
}

/** React subscription — re-renders consumers when events are recorded. */
export function useAnalyticsEvents(): ReadonlyArray<AnalyticsEvent> {
  const [v, setV] = useState<ReadonlyArray<AnalyticsEvent>>(() => readEvents());
  useEffect(() => {
    _eventListeners.add(setV);
    setV(readEvents());
    return () => {
      _eventListeners.delete(setV);
    };
  }, []);
  return v;
}

/* ────────────────────────────────────────────────────────────────────────
   Aggregations — pure functions over an event array. Live in this module
   so tests can hit them without React + so the /analytics page is just
   a presentation layer over them.
   ──────────────────────────────────────────────────────────────────── */

export interface SlideDwellSummary {
  /** Slide number. */
  slide: number;
  /** How many times this slide was visited. */
  visits: number;
  /** Total dwell time (ms) across all visits. */
  totalDwellMs: number;
  /** Average dwell time (ms) per visit. NaN if visits === 0. */
  meanDwellMs: number;
  /** Number of click-reveal interactions originating on this slide. */
  reveals: number;
}

/**
 * Roll up `slide-exit` events into per-slide dwell summaries. Visits are
 * counted from `slide-enter` events so a slide that was entered but never
 * exited (the current slide at session-end) still shows visits=1 with
 * totalDwellMs=0.
 */
export function summarizeDwell(
  events: ReadonlyArray<AnalyticsEvent>,
): SlideDwellSummary[] {
  const map = new Map<number, SlideDwellSummary>();
  const ensure = (n: number): SlideDwellSummary => {
    let row = map.get(n);
    if (!row) {
      row = { slide: n, visits: 0, totalDwellMs: 0, meanDwellMs: NaN, reveals: 0 };
      map.set(n, row);
    }
    return row;
  };

  for (const e of events) {
    if (e.kind === 'slide-enter') ensure(e.slide).visits += 1;
    else if (e.kind === 'slide-exit') {
      const row = ensure(e.slide);
      const dwell = e.data?.dwellMs ?? 0;
      row.totalDwellMs += dwell;
    } else if (e.kind === 'click-reveal') {
      ensure(e.slide).reveals += 1;
    }
  }

  for (const row of map.values()) {
    row.meanDwellMs = row.visits > 0 ? row.totalDwellMs / row.visits : NaN;
  }

  return [...map.values()].sort((a, b) => a.slide - b.slide);
}

/* ────────────────────────────────────────────────────────────────────────
   Slide-type usage roll-up — answers "which slide TYPE do presenters
   dwell on most?" Independent of slide identity, so useful across deck
   revisions. Only events that carry `data.slideType` participate; older
   events without the tag are skipped (rather than bucketed as "unknown")
   so the totals reflect intent, not legacy noise.
   ──────────────────────────────────────────────────────────────────── */

export interface SlideTypeUsageSummary {
  /** Slide-type label (e.g. "CapsuleListSlide"). */
  slideType: string;
  /** Total entries into any slide of this type. */
  visits: number;
  /** Sum of dwell time (ms) across all visits of this type. */
  totalDwellMs: number;
  /** Mean dwell time (ms) per visit. NaN when visits === 0. */
  meanDwellMs: number;
  /** Click-reveal interactions that originated on a slide of this type. */
  reveals: number;
}

export function summarizeByType(
  events: ReadonlyArray<AnalyticsEvent>,
): SlideTypeUsageSummary[] {
  const map = new Map<string, SlideTypeUsageSummary>();
  const ensure = (key: string): SlideTypeUsageSummary => {
    let row = map.get(key);
    if (!row) {
      row = { slideType: key, visits: 0, totalDwellMs: 0, meanDwellMs: NaN, reveals: 0 };
      map.set(key, row);
    }
    return row;
  };
  for (const e of events) {
    const t = e.data?.slideType;
    if (!t) continue;
    if (e.kind === 'slide-enter') ensure(t).visits += 1;
    else if (e.kind === 'slide-exit') ensure(t).totalDwellMs += e.data?.dwellMs ?? 0;
    else if (e.kind === 'click-reveal') ensure(t).reveals += 1;
  }
  for (const row of map.values()) {
    row.meanDwellMs = row.visits > 0 ? row.totalDwellMs / row.visits : NaN;
  }
  // Most-visited first so the analytics page reads top-down.
  return [...map.values()].sort((a, b) => b.visits - a.visits || a.slideType.localeCompare(b.slideType));
}

/* ────────────────────────────────────────────────────────────────────────
   Click-reveal section roll-up — answers "which reveal sections did the
   audience actually open?" Keyed by `revealSlug` (the human-readable
   panel title). Stable across decks because slugs are content-derived,
   not number-derived.
   ──────────────────────────────────────────────────────────────────── */

export interface RevealUsageSummary {
  /** Slug of the reveal target (panel title or explicit revealSlug). */
  revealSlug: string;
  /** Number of times this reveal opened. */
  opens: number;
  /** Distinct parent slides that triggered this reveal. */
  parentSlides: number[];
  /** Most recent open (epoch ms). 0 when never opened. */
  lastOpenedAt: number;
}

export function summarizeReveals(
  events: ReadonlyArray<AnalyticsEvent>,
): RevealUsageSummary[] {
  const map = new Map<string, RevealUsageSummary & { _parents: Set<number> }>();
  for (const e of events) {
    if (e.kind !== 'click-reveal') continue;
    const slug = e.data?.revealSlug ?? 'unknown';
    let row = map.get(slug);
    if (!row) {
      row = {
        revealSlug: slug,
        opens: 0,
        parentSlides: [],
        lastOpenedAt: 0,
        _parents: new Set<number>(),
      };
      map.set(slug, row);
    }
    row.opens += 1;
    if (e.slide) row._parents.add(e.slide);
    if (e.t > row.lastOpenedAt) row.lastOpenedAt = e.t;
  }
  return [...map.values()]
    .map(({ _parents, ...rest }) => ({
      ...rest,
      parentSlides: [..._parents].sort((a, b) => a - b),
    }))
    .sort((a, b) => b.opens - a.opens || a.revealSlug.localeCompare(b.revealSlug));
}
// Test-only — reset module state without reloading the page.
export function _resetAnalyticsForTests(): void {
  _enabled = false;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY_ENABLED);
      window.localStorage.removeItem(STORAGE_KEY_EVENTS);
    } catch {
      /* ignore */
    }
  }
}

// Internal — exported only for the test harness to set MAX_EVENTS-style
// invariants without monkey-patching.
export const _MAX_EVENTS = MAX_EVENTS;
