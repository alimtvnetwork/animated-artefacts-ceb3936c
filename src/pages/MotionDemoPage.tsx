/**
 * /motion-demo — visual sanity check for the four motion families used
 * across the deck:
 *
 *   1. FadeIn        — pure opacity (transitions.ts → 'FadeIn')
 *   2. SlideIn       — opacity + translateY (transitions.ts → 'SlideIn')
 *   3. PushIn        — opacity + scale       (transitions.ts → 'PushIn')
 *   4. StepTimeline  — staggered row reveal (mirrors StepTimelineSlide
 *                      reveal numbers from `42-steps-motion.md`:
 *                      base 0.3s + 0.18s/row stagger)
 *
 * The page cycles through them on a 2.4s timer and lets you click any
 * thumbnail to jump directly. Reduced-motion is honored: the underlying
 * variants come from `getSlideVariants` which already collapses to a
 * 150ms opacity cross-fade when the OS preference is set, so this page
 * inherits that behavior with zero extra wiring.
 *
 * This is a presentation-only page — no business logic, no state outside
 * the local cycle index.
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getSlideVariants, SLIDE_TRANSITION_CONFIG } from '@/slides/transitions';
import type { SlideTransitionValue } from '@/slides/enums';

type DemoKey = 'FadeIn' | 'SlideIn' | 'PushIn' | 'StepTimeline';

interface DemoEntry {
  key: DemoKey;
  label: string;
  blurb: string;
}

const DEMOS: readonly DemoEntry[] = [
  { key: 'FadeIn',       label: 'Fade In',       blurb: 'Pure opacity. Used for hand-offs into still slides.' },
  { key: 'SlideIn',      label: 'Slide In',      blurb: 'Opacity + translateY(40 → 0). Default for content.' },
  { key: 'PushIn',       label: 'Push In',       blurb: 'Opacity + scale(0.92 → 1). Use sparingly.' },
  { key: 'StepTimeline', label: 'Step Timeline', blurb: 'Staggered rows: base 0.3s + 0.18s per row.' },
];

const CYCLE_MS = 2400;

/** Mock 4-row step list using the canonical numbers from spec 42. */
const STEP_ROWS = ['Discover', 'Define', 'Design', 'Deliver'];

export default function MotionDemoPage() {
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Cycle on a fixed interval so the page is glanceable without interaction.
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % DEMOS.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [autoplay]);

  const active = DEMOS[index];

  // Reuse the production variants for the three slide-level transitions
  // so this demo can't drift from what the deck actually renders.
  const slideVariants = useMemo(() => {
    if (active.key === 'StepTimeline') return null;
    return getSlideVariants(active.key as SlideTransitionValue, 'forward');
  }, [active]);

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Motion Demo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cycles every {CYCLE_MS}ms · honors <code>prefers-reduced-motion</code>.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={() => setAutoplay((a) => !a)}
            className="px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
          >
            {autoplay ? 'Pause' : 'Play'}
          </button>
          <Link to="/style-guide" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            ← Style guide
          </Link>
        </div>
      </header>

      {/* Tab thumbnails — click to jump, current pill highlighted. */}
      <nav className="flex flex-wrap gap-2">
        {DEMOS.map((d, i) => (
          <button
            key={d.key}
            onClick={() => { setIndex(i); setAutoplay(false); }}
            className={[
              'px-4 py-2 rounded-full text-sm border transition-colors',
              i === index
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
            ].join(' ')}
          >
            {d.label}
          </button>
        ))}
      </nav>

      {/* Stage — 16:9 to mirror the deck canvas. */}
      <section
        aria-label="Animation stage"
        className="relative w-full aspect-video rounded-xl border border-border overflow-hidden bg-card"
      >
        <AnimatePresence mode="wait">
          {slideVariants && (
            <motion.div
              key={active.key}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={SLIDE_TRANSITION_CONFIG}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {active.key}
              </span>
              <h2 className="text-5xl font-bold">{active.label}</h2>
              <p className="text-muted-foreground max-w-md text-center">{active.blurb}</p>
            </motion.div>
          )}

          {active.key === 'StepTimeline' && (
            <motion.ol
              key="step-timeline"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={{
                initial: { opacity: 0 },
                animate: {
                  opacity: 1,
                  transition: { delayChildren: 0.3, staggerChildren: 0.18 },
                },
                exit: { opacity: 0, transition: { duration: 0.22 } },
              }}
              className="absolute inset-0 flex flex-col items-start justify-center gap-4 px-16"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Step Timeline
              </span>
              {STEP_ROWS.map((row, i) => (
                <motion.li
                  key={row}
                  variants={{
                    initial: { opacity: 0, x: -24 },
                    animate: { opacity: 1, x: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  className="flex items-center gap-4"
                >
                  <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-3xl font-semibold">{row}</span>
                </motion.li>
              ))}
            </motion.ol>
          )}
        </AnimatePresence>
      </section>

      <footer className="text-xs text-muted-foreground">
        Variants sourced from <code>src/slides/transitions.ts</code>; step numbers
        mirror <code>spec/slides/42-steps-motion.md</code>.
      </footer>
    </div>
  );
}
