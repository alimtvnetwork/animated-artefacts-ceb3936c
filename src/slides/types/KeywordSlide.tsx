import { motion } from 'framer-motion';
import type { SlideSpec } from '../types';
import { getContainerVariants, getItemVariants, resolvePreset } from '../textAnimations';
import { titleClassFor } from '../preset';
import { Capsule } from '../components/Capsule';

export function KeywordSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const container = getContainerVariants(spec.textAnimation);
  const defaultItem = getItemVariants(spec.textAnimation);
  const eyebrowV  = c.animations?.eyebrow  ? resolvePreset(c.animations.eyebrow)  : defaultItem;
  const titleV    = c.animations?.title    ? resolvePreset(c.animations.title)    : defaultItem;
  const keywordsV = c.animations?.keywords ? resolvePreset(c.animations.keywords) : defaultItem;
  const capsulesV = c.animations?.capsules ? resolvePreset(c.animations.capsules) : defaultItem;
  const titleColor = titleClassFor(spec);
  return (
    <motion.div variants={container} initial="initial" animate="animate" className="flex h-full flex-col items-center justify-center text-center px-8 pt-32 pb-20">
      {c.eyebrow && <motion.span variants={eyebrowV} className="text-xs tracking-[0.4em] uppercase text-gold/90 mb-6">{c.eyebrow}</motion.span>}
      {/* Middle title is locked to white across every theme — the colored
          keywords below carry the brand accent, the title stays a calm anchor. */}
      {c.title && <motion.h2 variants={titleV} className="slide-title-content text-white/75 mb-10">{c.title}</motion.h2>}
      {c.keywords && (
        <motion.div variants={keywordsV} className="flex flex-wrap gap-x-12 gap-y-4 justify-center">
          {c.keywords.map((k, i) => (
            <motion.span
              key={i}
              variants={keywordsV}
              className={`font-display ${titleColor}`}
              style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', lineHeight: 1 }}
            >
              {k}
            </motion.span>
          ))}
        </motion.div>
      )}
      {c.capsules && (
        <motion.div variants={capsulesV} className="mt-12 flex flex-wrap gap-3 justify-center">
          {c.capsules.map((cap, i) => <Capsule key={i} spec={cap} />)}
        </motion.div>
      )}
    </motion.div>
  );
}
