/**
 * Runtime HEAD-check for IMPORTED decks.
 *
 * The build-time `scripts/check-deck-assets.ts` already verifies the
 * BUNDLED showcase deck before merge, so any URL it declares is known
 * to exist in `public/`. But a user can import a custom deck via the
 * deck menu (stored in `localStorage` under `IMPORTED_MANIFEST_KEY`),
 * and that deck's URLs have never been seen by CI. This module HEAD-
 * checks each one in parallel and surfaces failures.
 *
 * # Why HEAD (not GET)
 *   - We only care about HTTP status, not the bytes.
 *   - Avoids cluttering the cache with the actual asset content for
 *     formats (e.g. mp3) the user might not play this session.
 *
 * # Why this is non-fatal (warning surface, not throw)
 *   - The contract violation is the BUILD-time job; runtime is a sanity
 *     check on top. A user who imported a deck for editing shouldn't be
 *     locked out of the workspace just because one icon 404s.
 *   - The companion `BrokenAssetOverlay` shows which URLs failed, so
 *     they can fix and re-import.
 *
 * # Bundled decks
 *   - Caller (loader.ts) only invokes this when `isImported === true`.
 *     Bundled decks skip the HEAD storm entirely — saves ~5–20 round
 *     trips on every cold load.
 */
import type { DeckSpec } from './types';

export interface BrokenAssetReport {
  /** `assets.audio.whoosh` etc. — exact JSON pointer the author edits. */
  key: string;
  /** Asset category the URL came from. */
  kind: 'audio' | 'qr' | 'brand';
  /** Asset slug (the leaf of the JSON pointer). */
  slug: string;
  /** The URL that failed. */
  url: string;
  /**
   * HTTP status when the response was received, or `null` when the
   * fetch itself rejected (CORS, DNS, offline). The overlay treats
   * these the same way; the field is exposed so support tickets can
   * distinguish "404 typo" from "asset host down".
   */
  status: number | null;
};

/**
 * HEAD-check every URL in `deck.assets.{audio,qr,brand}`. Icons are
 * skipped — they're component-registry remaps, not file URLs.
 *
 * Returns a list of broken URLs. Empty list ⇒ everything 2xx'd.
 *
 * Concurrency-bounded at 8 in-flight requests so we don't blast a slow
 * CDN with 30 simultaneous HEADs on a large deck. The overall wall
 * time is ~50–200ms for a typical deck on a fast connection.
 */
export async function checkImportedDeckAssets(deck: DeckSpec): Promise<BrokenAssetReport[]> {
  const assets = (deck as DeckSpec & { assets?: { audio?: Record<string, string>; qr?: Record<string, string>; brand?: Record<string, string> } }).assets;
  if (!assets) return [];

  // Flatten into one task list so the concurrency limiter doesn't have
  // to know about categories.
  type Task = { key: string; kind: BrokenAssetReport['kind']; slug: string; url: string };
  const tasks: Task[] = [];
  for (const kind of ['audio', 'qr', 'brand'] as const) {
    const block = assets[kind];
    if (!block) continue;
    for (const [slug, url] of Object.entries(block)) {
      // Skip remote URLs — CORS would cause spurious failures and most
      // shared deck manifests reference local /public paths anyway.
      if (url.startsWith('http://') || url.startsWith('https://')) continue;
      tasks.push({ key: `assets.${kind}.${slug}`, kind, slug, url });
    }
  }

  const broken: BrokenAssetReport[] = [];
  const MAX_CONCURRENT = 8;
  let cursor = 0;

  // Manual pool instead of `Promise.all(tasks.map(...))` so we don't
  // open 30+ sockets at once on a large deck.
  async function worker(): Promise<void> {
    while (cursor < tasks.length) {
      const t = tasks[cursor++];
      let status: number | null = null;
      try {
        // `cache: 'no-store'` so we don't get tricked by a stale 200 in
        // the SW / disk cache when the file was deleted server-side.
        const res = await fetch(t.url, { method: 'HEAD', cache: 'no-store' });
        status = res.status;
        if (!res.ok) {
          broken.push({ key: t.key, kind: t.kind, slug: t.slug, url: t.url, status });
        }
      } catch {
        // Network/CORS rejection — count as broken with status=null so
        // the overlay can distinguish from a 404.
        broken.push({ key: t.key, kind: t.kind, slug: t.slug, url: t.url, status: null });
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(MAX_CONCURRENT, tasks.length); i++) workers.push(worker());
  await Promise.all(workers);

  // Stable output order — sort by JSON-pointer key so the overlay /
  // tests don't see different orderings on the same input.
  broken.sort((a, b) => a.key.localeCompare(b.key));
  return broken;
}
