import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec, SvgCalloutSpec } from '../types';

/**
 * SvgDiagramSlide — a centered inline SVG figure with optional annotation
 * callouts pinned over it by percent position. Use for architecture sketches,
 * flow figures, and labelled vector diagrams where freeform SVG beats the
 * box-and-line `BoxDiagramSlide`. One idea per slide; keep callouts few.
 * See `spec/26-slide-definitions/_patterns/svg-diagram-slide.md`.
 */
const TONE_CLASS = { gold: 'capsule-gold', ember: 'capsule-ember', cream: 'capsule-cream' } as const;

function toneClass(tone: SvgCalloutSpec['tone']): string {
  return TONE_CLASS[tone ?? 'gold'];
}

function Figure({ markup, image, alt }: { markup?: string; image?: string; alt?: string }) {
  if (markup) {
    return <div className="h-full w-full [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: markup }} />;
  }
  if (image) return <img src={image} alt={alt} draggable={false} className="h-full w-full object-contain" />;
  return null;
}

function Callout({ c, index, reduced }: { c: SvgCalloutSpec; index: number; reduced: boolean }) {
  const enter = reduced
    ? { opacity: 1 }
    : { opacity: 1, transition: { delay: 0.4 + index * 0.12, duration: 0.4 } };
  return (
    <motion.span
      initial={reduced ? false : { opacity: 0 }}
      animate={enter}
      style={{ left: `${c.x}%`, top: `${c.y}%` }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium shadow-lg ${toneClass(c.tone)}`}
    >
      {c.label}
    </motion.span>
  );
}

export function SvgDiagramSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = Boolean(useReducedMotion());
  const callouts = c.callouts ?? [];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-16 py-14">
      {c.eyebrow && <p className="slide-eyebrow">{c.eyebrow}</p>}
      {c.title && <h2 className="slide-title-display text-gold-gradient text-center">{c.title}</h2>}
      <div className="relative mx-auto h-[60%] w-full max-w-[1100px]">
        <Figure markup={c.svgMarkup} image={c.image} alt={c.title ?? undefined} />
        {callouts.map((co, i) => (
          <Callout key={`${co.label}-${i}`} c={co} index={i} reduced={reduced} />
        ))}
      </div>
      {c.caption && <p className="slide-caption max-w-[900px] text-center text-foreground/80">{c.caption}</p>}
    </div>
  );
}
