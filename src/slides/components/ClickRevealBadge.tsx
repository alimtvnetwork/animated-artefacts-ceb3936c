import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { SlideSpec } from '../types';
import { allSlides } from '../loader';

interface Props {
  slide: SlideSpec;
  onBack: (parentSlideNumber: number) => void;
}

/**
 * Badge rendered at the top of every `isClickReveal` slide.
 *
 * Click-reveal slides are *not* part of the linear flow — they're hidden
 * detail views surfaced by clicking a capsule (or hotspot) on a parent
 * slide. Without an explicit indicator, presenters land on one and have no
 * idea they've stepped sideways out of the deck.
 *
 * The badge does three things:
 *   1. Visually marks the slide as a hidden detail (gold sparkle + label).
 *   2. Names the parent slide so the presenter knows where they came from.
 *   3. Provides a clear "Back to {parent}" button — the same action that
 *      the controller's prev/next already wires up, but discoverable on the
 *      slide itself.
 *
 * Sits below the BrandHeader/strip so it never collides with chrome.
 */
export function ClickRevealBadge({ slide, onBack }: Props) {
  if (!slide.isClickReveal || !slide.parentSlide) return null;
  const parent = allSlides.find((s) => s.slideNumber === slide.parentSlide);
  const parentLabel = parent?.content.title ?? parent?.slideName ?? `Slide ${slide.parentSlide}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2"
    >
      <span className="inline-flex items-center gap-2 h-8 pl-3 pr-3.5 rounded-full bg-gold/15 border border-gold/40 backdrop-blur-md text-[11px] font-semibold tracking-[0.18em] uppercase text-gold whitespace-nowrap">
        <Sparkles className="h-3 w-3" />
        Hidden detail
      </span>
      <button
        type="button"
        onClick={() => onBack(slide.parentSlide!)}
        className="lift-hover-subtle inline-flex items-center gap-2 h-8 pl-2.5 pr-3.5 rounded-full bg-ink/70 border border-cream/20 backdrop-blur-md text-[11px] font-semibold tracking-[0.12em] uppercase text-cream hover:border-gold/60 hover:text-gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        aria-label={`Back to ${parentLabel}`}
        title={`Back to ${parentLabel}`}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="max-w-[180px] truncate normal-case tracking-normal text-xs">
          Back to <span className="text-gold">{parentLabel}</span>
        </span>
      </button>
    </motion.div>
  );
}
