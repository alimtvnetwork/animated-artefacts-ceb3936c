/**
 * Runtime image QA — spec 54 (v0.162).
 *
 * Loads every reference image listed in `REFERENCE_ASSETS` (the manifest
 * shipped alongside `ReferenceGallery` + the LLM authoring pack) **inside
 * the running browser** and reports per-asset:
 *
 *   - `ok`                  — fetched, decoded, dimensions match.
 *   - `not-found`           — fetch returned non-2xx (typically 404).
 *   - `decode-failed`       — fetched but `<img>.decode()` rejected
 *                             (corrupt PNG, wrong magic bytes, mid-stream
 *                             truncation in the network).
 *   - `dimension-mismatch`  — decoded fine but `naturalWidth` /
 *                             `naturalHeight` disagree with the manifest.
 *
 * This is **runtime** — complementary to:
 *   - `referenceAssets.test.tsx` (build-time fs/dimension assertion via
 *     Node, no browser involved).
 *   - `audit-asset-resolutions.ts` (CI-only header probe via `bun`).
 *   - `assertDeclaredAssetFiles` (boot-time HEAD on `deck.assets.*`,
 *     does NOT touch the reference-gallery PNGs).
 *
 * Why we still need this layer:
 *   - A PNG can pass the build-time IHDR decode AND a HEAD 200 yet still
 *     fail to decode in the browser if the production CDN serves a
 *     truncated body, the wrong Content-Type, or a transformed variant
 *     (e.g. an aggressive image-proxy that mis-handles transparency).
 *   - The reference-gallery assets are not part of `deck.assets.*` so the
 *     strict-loader file-existence pass intentionally skips them.
 *
 * Public API:
 *   - `runRuntimeImageQA()` — Promise<RuntimeImageQAReport>. Idempotent;
 *     re-running re-fetches with `cache: 'reload'` so a manual re-run
 *     after a redeploy doesn't read a stale Service Worker copy.
 *   - `subscribeRuntimeImageQA(cb)` — receive the latest report when it
 *     changes; used by `<RuntimeImageQAOverlay>` to surface failures.
 *
 * Trigger surface (see `main.tsx` for wiring):
 *   - Always available via `?qa=images` URL flag.
 *   - Auto-runs in dev (`import.meta.env.DEV`) on the `/style-guide`
 *     route, where the gallery is the focus and a 404 is most visible.
 *
 * Concurrency cap of 6 keeps a 9-asset manifest from opening 9 sockets
 * at once on slow networks; matches Chrome's per-origin HTTP/1 budget.
 */
import { REFERENCE_ASSETS, type ReferenceAssetManifest } from './referenceAssetsManifest';

export type ImageQAStatus = 'ok' | 'not-found' | 'decode-failed' | 'dimension-mismatch';

export interface ImageQAResult {
  asset: ReferenceAssetManifest;
  status: ImageQAStatus;
  /** HTTP status when the response came back; null when fetch itself rejected. */
  httpStatus: number | null;
  /** Decoded `naturalWidth` after `img.decode()`, when reachable. */
  actualWidth: number | null;
  actualHeight: number | null;
  /** Wall-time the fetch+decode took, ms. Useful for spotting slow-CDN regressions. */
  elapsedMs: number;
  /** Free-form detail for the failing case (error.message, etc.). */
  detail: string | null;
}

export interface RuntimeImageQAReport {
  startedAt: string;
  finishedAt: string;
  totalMs: number;
  /** Counts by status. */
  counts: Record<ImageQAStatus, number>;
  results: ImageQAResult[];
}

const MAX_CONCURRENT = 6;

let lastReport: RuntimeImageQAReport | null = null;
const subscribers = new Set<(r: RuntimeImageQAReport) => void>();

/**
 * Probe one asset. Sequence:
 *   1. `fetch(url, { cache: 'reload' })` — explicit cache bust so a
 *      re-run after deploy never reads a stale ServiceWorker / disk-cache
 *      copy. We need the Response object to read `.status` before deciding
 *      whether to attempt a decode.
 *   2. If the response is non-2xx → `not-found` with `httpStatus`.
 *   3. Otherwise convert the body to a blob URL, hand it to a real
 *      `<img>`, and `await img.decode()`. `decode()` rejects on broken
 *      pixel streams in a way that `onload` doesn't always — onload fires
 *      even for some malformed PNGs because the browser already has the
 *      header.
 *   4. Compare `naturalWidth` × `naturalHeight` to the manifest.
 *
 * Why blob URL instead of `img.src = url` directly?
 *   - We've already read the bytes via fetch, so reusing them via blob
 *     avoids a second HTTP round trip and guarantees `decode()` sees the
 *     same bytes the network just delivered.
 *   - `img.src = httpUrl` racing the manual fetch sometimes gives us TWO
 *     network requests for the same asset on busy connections.
 */
