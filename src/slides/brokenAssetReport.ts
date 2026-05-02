/**
 * Broken-asset report (v0.173, persistence added v0.181).
 *
 * Single in-memory store + pub/sub for non-fatal asset failures detected
 * after the deck has been allowed to boot. Surfaced by
 * `BrokenAssetOverlay` as a floating dismissible card so users can see
 * which imported audio / QR / brand files failed without being locked
 * out of the workspace.
 *
 * # Why a separate store (not the existing runtimeImageQA channel)
 *   - `runtimeImageQA` is a one-shot batch report keyed off `?qa=images`
 *     and only covers reference images. Broken-asset failures stream in
 *     across boot (slug validation), the network (HEAD-check), and
 *     runtime decode (audio buffer / image element) — different lifetimes
 *     and different sources.
 *   - The overlay needs an aggregated, deduplicated, growing list. Two
 *     subscribers writing to the same channel would step on each other.
 *
 * # Lifecycle
 *   - The store lives for the whole session. Entries can be pushed at
 *     any time. Subscribers receive the full snapshot every time the
 *     list changes — same shape as `runtimeImageQA.subscribe`.
 *   - `clear()` is exposed for tests; the overlay's "dismiss" button
 *     hides the UI but does NOT call clear() (so a follow-up failure
 *     re-shows the card).
 *
 * # Dedupe
 *   - Entries are unique by `(kind, slug, reason)`. The first push wins
 *     so the original `detail` and `url` are preserved when the same
 *     asset fails repeatedly (e.g. a 404 audio that the user keeps
 *     triggering).
 *
 * # Persistence (v0.181)
 *   - When `setActiveDeck(slug)` is called at boot, the store hydrates
 *     from `localStorage` under `riseup.brokenAssets.v1.<slug>`. Hydrated
 *     entries are tagged `cached: true` so the overlay can render them
 *     immediately on reload (the user's "show cached, then re-verify"
 *     choice).
 *   - Every subsequent `reportBrokenAsset` call writes through to
 *     localStorage and clears `cached` (the failure was just re-observed).
 *   - `markVerificationPassFinished(reasons)` drops any cached entries
 *     whose `reason` is in the verified set but did NOT re-fail this
 *     session — i.e. the user fixed the file. We only auto-prune for
 *     reasons we can fully re-verify on boot:
 *       - `missing-slug`     re-checked synchronously by initAssetRegistrySoft
 *       - `url-fetch-failed` re-checked by reportDeclaredAssetFiles HEAD pass
 *       - `image-decode-failed` re-checked by probeDeclaredImageDecode
 *     `audio-decode-failed` is NOT auto-pruned: we can't decode audio
 *     without playing it, so we keep cached audio failures until the
 *     user dismisses or the asset re-fails on next playback.
 */

export type BrokenAssetKind = 'audio' | 'qr' | 'brand';

/**
 * Why each failure reason exists:
 *   - `missing-slug`        Slide references a slug the deck never declared.
 *   - `url-fetch-failed`    HEAD-check returned non-2xx or rejected (404, network, CORS).
 *   - `audio-decode-failed` `decodeAudioData` rejected — file exists but isn't valid audio.
 *   - `image-decode-failed` `<img>.decode()` rejected — file exists but isn't a valid image.
 */
export type BrokenAssetReason =
  | 'missing-slug'
  | 'url-fetch-failed'
  | 'audio-decode-failed'
  | 'image-decode-failed';

export interface BrokenAssetEntry {
  kind: BrokenAssetKind;
  slug: string;
  reason: BrokenAssetReason;
  /** URL the asset resolves to (or `null` for `missing-slug` — there's no URL yet). */
  url: string | null;
  /** Human-readable extra info (HTTP status, error message, JSON-pointer hint). */
  detail?: string;
  /** ms since `performance.timeOrigin` when the failure was first recorded. */
  timestamp: number;
  /**
   * True when the entry was hydrated from localStorage on boot and has
   * NOT yet been re-observed this session. Cleared the moment a fresh
   * `reportBrokenAsset` call re-confirms the same (kind, slug, reason).
   * The overlay surfaces this with a "from previous session" badge so
   * users know which entries are historical.
   */
  cached?: boolean;
}

