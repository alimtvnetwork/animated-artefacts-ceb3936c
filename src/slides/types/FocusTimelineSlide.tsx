import { forwardRef, useImperativeHandle } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec } from '../types';
import { titleClassFor } from '../preset';
import { Capsule } from '../components/Capsule';
import { useFocusTimeline, type FocusTimelineHandle } from '../hooks/useFocusTimeline';
import { toDescriptionString } from '../utils/descriptionString';

/**
 * `FocusTimelineSlide` — one step at a time, in the limelight.
 *
 * See `spec/slides/11-focus-timeline.md` and
 * `mem://features/focus-timeline-effect` for the full contract.
 *
 * # Behavior summary
 * - Owns an internal `focusIndex` via `useFocusTimeline`.
 * - Renders a 3-step (or 5-step) horizontal window: dim previous, hero focus,
 *   dim next. Off-window steps are fully hidden.
 * - Exposes an imperative `tryAdvance(dir)` handle so the deck's Next/Prev
 *   short-circuit through the slide first, only falling through to the next
 *   deck slide at the chain boundaries.
 *
 * # Animation
 * - Focus enter: scale 0.75 → 1, opacity 0.35 → 1, slide in on the active
 *   axis. 480ms `[0.22, 1, 0.36, 1]`.
 * - Focus exit: mirror values, opposite direction.
 * - Description: fades in 200ms after focus settles.
 * - Connector: width (or height) → `(focusIndex / (total-1)) * 100%`, 500ms.
 * - `prefers-reduced-motion`: drops scale/translate, keeps opacity.
 */
