import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec } from '../types';

/**
 * LogoWallSlide — a tidy grid of brand/partner logos with an optional
 * eyebrow + title. Logos render desaturated by default (`grayscale` default
 * true) so the wall reads as one calm field; set `grayscale: false` for full
 * color. Column count auto-derives from the logo count unless `columns` is
 * given (2–6). Each logo can carry an optional `name` (used as alt text) and
 * `href` (decorative — not a live link in presentation mode).
 *
 * Reduced motion (or `content.freezeOnReducedMotion`) collapses the entrance
 * stagger to an instant fade.
 * See `spec/26-slide-definitions/_patterns/logo-wall-slide.md`.
 */
function columnsFor(count: number): number {
  if (count <= 4) return Math.max(2, count);
  if (count <= 6) return 3;
  if (count <= 9) return 3;
  if (count <= 12) return 4;
  return 5;
}

export function LogoWallSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = Boolean(useReducedMotion());
  const logos = c.logos ?? [];
  const cols = c.columns ?? columnsFor(logos.length);
  const grayscale = c.grayscale !== false;
  const freeze = reduced || c.freezeOnReducedMotion === true;

  const container = freeze
    ? {}
    : { animate: { transition: { staggerChildren: 0.06, delayChildren: 0.18 } } };
  const item = freeze
    ? { opacity: 1 }
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="flex h-full flex-col justify-center gap-10 px-16 py-20">
      {(c.eyebrow || c.title) && (
        <header className="flex flex-col gap-2 text-center">
          {c.eyebrow && <p className="slide-eyebrow">{c.eyebrow}</p>}
          {c.title && <h2 className="slide-title-display text-gold-gradient">{c.title}</h2>}
        </header>
      )}
      <motion.div
        variants={container as never}
        initial="initial"
        animate="animate"
        className="grid flex-1 content-center gap-x-10 gap-y-8"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {logos.map((logo, i) => (
          <motion.figure
            key={i}
            variants={item as never}
            className="group flex items-center justify-center rounded-xl border border-foreground/10 bg-foreground/[0.03] p-6 transition-colors"
          >
            <img
              src={logo.src}
              alt={logo.name ?? ''}
              draggable={false}
              className={`max-h-16 w-full object-contain opacity-80 transition-all duration-300 group-hover:opacity-100 ${
                grayscale ? 'grayscale group-hover:grayscale-0' : ''
              }`}
            />
          </motion.figure>
        ))}
      </motion.div>
    </div>
  );
}
