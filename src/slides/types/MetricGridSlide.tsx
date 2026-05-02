import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec, MetricSpec } from '../types';
import { titleClassFor } from '../preset';
import { AmbientBackground } from '../components/AmbientBackground';

/**
 * MetricGridSlide
 *
 * Compact 2–6 cell grid of headline numbers. Each cell renders a huge
 * accent-colored value, a quiet label, and an optional one-line caption.
 *
 * Layout auto-derives from `metrics.length`:
 *   2 → 1×2  (two-up)
 *   3 → 1×3  (three-up)
 *   4 → 2×2
 *   5 → 2×3 with one empty slot
 *   6 → 2×3
 *
 * Spec: `spec/slides/llm/22b-metric-grid-worked-example.md`.
 */
/**
 * Accent → Tailwind class. The vibrant variants use `metric-accent-*`
 * helpers (defined in src/index.css) instead of inline HSL so light themes
 * (github-light, macos-sonoma) can darken them for legibility on a white
 * slide bg without touching this file.
 */
const ACCENT_CLASS: Record<NonNullable<MetricSpec['accent']>, string> = {
  gold:    'metric-accent-gold',
  ember:   'metric-accent-ember',
  cream:   'metric-accent-cream',
  ink:     'text-foreground',
  outline: 'metric-accent-cream',
  violet:  'metric-accent-violet',
  teal:    'metric-accent-teal',
  rose:    'metric-accent-rose',
  sky:     'metric-accent-sky',
};

function gridClassFor(count: number): string {
  if (count <= 2) return 'grid-cols-2 grid-rows-1';
  if (count === 3) return 'grid-cols-3 grid-rows-1';
  if (count === 4) return 'grid-cols-2 grid-rows-2';
  return 'grid-cols-3 grid-rows-2'; // 5 or 6
}

export function MetricGridSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const metrics = c.metrics ?? [];

  return (
    <div
      role="region"
      aria-label={`Metric grid: ${c.title ?? spec.slideName}`}
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
    >
      <AmbientBackground seed={`metric-grid-${spec.slideName}`} count={10} opacity={0.05} drift={0.3} />

      <div className="absolute inset-0 flex flex-col pt-32 pb-20 px-[var(--brand-inset-x,clamp(48px,15vw,288px))]">
        {/* Eyebrow + title block */}
        <header className="mb-12">
          {c.eyebrow && (
            <motion.span
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="slide-eyebrow"
            >
              {c.eyebrow}
            </motion.span>
          )}
          {c.title && (
            <motion.h2
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
              className={`slide-title-content ${titleClassFor(spec)} mt-3`}
            >
              {c.title}
            </motion.h2>
          )}
          {c.subtitle && (
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
              className="slide-subtitle mt-4 max-w-[1100px]"
            >
              {c.subtitle}
            </motion.p>
          )}
        </header>

        {/* Metric grid. `content.metricLayout` (optional) lets a deck pin
            the column/row count, gap, and value font-size so the layout
            reproduces 1:1 across renderers. Falls back to the auto-derived
            grid + legacy gaps when omitted. */}
        {(() => {
          const layout = c.metricLayout;
          const cols = layout?.columns ?? null;
          const rows = layout?.rows ?? null;
          const gapX = Math.max(0, Math.min(160, layout?.gapXPx ?? 48));
          const gapY = Math.max(0, Math.min(160, layout?.gapYPx ?? 56));
          const valueSize = layout?.valueSize ?? 'clamp(4rem, 9vw, 9rem)';
          const gridStyle: React.CSSProperties = (cols || rows)
            ? {
                display: 'grid',
                gridTemplateColumns: cols ? `repeat(${cols}, minmax(0, 1fr))` : undefined,
                gridTemplateRows: rows ? `repeat(${rows}, minmax(0, 1fr))` : undefined,
                columnGap: `${gapX}px`,
                rowGap: `${gapY}px`,
              }
            : { columnGap: `${gapX}px`, rowGap: `${gapY}px` };
          const autoGridClass = (cols || rows)
            ? 'flex-1 content-center'
            : `grid ${gridClassFor(metrics.length)} flex-1 content-center`;
          return (
        <div
          aria-label="Metrics"
          className={autoGridClass}
          style={gridStyle}
        >
          {metrics.map((m, i) => {
            const accent = ACCENT_CLASS[m.accent ?? 'gold'];
            return (
              <motion.figure
                key={`${m.label}-${i}`}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                  delay: reduced ? 0 : 0.18 + i * 0.08,
                }}
                className="flex flex-col items-start gap-3"
              >
                <span
                  className={`font-display font-bold leading-none tracking-tight ${accent}`}
                  style={{ fontSize: valueSize }}
                >
                  {m.value}
                </span>
                <figcaption className="text-foreground font-semibold text-2xl tracking-tight">
                  {m.label}
                </figcaption>
                {m.caption && (
                  <p className="text-foreground/65 text-base leading-snug max-w-[28ch]">
                    {m.caption}
                  </p>
                )}
              </motion.figure>
            );
          })}
        </div>
        );
        })()}
      </div>
    </div>
  );
}
