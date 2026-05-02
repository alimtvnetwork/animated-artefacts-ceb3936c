import { motion } from 'framer-motion';
import type { SlideSpec } from '../types';
import { SlotImage } from '../components/SlotImage';

/**
 * ImageSlide — centered figure, wrapped in `SlotImage` so the bodyFigure slot
 * rules (max 1600×864 in stage px, contain-fit, soft card chrome) apply
 * consistently. Authors can override the slot via `content.imageRole` once
 * that field is added to the spec; until then the resolver picks
 * `bodyFigure` automatically for ImageSlide.
 */
export function ImageSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  return (
    <div className="flex h-full items-center justify-center px-12">
      {c.image && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center"
        >
          <SlotImage
            src={c.image}
            alt={c.title ?? undefined}
            hint={{ slideType: spec.slideType }}
          />
        </motion.div>
      )}
      {c.title && (
        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 font-display text-3xl text-gold-gradient"
        >
          {c.title}
        </motion.h3>
      )}
    </div>
  );
}
