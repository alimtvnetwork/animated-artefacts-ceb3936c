import { motion } from 'framer-motion';
import type { SlideSpec } from '../types';

export function SectionDividerSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      {c.eyebrow && <span className="text-xs tracking-[0.5em] uppercase text-gold/70">{c.eyebrow}</span>}
      <motion.h2 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="font-display text-7xl md:text-9xl text-gold-gradient mt-6">
        {c.title}
      </motion.h2>
    </div>
  );
}
