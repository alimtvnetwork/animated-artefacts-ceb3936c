/**
 * `ColorTokenDebugOverlay` — visual auditor for theme-token usage AND
 * runtime WCAG contrast.
 *
 * Why this exists
 * ---------------
 * Light themes (notably `github-light`) remap `--white` → dark ink, so a
 * slide that paints text via theme tokens stays legible. When debugging
 * "why is this text invisible?" it's invaluable to see *which* token each
 * text element resolves through AND what its computed contrast ratio is
 * against the surface it sits on.
 *
 * How it works
 * ------------
 * Any element annotated with `data-debug-token="<short-label>"` (and
 * optionally `data-debug-class="<original-class>"`) inside the overlay's
 * `targetRef` gets a small absolute-positioned chip rendered next to it,
 * showing:
 *
 *   • The label (e.g. "title — text-[hsl(var(--white))]")
 *   • The element's resolved `color` swatch
 *   • The effective background color discovered by walking up the DOM
 *   • The WCAG 2.1 contrast ratio + a pass/fail badge against AA
 *     (4.5:1 for normal text, 3:1 for large/bold display text)
 *
 * The overlay re-measures on resize, scroll, and a periodic tick so it
 * stays glued to its targets even when the underlying step row changes.
 *
 * Activation
 * ----------
 * Two equivalent toggles:
 *   • URL query param `?colorDebug=1` (or `?colorDebug=true`)
 *   • Persisted localStorage flag `riseup.colorDebug=1`
 *   • Programmatic: `setColorDebug(true)` from the controller bar button
 * `isColorDebugEnabled()` is a one-shot read; `useColorDebug()` is a
 * subscribed hook used by the controller chrome to render its toggle
 * state. Off by default; never shown to the audience.
 *
 * Cost
 * ----
 * Pure DOM measurement, no rerenders triggered on the targets. Safe to
 * leave wired up — it short-circuits when `enabled` is false.
 */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

/* ────────────────────────────────────────────────────────────────────────
   Toggle state — tiny pub/sub so the controller bar button and the
   overlay stay in lockstep without dragging in a state library. URL
   param + localStorage are both honored on first read; subsequent
   changes go through `setColorDebug()` which writes both back.
   ──────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'riseup.colorDebug';

function readInitial(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('colorDebug');
    if (fromUrl === '1' || fromUrl === 'true') return true;
    if (fromUrl === '0' || fromUrl === 'false') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let _enabled = readInitial();
const _listeners = new Set<(v: boolean) => void>();

export function isColorDebugEnabled(): boolean {
  return _enabled;
}

export function setColorDebug(next: boolean): void {
  _enabled = next;
  // Persist to localStorage AND mirror onto the URL so a deep-link copy
  // captures the state too. We mutate the URL via replaceState so back
  // navigation isn't polluted.
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      const url = new URL(window.location.href);
      if (next) url.searchParams.set('colorDebug', '1');
      else url.searchParams.delete('colorDebug');
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    /* ignore — best-effort persistence */
  }
  _listeners.forEach((fn) => fn(next));
}

export function toggleColorDebug(): void {
  setColorDebug(!_enabled);
}

/** React subscription so chrome can re-render when the flag flips. */
export function useColorDebug(): boolean {
  const [v, setV] = useState<boolean>(_enabled);
  useEffect(() => {
    _listeners.add(setV);
    // Pick up any late mutation (e.g. another tab toggled it).
    setV(_enabled);
    return () => {
      _listeners.delete(setV);
    };
  }, []);
  return v;
}

/* ────────────────────────────────────────────────────────────────────────
   Color math — WCAG 2.1 contrast ratio. Pure functions so tests can hit
   them without a DOM.
   ──────────────────────────────────────────────────────────────────── */

type Rgb = readonly [number, number, number];

/** Parse `getComputedStyle()` color values: rgb(), rgba(), hsl(), hsla(). */
export function parseCssColor(input: string): { rgb: Rgb; alpha: number } | null {
  const s = input.trim();
  // rgb / rgba
  const rgbMatch = s.match(
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i,
  );
  if (rgbMatch) {
    const r = clamp255(parseFloat(rgbMatch[1]!));
    const g = clamp255(parseFloat(rgbMatch[2]!));
    const b = clamp255(parseFloat(rgbMatch[3]!));
    const a = parseAlpha(rgbMatch[4]);
    return { rgb: [r, g, b], alpha: a };
  }
  // hsl / hsla
  const hslMatch = s.match(
    /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.]+%?))?\s*\)$/i,
  );
  if (hslMatch) {
    const [r, g, b] = hslToRgb(
      parseFloat(hslMatch[1]!),
      parseFloat(hslMatch[2]!),
      parseFloat(hslMatch[3]!),
    );
    const a = parseAlpha(hslMatch[4]);
    return { rgb: [r, g, b], alpha: a };
  }
  // Special CSS keywords we care about.
  if (s === 'transparent') return { rgb: [0, 0, 0], alpha: 0 };
  return null;
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseAlpha(token: string | undefined): number {
  if (!token) return 1;
  if (token.endsWith('%')) return Math.max(0, Math.min(1, parseFloat(token) / 100));
  return Math.max(0, Math.min(1, parseFloat(token)));
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) =>
    ln - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

