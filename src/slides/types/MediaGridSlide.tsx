import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec } from '../types';

/**
 * MediaGridSlide — 2–6 image/SVG tiles with optional captions. Layout
 * auto-derives from the tile count (2→1×2, 3→1×3, 4→2×2, 5/6→2×3). Density
 * cap `capTiles` (≤6) is enforced at load via `densityCheck`. Reduced motion
 * collapses the stagger to an instant fade.
 * See `spec/26-slide-definitions/_patterns/media-grid-slide.md`.
 */
function gridClassFor(count: number): string {
  if (count <= 2) return 'grid-cols-2 grid-rows-1';
  if (count === 3) return 'grid-cols-3 grid-rows-1';
  if (count === 4) return 'grid-cols-2 grid-rows-2';
  return 'grid-cols-3 grid-rows-2';
}

function useStagger(reduced: boolean) {
  if (reduced) return { container: {}, item: { opacity: 1 } };
  return {
    container: { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } },
    item: { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } },
  };
}

export function MediaGridSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = Boolean(useReducedMotion());
  const tiles = c.mediaTiles ?? [];
  const s = useStagger(reduced);

  return (
    <div className="flex h-full flex-col justify-center gap-8 px-16 py-20">
      <header className="flex flex-col gap-2">
        {c.eyebrow && <p className="slide-eyebrow">{c.eyebrow}</p>}
        {c.title && <h2 className="slide-title-display text-gold-gradient">{c.title}</h2>}
      </header>
      <motion.div
        variants={s.container as never}
        initial="initial"
        animate="animate"
        className={`grid flex-1 gap-6 ${gridClassFor(tiles.length)}`}
      >
        {tiles.map((tile, i) => (
          <motion.figure key={i} variants={s.item as never} className="flex min-h-0 flex-col gap-2">
            <img
              src={tile.src}
              alt={tile.caption ?? ''}
              draggable={false}
              className="min-h-0 w-full flex-1 rounded-xl object-cover"
            />
            {tile.caption && <figcaption className="slide-caption text-foreground/70">{tile.caption}</figcaption>}
          </motion.figure>
        ))}
      </motion.div>
    </div>
  );
}