export const FocusTimelineSlide = forwardRef<FocusTimelineHandle, { spec: SlideSpec }>(
  function FocusTimelineSlide({ spec }, ref) {
    const c = spec.content;
    const steps = c.steps ?? [];
    const total = steps.length;
    const direction = c.direction ?? 'horizontal';
    const isVertical = direction === 'vertical';
    const reduced = useReducedMotion();

    const { focusIndex, focusOn, next, prev } = useFocusTimeline(total);

    // Expose the imperative handle so SlideDeckPage can route Next/Prev
    // through us first. Returning `false` lets the deck advance to the
    // sibling slide.
    useImperativeHandle(
      ref,
      () => ({
        tryAdvance: (dir) => (dir === 'forward' ? next() : prev()),
      }),
      [next, prev],
    );

    // The "visible window" — prev / focus / next (5 if windowSize === 5).
    // Other indices render but are immediately hidden via opacity/scale 0
    // so we keep the layout slot reserved for layout-aware animations.
    const half = c.windowSize === 5 ? 2 : 1;

    const progressPct = total > 1 ? (focusIndex / (total - 1)) * 100 : 100;

    return (
      <div className="flex h-full flex-col px-16 pt-32 pb-20 max-w-7xl mx-auto">
        {c.eyebrow && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="slide-eyebrow mb-3">
            {c.eyebrow}
          </motion.span>
        )}
        {c.title && (
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`slide-title-content mb-8 ${titleClassFor(spec)}`}
          >
            {c.title}
          </motion.h2>
        )}

        {/* Step indicator pill + dot row — always rendered (per spec). */}
        <div className="mb-8 flex items-center gap-4">
          <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-gold/15 border border-gold/40 text-[11px] font-semibold tracking-[0.18em] uppercase text-gold whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            Step {focusIndex + 1} / {total}
          </span>
          <div className="flex items-center gap-2">
            {steps.map((_, i) => {
              const passed = i < focusIndex;
              const isFocus = i === focusIndex;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => focusOn(i)}
                  aria-label={`Focus step ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
                    isFocus
                      ? 'w-6 bg-gold shadow-[0_0_8px_hsl(var(--gold)/0.7)]'
                      : passed
                        ? 'w-2.5 bg-gold/70'
                        : 'w-2.5 bg-gold/20 border border-gold/30'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Connector line — gold base + filled progress. */}
        <div
          className={`relative ${isVertical ? 'self-center w-px h-72 my-2' : 'h-px w-full mb-10'} bg-gold/20 rounded-full overflow-hidden`}
          aria-hidden="true"
        >
          <motion.div
            className={`absolute bg-gold ${isVertical ? 'left-0 right-0 top-0' : 'top-0 bottom-0 left-0'} shadow-[0_0_8px_hsl(var(--gold)/0.6)]`}
            initial={false}
            animate={isVertical ? { height: `${progressPct}%` } : { width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* The chain. Renders every step; non-window steps are visually
            collapsed but keep their slot so framer's layout animations work. */}
        <div
          className={`relative flex-1 flex ${
            isVertical ? 'flex-col items-center justify-center gap-6' : 'flex-row items-center justify-center gap-10'
          }`}
        >
          {steps.map((s, i) => {
            const offset = i - focusIndex;
            const inWindow = Math.abs(offset) <= half;
            const isFocus = offset === 0;
            // The visual state per slot (focus / side / hidden).
            const opacity = !inWindow ? 0 : isFocus ? 1 : 0.35;
            const scale = reduced ? 1 : !inWindow ? (isVertical ? 1 : 0.6) : isFocus ? 1 : 0.78;
            const translate = reduced
              ? 0
              : !inWindow
                ? offset > 0
                  ? 240
                  : -240
                : 0;
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => focusOn(i)}
                aria-current={isFocus ? 'step' : undefined}
                aria-hidden={!inWindow}
                tabIndex={inWindow ? 0 : -1}
                initial={false}
                animate={{
                  opacity,
                  scale,
                  ...(isVertical ? { y: translate } : { x: translate }),
                }}
                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                style={{ pointerEvents: inWindow ? 'auto' : 'none' }}
                className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-2xl ${
                  isFocus ? 'z-10' : 'z-0'
                } ${
                  isVertical ? 'w-full max-w-3xl' : isFocus ? 'w-[42%] max-w-2xl' : 'w-[24%] max-w-md'
                }`}
              >
                <FocusStepCard
                  label={s.label}
                  title={s.title}
                  description={toDescriptionString(s.description) || s.subtitle || ''}
                  capsule={s.capsule}
                  isFocus={isFocus}
                  reduced={!!reduced}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  },
);

interface CardProps {
  label: string;
  title: string;
  description: string;
  capsule?: import('../types').CapsuleSpec;
  isFocus: boolean;
  reduced: boolean;
}

/**
 * Single step card. The focused card gets full styling + visible description;
 * sibling cards are reduced to a label + title only (description is rendered
 * but animated to opacity 0 / height 0 so the layout doesn't jump).
 */
function FocusStepCard({ label, title, description, capsule, isFocus, reduced }: CardProps) {
  return (
    <div
      className={`text-left rounded-2xl border transition-colors duration-300 ${
        isFocus
          ? 'bg-surface-1/80 border-gold/40 shadow-[0_24px_60px_-20px_hsl(var(--gold)/0.35)] backdrop-blur-md p-8'
          : 'bg-surface-1/30 border-cream/10 p-5'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span
          className={`text-[11px] uppercase tracking-[0.3em] transition-colors duration-300 ${
            isFocus ? 'text-gold' : 'text-gold/60'
          }`}
        >
          {label}
        </span>
        {capsule && <Capsule spec={capsule} size="sm" />}
      </div>
      <h3
        className={`font-display transition-all duration-300 ${
          isFocus ? 'text-4xl text-foreground' : 'text-xl text-foreground/80'
        }`}
      >
        {title}
      </h3>
      <motion.p
        initial={false}
        animate={{
          opacity: isFocus ? 1 : 0,
          height: isFocus ? 'auto' : 0,
          marginTop: isFocus ? 16 : 0,
        }}
        transition={{
          opacity: { duration: 0.3, delay: isFocus && !reduced ? 0.2 : 0 },
          height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
        }}
        className="overflow-hidden text-foreground/70 text-lg leading-relaxed"
      >
        {description}
      </motion.p>
    </div>
  );
}
