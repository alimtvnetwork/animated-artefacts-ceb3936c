/**
 * AmbientBackground — reusable atmospheric layer for any slide.
 *
 * Spec: `spec/slides/24-ambient-background.md`.
 * Memory: `mem://features/ambient-background`.
 *
 * Renders a deterministic constellation of faint line-art icons behind the
 * slide content. Optional radial amber glow (matches the TitleSlide hero
 * treatment) and optional drift loop so the field feels alive without
 * being distracting.
 *
 * The layout is seeded from the `seed` prop so a given slide always
 * renders the same arrangement (no jitter on theme swap or re-render).
 *
 * GPU-only motion: opacity + transform via CSS keyframes — no JS RAF.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  FileText, Video, MessageSquare, Clipboard, UserCheck, Book, GitBranch, Users,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const DEFAULT_ICONS: ComponentType<LucideProps>[] = [
  FileText, Video, MessageSquare, Clipboard, UserCheck, Book, GitBranch, Users,
];

interface AmbientBackgroundProps {
  /** Stable seed → deterministic layout. Pass a slide title or slug. */
  seed: string;
  /** Lucide icons (or LucideProps-compatible components) to scatter. */
  icons?: ComponentType<LucideProps>[];
  /** Number of icons. Default 14. */
  count?: number;
  /** Peak opacity per icon (0–1). Default 0.05. */
  opacity?: number;
  /** Drift radius in % of stage. 0 = static. Default 0.4. */
  drift?: number;
  /** Render a soft radial amber glow above the icons. */
  glow?: boolean;
  /** Override the safe zone (% of stage to keep clean). Default {x:30, y:30}. */
  safeZone?: { x: number; y: number };
  /** Cursor parallax max-shift in px. 0 = off. Default 18. Reduced-motion → 0. */
  parallax?: number;
  /** Per-index colored accent map: indexes here render at full opacity in
   *  their own brand color. All other indexes stay faded/monochrome. */
  accentColors?: Record<number, string>;
  /** Indexes that get the gentle CSS bob (auto float). Two phases (`-a`/`-b`)
   *  alternate by parity so neighboring icons don't bob in lockstep. */
  floatIndexes?: number[];
  /** Min/max icon size in px. Default `[26, 50]` — keeps the existing
   *  scattered ambient field. Pass e.g. `[64, 110]` to render fewer, much
   *  larger icons (used by StepTimeline so the field reads as deliberate
   *  silhouettes instead of small confetti). */
  sizeRange?: [number, number];
  /**
   * Optional explicit placements — one entry per icon. When provided, this
   * REPLACES the seeded scatter entirely so the layout reproduces 1:1
   * across renderers. Each entry already encodes its own size and accent
   * (overriding `sizeRange` and `accentColors` per-slot).
   *
   * The `Icon` component is resolved by the caller from a JSON slug via
   * `ambientIconRegistry.resolveIconSlugs`.
   */
  explicitPositions?: Array<{
    Icon: ComponentType<LucideProps>;
    top: number;          // % of stage
    left: number;         // % of stage
    size?: number;        // px (defaults to sizeRange midpoint)
    accent?: string;      // hex override
    float?: boolean;
  }>;
}

interface ScatterIcon {
  Icon: ComponentType<LucideProps>;
  top: number;   // % of stage
  left: number;  // % of stage
  size: number;  // px
  delay: number; // s — fade-in delay
  drift: { dx: number; dy: number; durMs: number; phase: number };
  /** Per-icon parallax weight (0..1), seeded so each icon moves a bit
   *  differently — gives the field depth without going jittery. */
  parallaxWeight: number;
}

/** Mulberry32 — tiny seeded PRNG. Deterministic for a given seed. */
function makeRng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** String → 32-bit hash for the PRNG seed. */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickAvoidingCenter(
  rng: () => number,
  lo: number,
  hi: number,
  avoidLo: number,
  avoidHi: number,
): number {
  const v = lo + rng() * (hi - lo);
  if (v > avoidLo && v < avoidHi && rng() > 0.3) {
    return v < (avoidLo + avoidHi) / 2 ? avoidLo - rng() * 6 : avoidHi + rng() * 6;
  }
  return v;
}

