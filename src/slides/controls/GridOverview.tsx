import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { linearSlides } from '../loader';
import type { SlideSpec } from '../types';
import { TitleSlide } from '../types/TitleSlide';
import { KeywordSlide } from '../types/KeywordSlide';
import { CapsuleListSlide } from '../types/CapsuleListSlide';
import { StepTimelineSlide } from '../types/StepTimelineSlide';
import { QrMeetingSlide } from '../types/QrMeetingSlide';
import { ImageSlide } from '../types/ImageSlide';
import { SectionDividerSlide } from '../types/SectionDividerSlide';
import { MetricGridSlide } from '../types/MetricGridSlide';
import { TableSlide } from '../types/TableSlide';
import { CodeBlockSlide } from '../types/CodeBlockSlide';
import { BoxDiagramSlide } from '../types/BoxDiagramSlide';
import { LayoutSlide } from '../types/LayoutSlide';
import { BlastRadiusSlide } from '../types/BlastRadiusSlide';
import { BrandHeader } from '../components/BrandHeader';

interface Props {
  open: boolean;
  current: number;
  onJump: (slideNumber: number) => void;
  onClose: () => void;
}

const SLIDE_W = 1920;
const SLIDE_H = 1080;
const TILE_W = 320; // ~16:9 → height 180

/** Renders the same React body the live stage uses, so thumbnails are pixel-accurate. */
function renderBody(slide: SlideSpec) {
  switch (slide.slideType) {
    case 'TitleSlide':         return <TitleSlide spec={slide} />;
    case 'KeywordSlide':       return <KeywordSlide spec={slide} />;
    case 'CapsuleListSlide':   return <CapsuleListSlide spec={slide} onCapsuleClickReveal={() => {}} />;
    case 'StepTimelineSlide':  return <StepTimelineSlide spec={slide} />;
    case 'QrMeetingSlide':     return <QrMeetingSlide spec={slide} />;
    case 'ImageSlide':         return <ImageSlide spec={slide} />;
    case 'SectionDividerSlide':return <SectionDividerSlide spec={slide} />;
    case 'MetricGridSlide':    return <MetricGridSlide spec={slide} />;
    case 'TableSlide':         return <TableSlide spec={slide} />;
    case 'CodeBlockSlide':     return <CodeBlockSlide spec={slide} />;
    case 'BoxDiagramSlide':    return <BoxDiagramSlide spec={slide} />;
    case 'LayoutSlide':        return <LayoutSlide spec={slide} />;
    case 'BlastRadiusSlide':   return <BlastRadiusSlide spec={slide} />;
    default:                   return <TitleSlide spec={slide} />;
  }
}

function Thumbnail({ slide, isCurrent, onClick }: { slide: SlideSpec; isCurrent: boolean; onClick: () => void }) {
  const scale = TILE_W / SLIDE_W;
  return (
    <button
      onClick={onClick}
      className={`group relative rounded-xl overflow-hidden text-left focus:outline-none ${
        isCurrent
          ? 'ring-2 ring-gold shadow-[0_0_24px_-4px_hsl(var(--gold)/0.5)]'
          : 'ring-1 ring-border hover:ring-gold/60 lift-hover'
      }`}
      style={{ width: TILE_W, height: TILE_W * (SLIDE_H / SLIDE_W) }}
      aria-label={`Jump to slide ${slide.slideNumber}: ${slide.slideName}`}
    >
      {/* Scaled inner stage — exactly 1920x1080 then transform-scaled to tile size. */}
      <div
        className="absolute top-0 left-0 origin-top-left bg-background"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
        }}
      >
        <div className="relative h-full w-full overflow-hidden noise">
          {slide.showBrandHeader && <BrandHeader showPresenter={slide.showPresenterChip} />}
          {renderBody(slide)}
        </div>
      </div>

      {/* Footer label */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <span className="text-xs font-mono text-gold">{String(slide.slideNumber).padStart(2, '0')}</span>
        <span className="text-xs text-foreground/70 truncate ml-2">{slide.slideName}</span>
      </div>
    </button>
  );
}

export function GridOverview({ open, current, onJump, onClose }: Props) {
  // Esc closes
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-2xl overflow-y-auto"
          aria-modal="true"
          role="dialog"
          aria-label="Slide overview"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-10 py-6 border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <div>
              <h2 className="font-display text-2xl text-title-cream">Overview</h2>
              <p className="text-xs text-foreground/50 mt-1">
                {linearSlides.length} active slide{linearSlides.length === 1 ? '' : 's'} · click to jump · press <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border text-foreground/70">Esc</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border text-foreground/70">G</kbd> to close
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close overview"
              className="h-10 w-10 flex items-center justify-center rounded-full controller-pill hover:bg-white/5 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Grid */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
            className="p-10 grid gap-6 justify-center"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_W}px, 1fr))` }}
          >
            {linearSlides.map((slide) => (
              <motion.div
                key={slide.slideNumber}
                variants={{
                  initial: { opacity: 0, y: 16 },
                  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="flex justify-center"
              >
                <Thumbnail
                  slide={slide}
                  isCurrent={slide.slideNumber === current}
                  onClick={() => { onJump(slide.slideNumber); onClose(); }}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
