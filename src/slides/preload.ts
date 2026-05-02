/**
 * Asset preloader — spec/slides/25-asset-preload.md.
 *
 * Eliminates the latency the user saw on the contact / QR slide by warming
 * every image the deck will ever need at boot time, before the user clicks
 * Next. We do TWO things per asset:
 *   1. Inject `<link rel="preload" as="image">` so the browser schedules the
 *      fetch with high priority.
 *   2. Construct a real `Image()` so the asset enters the HTTP cache even on
 *      browsers that ignore the preload hint.
 *
 * Both are idempotent — calling this twice never duplicates `<link>` tags.
 *
 * The whole module is layout-free: it never mounts UI, never blocks paint,
 * and never throws (a missing asset is logged but does not break boot).
 */
import type { DeckSpec, SlideSpec } from './types';

/* ------------------------------------------------------------------ */
/* 1. Static brand-asset registry                                      */
/* ------------------------------------------------------------------ */

// Eagerly resolve every PNG/JPG/SVG/WebP/GIF/AVIF under `src/assets/` to its
// bundled URL. Vite handles hashing + cache headers, so the URLs we get back
// here are the exact same ones the running components import — preloading
// them warms the cache the components will hit on first render.
const BUNDLED_ASSETS = import.meta.glob(
  '../assets/**/*.{png,jpg,jpeg,svg,webp,gif,avif}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

/** Convert "../assets/brand/foo.png" → "brand/foo.png" for slug lookups. */
function relativeKey(path: string): string {
  return path.replace(/^\.\.\/assets\//, '');
}

/** All bundled asset URLs in a flat array. */
const ALL_BUNDLED_URLS = Object.values(BUNDLED_ASSETS);

/** Audio bundled under src/assets — preload as `audio` link hint. */
const BUNDLED_AUDIO = import.meta.glob(
  '../assets/**/*.{mp3,wav,ogg,m4a}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;
const ALL_BUNDLED_AUDIO_URLS = Object.values(BUNDLED_AUDIO);

/* ------------------------------------------------------------------ */
/* 2. URL collection                                                   */
/* ------------------------------------------------------------------ */

/** Stable QR-asset slug → bundled URL map. Mirrors `BrandedQR`'s registry. */
const QR_ASSET_URLS: Record<string, string | undefined> = {
  'riseup-meeting': BUNDLED_ASSETS[
    Object.keys(BUNDLED_ASSETS).find(k => relativeKey(k) === 'brand/meeting-qr.png') ?? ''
  ],
};

/**
 * Walk an arbitrary content tree and collect any string that looks like an
 * asset URL (`/...`, `http(s)://...`, `data:`-skipped). This catches deep
 * fields the typed loop above doesn't know about (image references inside
 * arrays, hero blocks, custom slide types added later).
 */
function collectUrlsFromValue(value: unknown, sink: Set<string>): void {
  if (value == null) return;
  if (typeof value === 'string') {
    if (
      value.length > 1 &&
      !value.startsWith('data:') &&
      (value.startsWith('http') || value.startsWith('/') || /\.(png|jpe?g|svg|webp|gif|avif|mp3|wav|ogg|m4a)(\?|$)/i.test(value))
    ) {
      sink.add(value);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectUrlsFromValue(v, sink);
    return;
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectUrlsFromValue(v, sink);
    }
  }
}

/** Heuristic: pull every URL the deck will need into a single set. */
function collectAssetUrls(deck: DeckSpec, slides: SlideSpec[]): { images: string[]; audio: string[] } {
  const images = new Set<string>();
  const audio = new Set<string>();

  // 2a. ALL bundled images — these are baked into the build, so preloading
  // them costs at most a few hundred KB and guarantees zero pop-in for any
  // slide regardless of which fields it uses.
  for (const url of ALL_BUNDLED_URLS) images.add(url);
  for (const url of ALL_BUNDLED_AUDIO_URLS) audio.add(url);

  // 2b. Deck-level meeting QR (slug → bundled URL).
  const deckQr = deck.meeting?.qrAsset;
  if (deckQr && QR_ASSET_URLS[deckQr]) images.add(QR_ASSET_URLS[deckQr]!);

  // 2c. Per-slide assets — typed QR + image + arbitrary URL strings nested
  // anywhere in the slide content tree (hero, capsules, contactRows, etc.).
  for (const slide of slides) {
    const c = slide.content;
    const slideQr = c.qrAsset;
    if (slideQr && QR_ASSET_URLS[slideQr]) images.add(QR_ASSET_URLS[slideQr]!);
    collectUrlsFromValue(c, images);
  }

  // 2d. Deck-level overrides (deck.assets / deck.meeting / etc.) — same deep walk.
  collectUrlsFromValue(deck, images);

  // Route audio-looking URLs out of the image bucket into audio.
  for (const url of [...images]) {
    if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url)) {
      audio.add(url);
      images.delete(url);
    }
  }

  return {
    images: [...images].filter(Boolean),
    audio: [...audio].filter(Boolean),
  };
}

/* ------------------------------------------------------------------ */
/* 3. Preload primitives                                               */
/* ------------------------------------------------------------------ */

/** Track URLs we've already injected so callers can re-invoke safely. */
const INJECTED = new Set<string>();

function injectPreloadLink(url: string, kind: 'image' | 'audio' = 'image') {
  if (INJECTED.has(url)) return;
  INJECTED.add(url);
  // <link rel="preload"> with the right `as` value is the highest-priority
  // browser hint short of an actual <img>/<audio> in the DOM. Safe in <head>;
  // non-blocking.
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = kind;
  link.href = url;
  if (kind === 'image') {
    // Some browsers ignore preload hints with the wrong fetchpriority. Setting
    // it explicitly to "high" is harmless on browsers that don't support it.
    (link as HTMLLinkElement & { fetchPriority?: string }).fetchPriority = 'high';
  }
  document.head.appendChild(link);

  // Belt-and-braces: a real element warms the HTTP cache even if the preload
  // hint is dropped (e.g., older Safari or some adblockers).
  if (kind === 'image') {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  } else {
    // For audio we do an opaque fetch — `<audio preload>` would start the
    // decoder pipeline, which is more expensive than we need at boot.
    void fetch(url, { mode: 'no-cors', cache: 'force-cache' }).catch(() => undefined);
  }
}

/* ------------------------------------------------------------------ */
/* 4. Public API                                                       */
/* ------------------------------------------------------------------ */

/**
 * Preload every asset the active deck will need.
 *
 * Strategy (matches spec 25 §3):
 *   - Brand chrome + slide #1 QR/image → fire synchronously on boot.
 *   - Everything else (incl. all bundled images + every URL referenced
 *     anywhere in the deck/slide tree) → defer to `requestIdleCallback`
 *     (or a 200ms timeout fallback) so we don't fight the first paint for
 *     network bandwidth.
 *
 * Safe to call multiple times — already-injected URLs are skipped.
 */
export function preloadDeckAssets(deck: DeckSpec, slides: SlideSpec[]): void {
  const { images, audio } = collectAssetUrls(deck, slides);
  if (images.length === 0 && audio.length === 0) return;

  // Synchronous priority batch: brand chrome + first slide's image/QR.
  const firstSlide = slides[0];
  const priority = new Set<string>();
  for (const url of images) {
    if (/brand\/(riseup-asia-logo|alim-presenter)\./.test(url)) priority.add(url);
  }
  if (firstSlide) {
    const fc = firstSlide.content;
    if (fc.qrAsset && QR_ASSET_URLS[fc.qrAsset]) priority.add(QR_ASSET_URLS[fc.qrAsset]!);
    if (fc.image) priority.add(fc.image);
  }
  for (const url of priority) injectPreloadLink(url, 'image');

  // Deferred batch: every remaining image + every audio file. Loops through
  // ALL bundled assets (not just the ones referenced by the typed loop), so
  // late-slide QR codes / hero images are warm by the time the user advances.
  const restImages = images.filter(u => !priority.has(u));
  const runRest = () => {
    for (const url of restImages) injectPreloadLink(url, 'image');
    for (const url of audio) injectPreloadLink(url, 'audio');
  };
  type IdleAPI = (cb: () => void, opts?: { timeout: number }) => void;
  const ric = (window as unknown as { requestIdleCallback?: IdleAPI }).requestIdleCallback;
  if (typeof ric === 'function') {
    ric(runRest, { timeout: 1500 });
  } else {
    window.setTimeout(runRest, 200);
  }
}