/** Composite `fg` with its alpha over opaque `bg`. */
export function composite(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return [
    Math.round(fg[0] * alpha + bg[0] * (1 - alpha)),
    Math.round(fg[1] * alpha + bg[1] * (1 - alpha)),
    Math.round(fg[2] * alpha + bg[2] * (1 - alpha)),
  ];
}

function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const sn = c / 255;
    return sn <= 0.03928 ? sn / 12.92 : Math.pow((sn + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Walk up the DOM until we find an ancestor with a non-transparent
 *  background. Returns the resolved opaque rgb and the source element. */
function effectiveBackground(el: HTMLElement, fallback: Rgb = [255, 255, 255]): Rgb {
  let node: HTMLElement | null = el;
  while (node) {
    const cs = window.getComputedStyle(node);
    const parsed = parseCssColor(cs.backgroundColor);
    if (parsed && parsed.alpha > 0.01) {
      // Composite over fallback in case the bg is itself partially
      // transparent — good-enough approximation for a debug overlay.
      return parsed.alpha >= 0.99
        ? parsed.rgb
        : composite(parsed.rgb, parsed.alpha, fallback);
    }
    node = node.parentElement;
  }
  // No opaque ancestor found — assume slide background fallback.
  return fallback;
}

/** Categorize an element as "large text" (3:1 AA threshold) or normal
 *  (4.5:1). Per WCAG: ≥ 18pt (~24px) regular OR ≥ 14pt (~18.66px) bold. */
function isLargeText(cs: CSSStyleDeclaration): boolean {
  const px = parseFloat(cs.fontSize);
  const weight = parseInt(cs.fontWeight || '400', 10);
  if (Number.isFinite(px)) {
    if (px >= 24) return true;
    if (px >= 18.66 && weight >= 700) return true;
  }
  return false;
}

/* ────────────────────────────────────────────────────────────────────────
   Overlay component
   ──────────────────────────────────────────────────────────────────── */

interface Annotation {
  /** Short label authored on `data-debug-token`. */
  label: string;
  /** Original Tailwind class (or inline style descriptor) for cross-reference. */
  cls: string;
  /** Resolved `color` from `getComputedStyle` (the raw CSS string). */
  resolved: string;
  /** Foreground composited over the discovered background. */
  fgComposited: Rgb;
  /** Effective opaque background discovered by ancestor walk. */
  bgRgb: Rgb;
  /** WCAG 2.1 contrast ratio (1.0 – 21.0). */
  ratio: number;
  /** Threshold required for AA at this element's size/weight. */
  required: 3 | 4.5;
  /** Pass/fail vs `required`. */
  pass: boolean;
  /** Bounding box relative to the overlay root. */
  rect: { top: number; left: number; width: number; height: number };
}

interface Props {
  /** The slide root to scan. Annotations are positioned relative to this. */
  targetRef: RefObject<HTMLElement>;
  /** Master switch — typically driven from `useColorDebug()`. */
  enabled: boolean;
  /** How often to re-scan for annotations (ms). */
  pollMs?: number;
}

export function ColorTokenDebugOverlay({
  targetRef,
  enabled,
  pollMs = 400,
}: Props) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!enabled) {
      setAnnotations([]);
      return;
    }
    const root = targetRef.current;
    const overlay = overlayRef.current;
    if (!root || !overlay) return;

    let raf = 0;
    let cancelled = false;

    function scan() {
      if (cancelled) return;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const r = targetRef.current!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const o = overlayRef.current!;
      const targets = r.querySelectorAll<HTMLElement>('[data-debug-token]');
      const overlayBox = o.getBoundingClientRect();
      const next: Annotation[] = [];
      targets.forEach((el) => {
        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) return;
        const cs = window.getComputedStyle(el);
        const fgParsed = parseCssColor(cs.color);
        const bgRgb = effectiveBackground(el);
        const fgComposited = fgParsed
          ? composite(fgParsed.rgb, fgParsed.alpha, bgRgb)
          : bgRgb;
        const ratio = contrastRatio(fgComposited, bgRgb);
        const required: 3 | 4.5 = isLargeText(cs) ? 3 : 4.5;
        next.push({
          label: el.dataset.debugToken ?? '',
          cls: el.dataset.debugClass ?? '',
          resolved: cs.color,
          fgComposited,
          bgRgb,
          ratio,
          required,
          pass: ratio >= required,
          rect: {
            top: box.top - overlayBox.top,
            left: box.left - overlayBox.left,
            width: box.width,
            height: box.height,
          },
        });
      });
      setAnnotations(next);
    }

    function tick() {
      scan();
      raf = window.setTimeout(tick, pollMs) as unknown as number;
    }

    scan();
    raf = window.setTimeout(tick, pollMs) as unknown as number;

    const onResize = () => scan();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    return () => {
      cancelled = true;
      window.clearTimeout(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [enabled, targetRef, pollMs]);

  if (!enabled) return null;

  const fails = annotations.filter((a) => !a.pass).length;

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="absolute inset-0 z-50 pointer-events-none"
      data-color-token-debug="true"
    >
      {/* Legend pinned top-right. Pointer events on so the operator can
          click "off" without leaving the overlay context. */}
      <div
        className="absolute top-3 right-3 rounded-md bg-black/85 text-[10px] font-mono leading-tight text-white px-2 py-1.5 shadow-lg flex flex-col gap-0.5"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="font-semibold tracking-wide flex items-center gap-2">
          <span>color-token debug</span>
          <button
            type="button"
            onClick={() => setColorDebug(false)}
            className="ml-1 px-1.5 py-[1px] rounded bg-white/10 hover:bg-white/20 transition text-[9px]"
            title="Disable overlay"
          >
            ✕
          </button>
        </div>
        <div className="opacity-70">
          {annotations.length} annotated · {' '}
          <span className={fails > 0 ? 'text-red-300' : 'text-emerald-300'}>
            {fails === 0 ? 'all pass AA' : `${fails} fail AA`}
          </span>
        </div>
        <div className="opacity-60">
          AA = ≥ 4.5:1 (normal) · ≥ 3:1 (large/bold)
        </div>
      </div>

      {annotations.map((a, i) => (
        <ChipForAnnotation key={`${a.label}-${i}`} annotation={a} />
      ))}
    </div>
  );
}

