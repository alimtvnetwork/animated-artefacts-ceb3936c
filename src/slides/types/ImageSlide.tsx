import { motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import type { SlideSpec } from '../types';
import { SlotImage } from '../components/SlotImage';

/**
 * ImageSlide — centered figure(s), wrapped in `SlotImage` so the placement
 * slot rules (max dimensions, contain-fit, soft card chrome) apply
 * consistently. Supports:
 *   - `content.image`     — single figure (default `bodyFigure` slot).
 *   - `content.images[]`  — 2–3 figure gallery row (each `inlineThumbnail`).
 *   - `content.caption`   — one-line caption under the figure(s).
 *   - `content.imageRole` — explicit slot override for the single image.
 *
 * Reduced motion collapses the entrance to an instant opacity fade.
 * See `spec/21-slides-system/images/01-image-authoring.md`.
 */
const INLINE_SIZE_WARN_BYTES = 10_000;

function warnIfHeavyInlineImage(src: string | undefined) {
  if (!import.meta.env.DEV || !src || !src.startsWith('data:')) return;
  // Rough byte estimate from the data-URI payload length.
  if (src.length > INLINE_SIZE_WARN_BYTES) {
    // eslint-disable-next-line no-console
    console.warn(
      `[ImageSlide] inline data-URI image is ${(src.length / 1024).toFixed(1)} KB ` +
        `(> ${INLINE_SIZE_WARN_BYTES / 1024} KB). Prefer a CDN asset via lovable-assets ` +
        `for large images. See spec/21-slides-system/images/01-image-authoring.md.`,
    );
  }
}

export function ImageSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const gallery = Array.isArray(c.images) && c.images.length > 0 ? c.images : null;

  useEffect(() => {
    warnIfHeavyInlineImage(c.image);
    gallery?.forEach(warnIfHeavyInlineImage);
  }, [c.image, gallery]);

  const enter = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
    : {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-12 pb-24">
      {gallery ? (
        <motion.div {...enter} className="flex items-center justify-center gap-8">
          {gallery.map((src, i) => (
            <SlotImage
              key={i}
              src={src}
              alt={c.caption ?? c.title ?? undefined}
              hint={{ slideType: spec.slideType, role: 'inlineThumbnail' }}
            />
          ))}
        </motion.div>
      ) : (
        c.image && (
          <motion.div {...enter} className="flex items-center justify-center">
            <SlotImage
              src={c.image}
              alt={c.title ?? undefined}
              hint={{ slideType: spec.slideType, role: c.imageRole }}
            />
          </motion.div>
        )
      )}

      {c.caption && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.35 }}
          className="slide-caption max-w-[1000px] text-center text-foreground/70"
        >
          {c.caption}
        </motion.p>
      )}

      {c.title && (
        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.3 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 font-display text-3xl text-gold-gradient"
        >
          {c.title}
        </motion.h3>
      )}
    </div>
  );
}
