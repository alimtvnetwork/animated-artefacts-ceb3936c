/**
 * BlastRadiusSlide — cinematic single-word title moment.
 *
 * Spec: `spec/26-slide-definitions/_patterns/blast-radius-slide.md`.
 *
 * Layer stack (back → front):
 *   1. SlideStage `bg-background`
 *   2. Radial vignette (`hsl(var(--ink) / 0.85)` corners → transparent)
 *   3. Particulate field (CSS-animated drifting dots, gold/cream tokens)
 *   4. SVG shard cluster (irregular polygons, tumbling on random 3D axes)
 *   5. Chrome title (theme-token gradient + sweeping shimmer overlay)
 *   6. Optional eyebrow + subtitle
 *
 * Outro: registered as `SlideTransition.ZoomOut` in `transitions.ts` —
 * the entire stage scales 1.0 → 1.18 + fades over 600ms (expoIn) on
 * exit, so the next slide feels like it arrives from behind the title.
 *
 * All decorative layers are `pointer-events: none` and `aria-hidden`.
 * Under `prefers-reduced-motion` the particle and shard layers do not
 * render at all (no DOM, not just paused) and the title falls back to
 * a 240ms fade.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import type { SlideSpec } from '../types';

/** Deterministic LCG so shards/particles are identical every render. */
function rng(seedStr: string) {
  let s = 0;
  for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

interface Particle {
  x: number; y: number; size: number; opacity: number;
  color: 'gold' | 'cream'; blur: number;
  duration: number; delay: number; dx: number; dy: number;
}

function buildParticles(count: number, seed: string): Particle[] {
  const r = rng(seed + ':p');
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: r() * 1920,
      y: r() * 1080,
      size: 1.5 + r() * 2.5,
      opacity: 0.2 + r() * 0.65,
      color: r() > 0.5 ? 'gold' : 'cream',
      blur: r() > 0.7 ? 0.5 + r() * 0.5 : 0,
      duration: 12 + r() * 10,
      delay: -r() * 22, // negative → already in motion on mount
      dx: -40 + r() * 80,
      dy: -60 + r() * 40,
    });
  }
  return out;
}

interface Shard {
  cx: number; cy: number;
  points: string;
  axis: { x: number; y: number; z: number };
  tumbleDur: number;
  floatDur: number; floatDx: number; floatDy: number;
  glintDelay: number;
}

/** Generate an irregular convex N-gon centered at (0,0). */
function shardPoints(r: () => number, sides: number, radius: number) {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 + (r() - 0.5) * 0.4;
    const rad = radius * (0.7 + r() * 0.6);
    pts.push(`${Math.cos(angle) * rad},${Math.sin(angle) * rad}`);
  }
  return pts.join(' ');
}

function buildShards(count: number, seed: string): Shard[] {
  const r = rng(seed + ':s');
  const out: Shard[] = [];
  // Centered safe zone: 40% × 30% rect (no shard centers inside).
  const safeX = [1920 * 0.30, 1920 * 0.70] as const;
  const safeY = [1080 * 0.35, 1080 * 0.65] as const;
  let attempts = 0;
  while (out.length < count && attempts < count * 30) {
    attempts++;
    const cx = r() * 1920;
    const cy = r() * 1080;
    if (cx > safeX[0] && cx < safeX[1] && cy > safeY[0] && cy < safeY[1]) continue;
    const sides = r() > 0.5 ? 5 : 6;
    const radius = 30 + r() * 60; // → edge length ~60–180px
    // Random unit axis for rotate3d.
    const ax = r() - 0.5; const ay = r() - 0.5; const az = r() - 0.5;
    const len = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
    out.push({
      cx, cy,
      points: shardPoints(r, sides, radius),
      axis: { x: ax / len, y: ay / len, z: az / len },
      tumbleDur: 14 + r() * 12,
      floatDur: 9 + r() * 6,
      floatDx: -90 + r() * 180,
      floatDy: -60 + r() * 120,
      glintDelay: r() * 12,
    });
  }
  return out;
}