function buildScatter(
  seedStr: string,
  count: number,
  iconSet: ComponentType<LucideProps>[],
  drift: number,
  safeZone: { x: number; y: number },
  sizeRange: [number, number],
): ScatterIcon[] {
  const rng = makeRng(hashString(seedStr));
  const xLo = 50 - safeZone.x / 2;
  const xHi = 50 + safeZone.x / 2;
  const yLo = 50 - safeZone.y / 2;
  const yHi = 50 + safeZone.y / 2;
  const [sizeMin, sizeMax] = sizeRange;
  const sizeSpan = Math.max(0, sizeMax - sizeMin);
  const out: ScatterIcon[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      Icon: iconSet[i % iconSet.length],
      top:  pickAvoidingCenter(rng, 8, 88, yLo, yHi),
      left: pickAvoidingCenter(rng, 8, 92, xLo, xHi),
      size: sizeMin + Math.floor(rng() * (sizeSpan + 1)),
      delay: rng() * 0.6,
      drift: {
        dx: (rng() * 2 - 1) * drift,
        dy: (rng() * 2 - 1) * drift,
        durMs: 12000 + Math.floor(rng() * 10000),
        phase: rng(),
      },
      // Each icon parallaxes 0.4–1.0 of the configured max so the field
      // moves with depth rather than as a single rigid plane.
      parallaxWeight: 0.4 + rng() * 0.6,
    });
  }
  return out;
}

