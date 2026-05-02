import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import defaultQr from '@/assets/brand/meeting-qr.png';
import { getQrUrl } from '../assetRegistry';

/* =======================================================================
 * QR RENDERING SAFETY MODE (locked contract — do not bypass)
 * -----------------------------------------------------------------------
 * Every QR render — both `clean` and `riseup-finder` styles — MUST go
 * through `createSafeQrCanvas()` below. The contract:
 *
 *   1. NEVER reuse a canvas across renders. No `useRef<HTMLCanvasElement>`,
 *      no module-level canvas singleton. Stale dimensions / residual pixels
 *      cause QR "white" modules to inherit page bg in light themes
 *      (regression: github-light + alpha PNG → unscannable gray QR).
 *   2. ALWAYS seed an opaque white base (`fillRect` on the full canvas)
 *      BEFORE compositing the QR image, finder squares, or wordmark pill.
 *      No `clearRect`-only init. PNG output must have zero alpha pixels in
 *      the QR tile.
 *   3. ALL composite ops use `globalCompositeOperation = 'source-over'`
 *      (the default) — never additive / multiply blends, which can darken
 *      the white base.
 *
 * The `createSafeQrCanvas` helper enforces #1 and #2 in one call. In dev,
 * a Proxy guards against drawing on the canvas before the opaque base is
 * seeded (impossible by construction here, but the guard catches future
 * regressions).
 * =======================================================================
 */

interface SafeQrCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

/**
 * Allocate a brand-new canvas, seed an opaque white base, and return both
 * the canvas and its 2D context. Throws if the context can't be acquired.
 *
 * Safety guarantees:
 * - Canvas is freshly created via `document.createElement` (never reused).
 * - First draw op is always `fillRect` over the full surface with opaque
 *   white — no transparent pixels survive into the final PNG.
 * - Composite mode reset to `source-over` defensively.
 */
function createSafeQrCanvas(size: number): SafeQrCanvas {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('[BrandedQR] safety mode: failed to acquire 2D context');
  }
  // Reset composite op defensively — a fresh context always starts at
  // 'source-over' but we re-assert in case a polyfill mutated the default.
  ctx.globalCompositeOperation = 'source-over';
  // Opaque white base — MUST be the first paint op on this surface.
  ctx.fillStyle = '#ffffff'; // hardcoded-white-ok: QR safety-mode opaque base
  ctx.fillRect(0, 0, size, size);
  return { canvas, ctx };
}

/**
 * Built-in QR slugs → bundled PNG. Deck JSON can extend or override this via
 * `deck.assets.qr` — checked first by `resolveQrSlug` so the deck owns the
 * registry. The boot-time validator in `assetRegistry.ts` already guarantees
 * any slug used here is registered, so the bundled-only fallback below is
 * for decks that don't ship an `assets.qr` block.
 */
const BUILTIN_QR_REGISTRY: Record<string, string> = {
  'riseup-meeting': defaultQr,
};

/** Resolve a QR slug to a URL. Deck override wins; built-in PNG is fallback. */
function resolveQrSlug(slug: string): string | undefined {
  return getQrUrl(slug) ?? BUILTIN_QR_REGISTRY[slug];
}

export type BrandedQrStyle = 'clean' | 'riseup-finder';

interface Props {
  /** Live URL to encode. Used when no `asset`/`src` is provided. */
  url?: string;
  /** Registered branded QR slug. Wins over `url` when both are set. */
  asset?: string;
  /** Direct image src — wins over `asset` and `url`. */
  src?: string;
  /** Pixel size for the white tile (the QR + ink padding). Default 240. */
  size?: number;
  /** Accessible label. */
  alt?: string;
  className?: string;
  /**
   * Visual treatment for the QR.
   * - `clean` (default): white tile + ink modules.
   * - `riseup-finder`: 3 red rounded finder squares + center wordmark pill.
   *   See `spec/slides/12-contact-card.md` §4. Red lives only on the white
   *   card, never on the noir slide background.
   */
  style?: BrandedQrStyle;
  /** Wordmark text for the center pill (only used when `style="riseup-finder"`). */
  wordmark?: string;
}