async function probeAsset(asset: ReferenceAssetManifest): Promise<ImageQAResult> {
  const start = performance.now();
  let httpStatus: number | null = null;
  try {
    const res = await fetch(asset.publicPath, { cache: 'reload' });
    httpStatus = res.status;
    if (!res.ok) {
      return {
        asset,
        status: 'not-found',
        httpStatus,
        actualWidth: null,
        actualHeight: null,
        elapsedMs: performance.now() - start,
        detail: `HTTP ${res.status} ${res.statusText}`,
      };
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = blobUrl;
      try {
        await img.decode();
      } catch (decodeErr) {
        return {
          asset,
          status: 'decode-failed',
          httpStatus,
          actualWidth: null,
          actualHeight: null,
          elapsedMs: performance.now() - start,
          detail: (decodeErr as Error)?.message ?? 'decode() rejected',
        };
      }
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w !== asset.expectedWidth || h !== asset.expectedHeight) {
        return {
          asset,
          status: 'dimension-mismatch',
          httpStatus,
          actualWidth: w,
          actualHeight: h,
          elapsedMs: performance.now() - start,
          detail: `expected ${asset.expectedWidth}×${asset.expectedHeight}, got ${w}×${h}`,
        };
      }
      return {
        asset,
        status: 'ok',
        httpStatus,
        actualWidth: w,
        actualHeight: h,
        elapsedMs: performance.now() - start,
        detail: null,
      };
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (fetchErr) {
    return {
      asset,
      status: 'not-found',
      httpStatus,
      actualWidth: null,
      actualHeight: null,
      elapsedMs: performance.now() - start,
      detail: (fetchErr as Error)?.message ?? 'fetch rejected (network / CORS / offline)',
    };
  }
}

/**
 * Pull every entry through `probeAsset` with a small in-flight cap so a
 * 30-asset manifest doesn't hammer the CDN. Resolves after the slowest
 * worker finishes — typical wall time on localhost: ~80–250ms.
 */
export async function runRuntimeImageQA(): Promise<RuntimeImageQAReport> {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();

  const queue = [...REFERENCE_ASSETS];
  const results: ImageQAResult[] = [];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) return;
      results.push(await probeAsset(next));
    }
  }
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(MAX_CONCURRENT, REFERENCE_ASSETS.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  // Sort by manifest order so a re-run produces a stable report (easier
  // to diff in the console between two deploys).
  results.sort((a, b) => {
    const ai = REFERENCE_ASSETS.indexOf(a.asset);
    const bi = REFERENCE_ASSETS.indexOf(b.asset);
    return ai - bi;
  });

  const counts: Record<ImageQAStatus, number> = {
    ok: 0,
    'not-found': 0,
    'decode-failed': 0,
    'dimension-mismatch': 0,
  };
  for (const r of results) counts[r.status]++;

  const report: RuntimeImageQAReport = {
    startedAt,
    finishedAt: new Date().toISOString(),
    totalMs: Math.round(performance.now() - t0),
    counts,
    results,
  };
  lastReport = report;
  for (const cb of subscribers) {
    try { cb(report); } catch { /* never let a subscriber crash the QA loop */ }
  }
  return report;
}

export function getLastRuntimeImageQAReport(): RuntimeImageQAReport | null {
  return lastReport;
}

export function subscribeRuntimeImageQA(cb: (r: RuntimeImageQAReport) => void): () => void {
  subscribers.add(cb);
  if (lastReport) cb(lastReport);
  return () => { subscribers.delete(cb); };
}

/**
 * Pretty-print a report into the browser console. Uses `console.group` so
 * a clean run collapses to one line and a failing run expands to show the
 * exact failure rows. Non-fatal — never throws.
 */
export function logRuntimeImageQAReport(report: RuntimeImageQAReport): void {
  const failures = report.results.filter((r) => r.status !== 'ok');
  const headline = failures.length === 0
    ? `✓ Runtime image QA: ${report.results.length} assets clean (${report.totalMs}ms)`
    : `✗ Runtime image QA: ${failures.length}/${report.results.length} failing (${report.totalMs}ms)`;

  if (failures.length === 0) {
    console.log(`%c${headline}`, 'color: #4ade80; font-weight: 600;');
    return;
  }
  console.group(`%c${headline}`, 'color: #f87171; font-weight: 600;');
  for (const f of failures) {
    console.error(
      `  [${f.status}] ${f.asset.publicPath}\n` +
      `    why locked: ${f.asset.whyLocked}\n` +
      `    detail:     ${f.detail ?? '—'}\n` +
      (f.httpStatus != null ? `    http:       ${f.httpStatus}\n` : '') +
      `    elapsed:    ${Math.round(f.elapsedMs)}ms`,
    );
  }
  console.groupEnd();
}