export function AmbientBackground({
  seed,
  icons = DEFAULT_ICONS,
  count = 14,
  opacity = 0.05,
  drift = 0.4,
  glow = false,
  safeZone = { x: 30, y: 30 },
  parallax = 18,
  accentColors,
  floatIndexes,
  sizeRange = [26, 50],
  explicitPositions,
}: AmbientBackgroundProps) {
  const floatSet = useMemo(() => {
    // Explicit positions provide their own per-slot `float` flag; the legacy
    // `floatIndexes` prop keeps working for the seeded path.
    if (explicitPositions) {
      return new Set(
        explicitPositions
          .map((p, i) => (p.float ? i : -1))
          .filter((i) => i >= 0),
      );
    }
    return new Set(floatIndexes ?? []);
  }, [floatIndexes, explicitPositions]);
  const reduced = useReducedMotion();
  const items = useMemo(() => {
    // Explicit-positions branch: skip the seeded scatter entirely. Each
    // placement becomes one ScatterIcon. Drift is preserved via the legacy
    // RNG so authored slides still feel alive (positions stay pinned but
    // each icon still sways within a small radius).
    if (explicitPositions && explicitPositions.length > 0) {
      const rng = makeRng(hashString(seed));
      const [sizeMin, sizeMax] = sizeRange;
      const midSize = Math.round((sizeMin + sizeMax) / 2);
      const driftAmt = reduced ? 0 : drift;
      return explicitPositions.map<ScatterIcon>((p) => ({
        Icon: p.Icon,
        top: p.top,
        left: p.left,
        size: p.size ?? midSize,
        delay: rng() * 0.4,
        drift: {
          dx: (rng() * 2 - 1) * driftAmt,
          dy: (rng() * 2 - 1) * driftAmt,
          durMs: 12000 + Math.floor(rng() * 10000),
          phase: rng(),
        },
        parallaxWeight: 0.4 + rng() * 0.6,
      }));
    }
    return buildScatter(seed, count, icons, reduced ? 0 : drift, safeZone, sizeRange);
  }, [seed, count, icons, drift, reduced, safeZone, sizeRange, explicitPositions]);

  // Cursor position normalized to (-0.5..+0.5) on each axis. Updated on
  // every mousemove via a single window listener; throttled with rAF so
  // we never render more than once per frame even on a 1000Hz mouse.
  //
  // ALSO — even when no cursor is moving, we drive a slow Lissajous sway
  // so the ambient field reads as "live" rather than frozen. Without this
  // the icons just sit there until someone wiggles the mouse, which makes
  // the slide look broken on first arrival. The sway amplitude is half
  // the cursor's full range so a real cursor still dominates.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMouseAt = useRef<number>(0);
  const userTarget = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    if (reduced || parallax <= 0) return;
    let raf = 0;
    let cancelled = false;

    const onMove = (e: MouseEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Normalize cursor against the slide stage so the parallax tracks the
      // element, not the viewport. Clamp so it eases out gently at edges.
      userTarget.current.x = Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width  - 0.5));
      userTarget.current.y = Math.max(-0.5, Math.min(0.5, (e.clientY - rect.top)  / rect.height - 0.5));
      lastMouseAt.current = performance.now();
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // Single rAF loop drives both idle sway and cursor smoothing. Idle
    // amplitude is 0.18 (≈36% of the full cursor range) — enough to make
    // the field feel breathing without competing with a real cursor when
    // one shows up. Periods are coprime (7s × 11s) so the figure never
    // visibly repeats. After a real mousemove we lerp toward the user's
    // cursor for ~1.2s, then fade back to idle sway if the mouse stops.
    const tick = () => {
      if (cancelled) return;
      const now = performance.now();
      const t = now / 1000;
      const idleX = Math.sin(t * (2 * Math.PI / 7))  * 0.18;
      const idleY = Math.cos(t * (2 * Math.PI / 11)) * 0.18;
      const sinceMouse = now - lastMouseAt.current;
      // 0 right after a mousemove → 1 once the mouse has been still ≥1.2s.
      const idleBlend = lastMouseAt.current === 0
        ? 1
        : Math.min(1, Math.max(0, (sinceMouse - 200) / 1000));
      const targetX = userTarget.current.x * (1 - idleBlend) + idleX * idleBlend;
      const targetY = userTarget.current.y * (1 - idleBlend) + idleY * idleBlend;
      setCursor((prev) => {
        // Critically-damped easing toward target. Cheap, no deps.
        const nx = prev.x + (targetX - prev.x) * 0.08;
        const ny = prev.y + (targetY - prev.y) * 0.08;
        return Math.abs(nx - prev.x) < 0.0005 && Math.abs(ny - prev.y) < 0.0005
          ? prev
          : { x: nx, y: ny };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, parallax]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {/* Optional radial amber glow — same recipe as TitleSlide hero.
          Layered: a brighter warm core on top of a soft amber wash so the
          centre reads as a real glowing light against the near-black bg. */}
      {glow && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            background: `radial-gradient(ellipse 52% 40% at 50% 52%,
                hsl(38 88% 56% / 0.42) 0%,
                hsl(34 82% 46% / 0.28) 22%,
                hsl(28 72% 30% / 0.15) 44%,
                transparent 70%)`,
          }}
        />
      )}
      {items.map(({ Icon, top, left, size, delay, drift: d, parallaxWeight }, i) => {
        // Accent precedence: explicit-position `accent` (per-slot) wins over
        // the `accentColors` index map (per-pool-index). This lets a JSON
        // spec accent any individual placement without re-keying the map.
        const explicitAccent = explicitPositions?.[i]?.accent;
        const accent = explicitAccent ?? accentColors?.[i];
        const renderedOpacity = accent ? Math.min(1, opacity * 12) : opacity;
        // Parallax shift in px — negative so icons drift OPPOSITE the
        // cursor, which reads as depth (further-back things move less).
        const px = -cursor.x * parallax * parallaxWeight;
        const py = -cursor.y * parallax * parallaxWeight;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              transform: 'translate(-50%, -50%)',
              color: accent ?? undefined,
            }}
            initial={{ opacity: 0 }}
            animate={
              reduced
                ? { opacity: renderedOpacity }
                : {
                    opacity: renderedOpacity,
                    // Combine ambient drift with cursor parallax. The
                    // parallax px/py are constant offsets baked into the
                    // keyframe series so the loop oscillates AROUND the
                    // current cursor target.
                    x: [px + 0, px + d.dx * 16, px + 0, px - d.dx * 16, px + 0],
                    y: [py + 0, py + d.dy * 16, py + 0, py - d.dy * 16, py + 0],
                  }
            }
            transition={
              reduced
                ? { duration: 1.2, delay: 0.2 + delay, ease: 'easeOut' }
                : {
                    opacity: { duration: 1.2, delay: 0.2 + delay, ease: 'easeOut' },
                    x: { duration: d.durMs / 1000, repeat: Infinity, ease: 'easeInOut', delay: d.phase * 4 },
                    y: { duration: d.durMs / 1000 * 1.3, repeat: Infinity, ease: 'easeInOut', delay: d.phase * 3 },
                  }
            }
          >
            <span className={floatSet.has(i) ? (i % 2 === 0 ? 'ambient-float-a' : 'ambient-float-b') : ''} style={{ display: 'inline-block' }}>
              <Icon
                strokeWidth={accent ? 1.5 : 1}
                style={{ width: size, height: size }}
                className={accent ? '' : 'text-foreground'}
              />
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
