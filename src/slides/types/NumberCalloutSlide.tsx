import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec } from '../types';
import { useCountUp } from '../hooks/useCountUp';

/**
 * NumberCalloutSlide — addendum 29 §2.3.
 *
 * Renders ONE oversized animated number. Density cap = 1 number.
 * Reduced motion → snaps to final via `useCountUp`.
 */
export function NumberCalloutSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const n = c.number;

  const display = useCountUp({
    from: n?.from ?? 0,
    to: n?.to ?? 0,
    duration: n?.duration ?? 'slow',
    easing: n?.easing ?? 'easeOutQuint',
    decimals: n?.decimals,
  });

  if (!n) return null;

  return (
    <div
      role="region"
      aria-label={c.eyebrow ?? 'Number callout'}
      className="relative h-full w-full flex flex-col items-center justify-center"
      style={{ background: 'hsl(var(--background))' }}
    >
      {c.eyebrow && (
        <motion.span
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="slide-eyebrow mb-8"
        >
          {c.eyebrow}
        </motion.span>
      )}

      <div className="flex items-baseline gap-3">
        <span className="number-callout-value" aria-live="polite">{display}</span>
        {n.unit && (
          <span className="number-callout-value" style={{ fontSize: '0.45em', color: 'hsl(var(--ember))' }}>
            {n.unit}
          </span>
        )}
      </div>

      {c.label && (
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className="slide-subtitle mt-10 max-w-[36ch] text-center"
        >
          {c.label}
        </motion.p>
      )}

      {c.capsule && (
        <motion.span
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
          className={`mt-8 inline-flex items-center px-4 py-1.5 rounded-full border text-sm
            ${c.capsule.color === 'gold'  ? 'border-[hsl(var(--gold))]  text-[hsl(var(--gold))]'  : ''}
            ${c.capsule.color === 'ember' ? 'border-[hsl(var(--ember))] text-[hsl(var(--ember))]' : ''}
            ${c.capsule.color === 'cream' ? 'border-[hsl(var(--cream))] text-[hsl(var(--cream))]' : ''}`}
        >
          {c.capsule.text}
        </motion.span>
      )}
    </div>
  );
}
