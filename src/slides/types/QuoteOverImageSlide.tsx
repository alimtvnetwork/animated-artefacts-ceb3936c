import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec } from '../types';

/**
 * QuoteOverImageSlide — a pull-quote layered over a dimmed background photo
 * (`content.image`). Use for testimonial / quote beats where the words carry
 * the slide and the image sets the mood. The scrim keeps the quote legible;
 * `content.scrim` ('full' default | 'bottom' | 'none') tunes the dim. Under
 * `prefers-reduced-motion` the entrance is an instant fade.
 * See `spec/26-slide-definitions/_patterns/quote-over-image-slide.md`.
 */
const SCRIM_CLASS = {
  none: '',
  bottom: 'bg-gradient-to-t from-background/90 via-background/40 to-transparent',
  full: 'bg-background/70',
} as const;

function scrimClass(scrim: SlideSpec['content']['scrim']): string {
  return SCRIM_CLASS[scrim ?? 'full'];
}

export function QuoteOverImageSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = Boolean(useReducedMotion());
  const fade = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
    : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {c.image && (
        <img
          src={c.image}
          alt={c.quote ?? c.title ?? undefined}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div aria-hidden="true" className={`absolute inset-0 ${scrimClass(c.scrim)}`} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-24 text-center">
        {c.eyebrow && <p className="slide-eyebrow">{c.eyebrow}</p>}
        {c.quote && (
          <motion.blockquote {...fade} className="slide-title-display text-gold-gradient max-w-[1200px]">
            <span aria-hidden="true">“</span>
            {c.quote}
            <span aria-hidden="true">”</span>
          </motion.blockquote>
        )}
        {(c.attribution || c.attributionRole) && (
          <figcaption className="mt-2 text-foreground/85">
            {c.attribution && <span className="text-xl font-medium">{c.attribution}</span>}
            {c.attributionRole && <span className="block text-base text-foreground/60">{c.attributionRole}</span>}
          </figcaption>
        )}
      </div>
    </div>
  );
}