/**
 * Single chip — drawn beside its target with a thin outline matching the
 * resolved color so a "white-on-white" failure is immediately obvious
 * (the chip's outline disappears against the chip background).
 */
function ChipForAnnotation({ annotation: a }: { annotation: Annotation }) {
  const chipTop = Math.max(2, a.rect.top - 26);
  const chipLeft = Math.max(2, a.rect.left);
  const ratioStr = a.ratio >= 21 ? '21+' : a.ratio.toFixed(2);
  const badgeClass = a.pass
    ? 'bg-emerald-500/90 text-emerald-50'
    : 'bg-red-500/90 text-red-50';
  return (
    <>
      {/* Outline around the target — stroke uses the resolved color so a
          transparent or matching-bg color collapses visibly. */}
      <div
        className="absolute"
        style={{
          top: a.rect.top,
          left: a.rect.left,
          width: a.rect.width,
          height: a.rect.height,
          border: `1px dashed ${a.resolved}`,
          boxShadow: a.pass
            ? '0 0 0 1px rgba(0,0,0,0.35)'
            : '0 0 0 2px rgba(220,38,38,0.55)',
        }}
      />
      {/* Label chip — opaque dark background so it stays readable on
          every theme. fg/bg swatches sit side-by-side so the operator
          sees both colors without leaving the slide. */}
      <div
        className="absolute rounded-sm bg-black/85 text-[10px] font-mono leading-tight text-white px-1.5 py-[2px] flex items-center gap-1.5 whitespace-nowrap shadow-md"
        style={{ top: chipTop, left: chipLeft }}
      >
        <span className="flex items-center gap-[2px]" aria-hidden>
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm border border-white/40"
            style={{
              background: `rgb(${a.fgComposited[0]},${a.fgComposited[1]},${a.fgComposited[2]})`,
            }}
            title="foreground (composited)"
          />
          <span className="opacity-50">/</span>
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm border border-white/40"
            style={{
              background: `rgb(${a.bgRgb[0]},${a.bgRgb[1]},${a.bgRgb[2]})`,
            }}
            title="effective background"
          />
        </span>
        <span className="font-semibold">{a.label}</span>
        {a.cls && <span className="opacity-70">· {a.cls}</span>}
        <span className={`px-1 rounded ${badgeClass} font-semibold`}>
          {ratioStr}:1 {a.pass ? '✓' : '✗'} AA{a.required === 3 ? '-lg' : ''}
        </span>
      </div>
    </>
  );
}
