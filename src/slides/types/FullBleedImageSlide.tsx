import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec } from '../types';

/**
 * FullBleedImageSlide — edge-to-edge hero image/GIF with an optional
 * legibility scrim and overlaid eyebrow + title + caption. The photo IS the
 * slide; no body copy. Reduced motion (or `content.freezeOnReducedMotion`)
 * collapses the entrance to an instant fade.
 * See `spec/26-slide-definitions/_patterns/full-bleed-image-slide.md`.
 */
const SCRIM_CLASS = {
  none: '',
  bottom: 'bg-gradient-to-t from-background/85 via-background/30 to-transparent',
  full: 'bg-background/55',
} as const;

function resolveScrim(scrim: SlideSpec['content']['scrim']): string {
  return SCRIM_CLASS[scrim ?? 'bottom'];
}

function useEnter(isFrozen: boolean) {
  const reduced = useReducedMotion();
  if (reduced || isFrozen) return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } };
  return {
    initial: { opacity: 0, scale: 1.06 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export function FullBleedImageSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const enter = useEnter(Boolean(c.freezeOnReducedMotion));
  const hasText = Boolean(c.eyebrow || c.title || c.caption);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {c.image && (
        <motion.img
          {...enter}
          src={c.image}
          alt={c.title ?? c.caption ?? undefined}
          draggable={false}
          className="h-full w-full object-cover"
        />
      )}
      <div className={`pointer-events-none absolute inset-0 ${resolveScrim(c.scrim)}`} />
      {hasText && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-16 pb-20"
        >
          {c.eyebrow && <p className="slide-eyebrow">{c.eyebrow}</p>}
          {c.title && <h2 className="slide-title-display text-gold-gradient">{c.title}</h2>}
          {c.caption && <p className="slide-caption max-w-[900px] text-foreground/80">{c.caption}</p>}
        </motion.div>
      )}
    </div>
  );
}