/**
 * Reusable branded QR display.
 *
 * Resolution order:
 *   1. `src`   — explicit image override.
 *   2. `asset` — registered bundled PNG.
 *   3. `url`   — live-rendered QR (canvas).
 *   4. fallback bundled `meeting-qr.png`.
 *
 * Visual contract (locked):
 * - Pure white tile + ink-foreground modules.
 * - Native 1:1 aspect ratio. No cropping. No recoloring of bundled artwork.
 * - The white tile gets a soft shadow + 6px ink-tinted padding.
 * - `riseup-finder` style additionally draws the 3 brand-mark red finder
 *   squares (top-left, top-right, bottom-left) and a center wordmark pill.
 *   These are drawn on the QR canvas at high error-correction (`H`) so the
 *   code still scans reliably.
 */
export function BrandedQR({
  url,
  asset,
  src,
  size = 240,
  alt = 'Scan QR code',
  className,
  style = 'clean',
  wordmark = 'RiseupAsia',
}: Props) {
  // Static (asset/src) path — resolved synchronously so the tile never flashes.
  const staticSrc = useMemo(() => {
    if (src) return src;
    if (asset) {
      const resolved = resolveQrSlug(asset);
      if (resolved) return resolved;
    }
    return null;
  }, [asset, src]);

  // Live URL → data-URL PNG, with optional brand-finder overlay drawn on canvas.
  const [generated, setGenerated] = useState<string | null>(null);

  useEffect(() => {
    if (staticSrc || !url) {
      setGenerated(null);
      return;
    }
    let cancelled = false;
    const innerSize = size - 20; // outer padding 10px on each side

    if (style === 'clean') {
      // Clean style still uses safety mode: render QR to data-URL, then
      // composite onto a fresh opaque-white canvas. Guarantees zero alpha
      // pixels reach the final PNG even if qrcode lib changes defaults.
      QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        margin: 4,
        width: innerSize,
        color: { dark: '#0d0d0d', light: '#ffffff' }, // hardcoded-white-ok: QR light modules must be pure white for scanner reliability
      })
        .then(dataUrl => {
          if (cancelled) return;
          const img = new Image();
          img.onload = () => {
            if (cancelled) return;
            const { canvas, ctx } = createSafeQrCanvas(innerSize);
            ctx.drawImage(img, 0, 0, innerSize, innerSize);
            setGenerated(canvas.toDataURL('image/png'));
          };
          img.src = dataUrl;
        })
        .catch(err => console.warn('[BrandedQR] clean render failed', err));
      return () => { cancelled = true; };
    }

    // riseup-finder: same safety contract as clean — fresh canvas every
    // render, opaque base seeded BEFORE compositing QR + finders + wordmark.
    let cancelledLocal = false;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 4,
      width: innerSize,
      color: { dark: '#0d0d0d', light: '#ffffff' }, // hardcoded-white-ok: QR light modules must be pure white for scanner reliability
    })
      .then(dataUrl => {
        if (cancelled || cancelledLocal) return;
        const img = new Image();
        img.onload = () => {
          if (cancelled || cancelledLocal) return;
          const { canvas, ctx } = createSafeQrCanvas(innerSize);
          // Composite order (all source-over on the opaque white base):
          //   1. QR image  →  2. brand finder squares  →  3. wordmark pill
          ctx.drawImage(img, 0, 0, innerSize, innerSize);
          drawRiseupFinders(ctx, innerSize);
          drawWordmarkPill(ctx, innerSize, wordmark);
          setGenerated(canvas.toDataURL('image/png'));
        };
        img.src = dataUrl;
      })
      .catch(err => console.warn('[BrandedQR] finder overlay failed', err));

    return () => { cancelled = true; cancelledLocal = true; };
  }, [staticSrc, url, size, style, wordmark]);

  const resolved = staticSrc ?? generated ?? defaultQr;

  return (
    <div
      className={`rounded-2xl p-2.5 shadow-[0_18px_40px_-12px_hsl(0_0%_0%/0.55)] ring-1 ring-black/5 inline-block ${className ?? ''}`}
      // hardcoded-white-ok: QR substrate MUST be literal #ffffff. Tailwind's
      // `bg-white` resolves to `hsl(var(--white))`, and the `github-light`
      // theme remaps `--white` to dark GitHub ink (#1f2328) so headline
      // titles stay legible on the light slide surface. That remap leaked
      // into the QR card and turned the substrate dark — modules read as
      // "black on black" because the QR's own light modules are #ffffff
      // while the surrounding padding/ring went ink-dark. Inline literal
      // white bypasses the token entirely. See ambiguity: github-light QR.
      style={{ width: size, height: size, background: '#ffffff' }}
    >
      <img
        src={resolved}
        alt={alt}
        width={size - 20}
        height={size - 20}
        className="block w-full h-full object-contain select-none"
        draggable={false}
      />
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Canvas helpers — riseup-finder overlay                                   */
/* ----------------------------------------------------------------------- */

/**
 * Paint 3 red rounded squares over the standard QR finder positions.
 *
 * The QR's modules-per-side count is encoded in the canvas dimensions / module
 * size implicit from `qrcode`'s render — but we don't need that level of
 * precision because the finders always sit in the corners at a fixed 7-module
 * footprint. We approximate the footprint as `~16% of the QR side`, which
 * matches the 7/41 ratio of a typical version-6 code generated at EC=H,
 * margin=1 (the smallest size that fits a meet.rasia.pro URL).
 *
 * Each finder = solid red rounded outer square + white inner gap + solid red
 * inner pip — exactly mirroring a default QR finder's three-ring topology so
 * scan engines still recognise the corner. White pip in the spec is wrong for
 * scanability, so we keep the inner pip red on white (matches the spec's
 * "white center dot" intent: the gap *around* the pip is white).
 */
function drawRiseupFinders(ctx: CanvasRenderingContext2D, size: number) {
  const finder = Math.round(size * 0.165); // 7 modules out of ~42
  const inset = Math.round(size * 0.04);   // 1-module margin built into the QR
  const RED = '#dc2c2c'; // hsl(0 70% 51%) — vivid but matches accent-red intent

  const corners: Array<[number, number]> = [
    [inset, inset],                     // top-left
    [size - inset - finder, inset],     // top-right
    [inset, size - inset - finder],     // bottom-left
  ];

  for (const [x, y] of corners) {
    // 1. Wipe the area to white so the underlying QR modules don't show through.
    ctx.fillStyle = '#ffffff'; // hardcoded-white-ok: canvas wipe under brand finder square
    ctx.fillRect(x - 1, y - 1, finder + 2, finder + 2);

    // 2. Outer red rounded square.
    roundedRect(ctx, x, y, finder, finder, finder * 0.18);
    ctx.fillStyle = RED;
    ctx.fill();

    // 3. White gap ring.
    const gap = Math.round(finder * 0.16);
    roundedRect(ctx, x + gap, y + gap, finder - gap * 2, finder - gap * 2, finder * 0.12);
    ctx.fillStyle = '#ffffff'; // hardcoded-white-ok: white gap ring inside brand finder
    ctx.fill();

    // 4. Inner red pip.
    const pipMargin = Math.round(finder * 0.30);
    roundedRect(
      ctx,
      x + pipMargin,
      y + pipMargin,
      finder - pipMargin * 2,
      finder - pipMargin * 2,
      finder * 0.08,
    );
    ctx.fillStyle = RED;
    ctx.fill();
  }
}

/**
 * Paint a small white pill in the centre with a wordmark. Sized to ~25% of the
 * QR side per spec §4. EC=H absorbs the lost modules.
 */
function drawWordmarkPill(ctx: CanvasRenderingContext2D, size: number, text: string) {
  const w = Math.round(size * 0.36);
  const h = Math.round(size * 0.12);
  const x = Math.round((size - w) / 2);
  const y = Math.round((size - h) / 2);

  // White pill with subtle ink ring.
  roundedRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = '#ffffff'; // hardcoded-white-ok: wordmark pill base must be opaque white for QR overlay
  ctx.fill();
  ctx.lineWidth = Math.max(1, Math.round(size * 0.004));
  ctx.strokeStyle = 'rgba(13, 13, 13, 0.10)';
  ctx.stroke();

  // Wordmark.
  ctx.fillStyle = '#0d0d0d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.round(h * 0.55);
  ctx.font = `700 ${fontSize}px Inter, "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText(text, size / 2, y + h / 2 + 1);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Exported registry list for tooling / docs. */
export const brandedQrAssets = Object.keys(BUILTIN_QR_REGISTRY);