export interface BrokenAssetReport {
  entries: readonly BrokenAssetEntry[];
}

type Listener = (report: BrokenAssetReport) => void;

const listeners = new Set<Listener>();
let entries: BrokenAssetEntry[] = [];
let activeDeckSlug: string | null = null;

const STORAGE_PREFIX = 'riseup.brokenAssets.v1.';

function storageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`;
}

/** Safe localStorage access — never throws (private mode, quota, SSR). */
function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function persist(): void {
  if (!activeDeckSlug) return;
  const ls = safeStorage();
  if (!ls) return;
  try {
    if (entries.length === 0) {
      ls.removeItem(storageKey(activeDeckSlug));
      return;
    }
    // Strip `cached`/`timestamp` for storage — they're recomputed on
    // hydrate. `timestamp` is performance.now() so it's only meaningful
    // within a single session anyway.
    const payload = entries.map((e) => ({
      kind: e.kind,
      slug: e.slug,
      reason: e.reason,
      url: e.url,
      detail: e.detail,
    }));
    ls.setItem(storageKey(activeDeckSlug), JSON.stringify(payload));
  } catch {
    // Quota or serialization failure — non-fatal; the in-memory store
    // remains correct, we just won't restore on next reload.
  }
}

interface PersistedEntry {
  kind: BrokenAssetKind;
  slug: string;
  reason: BrokenAssetReason;
  url: string | null;
  detail?: string;
}

function isPersistedEntry(v: unknown): v is PersistedEntry {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    (o.kind === 'audio' || o.kind === 'qr' || o.kind === 'brand') &&
    typeof o.slug === 'string' &&
    (o.reason === 'missing-slug' ||
      o.reason === 'url-fetch-failed' ||
      o.reason === 'audio-decode-failed' ||
      o.reason === 'image-decode-failed') &&
    (o.url === null || typeof o.url === 'string') &&
    (o.detail === undefined || typeof o.detail === 'string')
  );
}

function hydrate(slug: string): void {
  const ls = safeStorage();
  if (!ls) return;
  let raw: string | null = null;
  try {
    raw = ls.getItem(storageKey(slug));
  } catch {
    return;
  }
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      ls.removeItem(storageKey(slug));
      return;
    }
    const restored: BrokenAssetEntry[] = [];
    for (const item of parsed) {
      if (!isPersistedEntry(item)) continue;
      restored.push({
        kind: item.kind,
        slug: item.slug,
        reason: item.reason,
        url: item.url,
        detail: item.detail,
        timestamp: 0,
        cached: true,
      });
    }
    if (restored.length === 0) return;
    // Merge into any in-memory entries already pushed before setActiveDeck
    // landed (rare race — a sound failure could fire during loader init).
    // Live entries win: do not overwrite a fresh entry with a cached one.
    for (const r of restored) {
      const dup = entries.some(
        (e) => e.kind === r.kind && e.slug === r.slug && e.reason === r.reason,
      );
      if (!dup) entries.push(r);
    }
    entries.sort((a, b) => a.kind.localeCompare(b.kind) || a.slug.localeCompare(b.slug));
    notify();
  } catch {
    // Corrupted JSON — drop it so the next reload starts clean.
    try { ls.removeItem(storageKey(slug)); } catch { /* ignore */ }
  }
}

function snapshot(): BrokenAssetReport {
  return { entries: Object.freeze([...entries]) };
}

function notify(): void {
  const snap = snapshot();
  for (const l of listeners) {
    try {
      l(snap);
    } catch (err) {
      // A misbehaving subscriber must not block the rest from updating.
      console.warn('[brokenAssetReport] subscriber threw', err);
    }
  }
}

/**
 * Bind the store to a deck slug and hydrate any persisted entries.
 * Call once at boot (from the deck loader). Calling with a different
 * slug clears the in-memory store and hydrates from the new key — useful
 * for tests; in production the slug is fixed for the page-load.
 */
export function setActiveDeck(slug: string): void {
  if (activeDeckSlug === slug) return;
  activeDeckSlug = slug;
  // Don't wipe in-memory entries on initial bind — there may already be
  // failures recorded between module-eval and this call. We DO wipe if
  // the slug actually changes (test re-init).
  hydrate(slug);
}

/** Return the slug the store is currently persisting under (or null). */
export function getActiveDeckSlug(): string | null {
  return activeDeckSlug;
}

/**
 * Record a broken asset. Idempotent on `(kind, slug, reason)`: re-reporting
 * the same trio updates the existing entry to clear its `cached` flag
 * (the failure was just re-observed this session) but preserves the
 * original detail + url + timestamp.
 *
 * Returns `true` if a new entry was added, `false` when deduped.
 */
export function reportBrokenAsset(
  entry: Omit<BrokenAssetEntry, 'timestamp' | 'cached'> & { timestamp?: number },
): boolean {
  const idx = entries.findIndex(
    (e) => e.kind === entry.kind && e.slug === entry.slug && e.reason === entry.reason,
  );
  if (idx >= 0) {
    // Re-observed: drop cached flag if it was set. Otherwise no-op.
    if (entries[idx].cached) {
      const next = [...entries];
      next[idx] = { ...next[idx], cached: false };
      entries = next;
      persist();
      notify();
    }
    return false;
  }
  entries = [
    ...entries,
    {
      kind: entry.kind,
      slug: entry.slug,
      reason: entry.reason,
      url: entry.url,
      detail: entry.detail,
      timestamp: entry.timestamp ?? (typeof performance !== 'undefined' ? performance.now() : 0),
    },
  ];
  // Sorted by kind then slug so the overlay output is stable across reloads
  // and tests don't have to care about insertion order.
  entries.sort((a, b) => a.kind.localeCompare(b.kind) || a.slug.localeCompare(b.slug));
  persist();
  notify();
  return true;
}

/**
 * Drop any still-`cached` entries whose `reason` is in `verifiedReasons`.
 * Call this after each asset-verification pass completes (slug check,
 * HEAD check, image-decode probe). Cached entries that DID re-fail this
 * session were already un-cached by `reportBrokenAsset`, so this only
 * removes the ones the user has actually fixed.
 *
 * `audio-decode-failed` is intentionally NOT auto-prunable: we can't
 * verify audio without playback. Cached audio entries persist until
 * dismissed or re-failed.
 */
export function markVerificationPassFinished(
  verifiedReasons: readonly BrokenAssetReason[],
): void {
  if (verifiedReasons.length === 0) return;
  const reasonSet = new Set(verifiedReasons);
  const before = entries.length;
  entries = entries.filter((e) => !(e.cached && reasonSet.has(e.reason)));
  if (entries.length !== before) {
    persist();
    notify();
  }
}

/** Read the current report. Frozen array — safe to hold. */
export function getBrokenAssetReport(): BrokenAssetReport {
  return snapshot();
}

/**
 * Subscribe to report changes. Fires immediately with the current snapshot
 * (matches `runtimeImageQA.subscribe` so consumers can use the same hook
 * shape). Returns an unsubscribe fn.
 */
export function subscribeBrokenAssetReport(listener: Listener): () => void {
  listeners.add(listener);
  // Defer the initial fire to a microtask so callers can finish setState
  // bookkeeping before the first event lands.
  Promise.resolve().then(() => {
    if (listeners.has(listener)) listener(snapshot());
  });
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper — wipes both the store and all subscribers AND persisted state. */
export function __resetBrokenAssetReport(): void {
  const ls = safeStorage();
  if (ls && activeDeckSlug) {
    try { ls.removeItem(storageKey(activeDeckSlug)); } catch { /* ignore */ }
  }
  entries = [];
  listeners.clear();
  activeDeckSlug = null;
}

/** Test helper — clear entries (and persisted blob) without dropping subscribers. */
export function clearBrokenAssetReport(): void {
  entries = [];
  persist();
  notify();
}
