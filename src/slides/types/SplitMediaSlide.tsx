import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec } from '../types';
import { Capsule } from '../components/Capsule';

/**
 * SplitMediaSlide — two-column "show + tell": media (image/GIF) on one half,
 * a text column (eyebrow + title + keywords + capsules) on the other.
 * `content.mediaSide` ('left' default | 'right') picks the media half.
 * Reduced motion collapses both columns to an instant fade.
 * See `spec/26-slide-definitions/_patterns/split-media-slide.md`.
 */
function useEnter() {
  const reduced = useReducedMotion();
  if (reduced) return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } };
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  };
}

function MediaColumn({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return <div className="rounded-2xl bg-muted/30" />;
  return (
    <img src={src} alt={alt} draggable={false} className="h-full w-full rounded-2xl object-cover" />
  );
}

export function SplitMediaSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const enter = useEnter();
  const mediaFirst = (c.mediaSide ?? 'left') === 'left';

  const text = (
    <motion.div {...enter} className="flex flex-col justify-center gap-5">
      {c.eyebrow && <p className="slide-eyebrow">{c.eyebrow}</p>}
      {c.title && <h2 className="slide-title-display text-gold-gradient">{c.title}</h2>}
      {c.keywords?.length ? (
        <ul className="flex flex-col gap-2">
          {c.keywords.map((k, i) => (
            <li key={i} className="slide-caption text-foreground/80">{k}</li>
          ))}
        </ul>
      ) : null}
      {c.capsules?.length ? (
        <div className="flex flex-wrap gap-3">
          {c.capsules.map((cap, i) => <Capsule key={i} spec={cap} />)}
        </div>
      ) : null}
    </motion.div>
  );

  const media = (
    <motion.div {...enter} className="h-full">
      <MediaColumn src={c.image} alt={c.title ?? undefined} />
    </motion.div>
  );

  return (
    <div className="grid h-full grid-cols-2 items-stretch gap-12 px-16 py-20">
      {mediaFirst ? media : text}
      {mediaFirst ? text : media}
    </div>
  );
}
