import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec } from '../types';

/**
 * GifLoopSlide — a looping animated GIF centered on the stage with an optional
 * eyebrow + title + caption. The browser auto-loops the GIF; under
 * `prefers-reduced-motion` (or `content.freezeOnReducedMotion`) the runtime
 * swaps it for a static `content.poster` so motion-sensitive viewers see a
 * frozen frame. Falls back to the GIF if no poster is supplied.
 * See `spec/26-slide-definitions/_patterns/gif-loop-slide.md`.
 */
function resolveSrc(c: SlideSpec['content'], isFrozen: boolean): string | undefined {
  if (isFrozen && c.poster) return c.poster;
  return c.image;
}

function useFade(isFrozen: boolean) {
  const reduced = useReducedMotion();
  const instant = reduced || isFrozen;
  return {
    initial: { opacity: 0, scale: instant ? 1 : 0.96 },
    animate: { opacity: 1, scale: 1 },
    transition: instant ? { duration: 0.2 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export function GifLoopSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const isFrozen = Boolean(reduced || c.freezeOnReducedMotion);
  const fade = useFade(isFrozen);
  const src = resolveSrc(c, isFrozen);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-16">
      {c.eyebrow && <p className="slide-eyebrow">{c.eyebrow}</p>}
      {c.title && <h2 className="slide-title-display text-gold-gradient text-center">{c.title}</h2>}
      {src && (
        <motion.img
          {...fade}
          src={src}
          alt={c.title ?? c.caption ?? undefined}
          draggable={false}
          className="max-h-[62%] max-w-[80%] rounded-2xl object-contain shadow-2xl"
        />
      )}
      {c.caption && <p className="slide-caption max-w-[900px] text-center text-foreground/80">{c.caption}</p>}
    </div>
  );
}
