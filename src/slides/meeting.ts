import type { SlideSpec, MeetingSpec } from './types';
import { deck } from './loader';

/**
 * Resolve the effective meeting config for a slide.
 *
 * Precedence (most → least specific):
 *   1. Per-slide `content.meetingUrl` / `content.meetingLabel` / `content.qrAsset`
 *      / `content.qrUrl` (legacy alias for `meetingUrl`).
 *   2. Deck-level `deck.meeting.url` / `deck.meeting.label` / `deck.meeting.qrAsset`.
 *   3. Sensible defaults (label falls back to a derived host, qrAsset to the
 *      registered `riseup-meeting` PNG).
 *
 * The resolver is the single source of truth — `QrMeetingSlide` (and any other
 * surface that wants to render a meeting QR) calls it instead of reading
 * `content.qrAsset` directly. This keeps deck-level overrides working without
 * touching every slide JSON.
 */
export interface ResolvedMeeting {
  /** Live URL to encode into the QR (or undefined if a bundled `qrAsset` covers it). */
  url?: string;
  /** Visible label rendered next to the QR. */
  label?: string;
  /** Registered branded-QR slug — wins over `url` when both are set. */
  qrAsset?: string;
}

/** Pick the first defined value from a list of candidates. */
function firstDefined<T>(...values: (T | undefined | null)[]): T | undefined {
  for (const v of values) if (v !== undefined && v !== null) return v as T;
  return undefined;
}

/** Best-effort visible label derived from a URL when no explicit label is set. */
function deriveLabel(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, '');
    return `${u.host}${path}`;
  } catch {
    return url;
  }
}

export function resolveMeeting(slide: SlideSpec): ResolvedMeeting {
  const c = slide.content;
  const deckMeeting: MeetingSpec | undefined = deck.meeting;
  const url = firstDefined(c.meetingUrl, c.qrUrl, deckMeeting?.url);
  const label = firstDefined(c.meetingLabel, deckMeeting?.label, deriveLabel(url));
  const qrAsset = firstDefined(c.qrAsset, deckMeeting?.qrAsset);
  return { url, label, qrAsset };
}