export function BlastRadiusSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content as SlideSpec['content'] & {
    particleCount?: number;
    shardCount?: number;
    gradientAngle?: number;
  };
  const reduced = useReducedMotion();

  const seed = `blast-${spec.slideName ?? c.title ?? spec.slideNumber}`;
  const particleCount = reduced ? 0 : (c.particleCount ?? 60);
  const shardCount = reduced ? 0 : (c.shardCount ?? 7);
  const gradAngle = c.gradientAngle ?? 180;

  const particles = useMemo(
    () => buildParticles(particleCount, seed),
    [particleCount, seed],
  );
  const shards = useMemo(
    () => buildShards(shardCount, seed),
    [shardCount, seed],
  );

  // Spring-driven entrance for the title — short, punchy, settles fast.
  const titleEntrance = reduced
    ? { opacity: 1, scale: 1, transition: { duration: 0.24, ease: 'easeOut' as const } }
    : {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring' as const, damping: 18, stiffness: 140, mass: 1 },
      };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Layer 1 — radial vignette. Uses `--ink` so paper-ink remaps it
          (where `--ink` is repurposed to a paper background, the corner
          tint flips automatically and stays subtle). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, transparent 55%, hsl(var(--ink) / 0.85) 100%)',
        }}
      />

      {/* Layer 2 — particle field. Skipped entirely under reduced-motion. */}
      {particleCount > 0 && (
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none blast-stage">
          {particles.map((p, i) => (
            <span
              key={i}
              className="blast-particle"
              style={{
                position: 'absolute',
                left: `${(p.x / 1920) * 100}%`,
                top: `${(p.y / 1080) * 100}%`,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                background: `hsl(var(--${p.color}))`,
                borderRadius: '50%',
                filter: p.blur ? `blur(${p.blur}px)` : undefined,
                ['--bx' as string]: `${p.dx}px`,
                ['--by' as string]: `${p.dy}px`,
                animation: `blast-drift ${p.duration}s linear ${p.delay}s infinite`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Layer 3 — shard cluster. SVG so stroke recolors via theme tokens. */}
      {shardCount > 0 && (
        <svg
          aria-hidden="true"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {shards.map((s, i) => (
            <g
              key={i}
              className="blast-shard"
              style={{
                ['--sx' as string]: `${s.floatDx}px`,
                ['--sy' as string]: `${s.floatDy}px`,
                ['--ax' as string]: s.axis.x.toFixed(3),
                ['--ay' as string]: s.axis.y.toFixed(3),
                ['--az' as string]: s.axis.z.toFixed(3),
                ['--tumble-dur' as string]: `${s.tumbleDur}s`,
                ['--float-dur' as string]: `${s.floatDur}s`,
                ['--glint-delay' as string]: `${s.glintDelay}s`,
                transformOrigin: `${s.cx}px ${s.cy}px`,
                transformBox: 'fill-box',
              } as React.CSSProperties}
            >
              <g style={{ transform: `translate(${s.cx}px, ${s.cy}px)` }}>
                <polygon
                  points={s.points}
                  fill="none"
                  stroke="hsl(var(--cream) / 0.45)"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  className="blast-shard-edge"
                />
                <polygon
                  points={s.points}
                  fill="none"
                  stroke="hsl(var(--cream) / 0.18)"
                  strokeWidth={1}
                  strokeLinejoin="round"
                  transform="scale(0.4)"
                />
              </g>
            </g>
          ))}
        </svg>
      )}

      {/* Layer 4 — title block. Centered both axes; max-width clamps. */}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-12">
        <div className="w-full" style={{ maxWidth: 'min(92%, 1700px)' }}>
          {c.eyebrow && (
            <motion.span
              className="slide-eyebrow block mb-6"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
              style={{ letterSpacing: '0.4em' }}
            >
              {c.eyebrow}
            </motion.span>
          )}
          {c.title && (
            <motion.h1
              className="slide-title-display blast-title"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.86 }}
              animate={titleEntrance}
              style={{
                fontWeight: 700,
                fontSize: 'clamp(8rem, 14vw, 18rem)',
                lineHeight: 1.0,
                letterSpacing: '-0.02em',
                margin: 0,
                background: `linear-gradient(${gradAngle}deg, hsl(var(--gold)) 0%, hsl(var(--cream)) 50%, hsl(var(--ember)) 100%)`,
                backgroundSize: '200% 200%',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                position: 'relative',
                animation: reduced
                  ? undefined
                  : 'blast-title-settle 0.32s ease-out 0.05s 1 both',
              }}
            >
              {c.title}
              {!reduced && (
                <span aria-hidden="true" className="blast-title-shimmer" />
              )}
            </motion.h1>
          )}
          {c.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: reduced ? 0.3 : 0.85, ease: 'easeOut' }}
              style={{
                color: 'hsl(var(--foreground) / 0.72)',
                fontWeight: 400,
                fontSize: 'clamp(1rem, 1.4vw, 1.5rem)',
                marginTop: 28,
                letterSpacing: '0.04em',
              }}
            >
              {c.subtitle}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
