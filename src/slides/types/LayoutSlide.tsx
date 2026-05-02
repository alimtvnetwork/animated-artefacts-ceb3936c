import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec, LayoutSlotSpec, LayoutGridPreset } from '../types';
import { titleClassFor } from '../preset';

/**
 * LayoutSlide (v0.169) — generic grid wrapper.
 *
 * Picks one of the `.slide-grid-*` presets defined in `src/index.css` and
 * renders `layoutSlots[]` in document order. Use this when no specialised
 * slide type fits and the deck just needs a 5/7 split, 4/8 split, 2-equal
 * compare, 2x3 card grid, or centered hero.
 *
 * Each slot is a `card`, `plain` text block, or inline `codeblock`. Slot
 * variants (`success` / `danger` / `accent`) add a colored border to the
 * card surface — used for pros/cons style comparisons.
 */
const GRID_CLASS: Record<LayoutGridPreset, string> = {
  'split-5-7':     'slide-grid-5-7',
  'split-4-8':     'slide-grid-4-8',
  'split-3-9':     'slide-grid-3-9',
  'split-2-equal': 'slide-grid-2-equal',
  '3-panel':       'slide-grid-3-panel',
  '12-column':     'slide-grid-12-column',
  'card-grid-2x3': 'slide-grid-card-2x3',
  'card-grid-3x3': 'slide-grid-card-3x3',
  'centered-hero': 'slide-grid-centered',
};

function Slot({ slot, idx }: { slot: LayoutSlotSpec; idx: number }) {
  const kind = slot.kind ?? 'card';
  const variantCls =
    slot.variant && slot.variant !== 'default' ? ` is-${slot.variant}` : '';

  const inner = (
    <>
      {slot.eyebrow && <p className="slide-eyebrow mb-3">{slot.eyebrow}</p>}
      {slot.title && (
        <h3 className="font-display text-3xl font-bold mb-4 text-foreground">{slot.title}</h3>
      )}
      {slot.body && <p className="text-base leading-relaxed text-foreground/85 mb-4">{slot.body}</p>}
      {slot.bullets && slot.bullets.length > 0 && (
        <ul className="space-y-2">
          {slot.bullets.map((b, i) => (
            <li key={i} className="flex gap-3 text-base text-foreground/85">
              <span className="text-gold mt-1">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (kind === 'codeblock') {
    return (
      <div>
        {slot.title && <h3 className="font-display text-2xl font-bold mb-3 text-foreground">{slot.title}</h3>}
        <pre className="slide-codeblock"><code>{slot.code ?? ''}</code></pre>
      </div>
    );
  }
  if (kind === 'plain') {
    return <div className="px-2">{inner}</div>;
  }
  return <div className={`slide-card${variantCls}`}>{inner}</div>;
}

export function LayoutSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const preset: LayoutGridPreset = c.layout ?? 'split-2-equal';
  const slots = c.layoutSlots ?? [];

  return (
    <section
      role="region"
      aria-label={`Layout: ${c.title ?? spec.slideName}`}
      className="relative h-full w-full overflow-hidden flex flex-col px-24 py-20"
    >
      <motion.header
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        {c.eyebrow && <p className="slide-eyebrow mb-3">{c.eyebrow}</p>}
        {c.title && <h2 className={`slide-title-content ${titleClassFor(spec)}`}>{c.title}</h2>}
        {c.subtitle && <p className="slide-subtitle mt-2">{c.subtitle}</p>}
      </motion.header>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className={`flex-1 min-h-0 ${GRID_CLASS[preset]}`}
      >
        {slots.map((slot, i) => <Slot key={i} slot={slot} idx={i} />)}
      </motion.div>
    </section>
  );
}
